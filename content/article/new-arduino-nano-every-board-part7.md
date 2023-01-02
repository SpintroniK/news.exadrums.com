---
title: New Arduino Nano Every Trigger Board - Part 7
createdAt: 2023-01-01 11:32:42
updatedAt: 2023-01-01 11:32:42
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 6](/article/new-arduino-nano-every-board-part6).

In this part, we are going to talk about digital filtering.
The board that was made for this project adds a DC offset to the signal to keep the voltage above 0V, as shown below.

![Circuit](/images/new-arduino-nano-every-board/Piezo-circuit.png)

If we get bytes from the ADC, the values are going to be centered around 127, and go from 0 to 255.
However, the offset won't always be exactly 127, as it depends on a voltage source and a voltage divider.
The offset may vary over time, so we can't really subtract 127 to the value read by the ADC.
This is why we need a high-pass filter.

<!--more-->

## High-pass Filter in Electronics

In electronics, a high-pass filter is made of two components: a resistor and a capacitor.
The capacitor naturally acts as a high-pass filter, but a resistor is required in order to control the cutoff frequency of the filter.

For a first order, RC, high-pass filter, the cutoff frequency is given by fc = 1/(2πRC).
For instance, the association of a 10 kΩ resistor and a 1 µF capacitor gives fc ≈ 16 Hz.
The signal amplitude below 16 Hz will be attenuated, which means that any DC offset will be automatically removed.

It means that, using such a high-pass filter, a signal that takes values from 0 to 255 while being centered around 127, will be shifted so that it is centered around zero and takes values that go from -127 to 128.
As a side-effect, the lowest frequencies (below 16 Hz) will also be filtered, but in our case, that is negligible.

## Algorithmic Implementation

Without going into too much detail, the RC high-pass filter can be translated into equations that can then be translated into a simple algorithm.
The output value `out` depends only on the input `in` and the values of R and C.
Time is 'translated' to indices, so `i` represents the time.
The output of the system is given by `out[i] = α × (out[i−1] + in[i] − in[i−1])`, where `α = RC / (RC + dt)`, `dt` being the elapsed time between samples `i` and `i+1`.
So we only need to know the previous output sample, and the current and previous input samples to compute the new output value.

This is fairly easy to implement, however, there is a problem.
The above algorithm requires the use of floating-point number.
When dealing with a 8-bit microcontroller, this can become problematic.

Enter the world of fixed-point arithmetic!

## Fixed-Point DC Blocking Filter

### DC Blocking Filter

