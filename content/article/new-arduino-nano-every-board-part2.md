---
title: New Arduino Nano Every Trigger Board - Part 2
createdAt: 2022-05-08 15:42:25
updatedAt: 2022-05-08 15:42:25
---

This is a series of posts. If you haven't read the previous part here's a link to it: [New Arduino Nano Every Trigger Board - Part 1](/article/new-arduino-nano-every-board-part1).
In this part, I'm going to describe how to compile C++ code and upload it to the Arduino Nano Every without using the Arduino library.

But why would one want to do that, you may ask?
The answer is simple: the Arduino library does a lot of things that may impact performance.
For instance, some interrupts are being fired frequently, and slow things down.

Let's be honest, we're not going to reinvent the wheel, most of what we are going to do here is to use the Arduino IDE's compiler and tools.
Say we install the Arduino IDE (version 1.8.9) and compile a program.
Here's what we're going to see:

![image](/images/new-arduino-nano-every-board/arduino-ide.png)

The interesting part is the console, where all the compilation-related messages are shown.
We see that the IDE uses avr-gcc version 7.3.0, along with a few other tools.
Let's see what we can do with that.

<!--more-->

First of all, we can see *where* all these tools are located.
A little digging reveals that an environment variable named *AVR_TOOLS_DIR* contains the tools folder location.
Thus, we can type the following: `$AVR_TOOLS_DIR/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/avr-gcc --version` and execute the command in a terminal.
This will print the avr-gcc version.

## Makefile for the Arduino Nano Every

