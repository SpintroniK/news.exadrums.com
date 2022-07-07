---
title: New Arduino Nano Every Trigger Board - Part 4
createdAt: 2022-06-06 19:48:22
updatedAt: 2022-06-06 19:48:22
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 3](/article/new-arduino-nano-every-board-part3).

In this part, we are going to read data from the Analog to Digital Converter (ADC) and make an oscilloscope.
It'll show us what the piezo voltage of drum pad looks like when hit with a drum stick.

![signal](/images/new-arduino-nano-every-board/signal.png)

To understand everything correctly, make sure you read the previous parts.

<!--more-->

## How the ADC Works

This part is going to be a little bit more theoretical.
But we'll see a concrete example at the end.

### ADC Configuration

First of all, we need to talk about the ATMega4809's ADC configuration.
Without going into the very technical details, I'll talk about some of the important parameters of the ADC.
It needs a clock source, which can be obtained from the peripheral clock.
The way this clock signal is generated, is by dividing the CPU clock by a 'divider' that goes from 2 to 256.
Since the CPU clock is 16 MHz, that leaves with an ADC frequency that goes from 62.5 kHz to 8 MHz.
In practice, it is recommended to avoid low frequencies, and to not go above 1.5 MHz.
A normal conversion takes 13 ADC clock cycles, so the fastest conversion time we can get is 8.67 µs.
That is a bit over 115 kilo samples per seconds (ksps).

Another important parameter is the resolution of the ADC. Here we have two choices: 8-bit or 10-bit.
In the case of 8-bit sampling, we can store the data into a single byte.
However, 10-bit resolution will require 16-bit integers to store the results, which can lead to slower code.

There are different modes of operation. We are interested in the 'normal' mode, in which we ask the microcontroller to start a new conversion ourselves. There's also the free-running mode, in which the ADC starts a new conversion every time the previous one has finished.

### Events and Interrupts

There are two ways the microcontroller can communicate with peripherals:

- Interrupts: they let you execute a function automatically after an hardware event has occurred.
- Events: they allow peripherals to communicate with one another.

We are going to use both of them, the event will trigger a new conversion when a timer overflows, and the interrupt will be used to fetch the conversion result.

## Using the ADC in C++

First, let's see how to use the ADC in C++.
We define a few useful things: 

```cpp
static const auto Adc0Addr = reinterpret_cast<uint16_t>(&ADC0);

class Adc10bitType;
class Adc8bitType;

enum class Vref : uint8_t
{
    External,
    Internal, 
    Vdd,
};

enum class Prescaler : uint8_t
{
    Div2,
    Div4,
    Div8,
    Div16,
    Div32,
    Div64,
    Div128,
    Div256
};

template <typename T, typename Enable = void>
class AdcBase;

template <typename T>
class AdcBase<T, Util::enable_if_t<Util::is_same_v<T, Adc8bitType>>>
{
public:
    AdcBase() = delete;
    ~AdcBase() = delete;

protected:

    inline static uint8_t value{};

};


template <typename T>
class AdcBase<T, Util::enable_if_t<Util::is_same_v<T, Adc10bitType>>>
{
public:
    AdcBase() = delete;
    ~AdcBase() = delete;

protected:

    inline static uint16_t value{};

};
```

The ADC register's address is stored in `Adc0Addr`.
We've defined utilities for the ADC resolution, its voltage reference, and the frequency divider.

Notice the use of `enable_if`, which is defined as:

```cpp
namespace Util
{
    
    template <class T, T v>
    struct integral_constant 
    {
        static constexpr T value = v;
        using value_type = T;
        using type = integral_constant; // using injected-class-name
        constexpr operator value_type() const noexcept { return value; }
        constexpr value_type operator()() const noexcept { return value; } // since c++14
    };

    template <class T, class U>
    struct is_same : integral_constant<bool, false> {};
    
    template <class T>
    struct is_same<T, T> : integral_constant<bool, true> {};

    template<bool B, class T = void>
    struct enable_if {};
    
    template<class T>
    struct enable_if<true, T> { using type = T; };

    template< bool B, class T = void >
    using enable_if_t = typename enable_if<B,T>::type;

    template< class T, class U >
    inline constexpr bool is_same_v = is_same<T, U>::value;

} // namespace Util
```

This is usually part of the standard C++ library, but we don't have it, so these definitions help us achieve what we need: two different types for the 8-bit and 10-bit modes.
Alright, now we're done with the boilerplate, so let's get all the basic stuff out of the way:

