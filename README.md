[<img align="right" src="https://raw.github.com/wiki/zxing/zxing/zxing-logo.png"/>][1]

# ZXing

## Project in Maintenance Mode Only

The project is in maintenance mode, meaning, changes are driven by contributed patches.
Only bug fixes and minor enhancements will be considered. The Barcode Scanner app can
no longer be published, so it's unlikely any changes will be accepted for it.
There is otherwise no active development or roadmap for this project. It is "DIY".

### Runs on your favorite ECMAScript ecosystem

> If it doesn't, we gonna make it.

## What is ZXing?

> [ZXing][1] ("zebra crossing") is an open-source, multi-format 1D/2D barcode image processing library implemented in Java, with ports to other languages.

## Supported Formats

> See [Projects](https://github.com/zxing-js/library/projects) and [Milestones](https://github.com/zxing-js/library/milestones) for what is currently done and what's planned next. 👀

| 1D product | 1D industrial                        | 2D           |
| ---------- |--------------------------------------|--------------|
| UPC-A      | Code 39                              | QR Code      |
| UPC-E      | Code 93                              | Data Matrix  |
| EAN-8      | Code 128                             | Aztec        |
| EAN-13     | Codabar                              | PDF 417      |
|            | ITF                                  | ~~MaxiCode~~ |
|            | RSS-14                               |              |
|            | RSS-Expanded (not production ready!) |              |


## Status

[![Maintainer wanted](https://img.shields.io/badge/maintained-help%20wanted-red)](https://npmjs.org/package/@zxing/ngx-scanner)
[![Greenkeeper badge](https://badges.greenkeeper.io/zxing-js/library.svg)](https://greenkeeper.io/)

[![NPM version](https://img.shields.io/npm/v/@zxing/library.svg?&label=npm)][0]
[![npm](https://img.shields.io/npm/dm/localeval.svg)][0]
[![Contributors](https://img.shields.io/github/contributors/zxing-js/library.svg)](https://github.com/zxing-js/library/graphs/contributors)
[![Commits to deploy](https://img.shields.io/github/commits-since/zxing-js/library/master.svg?label=commits%20to%20deploy)](https://github.com/zxing-js/library/compare/master...develop)

[![Maintainability](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/maintainability)](https://codeclimate.com/github/zxing-js/library/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/test_coverage)](https://codeclimate.com/github/zxing-js/library/test_coverage)

### Attention

>NOTE: While we do not have the time to actively maintain zxing-js anymore, we are open to new maintainers taking the lead.

## Demo

See [Live Preview](https://zxing-js.github.io/library/) in browser.

**Note:** All the examples are using ES6, be sure is supported in your browser or modify as needed, Chrome recommended.

## Installation

`npm i @zxing/library --save`

or

`yarn add @zxing/library`

## Limitations

On iOS-Devices **with iOS < 14.3** camera access works only in native Safari and not in other Browsers (Chrome,...) or Apps that use an UIWebView or WKWebView. This is not a restriction of this library but of the limited WebRTC support by Apple. The behavior might change in iOS 11.3 (Apr 2018?, not tested) as stated [here](https://developer.apple.com/library/content/releasenotes/General/WhatsNewInSafari/Articles/Safari_11_1.html#//apple_ref/doc/uid/TP40014305-CH14-SW1)

> iOS 14.3 (released in december 2020) now supports WebRTC in 3rd party browsers as well 🎉 

### Browser Support

The browser layer is using the [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) web API which is not supported by older browsers.

_You can use external polyfills like [WebRTC adapter](https://github.com/webrtc/adapter) to increase browser compatibility._

Also, note that the library is using the [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) (`Int32Array`, `Uint8ClampedArray`, etc.) which are not available in older browsers (e.g. Android 4 default browser).

_You can use [core-js](https://github.com/zloirock/core-js) to add support to these browsers._

In the PDF 417 decoder recent addition, the library now makes use of the new `BigInt` type, which [is not supported by all browsers][2] as well. There's no way to polyfill that and ponyfill libraries are **way to big**, but even if PDF 417 decoding relies on `BigInt` the rest of the library shall work ok in browsers that doesn't support it.

_There's no polyfills for `BigInt` in the way it's coded in here._

## Usage

```javascript
// use with commonJS
const { MultiFormatReader, BarcodeFormat } = require('@zxing/library');
// or with ES6 modules
import { MultiFormatReader, BarcodeFormat } from '@zxing/library';

const hints = new Map();
const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX/*, ...*/];

hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

const reader = new MultiFormatReader();

const luminanceSource = new RGBLuminanceSource(imgByteArray, imgWidth, imgHeight);
const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

reader.decode(binaryBitmap, hints);
```

## Contributing

See [Contributing Guide](https://github.com/zxing-js/library/blob/master/CONTRIBUTING.md) for information regarding porting approach and reasoning behind some of the approaches taken.

## Contributors

Special thanks to all the contributors who have contributed for this project. We heartly thankful to you all.

[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/0)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/0)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/1)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/1)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/2)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/2)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/3)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/3)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/4)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/4)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/5)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/5)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/6)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/6)[![](https://sourcerer.io/fame/odahcam/zxing-js/library/images/7)](https://sourcerer.io/fame/odahcam/zxing-js/library/links/7)

And a special thanks to [@aleris][3] who created the project itself and made available the initial QR code port.

---

[![Bless](https://cdn.rawgit.com/LunaGao/BlessYourCodeTag/master/tags/alpaca.svg)](http://lunagao.github.io/BlessYourCodeTag/)

[0]: https://www.npmjs.com/package/@zxing/library
[1]: https://github.com/zxing/zxing
[2]: https://caniuse.com/#feat=bigint
[3]: https://github.com/aleris
