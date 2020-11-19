[<img align="right" src="https://raw.github.com/wiki/zxing/zxing/zxing-logo.png"/>][1]

# ZXing

### Runs on your favorite ECMAScript ecosystem

> If it doesn't, we gonna make it.

## What is ZXing?

> [ZXing][1] ("zebra crossing") is an open-source, multi-format 1D/2D barcode image processing library implemented in Java, with ports to other languages.

## Supported Formats

> See [Projects](https://github.com/zxing-js/library/projects) and [Milestones](https://github.com/zxing-js/library/milestones) for what is currently done and what's planned next. 👀

| 1D product | 1D industrial       | 2D             |
| ---------- | ------------------- | -------------- |
| ~~UPC-A~~  | Code 39             | QR Code        |
| ~~UPC-E~~  | ~~Code 93~~         | Data Matrix    |
| EAN-8      | Code 128            | ~~Aztec~~ \*   |
| EAN-13     | ~~Codabar~~         | PDF 417        |
|            | ITF                 | ~~MaxiCode~~   |
|            | RSS-14              |
|            | ~~RSS-Expanded~~ \* |

**\*** In progress, may have open PR.

## Status

[![Build Status](https://travis-ci.org/zxing-js/library.svg?branch=master)](https://travis-ci.org/zxing-js/library)
![Dependencies](https://david-dm.org/zxing-js/library.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/zxing-js/library.svg)](https://greenkeeper.io/)

[![NPM version](https://img.shields.io/npm/v/@zxing/library.svg?&label=npm)][0]
[![npm](https://img.shields.io/npm/dm/localeval.svg)][0]
[![Contributors](https://img.shields.io/github/contributors/zxing-js/library.svg)](https://github.com/zxing-js/library/graphs/contributors)
[![Commits to deploy](https://img.shields.io/github/commits-since/zxing-js/library/master.svg?label=commits%20to%20deploy)](https://github.com/zxing-js/library/compare/master...develop)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9aaa5317fcc740af9f25b3c7f832aa1d)](https://www.codacy.com/app/zxing/library?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=zxing-js/library&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/maintainability)](https://codeclimate.com/github/zxing-js/library/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/test_coverage)](https://codeclimate.com/github/zxing-js/library/test_coverage)
[![BCH compliance](https://bettercodehub.com/edge/badge/zxing-js/library?branch=master)](https://bettercodehub.com/)

## Library

This is the base library meant to be run in Node.js or WebWorkers where the HTML DOM is not available. To use browser related features got to the [browser project](https://github.com/zxing-js/browser) which extends this library. See a [Live Preview](https://zxing-js.github.io/browser/) in your browser.

**Note:** All the examples are using ES6, be sure is supported in your browser or modify as needed, Chrome recommended.

## Documentation

Installation guide, examples and API reference can be found on the [documentation page](https://zxing-js.github.io/library/).

## Contributing

See [Contributing Guide](https://github.com/zxing-js/library/blob/master/CONTRIBUTING.md) for information regarding porting approach and reasoning behind some of the approaches taken.

## Contributors

Special thanks to all the contributors who have contributed for this project. We heartly thankful to you all.

[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/0)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/0)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/1)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/1)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/2)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/2)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/3)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/3)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/4)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/4)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/5)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/5)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/6)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/6)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/7)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/7)

And a special thanks to [@aleris][2] who created the project itself and made available the initial QR code port.

---

[![Bless](https://cdn.rawgit.com/LunaGao/BlessYourCodeTag/master/tags/alpaca.svg)](http://lunagao.github.io/BlessYourCodeTag/)

[0]: https://www.npmjs.com/package/@zxing/library
[1]: https://github.com/zxing/zxing
[2]: https://github.com/aleris
