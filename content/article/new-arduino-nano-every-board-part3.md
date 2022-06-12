---
title: New Arduino Nano Every Trigger Board - Part 3
createdAt: 2022-05-15 12:49:07
updatedAt: 2022-05-15 12:49:07
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 2](/article/new-arduino-nano-every-board-part2).

In this part, we are going to send MIDI notes over USB using the Arduino Nano Every.
To understand everything correctly, make sure you read the previous parts.

♬ ♪ ♬ ♪

<!--more-->

## MIDI Protocol for a Basic Drum Module

First, we are going to talk about MIDI and what it actually is at the "hardware" level.
I'll be honest, I probably know only the basis of MIDI.
However, I believe I know enough to make a drum module that sends MIDI notes and messages.

For a basic drum module, we'll need two MIDI ingredients: notes and control change.
MIDI is old, so most messages are represented by bytes, that is values that can go from 0 to 255, or -128 to 127 if you represent byte as signed integers using two's complement.
But there's a catch, MIDI doesn't always use 8-bit data, rather, some parameters use 7-bit data, so their values go from 0 to 127.
That means, there are 128 MIDI notes.

So what is a MIDI (drum) note exactly?
Well, drums are a bit different than other instruments in a sense that there aren't actual notes per say.
There is one thing called *Universal General MIDI Drum Notes* that saves us, though.
It defines more than 40 "notes" (from note 35 to 81) that [represent drum instruments](https://www.zendrum.com/resource-site/drumnotes.htm).
Here are some examples: 35 is *Acoustic Bass Drum*, 38 is *Acoustic Snare*, 70 is *Maracas*, and 81 is *Open Triangle*.

### MIDI Commands

In practice, MIDI notes are sent using commands. There are two note commands: *Note On* and *Note Off*.
As the names suggest, the former tells the instrument to play a note, and the latter says that we need to stop playing that note.
A command, such as *Note On*, is represented by a byte.
This byte is divided into two distinct parts: the command itself, and the MIDI channel.
There are 16 MIDI channels, so in theory you can send 16 *Note On* commands over the 16 available channels.

The way it works is that the command byte is cut in half. The most significant bits represent the command, and the least significant bits represent the channel number.
Here's an example. We would like to send a *Note On* command over channel 0.
The command number for *Note On* is 144, so we simply send a byte that holds the value 144, easy.
But, in MIDI, drums use channel 10, so how do we send a note over channel 10?

To answer that question, we are going to use hexadecimal values instead of decimal.
The *Note On* command for channel 0 is 144, which becomes `0x90` in hexadecimal.
Channel number 10, becomes channel number `0x0A`, so a *Note On* command over channel 10 is `0x9A`.
By the way `0x9A` is 154 in decimal, so that's just `144 + 10`, which is the *Note On* command *plus* the channel number.

### Drum Notes

Now, we know how to send a *Note On* command. It is quite simple, as only one byte needs to be sent.
This byte value is `0x9A` in hexadecimal if we use channel 10.

If a MIDI instrument were to received that command, it would need to know which note to play.
This is why the *Note On* command must be followed by the note number.
Lets say we want a snare drum sound, we need to send `0x9A` followed by 38, or `0x26`.

And that's it. If an instrument receives those two bytes one after another it will know that it should play a snare drum note.
But it won't, because there's still one thing that's missing here: the velocity.

### Note Velocity

It would be no fun at all if all the notes had the same velocity.
That's why a third byte follows the MIDI command and MIDI note number, and that third byte represents the velocity.
The velocity goes from 0 to 127 (yes it uses only 7 bits).

Finally, to send a snare drum note with a velocity of 92, we have to send 3 bytes: `154, 38, 92` or, in hexadecimal: `0x9A, 0x26, 0x5C`.

### Baud Rate & Latency

You probably think that sending only 3 bytes must be very fast, but is it really that fast?
MIDI communications usually happen at 38400 bauds per second.
The actual speed in bytes per seconds is 38400 divided by 8, which gives 4800 Bps.
Say we send 3 bytes per note, that gives us 1600 notes per second, or 0.625 milliseconds (ms) to send a note.
That may not seem like a lot, and it isn't really a lot, but that's getting close to 1 ms.

Do we really have to stick with 38400 bps?
I believe we don't, but it depends on the VST (Virtual Studio Technology) you use.
Now, if we use a baud rate of 115200 bps, we get 14400 Bps, so 4800 notes per second.
That means we're sending one note in nearly 0.2 ms. That's a bit better.

### Control Change

Okay, it's quite easy to understand what a note is, but perhaps we need a little bit more than that.
With MIDI notes, we can have a drum kit that's made of pads.
Every time we hit a pad, we send a note whose velocity is proportional to the pad's volume.
We can have drums and cymbals, but how do we deal with the hi-hat controller?

We could vary the note number according to the pedal's openness.
After all, there are two notes dedicated to the hi-hat: 42 is *Closed Hi-Hat* and 46 *Open Hi-Hat*, and some VSTs also define a *Semi-Open Hi-Hat* note.
That's a totally fine thing to do, but there's a better solution: control change.

Control change may seem more complicated than note commands, but it really is based on the same principle: send 3 bytes.
The first byte is the command byte, and it is 176 or `0xB0` in hexadecimal.
As for the notes, it has to be combined with the channel number.
So for channel 10, we get 186 or `0xBA`.

The second byte represents the control function. It can be a modulation wheel, a foot controller, an expression controller, etc.
There are 128 possible control functions, but some of them are undefined.
For the hi-hat controller, the one we are interested in is the *foot controller*, so control function number 4.
The second byte is 4, `0x04`.

Now the third byte is the value the control function should take.
Just like the velocity, this value goes from 0 to 127.

If the hi-hat pedal is half-open, we send the following three bytes: `186, 4, 63`, or `0xBA, 0x04, 0x3F`.
At least that what we send when a control change message needs to be sent. But when do we send a control change exactly?

Two options come to mind: when the sensor register a change that's big enough to be perceptible, or at regular time interval.
We'll go for the former, as there's no reason to send a control change if there's no change in the sensor value.

## Serial MIDI Over USB

So far we've talked about MIDI as bytes we send to a device, but we need to address how we send those bytes.

### The Hard Truth About the ATMega4809

The ATMega4809 has 4 USART (universal synchronous and asynchronous receiver-transmitter) preipherals.
One of them is accessible via the Arduino Nano Every board pins `RX` and `TX`, and the other one is hardwired to another microcontroller that's on the board: the SAMD11D14A.

Why is there another microcontroller on the board? Here's what the official documentation has to say:

```text
The SAMD11D14A processor is shipped with a firmware that implements USB to serial bridge and handles
ATMega4809 firmware upgrade through the UPDI interface.
```

The ATMega4809 doesn't support the USB protocol, so another microcontroller handles that instead.
It acts as a USB to serial bridge, and is connected to one of the ATMega4809's USART peripherals.
So when you use `Serial.println` in your Arduino IDE, the data goes from your Arduino USART numnber 3 to the SAMD11D14A which sends it over USB to you PC.

As a consequence, the Arduino Nano Every can't be recognized as a USB device, so no USB MIDI!

### How to Send MIDI Notes to a Computer

All hope is not lost, we can send MIDI data over USB, the catch is that we can't use the USB protocol.
Instead we can transfer serial data directly, which has one advantage: the code is simpler to write!
There are two options: we can use a serial to USB adapter and connect our Arduino (using two resistors) to it.
Or we can use the on-board USB and convert the serial data adequately on the target PC.

We are going to go for option number two, as we'd prefer not to rely on additional hardware.
The way it works is pretty straightforward, we are just going to send our bytes over the USART3.

## ATMega4809 USART & MIDI

Here we are, ready to write some code.
In order to send the notes over USB, we need to use USART3.
The ATMega4809's documentation tells us a few things:

- We need to set the USART pins as output (TX) and input (RX).
- Then, we have to configure the USART (especially its baud rate).
- Only after the USART's been configured, we can use its registers to send and receive data.

We are going to need to configure PORTB (please refer to [part 2 of this series](/article/new-arduino-nano-every-board-part2) for more info).
To that end, we use the following code:

```cpp

#include <avr/io.h>

#include <stdint.h>

namespace DigitalIO
{
    
    static const auto PORTA_ADDR = reinterpret_cast<uint16_t>(&PORTA); 
    static const auto PORTB_ADDR = reinterpret_cast<uint16_t>(&PORTB); 
    static const auto PORTC_ADDR = reinterpret_cast<uint16_t>(&PORTC); 
    static const auto PORTD_ADDR = reinterpret_cast<uint16_t>(&PORTD); 
    static const auto PORTE_ADDR = reinterpret_cast<uint16_t>(&PORTE);
    static const auto PORTF_ADDR = reinterpret_cast<uint16_t>(&PORTF);


    template <uint16_t portAddr, uint8_t mask>
    class Pin
    {
    public:
        Pin() = delete;
        ~Pin() = delete;

        static constexpr void ConfigureAsInput()
        {
            port().DIRSET &= ~mask;
        }

        static constexpr void ConfigureAsOutput()
        {
            port().DIRSET |= mask;
        }

        static constexpr void Toggle()
        {
            port().OUTTGL |= mask;
        }

        static constexpr void SetHigh()
        {
            port().OUTSET |= mask;
        }

        static constexpr void SetLow()
        {
            port().OUTCLR |= mask;
        }

        static constexpr auto& port()
        {
            return *reinterpret_cast<PORT_t*>(portAddr);
        }
        
    private:

    };
    
} // namespace IO
```

Now we need to configure the USART. I'll give the code for USART3 only, feel free to improve it to handle other USARTs if you wish.

```cpp
#include "Pin.hpp"
#include "Port.hpp"

#include <avr/io.h>

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

namespace DigitalIO
{

    template <uint8_t N>
    class Usart
    {
    public:

    constexpr explicit Usart(uint32_t br)
    {
        switch(N)
        {
            // TODO: configure Usart 0 to 2
            case 3: 
            {    
                PORTMUX.USARTROUTEA |= PORTMUX_USART30_bm;
                using Usart3InputPin = Pin<PORTB_ADDR, PIN5_bm>;
                using Usart3OutputPin = Pin<PORTB_ADDR, PIN4_bm>;

                Usart3InputPin::ConfigureAsInput();
                Usart3OutputPin::ConfigureAsOutput();
                
                break;
            }
            default: static_assert(N <= 3, "Invalid USART number."); break;
        }

        usart().BAUD = BaudRate(br);
        usart().CTRLB |= USART_RXEN_bm | USART_TXEN_bm; 
        usart().CTRLC |= USART_CMODE_ASYNCHRONOUS_gc | USART_PMODE_DISABLED_gc;
    }

    constexpr void SendByte(uint8_t c)
    {
        while(!(usart().STATUS & USART_DREIF_bm))
        {
            ;
        }        
        usart().TXDATAL = c;
    }

    static constexpr uint16_t BaudRate(uint32_t baudRate)
    {
        return static_cast<uint16_t>(static_cast<float>((F_CPU * 64 / (16 * static_cast<float>(baudRate))) + 0.5));
    }

    static constexpr USART_t& usart()
    {
        switch(N)
        {
            case 0: return USART0;
            case 1: return USART1;
            case 2: return USART2;
            case 3: return USART3;
            default: static_assert(N <= 3, "Invalid USART number.");
        }
    }

    private:

    };

} // namespace IO
```

You'll notice that there is a `SendByte` function.
That's all we need to send MIDI notes, as we need to send 3 bytes for each `Note On` command.

## Sending MIDI Over USART

All right, lets wring some code that sends MIDI notes.
We are going to use one more little helper:

```cpp
#include "DigitalIO/Usart.hpp"

template <typename Usart>   
class SerialMidi
{

public:

    SerialMidi() = delete;
    ~SerialMidi() = default;

    SerialMidi(Usart& usart) : usart_{usart}
    {

    }

    template <uint8_t channel>
    inline void NoteOn(uint8_t note, uint8_t velocity) const noexcept
    {
        usart_.SendByte(0x90 | (channel & 0x0f));
        usart_.SendByte(note);
        usart_.SendByte(velocity);
    }

    template <uint8_t channel, uint8_t control>
    inline void ControlChange(uint8_t value) const noexcept
    {
        static_assert(control <= 127, "Invalid control value.");
        usart_.SendByte(0xB0 | (channel & 0x0f));
        usart_.SendByte(control);
        usart_.SendByte(value);
    }


private:

    Usart& usart_;

};
```

Even if we are not going to use it, I included the `ControlChange` function.

```cpp
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>

using Usart3 = DigitalIO::Usart<3>;

static Usart3 usart{115'200};
static SerialMidi midi{usart};

int main()
{
    _PROTECTED_WRITE(CLKCTRL_MCLKCTRLB, 0x00); // Disable prescaler

    sei();

    const uint8_t snareNote = 38;
    const uint8_t bdNote = 36;
    const uint8_t hhNote = 42;

    const uint8_t nbNotes = 8;
    const uint8_t snareNotes[nbNotes] =    {0, 0, 1, 0, 0, 0, 1, 0};
    const uint8_t hihatNotes[nbNotes] =    {1, 1, 1, 1, 1, 1, 1, 1};
    const uint8_t bassDrumNotes[nbNotes] = {1, 0, 0, 0, 1, 1, 0, 0};

    uint8_t i = 0;

    for(;;)
    {
        _delay_ms(400);

        if(snareNotes[i] == 1)
        {
            midi.NoteOn<10>(snareNote, 80);
        }

        if(hihatNotes[i] == 1)
        {
            midi.NoteOn<10>(hhNote, 80);
        }

        if(bassDrumNotes[i] == 1)
        {
            midi.NoteOn<10>(bdNote, 80);
        }

        i = ++i % nbNotes;
    }

    return 0;
}
```

We have defined three instruments: a snare drum, a hi-hat, and a bass drum, each having its MIDI note: 38, 42 and 36, respectively.
We also define an array of eight notes for each instrument.
In that array, a "1" means that the instrument's note is to be played, and a "0" means nothing happens.
We iterate the array in loop, and play a note every 400 ms.
I believe the code is self-explanatory.

## Playing Those Notes

As I have already mentioned, our Arduino isn't recognized as a MIDI device because it doesn't use the USB protocol.
Consequently, we need to *convert* the incoming serial data to MIDI data.
To that end, we can use [ttymidi](https://github.com/cjbarnes18/ttymidi).
It isn't too hard to use, and works well on Linux.
First of all, we need to clone the repository: `git clone https://github.com/cjbarnes18/ttymidi`.
Then, in the `ttymidi` directory, we need to compile it using `make`.
And finally, to start the program, we run the following command:

```text
./ttymidi -s /dev/ttyACM0 -b 115200 -v
```

Where `/dev/ttyACM0` is the Arduino's serial port.
Let ttymidi run with the Arduino plugged in and you'll see MIDI notes being received in real-time.

## What's Next?

We are going to take a break for now.
I don't when the next part will be posted, but I know it'll be about the Analog to Digital Converter (ADC).
We'll probably get back to MIDI-related topics another time.
See you next time!