```cpp
template <uint16_t addr, typename ValueType>
class Adc : private AdcBase<ValueType>
{

public:

    Adc() = delete;
    ~Adc() = delete;

    template <Prescaler div>
    static constexpr void SetPrescaler()
    {
        switch(div)
        {
            case Prescaler::Div2:   adc().CTRLC |= ADC_PRESC_DIV2_gc; break;
            case Prescaler::Div4:   adc().CTRLC |= ADC_PRESC_DIV4_gc; break;
            case Prescaler::Div8:   adc().CTRLC |= ADC_PRESC_DIV8_gc; break;
            case Prescaler::Div16:  adc().CTRLC |= ADC_PRESC_DIV16_gc; break;
            case Prescaler::Div32:  adc().CTRLC |= ADC_PRESC_DIV32_gc; break;
            case Prescaler::Div64:  adc().CTRLC |= ADC_PRESC_DIV64_gc; break;
            case Prescaler::Div128: adc().CTRLC |= ADC_PRESC_DIV128_gc; break;
            case Prescaler::Div256: adc().CTRLC |= ADC_PRESC_DIV256_gc; break;
        }
    }

    template <Vref vref>
    static constexpr void SetReference()
    {
        switch(vref)
        {
            case Vref::External: adc().CTRLC |= ADC_REFSEL_VREFA_gc; break;
            case Vref::Internal: adc().CTRLC |= ADC_REFSEL_INTREF_gc; break;
            case Vref::Vdd: adc().CTRLC |= ADC_REFSEL_VDDREF_gc; break;
        }
    }

    static constexpr void SelectChannel(ADC_MUXPOS_t chan)
    {
        channel = chan;
        adc().MUXPOS = channel;
    }

    static constexpr void Enable()
    {
        if constexpr(Util::is_same_v<ValueType, Adc8bitType>)
        {
            adc().CTRLA = ADC_ENABLE_bm | ADC_RESSEL_8BIT_gc;
        }
        
        if constexpr(Util::is_same_v<ValueType, Adc10bitType>)
        {
            adc().CTRLA = ADC_ENABLE_bm | ADC_RESSEL_10BIT_gc;
        }
    }

    static constexpr void StartConversion()
    {
        adc().COMMAND = ADC_STCONV_bm;
    }


    static constexpr bool ConversionDone()
    {
        return adc().INTFLAGS & ADC_RESRDY_bm;
    }

    static constexpr auto GetValue()
    {
        return Adc<addr, ValueType>::value;
    }


private:

    static constexpr auto& adc()
    {
        return *reinterpret_cast<ADC_t*>(addr);
    }

    inline static ValueType value = 0;
    inline static ADC_MUXPOS_t channel = ADC_MUXPOS_t::ADC_MUXPOS_AIN0_gc;

};
```

Here are the things we can do with this code:

