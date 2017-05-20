ZXing TypeScript
================

ZXing ("zebra crossing") TypeScript is an open-source, multi-format 1D/2D barcode image processing library ported to TypeScript from Java.

See https://github.com/zxing/zxing for original Java project.

Porting guidelines
==================

See [TypeScript Port Info](typescriptport.md).


Status and Roadmap
==================

- [x] Port root, common and qrcode format and make it compile
- [x] Add unit test infrastructure, a first unit test and make it pass (common/BitArrayTestCase)
- [x] Add all unit tests for everything in root, common and qrcode
- [x] Add one "back box" test for qrcode
- [x] Add all "back box" tests for qrcode
- [ ] Create browser integration module and test UI for qrcode
- [ ] Create tests for node.js usage for qrcode
- [ ] Adapt documentation for JSDoc, generate documentation
- [ ] Document library usage
- [ ] Port aztec format with unit and browser tests
- [ ] Port client/result parsing with unit and browser tests and documentation
- [ ] Port datamatrix format with unit and browser tests and documentation
- [ ] Port maxicode format with unit and browser tests and documentation
- [ ] Port multi parsing with unit and browser tests and documentation
- [ ] Port oned format with unit and browser tests and documentation
- [ ] Port pdf417 format with unit and browser tests and documentation
- [ ] Create tests for all major current browsers


Etcetera
========

[![Build Status](https://travis-ci.org/aleris/zxing-typescript.svg?branch=master)](https://travis-ci.org/aleris/zxing-typescript)
