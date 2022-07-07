---
title: New Arduino Nano Every Trigger Board - Part 6
createdAt: 2022-07-05 16:11:31
updatedAt: 2022-07-05 16:11:31
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 5](/article/new-arduino-nano-every-board-part5).

In this part, we are going to talk about real-time counters.
In particular, we'll see advantages of using a relative time reference.

And we'll also see how the following figure helps us measure a time difference efficiently using a single byte as our time reference!

![delta](/images/new-arduino-nano-every-board/delta.png)

<!--more-->

## Absolute and Relative Time Reference

The first important thing that we need to know is that we can't have an absolute time reference.
Because our time reference needs to store the time in a variable, it will overflow at some point.
That means, an absolute time reference remains absolute as long as the counter variable doesn't overflow.

This is a major drawback, especially for limited hardware, where incrementing a 32-bit variable can be very expensive.
An 8-bit microcontroller such as the ATMega4809 isn't able to increment a 32-bit variable in a single instruction.
So, to avoid overflows, we need to either decrease the resolution of our counter, or store its value into a bigger variable.
But, this won't prevent the counter from overflowing at some point anyway... So what can we do about that?

Here's an example to illustrate our problem.
Say we want to increment a counter every microsecond.
We are playing drums an hour or two every day, and we'd like our time reference to be absolute.

Let's say we want to store our counter value in a 32-bit integer.
That leaves us with 4295 seconds before the counter overflows, which is slightly more than an hour.
We have three solutions:

- Use a 64-bit variable, which will cause an overflow after a few billion years.
- Increase the resolution of our timer to, say 1 ms, so that we get nearly 50 days before the variable overflows.
- Work with a relative time reference instead of an absolute one.

All three options work, but we are interested in the latter, as this will allow us to store our count in a 16-bit, possibly a 8-bit variable.

A relative time reference is a single variable that is incremented at regular interval.
The only difference with an absolute time reference is that we know it will overflow at some point, and that's not a problem.

## Relative Time Reference

### How it Works

Contrary to the absolute time reference, the relative time reference needs to be compared to another variable.
For instance, if a drum pad is hit, we get the value of our relative time reference (counter) and memorize it.
After some time, we are going to check how much time has elapsed since we've memorized the time reference value.

### Practical Example

First of all, we need to state the requirements for our time reference.
We'd like to make a drum module, so the time reference will be used to manage the triggers states.
That includes the trig time, scan time, and mask time.
For those values, it would be nice to have a resolution of 0.1 or 0.5 ms, something like that.
However, I will choose a step of 1 ms.
The main reason for that, is that 0.1 ms is too small and 0.5 ms could lead to confusion...

Let's say we use a 8-bit variable for our counter.
It is incremented every millisecond, so it can count from zero to 255 ms.
And it does so continuously until it overflows and goes back to zero.

Now if a drum pad is hit, the trigger registers the current value of the counter.
Imagine that the value of the counter is 42. It is stored in a `trigTime` variable.
We set the scan time to 4 ms, which means the scan time will be done when the counter reaches 46.
The only thing we need to know is: is the counter greater or equal to 46.

A problem arises if the counter overflows, though.
Let's say the pad has been hit when the counter's value was 254.
We'll know that the scan time is over when the counter's value will be greater or equal to 258.
But our 8-bit variable will overflow before that, so we'll get the following sequence: 254, 255, 0, 1, 2, instead of 254, 255, 256, 257, 258.

Fortunately, we can do something about that.
Instead of using unsigned integers, we can use signed integers, but we're going to go over a few other details before we do so.
We still use a 8-bit unsigned integer to store our counter's value, so it can go from 0 to 255.
We do the same for our scan time variable.
In order to determine if we have waited for a longer time than the scan time here's what we need to compute: `const uint8_t delta = trigTime + scanTime - currentTime;`.

So far, we still use an unsigned integer, but, let's examine precisely what happens with the previous values.
We have `trigTime = 254` and `scanTime = 4`.
Here's what happens if we subtract the `currentTime` variable to the previous value:

1. If `currentTime = 255` we get `delta =  254 + 4 - 255 = 3`.
2. If `currentTime` overflows, for instance, `currentTime = 1`, we get `delta =  254 + 4 - 1 = 1`.
3. If `currentTime` overflows, and we've waited longer than the scan time, for instance, `currentTime = 4`, we get `delta = 254 + 4 - 4 = 254`.

