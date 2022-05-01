---
title: New Arduino Nano Every Trigger Board - Part 1
createdAt: 2022-05-01 12:41:05
updatedAt: 2022-05-01 12:41:05
---

This project has been in the works for about a year.
I often get questions about MIDI support, so I spent some time developing a new exadrums board that supports MIDI.
Before we start, please note that this post will be split into several parts.

The board is capable of handling 8 triggers.
It can send MIDI notes over USB, or directly to a serial device such as a Raspberry Pi.
There is no on-board Analog to Digital Converter (ADC). Instead, there are two 15-position Arduino Nano-compatible female headers.
Any microcontroller that is pin-compatible with the Arduino Nano will fit.
For the rest of this post, I'll assume that the microcontroller is an Arduino Nano Every.

But before we dive into the details, check out that board!

![image](/images/new-arduino-nano-every-board/board.png)
![image](/images/new-arduino-nano-every-board/board-arduino.png)

Board alone (left), and board with Arduino mounted on (right).
I went for a blue PCB so that it would match the Arduino's color.


<!--more-->

## Board Specs

So far, with an Arduino Nano Every, I've achieved the following:

- Compatible with Roland TD-9, TD-11, TD-15, TD-17, TD-25, and TD-27-based edrum kits (DB25 connector).
- Sample rate greater than 70ksps (kilo samples per second).
- Nearly 9 samples per milliseconds and per channel (8.93 in average).
- Configurable trigger parameters: threshold, scan time and mask time (1ms step).
- Configurable MIDI channel and notes.

Using 7 of the 8 inputs (the pads only), I managed to optimize the firmware quite a bit, as it fits into less than 2k bytes of flash and uses less than 128 bytes of RAM. Of course, this will increase a little when the hi-hat pedal code will be added.

## This New Board is Called TB08-SE

This new board's name is *eXaDrums TB08-SE*.
Read *eXaDrums Trigger Board, 8 inputs, Special Edition*.
I consider this board a special edition because this is the first exadrums board that is MIDI-compliant, and also because it is modular.
As you can see on the photos above, the Arduino isn't soldered to the board, which means you can use another microcontroller if you want to (for instance an STM32 Nucleo board). As long as the pinout is compabitle, of course. Note that I don't recommend the Arduino Nano for this board, as its ADC is way too slow. The Arduino Nano Every, on the other hand, is a perfect fit!

## How it Works

### Analog Circuitry

The analog part of the board is quite straightforward. It uses op-amps and passive components to scale down the piezo voltage to the 0-3.3V range.
At rest, the output voltage is 1.65V (3.3V/2).
Among the 8 inputs, 7 are intended to be used with single-zone pads, and one is to be used with a hi-hat controller.

Here's how everything is wired:

|  Instrument   | Cable Reference | Arduino Analog Input | ATMega4809 Analog Input |
|---------------|-----------------|----------------------|-------------------------|
| Kick          |  KIK            |  A0                  |  AIN3                   |
| Snare         |  SNR            |  A1                  |  AIN2                   |
| Hi-hat        |  HH             |  A2                  |  AIN1                   |
| Hi-hat Control|  HHC            |  A3                  |  AIN0                   |
| Crash         |  CR1            |  A4                  |  AIN12                  |
| Tom1          |  T1             |  A5                  |  AIN13                  |
| Tom3          |  T3             |  A6                  |  AIN4                   |
| Ride          |  RD             |  A7                  |  AIN5                   |

### Arduino Nano Every

I chose the Arduino Nano Every because it's affordable, popular, small, and more importantly, because it has the right specs for the job!
The on-board ATMega4809 has plenty of flash and RAM, so I knew these wouldn't cause any issues.
The ADC is a crucial element for an edrum project, and the ATMega4809 has a 10-bit ADC that is capable of running at a 115ksps.
For a 8-input board, that means about 14 samples per millisecond and per channel, which is quite good (it's recommended to get, at the very least, 5 samples per ms and per channel. But usually, [it's best to get around 10 samples/ms/channel](https://www.vdrums.com/forum/advanced/technical/1215866-edrumin-let-s-talk-about-it?p=1216107#post1216107)).

However, the ATMega4809 isn't a powerful beast. First of all, the Arduino Nano Every runs at 16MHz by default.
Although you can change the CPU clock to a slightly higher frequency of 20MHz, I decided not to do that in order to keep things simple (and challenging).
You might think that 16MHz is quite a lot, after all it means that one clock cycle is as short as 62.5ns, but there's another catch.
The ATMega4809 is an 8-bit microcontroller, which means that even adding two 32-bit integers requires several clock cycles.
So, when you only have a few microseconds between each ADC reading, it's kind of foolish to consider floating point arithmetic...
FIY, the Arduino Nano Every's score at the CoreMark CPU Benchmark is 8.20, where 32-bit microcontroller such as the Teensy 3.2 (72MHz) scores well above 100, and a Teensy 3.6 gets a core of 440, [which is more than 50 times the Arduino Nano Every score](https://github.com/PaulStoffregen/CoreMark).

So with all those limitations in mind, I decided to go for 12 microseconds between each sample.
That leaves around 200 instructions (per channel) for all the computations.
Unfortunately, that was a bit ambitious, so I had to increase that time to 14µs, which leads to almost 9 samples per millisecond and per channel.
But you already knew that if you read the post from the beginning.

## The Devil is in the Details

So what do we need to make this work?
Here's a list I came up with when I was starting to think about this project.
We need to:

- Get at least 5 samples per milliseconds and per channel.
- Provide an internal time reference.
- Avoid floating point numbers and complex calculations.
- Use hardware capabilities whenever possible.
- Go as low level as possible to optimize computations.
- Write high level code to improve readability.

But how to go as high level as possible and optimize the code at the same time?
To be honest, I didn't even think about that at first...
I started to write all the code in C, so that I could get a working prototype.
Then I introduced some high level C++ to improve the code readability.
As I was doing that, I noticed the compiled program was getting smaller and smaller.
So, without any massive effort, I managed to write high level readable code that was also quite optimized.
At some point, the program was mainly written in C and was using 978 bytes of flash.
Rewriting the same program in C++ decreased the program size to 918 bytes.
I didn't try to find the reason why that is, but my conclusion was that gcc is awesome!

## What's Next?

It would take a long time to describe everything that's going on, so I'll stop here for now and cover more things in part 2.
The next part will be about getting the code to compile and upload to the Arduino board, without the Arduino library.
