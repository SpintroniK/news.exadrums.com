---
title: Raspberry Pi OS - Bullseye
createdAt: 2021-11-12 18:07:46
updatedAt: 2021-11-12 18:07:46
---

Remember this article about [exadrums becoming an official Debian package](article/debian-bullseye)?
It's now time to play (exa)drums on your Raspberry Pi.
The Raspberry Pi Foundation released the latest Raspberry Pi OS *bullseye* a few days ago, and as you may have guessed, it includes exadrums packages:

![image](/images/raspberry-pi-os-bullseye/screenshot.png)

Now, you simply have to type `sudo apt install exadrums` into a terminal to install exadrums on your Raspberry Pi.

<!--more-->

It took some time to get to that point, but you get exadrums 0.6.0, which fairly recent, and works on my Roland TD-4KP drum set.
If you'd like to try exadrums with your TD-4KP drum set, it's quite easy.
First of all, you'll need to install *zip*, as it's not installed by default: `sudo apt install zip`.
Then, you can go to the following page: https://github.com/SpintroniK/exadrums-data/tree/TD-4KP and follow the instructions.

Obviously, the project is still under development and future versions will support more inputs, and have a lot of improvements.
The official documentation is far from being complete, but I'll make sure to add guidelines to help install the latest version of exadrums on a Raspberry Pi. I will make sure the future versions work on the current version of Raspberry Pi OS *bullseye*. Stay tuned, new versions are coming!