This is not a tutorial about makefiles, if you want an in-depth tutorial about makefiles, please read the official [GNU Make Manual](https://www.gnu.org/software/make/manual/).
With that out of the way, let's write a makefile.

### Variables

First of all, we need to define some variables.
Having the avr-gcc bin directory as variable seems like a good idea, so we define the following: `BIN_DIR?=${AVR_TOOLS_DIR}/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin`.
Your bin directory may differ, so be sure to check its correct location.
That's the only variable we'll need for the compiling process.

There's one more thing that we need in order to upload the compiled program to the Arduino, though.
This thing is avrdude.
It's a little bit trickier, as we need the avrdude executable and a configuration file.
So here are our variables:

```makefile
AVRDUDE_DIR?=${AVR_TOOLS_DIR}/avrdude/6.3.0-arduino17/
AVRDUDE?=${AVRDUDE_DIR}/bin/avrdude
CONFDIR?=${AVRDUDE_DIR}/etc/avrdude.conf
```

Again, be sure to check the the executable path.
If you want to provide your own configuration file, you can use the following (sorry, it isn't a short snippet...):

```ini

#------------------------------------------------------------
# AVR8X family common values
#------------------------------------------------------------

part
    id        = ".avr8x";
    desc    = "AVR8X family common values";
    has_updi    = yes;
    nvm_base    = 0x1000;
    ocd_base    = 0x0F80;

    memory "signature"
        size        = 3;
        offset        = 0x1100;
    ;

    memory "prodsig"
        size        = 0x3D;
        offset        = 0x1103;
        page_size    = 0x3D;
        readsize    = 0x3D;
    ;

    memory "fuses"
        size        = 9;
        offset        = 0x1280;
    ;

    memory "fuse0"
        size        = 1;
        offset        = 0x1280;
    ;

    memory "fuse1"
        size        = 1;
        offset        = 0x1281;
    ;

    memory "fuse2"
        size        = 1;
        offset        = 0x1282;
    ;

    memory "fuse4"
        size        = 1;
        offset        = 0x1284;
    ;

    memory "fuse5"
        size        = 1;
        offset        = 0x1285;
    ;

    memory "fuse6"
        size        = 1;
        offset        = 0x1286;
    ;

    memory "fuse7"
        size        = 1;
        offset        = 0x1287;
    ;

    memory "fuse8"
        size        = 1;
        offset        = 0x1288;
    ;

    memory "lock"
        size        = 1;
        offset        = 0x128a;
    ;

    memory "data"
        # SRAM, only used to supply the offset
        offset        = 0x1000000;
    ;
;


#------------------------------------------------------------
# AVR8X mega family common values
#------------------------------------------------------------

part parent    ".avr8x"
    id            = ".avr8x_mega";
    desc        = "AVR8X mega family common values";
    family_id    = "megaAVR";

    memory "usersig"
        size        = 0x40;
        offset        = 0x1300;
        page_size    = 0x40;
        readsize    = 0x100;
    ;
;

#------------------------------------------------------------
# ATmega4809
#------------------------------------------------------------

part parent    ".avr8x_mega"
    id        = "m4809";
    desc      = "ATmega4809";
    signature = 0x1E 0x96 0x51;

    memory "flash"
        size      = 0xC000;
        offset    = 0x4000;
        page_size = 0x80;
        readsize  = 0x100;
    ;

    memory "eeprom"
        size      = 0x100;
        offset    = 0x1400;
        page_size = 0x40;
        readsize  = 0x100;
    ;
;

programmer
  id    = "jtag2updi";
  desc  = "JTAGv2 to UPDI bridge";
  type  = "jtagmkii_pdi";
  connection_type = serial;
  baudrate = 115200;
;

```

And the last variable that we need is the Arduino serial port: `PORT?=/dev/ttyACM0`.
You can find that information in the Arduino IDE (in the *tools* menu).

### Rules

Now that we have defined all the variables that we need, we have to create some rules to compile and upload our code to the Arduino.
To that end, we are going to have three rules: `all`, to compile the code, `upload`, to upload the binary to the board, and `clean` to remove all the build files.

Let's start with the `all` rule:

```makefile
all:
    ${BIN_DIR}/avr-g++ -c -g -Os -w -std=c++17 -fpermissive -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mmcu=atmega4809 -DF_CPU=16000000L -DARDUINO=10809 -DARDUINO_AVR_NANO_EVERY main.cpp -o main.o
    ${BIN_DIR}/avr-g++ -w -Os -g -flto -fuse-linker-plugin -Wl,--gc-sections -Wl,--section-start=.text=0x0 -mmcu=atmega4809 -o main.elf main.o
    ${BIN_DIR}/avr-objcopy -O binary -R .eeprom main.elf main.bin
    ${BIN_DIR}/avr-objcopy -O ihex -j .eeprom --set-section-flags=.eeprom=alloc,load --no-change-warnings --change-section-lma .eeprom=0 main.elf main.eep
    ${BIN_DIR}/avr-objcopy -O ihex -R .eeprom main.elf main.hex
    ${BIN_DIR}/avr-size -C main.elf
```

This mostly comes from the Arduino IDE's console output window.
I've made only very small modifications.
The `upload` rule is also taken from the Arduino IDE:

```makefile
upload:
    python3 ./reset.py ${PORT}
    ${AVRDUDE} -C${CONFDIR} -v -patmega4809 -cjtag2updi -P${PORT} -b115200 -e -D -Uflash:w:main.hex:i -Ufuse2:w:0x01:m -Ufuse5:w:0xC9:m -Ufuse8:w:0x00:m
```

There is one subtle thing here.
If we check the Arduino IDE's console output, we can read the following message: `Forcing reset using 1200 bps open/close on port /dev/ttyACM0`.
This means that we need to reset the Arduino before avrdude starts uploading the program.
I found that the more reliable way to do that is to use a little python3 script:

```python
#!/usr/bin/python

import sys
import serial

com = serial.Serial(sys.argv[1], 1200)
com.dtr=False
com.close()
```

Finally, we need a `clean` rule that removes all the compiled files.
This is a pretty easy rule to write, so I'll just throw the whole makefile there:

```makefile
BIN_DIR?=${AVR_TOOLS_DIR}/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin
AVRDUDE_DIR?=${AVR_TOOLS_DIR}/avrdude/6.3.0-arduino17/
AVRDUDE?=${AVRDUDE_DIR}/bin/avrdude
CONFDIR?=${AVRDUDE_DIR}/etc/avrdude.conf

PORT?=/dev/ttyACM0

all:
    ${BIN_DIR}/avr-g++ -c -g -Os -w -std=c++17 -fpermissive -fno-exceptions -ffunction-sections -fdata-sections -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mmcu=atmega4809 -DF_CPU=16000000L -DARDUINO=10809 -DARDUINO_AVR_NANO_EVERY main.cpp -o main.o
    ${BIN_DIR}/avr-g++ -w -Os -g -flto -fuse-linker-plugin -Wl,--gc-sections -Wl,--section-start=.text=0x0 -mmcu=atmega4809 -o main.elf main.o
    ${BIN_DIR}/avr-objcopy -O binary -R .eeprom main.elf main.bin
    ${BIN_DIR}/avr-objcopy -O ihex -j .eeprom --set-section-flags=.eeprom=alloc,load --no-change-warnings --change-section-lma .eeprom=0 main.elf main.eep
    ${BIN_DIR}/avr-objcopy -O ihex -R .eeprom main.elf main.hex
    ${BIN_DIR}/avr-size -C main.elf


upload:
    python3 ./reset.py ${PORT}
    ${AVRDUDE} -C${CONFDIR} -v -patmega4809 -cjtag2updi -P${PORT} -b115200 -e -D -Uflash:w:main.hex:i -Ufuse2:w:0x01:m -Ufuse5:w:0xC9:m -Ufuse8:w:0x00:m


clean:
    rm -f main.bin main.d main.eep main.elf main.hex main.o
```

There we are, all that's left is to put this in a `Makefile`file.
Now we can type `make` to compile the code and `make upload` to upload it to the board.

## Example: Blink the On-board LED

We are going to go through a very simple example: the LED blink example.

### Arduino Version

Here's the Arduino code for the LED blink example:

```cpp
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);   // set the LED on
  delay(1000);                  // wait for a second
  digitalWrite(ledPin, LOW);    // set the LED off
  delay(1000);                  // wait for a second
}
```

Using the Arduino IDE to compile this code, we get the following message:

```text
Sketch uses 1118 bytes (2%) of program storage space. Maximum is 49152 bytes.
Global variables use 22 bytes (0%) of dynamic memory, leaving 6122 bytes for local variables. Maximum is 6144 bytes.
```

So, in order to make a LED blink every second, we need 1118 bytes of program space, and 22 bytes of RAM.
To me, that sounds like a lot!

### C Version

Now let's go low-level and see what we can do without using the Arduino library.
Since we're using a C++ compiler, it's not really C code, but it looks like it is:

```cpp
#include <avr/io.h>
#include <util/delay.h>

int main()
{
    _PROTECTED_WRITE(CLKCTRL_MCLKCTRLB, 0x00); // Disable prescaler

    PORTE.DIRSET |= PIN2_bm;

    for(;;)
    {
        _delay_ms(1000);
        PORTE.OUTTGL |= PIN2_bm;
    }

    return 0;
}
```

The first line of the main function is used to disable the prescaler, which ensures that the CPU runs at the wanted 16MHz frequency.
If you check out the Arduino Nano Every connector pinouts, you'll see that the on-board LED is connected to `D13`.
This pin is also labeled `SCK` and `PE2`.
The latter tells us that this particular pin is wired to port E, pin 2.
And that's all we need for our LED blink example.
First we use the `DIRSET` register of port E to set the pin 2 bit, which will set pin 2 as an output.
Then, in the main for loop, we write the pin 2 bit into the `OUTTGL` register, which toggles the state of pin 2.
In between each toggling, we use the `_delay_ms` function, which allows us to wait for a given time.

The ports registers and pins definitions are provided by the `avr/io.h` header which contains everything we need.
Because we passed the `-mmcu=atmega4809` flag to avr-gcc in our makefile, it knows that we are using an ATMega4809.
The `_delay_ms` function comes from `util/delay.h`, it needs to know the CPU clock frequency, which why we passed to avr-gcc using `-DF_CPU=16000000L`.

This program does the same thing as the previous one, except it uses a lot less memory and needs no RAM:

```text
AVR Memory Usage
----------------
Device: Unknown

Program:     238 bytes
(.text + .data + .bootloader)

Data:          0 bytes
(.data + .bss + .noinit)
```

### C++ Version

Okay, so I'm not a big fan of C, and I wonder if we could make this code more readable.
I would like to be able to write something like `led.Toggle()` instead of `PORTE.OUTTGL |= PIN2_bm`.

In order to be as generic as possible, we are going to define a class that allows pin manipulation.
One more thing: I really don't like pointers, so we are going to try to avoid them at all cost.

First of all, we need to know how `PORTE` is defined.
Its definition lies in the `avr/include/avr/iom4809.h` file: `#define PORTE                (*(PORT_t *) 0x0480) /* I/O Ports */`, where `PORT_t` is a big struct with a bunch of `register_t` in it.
Fort instance, `OUTTGL` and `DIRSET` are in that struct.
And here's where it gets kind of ugly: `typedef volatile uint8_t register8_t;`.
Every `register8_t` is declared as volatile, which makes sense because our LED blink wouldn't work otherwise (the compiler would optimize away the `PORTE.OUTTGL |= PIN2_bm` line).

So, the first thing that we need, is the address of `PORTE`.
Because of that `volatile` keyword, we can't use `constexpr` nor `static_cast`, so we are going to define it as: `static const auto PORTE_ADDR = reinterpret_cast<uint16_t>(&PORTE);`.
Note that this is a 16-bit address

Now we define a pin as a port and a pin number.
In our case: port E (its address) and pin 2 (its bit mask).
These two things are known at compile time, so we can use them as template parameters.
Hence, we are going to define a `Pin` class that take these two parameters as template parameters:

```cpp
namespace DigitalIO
{

    static const auto PORTE_ADDR = reinterpret_cast<uint16_t>(&PORTE);

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

We need to cast the port address back to a `PORT_t` struct, which is the role of the `port()` function.
The rest of the code is pretty straightforward, we encapsulate our C code into `static` methods.

Here's how to use this code:

```cpp
#include "DigitalIO.h"

#include <avr/io.h>
#include <util/delay.h>

#include <stdint.h>

using Led = DigitalIO::Pin<DigitalIO::PORTE_ADDR, PIN2_bm>;

int main()
{
    _PROTECTED_WRITE(CLKCTRL_MCLKCTRLB, 0x00); // Disable prescaler

    Led::ConfigureAsOutput();

    for(;;)
    {
        _delay_ms(1000);
        Led::Toggle();
    }

    return 0;
}
```

It looks almost the same as the previous code, except that it's a bit more readable.

But we did add quite a bit of boilerplate code in our `DigitalIO.h` file, is that a good idea?
I believe it is. Right now, we don't see how this can be very useful because our program is small and basic.
With a bigger code base, I think it would be way easier to understand our code with a well-structured C++ program.

But wait a minute, isn't all that code going to add more bytes to our program?
Let's check that, shall we?

```text
AVR Memory Usage
----------------
Device: Unknown

Program:     238 bytes
(.text + .data + .bootloader)

Data:          0 bytes
(.data + .bss + .noinit)
```

It doesn't. In fact the assembly code is exactly the same as the previous one.
Why is that? Because gcc is awesome, of course!
So, we can write C++ code and get the same assembly code as a C program, that's what we call *zero cost abstraction*.

## What's Next?

Okay, so we've seen how to program an Arduino Nano Every without using the Arduino library.
Through a very simple example, we've also seen that C and C++ code lead to the same assembly code.

In the next part, we will focus on MIDI and see how we can turn our Arduino Nano Every into a MIDI device.