A DC blocking filter is not exactly the same thing as a high-pass filter.
Let's focus a little bit on [digital filtering](https://en.wikipedia.org/wiki/Digital_filter).
When dealing with digital filtering, filters are described using the so called [Z-transform](https://en.wikipedia.org/wiki/Z-transform).
One advantage I see in doing so, is that it's easy to reason about complex filters.

For instance, let's consider a simple high-pass filter.
In digital signal processing, its transfer function can be described as:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="T(z) = \frac{out(z)}{in(z)} = \frac{1 - z^{-1}}{1 - pz^{-1}}  ">
  <mrow>
    <mi>T</mi>
    <mo stretchy="false">(</mo>
    <mi>z</mi>
    <mo stretchy="false">)</mo>
    <mo>=</mo>
    <mfrac>
      <mrow>
        <mi>o</mi>
        <mi>u</mi>
        <mi>t</mi>
        <mo stretchy="false">(</mo>
        <mi>z</mi>
        <mo stretchy="false">)</mo>
      </mrow>
      <mrow>
        <mi>i</mi>
        <mi>n</mi>
        <mo stretchy="false">(</mo>
        <mi>z</mi>
        <mo stretchy="false">)</mo>
      </mrow>
    </mfrac>
    <mo>=</mo>
    <mfrac>
      <mrow>
        <mn>1</mn>
        <mo>-</mo>
        <msup>
          <mrow>
            <mi>z</mi>
          </mrow>
          <mrow>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msup>
      </mrow>
      <mrow>
        <mn>1</mn>
        <mo>-</mo>
        <mi>p</mi>
        <msup>
          <mrow>
            <mi>z</mi>
          </mrow>
          <mrow>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msup>
      </mrow>
    </mfrac>
  </mrow>
</math>

The parameter *p* is a pole, and has a big influence on the filter's transfer function, as shown on the figure below:

![HPFilter](/images/new-arduino-nano-every-board/hp.svg)

By the way, I used Octave to create this figure, here's the code to replicate it:

```matlab
ps = [0 0.5 0.9 0.99];

for p = ps

    p
    b = [1 -1];
    a = [1 -p];


    [h, w] = freqz(b, a);

    n = length(w);
    
    plot(w(1:n/2), 20*log10(abs(h(1:n/2))), "linewidth", 3);
    hold on;

endfor

xlabel('Freq. (rad/s)');
ylabel('Gain (dB)');
grid on;
legend("show")
legend("p = 0", "p = 0.5", "p = 0.9", "p = 0.99")
set(gca, "linewidth", 3, "fontsize", 14)
```

What we'd like is to have something that's close to the curve given by *p = 0.99*, as it blocks DC values and keeps all higher frequencies.

### Fixed-Point Arithmetic

Clearly, the main advantage of fixed-point arithmetic is speed.
The Arduino Nano Every doesn't have a floating-point unit, so every operation that involves floating-point numbers is super slow, as it requires a lot of instructions. Multiplying two floats (that are 32-bit numbers) takes several milliseconds, which is way too long for our purposes.

Our goal is to find a way to perform the high-pass filtering operation using algorithms that operate on bytes.
This will involve fixed-point operations, but will also require a few tricks to make things work as expected.

### Fixed-Point DC Blocker

We can use the previous equation to compute the current output value as a function of the previous output value, and the current and previous input values:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="y[n] = p y[n - 1] + x[n] - x[n - 1] ">
  <mrow>
    <mi>y</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
    <mo>=</mo>
    <mi>p</mi>
    <mi>y</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mo>-</mo>
    <mn>1</mn>
    <mi>]</mi>
    <mo>+</mo>
    <mi>x</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
    <mo>-</mo>
    <mi>x</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mo>-</mo>
    <mn>1</mn>
    <mi>]</mi>
  </mrow>
</math>
<br>

Where *y* is the output and *x* is the input.
Of course this formula is valid if we use floating-point numbers.
However, we can notice that this is equation can be applied in two distinct steps:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="w[n] = x[n] - x[n-1] ">
  <mrow>
    <mi>d</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
    <mo>=</mo>
    <mi>x</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
    <mo>-</mo>
    <mi>x</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mo>-</mo>
    <mn>1</mn>
    <mi>]</mi>
  </mrow>
</math>

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="y[n] = p\,y[n-1] + w[n] ">
  <mrow>
    <mi>y</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
    <mo>=</mo>
    <mi>p</mi>
    <mi>y</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mo>-</mo>
    <mn>1</mn>
    <mi>]</mi>
    <mo>+</mo>
    <mi>d</mi>
    <mi>[</mi>
    <mi>n</mi>
    <mi>]</mi>
  </mrow>
</math>
<br>
The first step represents a differentiator, and the second step a leaky integrator.
The differentiator has the transfer function of the very first equation when p = 0, so it's basically a DC blocker, but it blocks more than just low frequencies.
Thanks to the leaky integrator, those frequencies are less attenuated, so it's definitely what we want to obtain.

### Understanding and Prototyping a Fixed-Point DC Blocker

Using integers instead of floats results in quantization errors, especially due to the leaky integrator.
Furthermore, how do we deal with *p*, whose value lies between 0 and 1?
Let's assume that the input is an unsigned 8-bit integer, and the output is a signed 8-bit integer.
The input values go from 0 to 255 whereas the output values go from -127 to 128.

Before rushing into it, let's make a little detour and try to implement the DC blocker algorithm using Octave.
We need to convert the previous equations into something we can use in a fixed-point algorithm.
Here's what we have so far:

- x<sub>n</sub> is the input of the DC blocker.
- d<sub>n</sub> is the output of the differentiator.
- y<sub>n</sub> is the output of the DC blocker.

Now we're going to have to use the previous equation with integers, so at some point, we'll have a quantization that will introduce a quantization error: e<sub>n</sub>.
The technique that we are going to use is called fraction-saving, it works very well when *p* is close to 1.
It consists in memorizing the round-off error of the previous sample and subtract it to the next sample, to minimize that error.

