# Contributing

This document contains rules and guidelines for porting the library from Java to TypeScript.

## Tooling

Local development using Node.js and `npm` or `yarn`, see `package.json` for dependencies.

**Note:** Keep dependencies at minimum necessary. 🖤

### Run the docs

To run the docs, open the CLI in this project root folder (something like `<somepath>/zxing-js/library`):

```bash
user@computer BUILDV <somepath>/zxing-js/library (develop)
http-server ./docs -a localhost -p 4040 -o
```

**Note:** `http-server` is a package that runs a local server, install with `npm i -g http-server`.

## Porting

Initial port from 3.3.1-SNAPSHOT on May 2017 by Adrian Toșcă (@aleris).

### Approach

The Java files are transformed using regexps for some obvious syntax transformation (see ./autotransform) and then modified manually.

Using http://www.jsweet.org was considered but rejected because of loosing type information early on (for example 
number versus int is essential for bitwise operations), language style and older TypeScript version.

### Rules

- Keep all types as close to the original as possible.
- Keep detailed type information in comments where applicable (example int will become `number /*int*/`) as the code is extensively using bitwise operations that can overflow.
- Use TypedArray whenever possible (example `int[]` will become `Int32Array`) - see below for more info.
- Use constructor property whenever possible.
- Take care of array initialisation with capacity, especially when using length and push later on. Basically only use when setting with index accessor only .
- Use utility classes to implement platform dependencies (like `System` or `Arrays`), avoid inline implementation for anything that is not trivial.
- Use single class|enum|interface per module, export with default. Move internal classes to separate modules if used from other modules.
- Package level visibility will transform to public to avoid module complexity.
- Keep enum as similar with the original interface as possible (transform to class and use static fields for enum values).
- Always use `===` for `==` to avoid glitches from type transforms.

### Cheat Sheet 💩

| Java     | TypeScript          |
| -------- | ------------------- |
| `byte[]` | `Uint8ClampedArray` |
| `int[]`  | `Int32Array`        |

## Types

### Java types

https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html

- `byte` has 8 bits, signed (e.g. -127 to 127), so `byte[]` would transforms to `Int8Array` however:
  - `TextEncoder` will use `Uint8Array`.
  - `canvas` image data will use `Uint8ClampedArray`.
- `int` has 32 bits, signed, so `int[]` transforms to `Int32Array`.
- `char` has 2 bytes, so `char[]` transforms to `Uint16Array`.
- `long` has 64 bit two's complement `integer`, can be signed or unsigned.

### JavaScript's TypedArray

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray

## Things to look for

- Take care of `int` -> `number` (integer to number) port when doing bitwise transformation especially `<<`. Do a `& 0xFFFFFFFF` for ints, a &0xFF for bytes.
- Take care of array initialization, in Java `new Array(N)` initializes capacity NOT size/length.
- Use `Math.floor` for any division of ints otherwise the `number` type is a floating point and keeps the numbers after the dot.
- For `float` to `int` casting use `Math.trunc`, to replicate the same effect as Java casting does.

## Encoding

In Java `new String(<ByteArray>, encoding)`, a lot of encodings are supported
See `StringEncoding.ts` for implementation in TypeScript for handling limited browser support.
Will became: `StringEncoding.decode(<ByteArray>, encoding)`.

## TODO

- Check for `sometype[]` arrays: check for push, check for `==` length etc. To spot size comparison bugs.
- Skipped:
  - `BufferedImageLuminanceSource.java`
  - `common/AbstractNegativeBlackBoxTestCase.java`
  - `common/AbstractBlackBoxTestCase.java`
- `Cp437` not supported by TextEncoding library see `DecodedBitStreamParserTestCase`.
- Replace `instanceof` with something more robust.
- Simplify double `null !== <something> && undefined !== <something>` checks.

----

Most of things here are opinions and were written by the first porter, please feel free to discuss and help us to make it better.