- Set the ADC clock frequency by changing the clock divider (or prescaler) using `SetPrescaler()`.
- Set the voltage reference (we'll use an external reference here) using `SetReference()`.
- Select the input channel (from 0 to 7), using `SelectChannel(ADC_MUXPOS_t chan)`.
- Of course, we can enable the ADC, start a conversion, and check if the conversion is done.

With all that we can write an infinite loop, start a conversion, do some things, wait until the conversion is done (in a loop), read the result and use the value as we see fit.
But that wouldn't correspond to what we really need.
What we do need is to trigger conversions at a regular interval so that we know exactly how much time has elapsed since the previous value was retrieved from the ADC.

## Using a Timer to Trigger the ADC at Regular Intervals

We are not going to go into much details about setting up the timer.
However, we are going to focus on the event system that allows to trigger the ADC when the timer overflows.

### Timer Configuration

We are going to use the TCA timer.
It will be configured as follows:

```cpp
// Configure TCA
Tca::SetSingleMode<Timing::TCASingleMode::Normal>();
Tca::DisableEventCounting();
Tca::SetPeriod(13);             // 14 µs

Tca::SetClockDivider<Timing::TCAClockDiv::Div16>();
Tca::Enable();
```

The complete code will be on [GitHub](https://github.com/SpintroniK/exadrumino-Nano-Every) soon.
I believe the code speaks for itself: the timer will overflow every 14 µs.
It will count up to 13 (including 0), at a frequency of 1 MHz (CPU clock divided by 16).

### Event System

Let's see how we can trigger an ADC conversion automatically when the timer overflows.
To that end, we are going to use the ATMega4809's event system.
The event system has 8 channels that allows peripherals to communicate with each other.
Each channel can be used to connect a peripheral to another one, or itself.
We are interested in the overflow event of the TCA timer and the ADC conversion start event.

But first let's use a little helper that'll make our life easier and the code more readable: 

```cpp
#include <avr/io.h>

#include <stdint.h>

inline constexpr uint8_t EVSYS_GENERATOR_TCA0_OVF_gc = 0x80 << 0; // Should already be defined, but it's not...

namespace Event
{

    using Generator = uint8_t;
    using Event = register8_t;


    class EventSystem
    {
        
    public:
        EventSystem() = delete;
        ~EventSystem() = delete;

        template <uint8_t channel>
        static constexpr void Connect(Generator in, Event& out)
        {
            switch(channel)
            {
                case 0:
                {
                    EVSYS.CHANNEL0 = in;
                    out = EVSYS_CHANNEL_CHANNEL0_gc;
                    break;
                }

                case 1:
                {
                    EVSYS.CHANNEL1 = in;
                    out = EVSYS_CHANNEL_CHANNEL1_gc;
                    break;
                }

                default: static_assert(channel <= 7, ""); break;
            }
        }

    private:

    };
    
} // namespace Event
```

I've only implemented the code for channel 0 and channel 1. Other channels can be added by filling the switch-case statement.
And that's how we 'connect' the TCA's overflow to the ADC's start conversion event:

```cpp
Event::EventSystem::Connect<0>(EVSYS_GENERATOR_TCA0_OVF_gc, EVSYS.USERADC0);
```

## ADC Events and Interrupts

A few things are missing in our ADC class.
We need to be able to enable events and interrupts, so we can add the following member functions:

```cpp
static constexpr void EnableInterrupts()
{
    adc().INTCTRL |= ADC_RESRDY_bm;
}

static constexpr void EnableEvents()
{
    adc().EVCTRL |= ADC_STARTEI_bm;
}
```

That's it for the event's configuration, but what about the interrupt?
An interrupt is triggered by the hardware, but it needs to be handled on the software side.
More precisely, we need to define a function that is going to be called when an interrupt is fired.
It is kind of a callback function that takes no arguments and returns nothing.

I'm not going to go into the gory details of gcc, but because of a bug in the compiler, with have to define a new class with a static function that handles the interrupt:

```cpp
class AdcInterrupts
{
public:

    AdcInterrupts() = delete;
    ~AdcInterrupts() = delete;

private:

    static void ResReady() __asm__("__vector_22") __attribute__((__signal__, __used__, __externally_visible__));
};
```

We can handle some other ADC interrupts in the same class if we need to.
But how do we know that we need to use the vector 22?
Again without going into a lot of details, the answer is in the `iom4809.h` header, where we can find:

```cpp
/* ADC0 interrupt vectors */
#define ADC0_RESRDY_vect_num  22
#define ADC0_RESRDY_vect      _VECTOR(22)  /*  */
#define ADC0_WCOMP_vect_num  23
#define ADC0_WCOMP_vect      _VECTOR(23)  /*  */
```

## Putting it All Together

Okay, now we have almost everything we need, so it's time to write our main function.
But before that, we need to define the body of our ADC interrupt in a `.cpp` file.
Let's put it in our `main.cpp` file then:

```cpp

using Adc0 = Adc<Adc0Addr, Adc8bitType>;

void Analog::AdcInterrupts::ResReady()
{
    Adc0::ResetInterrupt();
    // Do somehing with the ADC value ADC0.RES here
}
```

What we do with the resulting value is up to us, as long as our computations finish before the timer overflows again.

Now to our main function.

```cpp
int main()
{

    _PROTECTED_WRITE(CLKCTRL_MCLKCTRLB, 0x00); // Disable prescaler

    sei();

    Event::EventSystem::Connect<0>(EVSYS_GENERATOR_TCA0_OVF_gc, EVSYS.USERADC0);

    // Configure ADC
    Adc0::EnableInterrupts();
    Adc0::EnableEvents();
    Adc0::SelectChannel(ADC_MUXPOS_AIN0_gc);
    Adc0::SetPrescaler<Analog::Prescaler::Div8>();
    Adc0::SetReference<Analog::Vref::External>();
    Adc0::Enable();

    // Configure TCA
    Tca::SetSingleMode<Timing::TCASingleMode::Normal>();
    Tca::DisableEventCounting();
    Tca::SetPeriod(13);             // 14 µs
    
    Tca::SetClockDivider<Timing::TCAClockDiv::Div16>();
    Tca::Enable();



    for(;;)
    {
    }

    return 0;
}
```

First of all, we disable the CPU clock prescaler.
Then, we enable interrupts, and we connect the TCA overflow event to the ADC start conversion event.
We configure the ADC and the TCA.
And finally, we write an infinite loop.
Our ADC is sampling `AIN0` but, so far, we're not doing anything with the result.

## Arduino Nano Every Oscilloscope

In this last section, we are going to use everything that has been presented above, plus the previous part of this series of articles.
So if you haven't read the [previous part](/article/new-arduino-nano-every-board-part3), I encourage you to do so.

### Retrieve the ADC Value

We are going to need a variable to store the ADC value.
As this variable will be accessed by both the ADC interrupt and our main function, we ought to declare it as a global variable.

```cpp

using Adc0 = Adc<Adc0Addr, Adc8bitType>;

static uint8_t adcValue{};

void Analog::AdcInterrupts::ResReady()
{
    Adc0::ResetInterrupt();
    adcValue = ADC0.RES;
}
```

### Send ADC Values Over the USART

We're going to use the USART code that we wrote in the previous part of this series.
The last thing we need to do is to is be able to send strings over the USART.
In the previous part, we wrote a function that allowed us to send a single byte.
A string is an array of characters, and every character can be represented as a single byte.
All we need is to format the string and send the bytes it is made of.
Using `string.h` this isn't too hard to achieve.

```cpp
#include "Adc.hpp"
#include "Usart.hpp"

#include <avr/io.h>
#include <avr/interrupt.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>


using Adc0 = Adc<Adc0Addr, Adc8bitType>;
using Tca = TCA<TCASingle>;

static uint8_t adcValue{};

static DigitalIO::Usart<3> usart{115'200};

void Analog::AdcInterrupts::ResReady()
{
    Adc0::ResetInterrupt();
    adcValue = ADC0.RES;
}

int main()
{

    _PROTECTED_WRITE(CLKCTRL_MCLKCTRLB, 0x00); // Disable prescaler

    sei();

    Event::EventSystem::Connect<0>(EVSYS_GENERATOR_TCA0_OVF_gc, EVSYS.USERADC0);

    // Configure ADC
    Adc0::EnableInterrupts();
    Adc0::EnableEvents();
    Adc0::SelectChannel(ADC_MUXPOS_AIN2_gc);
    Adc0::SetPrescaler<Analog::Prescaler::Div8>();
    Adc0::SetReference<Analog::Vref::External>();
    Adc0::Enable();

    // Configure TCA
    Tca::SetSingleMode<Timing::TCASingleMode::Normal>();
    Tca::DisableEventCounting();
    Tca::SetPeriod(13);             // 14 µs
    
    Tca::SetClockDivider<Timing::TCAClockDiv::Div16>();
    Tca::Enable();

    for(;;)
    {
        // brain.SendMidiNotes();
        static char str[32];
        ::sprintf(str, "%d\n", adcValue);

        for(uint8_t i = 0; i < ::strlen(str); ++i)
        {
            usart.SendByte(str[i]);
        }
    }

    return EXIT_SUCCESS;
}
```

And here we are, we have an Arduino Nano Every oscilloscope.
You can use the [new exadrums Arduino Nano Every board](/article/new-arduino-nano-every-board-part3) to connect your e-drums to and have look at a piezo signal in real time, for instance the snare drum.

![arduino-board](/images/new-arduino-nano-every-board/board-arduino.png)

Then, you can launch the Arduino IDE, and hit Ctrl + Shift + L.
You'll see something like that if you play flams, for instance:

![oscilloscope](/images/new-arduino-nano-every-board/oscilloscope.png)

You'll notice that we are getting one new sample every 14 µs, but sending data at a baudrate of 115200 bps, which corresponds to about 5000 values per second in average.
We are getting samples way to fast, but that's not really a problem since this is just a step towards our goal: making a drum module.
So getting one sample every 14 µs means we can aim for 8928 samples per second and per piezo if we use 8 piezos.

## What's Next?

Next time I'll share the code, as it is now usable and I've tested it with my Roland TD17 e-drum.
Stay tuned!