So now we need and extra variable to store the error.
The thing is that it's possible to overflow the 8-bit capacity, because we'll add the previous value of the error, e<sub>n-1</sub>.
We have no choice but to make our new variable a 16-bit integer to store the extra bit that might be required. Fortunately, the ATMega4809 can perform some 16-bit operations very efficiently, so that's not a big deal.
To optimize things as much as possible, we'll use this variable to store the error as well as the current value of y<sub>n</sub>.

It's now time to do some prototyping and testing.
Let's call the new variable *acc*. We can store the quantized value of y<sub>n</sub> in the upper 9 bits (to avoid any overflow) of *acc* and e<sub>n</sub> in the lower 7 bits.  
We'll use Octave to make sure everything works out before we implement the final filter in C++.

To that end, we'll introduce three main variables, `prevX`, `prevY` and `acc`.
The names speak for themselves.
Our test will consist of an input of 100 samples that basically repeat the values 77 and 177 until the end of the sequence.
This input signal is centered around 127 and oscillates from 77 to 177.
If the DC component is removed, we'll end up with an output that is centered around 0 and goes from -50 to +50.

Here's the code for our prototype, with p = 0.98:

```matlab
prevX = int16(0);
prevY = int16(0);
acc = int16(0);

xa = repmat([uint8(77), uint8(177)], [1, 50]);

t = linspace(0, length(xa), length(xa));

y = [];

for x = xa
                                    % acc = y_{n-1} << 7 - e_{n-1}
  acc = acc - prevX;                % acc = acc - x_{n-1} << 7
  prevX = bitshift(int16(x), 7);    % prevX = x_n << 7
  acc = acc + prevX;                % acc = acc + x_n << 7 - e_{n-1}
  % d_n is now in the upper 9 bits of acc
  % acc = (y_{n-1} + d_n )<< 7 - e_{n-1}
  acc = acc - prevY * 256*(1 - .98);% acc = acc - y_{n-1} * (1<<8 * (1 - p)) - e_{n-1}
  % acc = [ y_{n-1} - y_{n-1} * (1<<8 * (1 - p)) + d_n ] << 7 - e_{n-1}
  prevY = bitshift(acc, -7);        % prevY = acc >> 7 + e_n (error introduced by quantization)
  y = [y; prevY];

endfor

plot(t, y)
```

And here's the result:

![DCBlocker](/images/new-arduino-nano-every-board/dc_blocker.svg)

As expected, after a transient phase, the signal oscillates between -50 ans 50.
The transient phase is tightly related to the value of *p*.
The closer *p* gets to 1, the longer the transient.

Now, let's dig into the code and got through the comments.
First of all, let's assume that the loop already iterated at least once.
The *acc* variable holds y<sub>n-1</sub> << 7 - e<sub>n-1</sub>.

Firstly, we perform the following operation: acc = acc - x<sub>n-1</sub> << 7, which means that the upper 9 bits of *acc* are now y<sub>n-1</sub> - x<sub>n-1</sub>.
We then store x<sub>n</sub> into the upper 9 bits of *prevX*, and add that value to *acc*.
At this point, we have acc = y<sub>n-1</sub> - x<sub>n-1</sub> - e<sub>n-1</sub> (remember that the initial value of *acc* held the value -e<sub>n-1</sub> in its lowest bits).

Alright, now we encounter that line: `acc = acc - prevY * 256*(1 - .98);`.
Without going into too much detail, if we take the previous equations, we get:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="y_n = Q{p\,y_{n-1} + d_n - e_{n-1}}  ">
  <mrow>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>=</mo>
    <mi>Q</mi>
    <mi>{</mi>
    <mi>p</mi>
    <mspace width="0.167em"/>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
        <mo>-</mo>
        <mn>1</mn>
      </mrow>
    </msub>
    <mo>+</mo>
    <msub>
      <mrow>
        <mi>d</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>-</mo>
    <msub>
      <mrow>
        <mi>e</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
        <mo>-</mo>
        <mn>1</mn>
      </mrow>
    </msub>
    <mi>}</mi>
  </mrow>
</math>
<br>

