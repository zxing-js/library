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

The Java files are transformed using RegExps for some obvious syntax transformation, see `` for a starting point.

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

### Java numbers to TS numbers

- Take care of `int` -> `number` (integer to number) port when doing bitwise transformation especially `<<`. Do a `& 0xFFFFFFFF` for ints, a &0xFF for bytes.
- Take care of array initialization, in Java `new Array(N)` initializes capacity NOT size/length.
- Use `Math.floor` for any division of `int`s otherwise the `number` type is a floating point and keeps the numbers after the dot.
- For `float`/`number` to `int` casting use `Math.trunc`, to replicate the same effect as Java casting does.

### Porting overloads

> [but don't rewrite JavaScript to be Java](https://github.com/zxing-js/library/pull/376#commitcomment-44928885)

Strong words and you should agree, so we're in favor of mixing implementations using a prefered order:

1. Don't implement overloading if not needed but document it.
2. Missing argument handling and then calling a (one) implementation method (this is easily preferable than 3 bellow).
3. Missing argument handling and calling vastly (multiple) different implementations as the arguments matches.

All this in favor of keeping the interfaces similar to Java and the code as close as possible for porting and debugging. Both should be very well commented in the code so they explain why they're there and what they're doing.

> [Most of the contributors to this library will most likely have a JavaScript background rather than Java.](https://github.com/zxing-js/library/pull/376#commitcomment-44928885)

Yeah but most will have to have a very good understanding of both languages so they can port the `core` and porting is terrible hard when code doesn't matches. For new modules **not based** in the Java version we're **against** the use of overloading pattern, JavaScript simply doesn't fits it well and should be avoided in here.

> You can find more on this discussion in [this Pull Request](https://github.com/zxing-js/library/pull/376).

#### Examples

Based on the rules set above, this is where we land, first with a simpler yet effective approach:

```typescript
constructor(arg1: any);
constructor(arg1: any, arg2: any);
constructor(arg1: any, arg2: any, arg3: any);
constructor(arg1: any, arg2?: any, arg3?: any) {
    if (arg2 == null) arg2 = {};
    if (arg3 == null) arg3 = {};
    return constructorImpl(arg1, arg2, arg3)
}

constructorImpl(arg1: any, arg2: any, arg3: any) {
    /* Implementation code */
}
```

And less preferred if more advanced logic needed:

```typescript
constructor(arg1: any);
constructor(arg1: any, arg2: any);
constructor(arg1: any, arg2: any, arg3: any);
constructor(arg1: any, arg2?: any, arg3?: any) {
    if (arg3 != null) return constructorImpl(arg1, arg2, arg3);
    if (arg2 != null) return constructorOverload2(arg1, arg2);
    return constructorOverload1(arg1)
}

private constructorOverload1(
    arg1: any,
) {
    return this.constructorOverload2(arg1, {});
}

private constructorOverload2(
    arg1: any,
    arg2: any,
) {
    return this.constructorImpl(arg1, arg2, {});
}

private constructorImpl(
    arg1: any,
    arg2: any,
    arg3: any,
) {
    /* Implementation code */
}
```

## Types

### Java types

https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html

- `byte` has 8 bits, signed (e.g. -127 to 127), so `byte[]` would transforms to `Int8Array` however:
  - `TextEncoder` will use `Uint8Array`.
  - `canvas` image data will use `Uint8ClampedArray`.
- `int` has 32 bits, signed, so `int[]` transforms to `Int32Array`.
- `char` has 2 bytes, so `char[]` transforms to `Uint16Array`.
- `long` has 64 bit two's complement `integer`, can be signed or unsigned.
- `float[]` can be ported to `Float32Array`.
- `double[]` can be ported to `Float64Array`.

### JavaScript's TypedArray

Read about JavaScript TypedArray [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray).

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
- Simplify double `<something> !== null && <something> !== undefined` checks.

---

Most of things here are opinions and were written by the first porter, please feel free to discuss and help us to make it better.
