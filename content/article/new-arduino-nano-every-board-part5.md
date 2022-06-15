---
title: New Arduino Nano Every Trigger Board - Part 5
createdAt: 2022-06-15 18:25:57
updatedAt: 2022-06-15 18:25:57
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 4](/article/new-arduino-nano-every-board-part4).

As mentioned in the previous parts, especially the first one, the eXaDrums TB08-SE board can be used together with an Arduino Nano Every and the eXaDrumino Nano Every code to make a MIDI drum module. Here's a picture of the board.

![image](/images/new-arduino-nano-every-board/board.png)

I've been able to test it with my Roland TD17 and it works very well.
In particular, it is very impressive to see how much a tiny Arduino Nano Every can do.
Thanks to MIDI, the sound quality is spectacular, and we get multilayer sounds, round-robin, etc. for free by using a VST that handles those things.
For my tests, I used [hydrogen](https://hydrogen-music.org/) as a VST. It may not be the best, but it felt like playing with high quality material.

<!--more-->

## Context and Description

This project is part of the eXaDrums project.
It features a new board that allows to connect 8 drum pads to an Arduino Nano Every that, in turns, sends MIDI notes over USB.
The board hardware and software are both compatible with eXaDrums, but it can also be used as a standalone device.

The project name is eXadrumino Nano Every. It is a high performance firmware that allows to read eight analog inputs very fast and send MIDI notes over USB, or via the on-board USART. Using eXaDrums or a PC loaded with a VST, it allows to play drums with a very low latency.
The board itself is called *eXaDrums TB08-SE*, and it is compatible with other microcontrollers than the Arduino Nano Every.

Here's a brief reminder of the specs I gave in the first part of this series of articles:

- Works on PC and Raspberry Pi.
- Up to 7 single-zone pads + 1 hi-hat controller.
- Compatible with Roland TD-9, TD-11, TD-15, TD-17, TD-25, and TD-27-based edrum kits (DB25 connector).
- Sample rate greater than 70ksps (kilo samples per second).
- Nearly 9000 samples per second and per channel (8928 in average).
- Configurable trigger parameters: threshold, scan time and mask time (1ms step).
- Configurable MIDI channel and notes.

The last two are still under development.

## How to Get the Board?

I designed a board and got 5 prototypes PCBs.
However, that board requires some refinements. I would like to make some changes before I share the whole PCB so that it is as good as it can be.
Meanwhile, you can easily replicate the schematics, as it is a quite simple circuit.
Every piezo is wired to a single operational amplifier that acts as a simple amplifier that adds a bias voltage to the signal.
Here's how it looks:

![Circuit](/images/new-arduino-nano-every-board/Piezo-circuit.png)

The `Vcc` voltage is taken from the Arduino's 5V `power out` (pin number 12).
At the `Vbias` pin, the voltage is 1.65V.
It is obtained by using a voltage divider made of two 10k resistors that are wired to the 3.3V `power out` pin of the Arduino (pin number 2).

The hi-hat controller input is a little different, and simpler.
It consists of a single 4.7k resistor wired to the 3.3V pin of the Arduino on one side, and the hi-hat controller as well as the `+` input of voltage follower. It is the same divider for all operational amplifiers.

And that's it, you know everything. There are 4 dual operational amplifiers on the board, which makes a total of 8 inputs.
I got my prototypes from JLCPCB, using their SMT sevice, which means that I received assembled boards, that is, all the components were already soldered, except for the Raspberry Pi GPIO header socket.
If you'd like to get you own board, I do recommend JLCPCB, the PCBs are good quality and affordable, the only downside is the shipping cost.
Or, if you're patient, you can wait until I'm done with improving the board's layout, it shouldn't take too long.
Again, I just want to make the best board possible, which will require a few changes.

## Where is the Code?

The code is freely available at [GitHub](https://github.com/SpintroniK/exadrumino-Nano-Every).
You'll find more details as well as instructions that will help you flash the code to your Arduino.
Note that the code is still a work in progress, some features are not their yet.
The most important missing features are those that allow to change trigger and MIDI parameters via the USART, and save those parameters to the on-board EEPROM.

## Previous and Next Parts

So far there has been 4 parts published in this series of articles. This is the fifth one.
Here's a reminder of the previous parts and what they talk about:

- [Part 1](/article/new-arduino-nano-every-board-part1): New board specs, and how it works.
- [Part 2](/article/new-arduino-nano-every-board-part2): Makefile and the way C++ has been used to write the firmware.
- [Part 3](/article/new-arduino-nano-every-board-part3): Sending serial MIDI notes over USB.
- [Part 4](/article/new-arduino-nano-every-board-part4): How to use the ADC to make an oscilloscope and read triggers voltages.

There will be at least two more parts which will deal with the following topics:

- Part 6: How to get an efficient real-time counter.
- Part 7: How to filter the piezo output signal very fast to make a drum trigger.
- Part 8: How to read and write values to the on-board EEPROM.
- Maybe more...

See you next time!
