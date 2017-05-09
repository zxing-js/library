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

Porting Rules
=============

* Keep all types as close to the original as possible.
* Keep detailed type information in comments where applicable (example int will become `number/*int*/`).
* Use TypedArray whenever possible (example `int[]` will become `Int32Array`).
* Use constructor property whenever possible.
* Take care of array initialisation with capacity, especially when using length and push later on. Basically only use when setting with index accesor only .
* Use utility classes to implement platform dependencies (like `System` or `Arrays`), avoid inline implementation for anything that is not trivial.
* Use single class|enum|interface per module, export with default. Move internal classes to separate modules if used from other modules.
* Package level visibility will transform to public to avoid module complexity.
* Keep enum as similar with the original interface as possible (transform to class and use static fields for enum values).
* Allways use `===` for `==` to avoid gliches from type transforms.

TODO
====

* Check for aaa[] arrays, check for push check for == length