where *Q* represents the quantization, which is of course implicit.
Notice that we are feeding the quantization error from the previous iteration of the loop (e<sub>n-1</sub>) on purpose.
The error for the n<sup>th</sup> iteration is thus given by:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="e_n = Q{p\,y_{n-1} + d_n - e_{n-1}} - \left(p\,y_{n-1} + d_n - e_{n-1}\right) = y_n - \left(p\,y_{n-1} + d_n - e_{n-1}\right) ">
  <mrow>
    <msub>
      <mrow>
        <mi>e</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>=</mo>
    <mi>Q</mi>
    <mi>{</mi>
    <mi>p</mi>
    <mspace width="0.167em"/>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
        <mo>-</mo>
        <mn>1</mn>
      </mrow>
    </msub>
    <mo>+</mo>
    <msub>
      <mrow>
        <mi>d</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>-</mo>
    <msub>
      <mrow>
        <mi>e</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
        <mo>-</mo>
        <mn>1</mn>
      </mrow>
    </msub>
    <mi>}</mi>
    <mo>-</mo>
    <mrow>
      <mo>(</mo>
      <mrow>
        <mi>p</mi>
        <mspace width="0.167em"/>
        <msub>
          <mrow>
            <mi>y</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>d</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
        <mo>-</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
      </mrow>
      <mo>)</mo>
    </mrow>
    <mo>=</mo>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>-</mo>
    <mrow>
      <mo>(</mo>
      <mrow>
        <mi>p</mi>
        <mspace width="0.167em"/>
        <msub>
          <mrow>
            <mi>y</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>d</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
        <mo>-</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
      </mrow>
      <mo>)</mo>
    </mrow>
  </mrow>
</math>
<br>

When you think about it, it is quite obvious!
Let's re-order the terms, without forgetting that y<sub>n</sub> has been subject to quantization:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="y_n = \left(p\,y_{n-1} + d_n - e_{n-1} + e_n\right) ">
  <mrow>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>=</mo>
    <mrow>
      <mo>(</mo>
      <mrow>
        <mi>p</mi>
        <mspace width="0.167em"/>
        <msub>
          <mrow>
            <mi>y</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>d</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
        <mo>-</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
      </mrow>
      <mo>)</mo>
    </mrow>
  </mrow>
</math>
<br>

The reason why y<sub>n-1</sub> is already stored in *acc* is that it is simply the last line of our loop.
Since we've already ran through it at least once, that makes sense.
However, this value is y<sub>n-1</sub>, and not p.y<sub>n-1</sub>.
That's too bad because the previous equation contains p.y<sub>n-1</sub>...
Let's rewrite it so that it fits our needs:

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" title="y_n = \left(y_{n-1} - (1 - p)\,y_{n-1} + d_n - e_{n-1} + e_n\right) ">
  <mrow>
    <msub>
      <mrow>
        <mi>y</mi>
      </mrow>
      <mrow>
        <mi>n</mi>
      </mrow>
    </msub>
    <mo>=</mo>
    <mrow>
      <mo>(</mo>
      <mrow>
        <msub>
          <mrow>
            <mi>y</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>-</mo>
        <mo stretchy="false">(</mo>
        <mn>1</mn>
        <mo>-</mo>
        <mi>p</mi>
        <mo stretchy="false">)</mo>
        <mspace width="0.167em"/>
        <msub>
          <mrow>
            <mi>y</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>d</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
        <mo>-</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
            <mo>-</mo>
            <mn>1</mn>
          </mrow>
        </msub>
        <mo>+</mo>
        <msub>
          <mrow>
            <mi>e</mi>
          </mrow>
          <mrow>
            <mi>n</mi>
          </mrow>
        </msub>
      </mrow>
      <mo>)</mo>
    </mrow>
  </mrow>
</math>
<br>

Now the line `acc = acc - prevY * 256*(1 - .98);` makes a lot of sense, as this is almost exactly the equation we've just written.
I say almost for two reasons.
The first one is that the term e<sub>n</sub> is missing for now, as it is introduced by the next line of code.
The other reason is that the equation doesn't show the `256` that is basically a normalization factor so that *p* no longer acts on floats, but on bytes instead (8-bit integers).
By the way, in practice, the value 256*(1 - .98) is not 5.12 as it should be because we're not dealing with floating-point numbers.
So, we should replace that whole expression by 5, which means that p = 0.9805.

That means not all values of *p* are allowed.
For instance, excluding 1, the first 10 values of *p* are: 0.9961, 0.9922, 0.9883, 0.9844, 0.9805, 0.9766, 0.9727, 0.9688, 0.9648, 0.9609.

Now all that's left is the step where the quantization actually happens, which corresponds to the very last operation of the loop.
That line translates to `prevY = acc >> 7;` in C++.
You may notice that this means *prevY* could be an 8-bit integer instead of a 16-bit one, but that would make the code a tad more complex, so we'll keep a 16-bit integer.

