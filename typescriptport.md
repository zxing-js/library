Porting Info
============

This document contains rules and guidelines for porting the library from Java to TypeScript.


Porting Version
===============

Initial port from 3.3.1-SNAPSHOT on May 2017 by Adrian Toșcă
Please update here with subsequent port updates:
* ...

Tooling
=======

Local development using Node and npm, see package.json for dependencies.

*Note:* Keep dependencies at minimum necessary, ideally none for distribution.

Unit tests: Mocha

If using Visual Studio Code IDE hava a look at tsconfig.json and .vscode for default configurations

Porting Approach
================

The java files are transformed using regexps for some obvious syntax transformation (see ./autotransform) and then modified manually.

Using http://www.jsweet.org was considered but rejected because of loosing type information early on (for example 
number versus int is esential for bitwise operations), language style and older typescript version.

Porting Rules
=============

* Keep all types as close to the original as possible.
* Keep detailed type information in comments where applicable (example int will become `number/*int*/`).
* Use TypedArray whenever possible (example `int[]` will become `Int32Array`) - see below for more info.
* Use constructor property whenever possible.
* Take care of array initialisation with capacity, especially when using length and push later on. Basically only use when setting with index accesor only .
* Use utility classes to implement platform dependencies (like `System` or `Arrays`), avoid inline implementation for anything that is not trivial.
* Use single class|enum|interface per module, export with default. Move internal classes to separate modules if used from other modules.
* Package level visibility will transform to public to avoid module complexity.
* Keep enum as similar with the original interface as possible (transform to class and use static fields for enum values).
* Allways use `===` for `==` to avoid gliches from type transforms.

Types
=====

*Java types*:
https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html

*JavasSript TypedArray*:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray

Java byte has 8 bits, signed (eg -127 to 127)
So byte[] would trasnforms to Int8Array however because of using TextEncoder will use Uint8Array

Java int has 32 bits, signed
So int[] transforms to Int32Array

Java char has 2 bytes
So char[] transfomrs to Uint16Array

Java long has 64-bit two's complement integer, can be signed or unsigned


Things to look for
==================

* Take care of int -> number port when doing bitwise transformation expecially <<.
* Take care of array initialization, in java new Array(N) initializes capacity NOT size/length.


TODO
====

* Check for aaa[] arrays, check for push check for == length
* Skipped:
..* BufferedImageLuminanceSource.java
..* common/AbstractNegativeBlackBoxTestCase.java
..* common/AbstractBlackBoxTestCase.java
* Cp437 see DecodedBitStreamParserTestCase
