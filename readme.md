ZXing TypeScript
================

[![Build Status](https://travis-ci.org/aleris/zxing-typescript.svg?branch=master)](https://travis-ci.org/aleris/zxing-typescript)

ZXing ("zebra crossing") TypeScript is an open-source, multi-format 1D/2D barcode image processing library ported to TypeScript from Java.

See https://github.com/zxing/zxing for original Java project.

Demo
====

See [some demo examples](https://aleris.github.io/zxing-typescript/) in browser.

Usage
=====

The library can be used from browser with TypeScript (include anything from src/browser however you must do the packaging yourself) or with plain javascript (see below). It can also be used from node (see below). The library is using separate builds for node and browser to allow different ES targeting.

Browser Usage
-------------

Examples below are for QR barcode, all other supported barcodes work similary.

`npm install zxing-typescript --save`

To use from javascript you need to build the browser distribution package:

`npm run build.browser.dist`

And then include what you need from `build-browser` folder (for example `zxing.qrcodereader.min.js` for qr barcode reader).

Or just grap the minified files that are available in [examples](https://github.com/aleris/zxing-typescript/tree/master/docs/examples).

See [some demo examples](https://github.com/aleris/zxing-typescript/tree/master/docs/examples) for browser code examples with javascript.

All the examples are using es6, be sure is supported in your browser or modify as needed (eg. var instead of const etc.). 

The builded library itself is targeting es5 (see `.babelrc`). If you want to target es6 change to `"presets": ["es2016"]` and add babel-preset-es2016 to dependencies (but be aware that webpack uglify does not yet support es6 as of this writing).

The browser library is using the [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) web api which is marked as experimental as of this writing. You can use external polyfills like [webrtc-adapter](https://github.com/webrtc/adapter) to increase browser compatiblity.

Also, note that the library is using the [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) (Int32Array, Uint8ClampedArray, etc.) which are not available in older browsers (for example Android 4 default browser, etc.). You can use a plyfill library like [core-js](https://github.com/zloirock/core-js) to support these browsers.

### Scanning from Video Camera

To display the input from the video camera you will need to add a video element in the html page:

```html
<video id="video" width="300" height="200" style="border: 1px solid gray"></video>
```

To start decoding, first obtain a list of video input devices with:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader()
codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
        videoInputDevices.forEach((element) => {
            console.log(`${element.label}, ${element.deviceId}`)            
        })
    .catch((err) => {
        console.error(err)
    })
```

If there is just one input device you can use the first deviceId and the video element id (in the example below is also 'video') to decode:

```javascript
const firstDeviceId = videoInputDevices[0].deviceId
codeReader.decodeFromInputVideoDevice(firstDeviceId, 'video')
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

If there are more input devices then you will need to chose one for `codeReader.decodeFromInputVideoDevice` device id parameter.

You can also provide `undefined` for the device id parameter in which case the library will automatically choose the camera, prefering the main (environment facing) camera if more are available:

```javascript
codeReader.decodeFromInputVideoDevice(undefined, 'video')
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

A full working example for [QR Code from Video Camera](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/qr-camera/) is provided in the [examples](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/).

### Scanning from Video File
Similar as above you can use a video element in the html page:

```html
<video id="video" width="300" height="200" style="border: 1px solid gray"></video>
```

And to decode the video from an url:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader()
const videoSrc = 'your url to a video'
codeReader.decodeFromVideoSource(videoSrc, 'video')
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

You can also decode the video url without showing it in the page, in this case no `video` element is needed in html.

```javascript
codeReader.decodeFromVideoSource(videoSrc)
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

A full working example for [QR Code from Video File](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/qr-video/) is provided in the [examples](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/).


### Scanning from Image
Similar as above you can use a img element in the html page (with src attribute set):

```html
<img id="img" src="qrcode-image.png" width="200" height="300" style="border: 1px solid gray"></img>
```

And to decode the image:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader()
const img = document.getElementById('img')
codeReader.decodeFromImage(img)
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

You can also decode the image url without showing it in the page, in this case no `img` element is needed in html:

```javascript
const imgSrc = 'url to image'
codeReader.decodeFromImage(undefined, imgSrc)
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

Or decode the image url directly from an url, with an `img` element in page (notice no `src` attribute is set for `img` element):

```html
<img id="img" width="200" height="300" style="border: 1px solid gray"></img>
```

```javascript
const imgSrc = 'url to image'
codeReader.decodeFromImage('img', imgSrc)//here img is the image id from html, in our case 'img'
    .then((result) => {
        console.log(result.text)
    }).catch((err) => {
        console.error(err)
    })
```

A full working example for [QR Code from Image](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/qr-image/) is provided in the [examples](https://github.com/aleris/zxing-typescript/tree/master/docs/examples/).

### Barcode generation

Not available yet.

Using from TypeScript
---------------------

Install the package:

`npm install zxing-typescript --save`

And then include directly `.ts` files you need, for example:

```javascript
import { BrowserQRCodeReader, VideoInputDevice } from 'zxing-typescript/src/browser/BrowserQRCodeReader'
```

The usage is identical with the above.

Node Usage
----------

`npm install zxing-typescript --save`

If you want to use plain js (build to es5, see tsconfig.js):

`npm run build.node`

And the files will be available in `build-node` folder.

To use in node you will need to provide an implementation of [`LuminanceSource`](https://github.com/aleris/zxing-typescript/blob/master/src/core/LuminanceSource.ts) for an image. A starting point is [`SharpImageLuminanceSource`](https://github.com/aleris/zxing-typescript/blob/master/src/test/core/SharpImageLuminanceSource.ts) from tests that is using [sharp image processing](https://github.com/lovell/sharp) node library.

No examples are availabe for now, however you can have a look at the extensive [tests cases](https://github.com/aleris/zxing-typescript/tree/master/src/test/core/qrcode).

Text Encoding and Decoding
==========================

To decode a barcode, the library needs at some point to decode from bits to text. Also, to generate a barcode it needs to encode text to bits. Unfortunately, the state of encoding and decoding text in javascript/browser is somehow messy at the moment. 

To have full support for all encodings in [CharacterSetECI](https://github.com/aleris/zxing-typescript/blob/master/src/core/common/CharacterSetECI.ts) *except Cp437* use [text-encoding](https://github.com/inexorabletash/text-encoding) library. The library is used implicitly for node (and tests), but is an optional dependency for browser because is rather large (> 600k). You will need to include it yourself if you want/need to use it.

By default, in browser, [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)/[TextEncoder](https://developer.mozilla.org/ro/docs/Web/API/TextEncoder) web api are used if available (take care as these are labeled as experimental as of this writing). Also, be aware that TextEncoder encodes only to UTF-8 as per spec. If these are not available the library falls back to a minimal implementation that only encodes and decodes to/from UTF-8 (see [`StringEncoding`](https://github.com/aleris/zxing-typescript/blob/master/src/core/util/StringEncoding.ts)).

Porting Information
===================

See [TypeScript Port Info](typescriptport.md) for information regarging poring approach and reasoning behind some of the approaches taken.

Status and Roadmap
==================

Done:
- [x] Port root, common and qrcode format and make it compile
- [x] Add unit test infrastructure, a first unit test and make it pass (common/BitArrayTestCase)
- [x] Add all unit tests for everything in root, common and qrcode
- [x] Add one "back box" test for qrcode
- [x] Add all "back box" tests for qrcode
- [x] Create browser integration module and demo UI for qrcode
- [x] Document browser usage

Todo:
- [ ] Implement QR barcode generation in browser to svg
- [ ] Port pdf417 format with unit and browser tests and documentation
- [ ] Adapt documentation for JSDoc, generate documentation, cleanup source files
- [ ] Create automatic tests for all major current browsers
- [ ] Port aztec format with unit and browser tests
- [ ] Port multi parsing with unit and browser tests and documentation
- [ ] Port datamatrix format with unit and browser tests and documentation
- [ ] Port maxicode format with unit and browser tests and documentation
- [ ] Port oned format with unit and browser tests and documentation
- [ ] Port client/result parsing with unit and browser tests and documentation
- [ ] Documentation for using directly from TypeScript