### A Little Bit of Theory

Now let's see what happens for a different value of `trigTime`: `trigTime = 120`, and consider a longer scanTime: `scanTime = 100`.

1. If `currentTime = 128` we get `delta =  120 + 100 - 128 = 92`.
2. If `currentTime` doesn't overflow, for instance, `currentTime = 200`, we get `delta =  120 + 100 - 200 = 20`.
3. If `currentTime` doesn't overflow, and we've waited longer than the scan time, for instance, `currentTime = 240`, we get `delta = 120 + 100 - 240 = 236`.

We see something interesting here, for cases 1 and 2, delta remains below 127, but in both cases, point number 3 gives us a value that is above 128.
This is understandable, because if `currentTime >= trigTime + scanTime`, `deltat = rigTime + scanTime - currentTime` goes below zero.
But with unsigned integers, that means `delta` is now 255 minus something, so we get 254 or 236 in the second third case.
Notice how the result is the same whether the value overflows or not!

What that means is that perhaps we should treat `delta` as a signed integer.
It's important to note that, even if we treat `delta` as a signed integer, the underlying binary value of `delta` remains the same.

A signed 8-bit integer goes from -128 to 127. The most significant bit, or MSB, determines the sign.
If that bit is set to 1, the value is negative, otherwise, it is positive.
So, if we count from zero, the value goes like this: 0, 1, 2, 3, ..., 126, 127, -128, -127, -126, ..., -3, -2, -1.
Which is to be compared to a unsigned integer that goes like: 0, 1, 2, 3, ..., 126, 127, 128, 129, 130, ..., 253, 254, 255.
Both sequences are different representations of the same binary value.

This means that `delta` is negative if the elapsed time since the trig time is longer than the scan time.
Back to our first example, but this time using the signed representation of delta:

1. If `currentTime = 255` we get `delta =  254 + 4 - 255 = 3`.
2. If `currentTime` overflows, for instance, `currentTime = 2`, we get `delta =  254 + 4 - 2 = 0`.
3. If `currentTime` overflows, and we've waited longer than the scan time, for instance, `currentTime = 4`, we get `delta = 254 + 4 - 4 = -2`.

We have the following three cases:

- If we have waited less than the scan time duration, the value is positive.
- If we have waited exactly the duration of the scan time, the value is zero.
- If we have waited more than the scan time duration, the value is negative.

Let's visualize what's happening here.

![delta](/images/new-arduino-nano-every-board/delta.png)

The value of `delta` reaches 0 when the elapsed time since the trig time is exactly the scan time.
For an unsigned integer, the next value is 255, and if we cast `delta` to a signed integer, it is -1.
There are a few options to detect the transition:

- We could simply test if the unsigned representation of `delta` is greater or equal to 128.
- We could test the MSB of the unsigned representation of `delta`.
- Or we could cast `delta` to a signed integer an check if the value is negative.

I like the latter the most because it gives us a useful information for free: the elapsed time since the end of the scan time.
That time is equal to `-delta`.
However, there's one thing that I didn't mention: we loose half of the values of our 8-bit integer.
All three options above lead to the same result, we can now only measure time differences that go from 0 to 128ms.

If you'd like a to read a slightly different explanation of this idea, please read the [following article from Lucky Resistor](https://luckyresistor.me/2019/07/10/real-time-counter-and-integer-overflow/).

## Using TCB0 as a Real Time Counter

We are already using the TCA counter to trigger the ADC conversions, so we are going to use the TCB0 timer/counter instead.

### Configure TCB0 and Handle Interrupts

The TCB timer/counter can do a lot of things, but we're only going to use it as a counter here.
First of all, we define a class to handle the counters interrupts:

```cpp
class TCBInterrupts
{

public:
    TCBInterrupts() = delete;
    ~TCBInterrupts() = delete;

private:

    static void TCB0Overflow() __asm__("__vector_12") __attribute__((__signal__, __used__, __externally_visible__));
    static void TCB1Overflow() __asm__("__vector_13") __attribute__((__signal__, __used__, __externally_visible__));

};
```

And yes, "counters" with an "s", as there are 4 TCB timers.
Note that I implemented the interrupts for TCB0 and TCB1 only.

Now let's add a little helper to choose the right clock for TCB0:

