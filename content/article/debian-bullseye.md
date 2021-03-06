---
title: Debian 11 - Bullseye
createdAt: 2021-08-14 12:08:07
updatedAt: 2021-08-21 16:17:58
---

Today, Debian 11 (Bullseye), has been officially released. This is a great news for *exadrums*, as this means it is now available in Debian. If you're using Debian (or Ubuntu, Raspberry Pi OS, and some [other distros](https://repology.org/project/exadrums/packages)), you can install exadrums via `apt`, i.e.:

```bash
sudo apt install exadrums
```
<!--more-->

## What does this mean?

Well, if you have about 5 MB to spare, you can install exadrums from the command line directly.
Here's what you see from a fresh Debian Bullseye install:

![image](/images/debian-bullseye/Screenshot_2021-08-15_11-14-02.png)

No more compiling, etc. `apt` handles everything for you!

## What about Raspberry Pi OS?

It's only been a few hours since Debian 11 has been released, so there's no news about the next Raspberry Pi OS (formerly Raspbian). Let's give them some time to publish a proper release.
I can already tell you that you'll get the same version of exadrums as Debian in Raspberry Pi OS, it'll be exadrums 0.6.0.

Anyhow, when the new Raspberry Pi OS will be released, you'll be able to install exadrums via `apt` on your Raspberry Pi.

## Using Debian Bullseye on a Raspberry Pi

If you don't want to wait until the version of Raspberry Pi OS comes out, you can install Debian Bullseye on your Raspberry Pi using one of the images available at: [ Tested images](https://raspi.debian.net/tested-images/). I haven't tried any of them, but they've been tested, so they should work.