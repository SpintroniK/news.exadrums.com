---
title: New SPI Sensors Configurator ⇒ More Trigger Inputs
createdAt: 2021-12-11 13:31:28
updatedAt: 2021-12-11 13:31:28
---

Exadrums 0.7.0 is currently under development. The biggest feature of this release is the addition of configurable SPI (Serial Peripheral Interface) devices.
This features aims to provide a way to add as many SPI devices as you want.
Currently supported devices are of the MCP3XXX family, including MCP3008, MCP3204, and MCP3208, but there's a good chance more chips will be added before and after the release of this new version.

This means that it'll become possible to add more inputs to the trigger input board, by adding more analog to digital converters.

![image](/images/new-spi-sensors-config/spidev-config.png)

<!--more-->

## How SPI Devices Work

An SPI analog to digital converter takes in analog data, digitizes it, and sends it to a Raspberry Pi using the SPI bus.
SPI communication offers many advantages, and one of them is that it's quite easy to communicate with several devices.
The first eXaDrums input board uses a single MCP3008 chip, which limits the number of inputs to 8.
Adding another MCP3008 would increase that number to 16, and if you want even more inputs, you could add a third one.

The Raspberry Pi offers at least one SPI interface that has two `Chip Select` inputs (also called *Chip Enable*).
So, with a single SPI bus, `SPI0`, the Raspberry Pi can communicate with two devices, by changing the states of the chip selects pins `CE0` and `CE1`.

But that's not it. Recent Raspberry Pis have another SPI *bus*: `SPI1`. And it can handle up to three devices via its three chip select inputs `CE0`, `CE1`, and `CE2`.
So, in theory it's possible to have up to 5 SPI Analog to Digital converters. Imagine 5 MCP3008, that would mean up to 40 inputs!
Note that the Raspberry Pi 4 has even more SPI buses, so that should be more than enough, even for a big drum kit with a lot of triggers.

It's important to note that SPI devices are grouped by bus and chip select, and this is exactly how the SPI configuration works in exadrums.

## How to Configure SPI Devices

Only supported devices are allowed in the SPI configuration dialog. They are currently limited to MCP3008, MCP3204, and MCP3208.
Each device must be associated to a bus and a chip select.
And that's basically it.

Here is an example.
You make a trigger input board that needs to handle up to 16 analog inputs.
The MCP3008 is a good choice, so you decide to use two of them.
You can either have one of them use the `SPI0`, and the other the `SPI1`, or you can have them both use `SPI1` and choose to use two different chip selects, i.e. `CE0` and `CE1`.
So your configuration is:
|  Name   | Bus | CS |
|---------|-----|----|
| MCP3008 |  0  |  0 |
| MCP3008 |  0  |  1 |

And this is exactly how you can configure your SPI devices in exadrums (see screenshot above).
By doing that, you'll be able to create up to 16 triggers, numbered 0 to 15, and everything will work out of the box.