```cpp
enum class TCBClock
{
    Div1,
    Div2,
    TCA
};
```

We'll use the same clock as TCA.
And now a class to configure the TCB counters:

```cpp
template <uint8_t nb>
class TCB
{

public:
    TCB() = delete;
    ~TCB() = delete;

    static constexpr void EnableInterrupts()
    {
        tcb().INTCTRL =  TCB_CAPT_bm;
    }

    static constexpr void ResetInterrupt()
    {
        tcb().INTFLAGS |= TCB_CAPT_bm;
    }

    static constexpr void SetCompareOrCapture(uint16_t value)
    {
        tcb().CCMP = value;
    }

    static constexpr void Enable()
    {
        tcb().CTRLA |= TCB_ENABLE_bm;
    }

    template <TCBClock clock>
    static constexpr void SetClock()
    {
        switch(clock)
        {
            case TCBClock::Div1: tcb().CTRLA |= TCB_CLKSEL_CLKDIV1_gc; break;
            case TCBClock::Div2: tcb().CTRLA |= TCB_CLKSEL_CLKDIV2_gc; break;
            case TCBClock::TCA: tcb().CTRLA |= TCB_CLKSEL_CLKTCA_gc; break;
        }
    }

private:

    static constexpr auto& tcb()
    {
        switch(nb)
        {
            case 0: return TCB0;
            case 1: return TCB1;
            case 2: return TCB2;
            case 3: return TCB3;
            default: static_assert(nb <= 3, "Wrong TCB number.");
        }
    }

};

```

The functions names are self-explanatory.

### A Real-Time Counter

Before we continue, we need one more ingredient: a counter.
To that end, I'll make a class template that will allow to choose the type of variable that the counter uses.

```cpp
template <typename T>
class Counter
{     

public:

    Counter() = default;
    ~Counter() = default;

    constexpr T GetCount()
    {
        return count;
    }

    constexpr void Increment()
    {
        ++count;
    }

private:

    T count{};
};
```

And that's it, now we can add all these niceties to our main function.

```cpp

#include "Adc.hpp"
#include "Counter.hpp"
#include "TCB.hpp"

#include <avr/io.h>
#include <avr/interrupt.h>

using Adc0 = Adc<Adc0Addr, Adc8bitType>;
using Tcb = TCB<0>;

Counter<uint8_t> clock{};

void Analog::AdcInterrupts::ResReady()
{
    Adc0::ResetInterrupt();
    trigger.Process(ADC0.RES, clock.GetCount());
}

void Timing::TCBInterrupts::TCB0Overflow()
{
    Tcb::ResetInterrupt();
    clock.Increment();
}

int main()
{

    while(1)
    {
        ;
    }

    return 0;
}

```

We use the relative time reference in the ADC interrupt, so that we know how much time has elapsed since we've received the previous samples.
In this interrupt there's a `trigger.Process()` function.
It is the function that will process the ADC data, together with the time reference, to compute the trigger state.
Here's an example that shows how this function can use the relative time reference:

```cpp
void Trigger::Process(uint8_t data, uint8_t time) const
{
    // [...]

    const uint8_t delta = this->trigTime + this->scanTime - time;

    if(static_cast<int8_t>(delta) <= 0)
    {
        // ...
    }

    // [...]
}
```

At some point in time, the ADC value exceeds a certain threshold, which in turn, puts the trigger in scan state.
The trigger remains in that state for `scanTime` milliseconds.
During that time, the peak value of the signal is computed.

The question we answer here is: how do we know when the scan time is over?
And the answer is simple: we check whether the signed representation of `delta` is positive or negative.
As soon as it becomes a negative value, we know that the scan time is over and we're done computing the signal's peak value.
Thus, we can go on and put the trigger in its next state, etc.

There we are, with a single byte we get a relative time reference that we can use to measure delays from 1 to 128 ms.
We don't need it to be an absolute time reference as long as we use a variable to memorize the start of the delay (`trigTime`).
Using this method, we can measure as many delays as we want as long they remain under 128 ms, and that we use a byte for each delay to memorize the when it starts.
Of course this also works if we use a 16-bit variable (or even bigger), it is just faster to use a 8-bit variable on a 8-bit CPU.

## What's Next?

Next time we'll talk about signal processing.
In particular, we will see how to make a high-pass filter that performs well with a 8-bit microcontroller.

See you next time!
