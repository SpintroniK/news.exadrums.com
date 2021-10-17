---
title: libexadrums.js
createdAt: 2021-10-16 13:26:21
updatedAt: 2021-10-16 13:26:21
---

Achieving low latency and performance for exadrums was possible thanks to the C++ programming language.
C++ is a great language because it offers both low- and high-level programming styles, but I find it a bit limited when it comes to user interfaces.
On the other hand, javascript isn't the best language for performance, but or user interfaces it really shines, thanks to its integration with html and css.

But can we get a nice and responsive html + css + js user interface, and get the C++ performance?
That's what [libexadrums.js](https://github.com/SpintroniK/libexadrums.js) does.
It is basically javascript a wrapper of the exadrums C++ library (libexadrums).
Using the Node-API interface, (lib)exadrums can be used in any nodejs project, with almost no performance loss.
It is a node package that [brings libexadrums to the nodejs world](https://news.exadrums.com/article/the-future-of-exadrums), and you can find it here: https://www.npmjs.com/package/@exadrums/libexadrums.js.

<!--more-->

## How it works

The way libexadrums.js works is very simple, it is just a javascript wrapper around the original C++ library.
Every function call is translated from javascript to a C++ function call.

So when you start your drum module, a javascript function calls the C++ start function, which in turns starts the module.
But the cool thing is, once the module has started, it runs the native compiled C++ program, so there's no performance hit whatsoever.
That way, you do get the best of both worlds.

## What's next?

So far, libexadrums.js is not complete, some functions are missing, and it will take some time to add them.
But the main goal is to make a better user interface.
The plan is to develop an [electron](https://www.electronjs.org/) application, that will become an alternative to the native C++ interface.
I don't think it will replace it, but it'll be used by people who want a more connected experience.

Imagine a user interface than leverages CSS transitions, animations, together with [vuejs](https://vuejs.org/), and javascript's fetch api. I think that can make the development easier, and faster. And hopefully drummers that use exadrums will highly benefit from that!
