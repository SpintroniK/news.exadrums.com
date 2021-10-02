---
title: How to Make a Modern Drum Module
createdAt: 2021-10-02 06:27:36
updatedAt: 2021-10-02 06:27:36
---

Over the past few years, I've worked on improving exadrums to make it as complete as possible.
However, before that, I spent a lot of time making sure the software and hardware would meet some very specific requirements.
On the software side, the latency had to be below 10ms, and the sound quality at least as good as our dear old compact discs.
And on the hardware side, the trigger input board had to preserve the piezos' dynamics, and be compatible with most edrums out there.
Achieving all of this wasn't an easy task, and took about three years, from September 2015 to September 2018.

Moreover, exadrums had to be a *modern* and accessible drum module. Which is why it is based on the Raspberry Pi (2+) and uses a 7" touchscreen. So, September 2018 was the confirmation that all those targets were reached, and it was time to write down how all these things came together.

<!--more-->

## How to Make it Work as Expected?

About three years ago, I wrote a short article that describes how and why I defined the software and hardware requirements, but also how I managed to make everything work as expected. I'll go into a bit more details below, but you can skip that part if you're in a hurry, and go straight to the article.

## Making a Modern Drum Module

Making a modern drum module means breaking the rules. Nearly a hundred percent of the existing drum modules use a microcontroller to leverage their real-time properties. However, that means that the amount of memory is often limited, and the user interface is rudimentary (buttons, sliders, etc.), and can't evolve without modifying the hardware.

By choosing the Raspberry Pi, I made it possible to have a modern user interface, using a touchscreen, but I lost all the real-time goodness that microcontrollers have to offer.
Fortunately, there was a solution to reduce the latency with a Raspberry Pi.
Unsurprisingly, getting more performance means going low-level, but also getting a good soundcard.
The soundcard latency represents a third of the total latency.
The software adds another third, and the last third is the trigger scan time.

## Making a Trigger Input Board

Making a trigger input board, is not overly complicated. But there are still two big challenges:

- Make sure all the components fit on the board.
- Find a way to make the board compatible with all the drum pads out there.

The first challenge is not too hard, thanks to SMD components. Especially for a 8-input board. That'll be a bit more difficult with 16 inputs...
As for making the board compatible with all the drum pads, I decided to connect potentiometers to the piezos, so that their output voltage can be scaled down if necessary. That avoids the biggest problem: clipping!

## How to Make a Modern Drum Module

Now that you've got the context, maybe you'd like to read the article, so here it is.
If for some reason your web browser doesn't show the pdf, here's a link to it: <a href="/docs/how-to-make-a-drum-module/HTMADM.pdf" target="_blank">How to Make a Modern Drum Module</a>.
<object data="/docs/how-to-make-a-drum-module/HTMADM.pdf" type="application/pdf" style="width: 100%; height: 100vh"></object>