Since the quantization happens here, this line is equivalent to prevY = y<sub>n</sub> + e<sub>n</sub> - e<sub>n-1</sub>, because we introduced the term -e<sub>n-1</sub> a few lines ago on purpose.
As we can see, this explains why we assumed that acc = y<sub>n-1</sub> << 7 - e<sub>n-1</sub> at the beginning.
This also shows that we found a way to compensate for the quantization error.

## Fixed-Point DC Blocker Implementation in C and C++

So far, everything behaves as expected.
Thanks to a few tricks, we've optimized things quite a lot and are down to a few lines of code to perform the DC blocking operation.
All the operations that are involved operate on 16-bit integer. They are mainly additions and subtraction, however, there is one multiplication involved.

We know that we need to multiply *prevY* by 256*(1 - p).
As I have already explained, using integer types limits the possible values.
That's why there are only 10 possible values between p = 0.996 and p = 0.96.
But if we restrict the values even more, we can make sure that our final multiplication end-up being a multiple of two.
This means that it won't be a multiplication anymore, but a simple bit shift operation, which is a lot more efficient.
Simply put, that limitation leads to these four values between 0.996 and 0.96: 0.9961, 0.9922, 0.9844, 0.9688.

Let's choose p = 0.9922, that lead us to a multiplication by 2.
Here's how it translates in C++ ([and can easily be adapted to C](https://dspguru.com/dsp/tricks/fixed-point-dc-blocking-filter-with-noise-shaping/)):

```cpp

static int16_t prevX = 0;
static int16_t prevY = 0;
static int16_t acc = 0;

int8_t RemoveDC(uint8_t x)
{

  acc   -= prevX;
  prevX = static_cast<int16_t>(x) << 7;
  acc   += prevX;
  acc   -= prevY << 2; // p = .9922 => 256 * (1 - p) = 2
  prevY = acc >> 7;

  return static_cast<int8_t>(prevY);
}
```

Here we are, only 5 lines of code to perform a DC blocking operation, using only additions, subtractions, and bit shift operations.
On a ATMega4809 clocked at 16MHz that is less than 10µs of execution time, that's just perfect!

Before concluding, I think it's worth mentioning that the transient response of the DC blocker lasts for about 350 samples.
That's not a lot, rounding up to 400 samples, that's 4ms at 100ksps, not too bad.

## From a DC Blocker to a C++ Drum Trigger

So, what happens after we remove the DC offset from the input signal?
In the [previous part of this series](/article/new-arduino-nano-every-board-part6), we've imagined a `Trigger` class that would contain a `Process` method:

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

We knew what to do with the `time` variable, now we know what to do with the `data` variable.
First of all, it has to go through the `RemoveDC` function, and then, we can take the absolute value of the filtered signal and apply some peak detection and other algorithms to it.
The code is on [Github](https://github.com/SpintroniK/exadrumino-Nano-Every/blob/de670fde4b6f3fe18d61a9d21d77866de8024d00/src/Module/Trigger.hpp#L25), but if you only care about the `Process` method, here's a snippet:

```cpp
void Process(uint8_t value, uint8_t currentTime) noexcept
{
    acc   -= prevX;
    prevX = static_cast<int16_t>(value) << 7;
    acc   += prevX;
    acc   -= prevY << 2;
    prevY = acc >> 7;

    const uint8_t velocity = ::abs(prevY);


    if(state == 0) // Idle
    {
        if(velocity >= threshold)
        {
            trigTime = currentTime;
            state = 1;
            return;
        }
    }

    if(state == 1) // Scan
    {
        maxVelocity = velocity > maxVelocity ? velocity : maxVelocity;
        maxVelocity = maxVelocity >= 127 ? 127 : maxVelocity;

        const uint8_t delta = trigTime + scanTime - currentTime;
        if(static_cast<int8_t>(delta) <= 0)
        {
            state = 2;
            trigVelocity = maxVelocity;
            return;
        }
    }

    if(state == 2)
    {
        const uint8_t delta = trigTime + maskTime - currentTime;
        if(static_cast<int8_t>(delta) <= 0)
        {
            state = 0;
            maxVelocity = 0;
            return;
        }
    }

    return;
}
```

It is basically a state machine.

## What's Next?

Next time we'll talk about how to read and write values to the Arduino's EEPROM.

Happy new year, and see you next time!
