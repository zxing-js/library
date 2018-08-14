[<img align="right" src="https://raw.github.com/wiki/zxing/zxing/zxing-logo.png"/>][1]

# ZXing

### Runs on your favorite ECMAScript ecosystem

> If it doesn't, we gonna make it.

## What is ZXing?

> [ZXing][1] ("zebra crossing") is an open-source, multi-format 1D/2D barcode image processing library implemented in Java, with ports to other languages.

## Supported Formats

> See [Projects](https://github.com/zxing-js/library/projects) and [Milestones](https://github.com/zxing-js/library/milestones) for what is currently done and what's planned next. 👀

| 1D product         | 1D industrial        | 2D
| ------------------ | -------------------- | --------------
| ~UPC-A~            | Code 39 (_no docs_)  | QR Code
| ~UPC-E~            | ~Code 93~            | Data Matrix (_no docs_)
| ~EAN-8~            | Code 128 (_no docs_) | ~Aztec (beta)~
| EAN-13 (_no docs_) | ~Codabar~            | PDF 417 (_in-progress_)
|                    | ITF (_no docs_)      | ~MaxiCode~
|                    | ~RSS-14~             |
|                    | ~RSS-Expanded~       |

## Status

[![Build Status](https://travis-ci.org/zxing-js/library.svg?branch=master)](https://travis-ci.org/zxing-js/library)

[![NPM version](https://img.shields.io/npm/v/@zxing/library.svg?&label=npm)][0]
[![npm](https://img.shields.io/npm/dm/localeval.svg)][0]
![Dependencies](https://david-dm.org/zxing-js/library.svg)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/39d86bc5d5f04bc8953cc68d729807b0)](https://www.codacy.com/app/zxing-js/library?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=zxing-js/library&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/maintainability)](https://codeclimate.com/github/zxing-js/library/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2b9c6ae92412ee8e15a9/test_coverage)](https://codeclimate.com/github/zxing-js/library/test_coverage)
[![BCH compliance](https://bettercodehub.com/edge/badge/zxing-js/library?branch=master)](https://bettercodehub.com/)

## Demo

See [Live Preview](https://zxing-js.github.io/library/) in browser.

**Note:** All the examples are using ES6, be sure is supported in your browser or modify as needed, Chrome recommended.

## Usage

### Installation

`npm i @zxing/library --save`

or

`yarn add @zxing/library`

### Environments

Examples below are for QR barcode, all other supported barcodes work similarly.

#### Browser

To use from JS you need to include what you need from `build/umd` folder (for example `zxing.min.js`).

##### Browser Support

The browser layer is using the [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) web API which is not supported by older browsers.

_You can use external polyfills like [WebRTC adapter](https://github.com/webrtc/adapter) to increase browser compatibility._

Also, note that the library is using the [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) (`Int32Array`, `Uint8ClampedArray`, etc.) which are not available in older browsers (e.g. Android 4 default browser).

_You can use [core-js](https://github.com/zloirock/core-js) to add support to these browsers._

#### TypeScript

You can include directly the classes you need, for example:

```typescript
import { BrowserQRCodeReader, VideoInputDevice } from '@zxing/library';
```

#### Node

To use in node you will need to provide an implementation of [`LuminanceSource`](https://github.com/zxing-js/library/blob/master/src/core/LuminanceSource.ts) for an image. A starting point is [`SharpImageLuminanceSource`](https://github.com/zxing-js/library/blob/master/src/test/core/SharpImageLuminanceSource.ts) from tests that is using [sharp image processing](https://github.com/lovell/sharp) Node library.

No examples are availabe for now, however you can have a look at the extensive [tests cases](https://github.com/zxing-js/library/tree/master/src/test/core/qrcode).

### Scanning from Video Camera

To display the input from the video camera you will need to add a video element in the HTML page:

```html
<video id="video" width="300" height="200" style="border: 1px solid gray"></video>
```

To start decoding, first obtain a list of video input devices with:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();

codeReader.getVideoInputDevices()
    .then(videoInputDevices => {
        videoInputDevices.forEach(
            device => console.log(`${device.label}, ${device.deviceId}`)
        );
    })
    .catch(err => console.error(err));
```

If there is just one input device you can use the first deviceId and the video element id (in the example below is also 'video') to decode:

```javascript
const firstDeviceId = videoInputDevices[0].deviceId;

codeReader.decodeFromInputVideoDevice(firstDeviceId, 'video')
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

If there are more input devices then you will need to chose one for `codeReader.decodeFromInputVideoDevice` device id parameter.

You can also provide `undefined` for the device id parameter in which case the library will automatically choose the camera, preferring the main (environment facing) camera if more are available:

```javascript
codeReader.decodeFromInputVideoDevice(undefined, 'video')
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

### Scanning from Video File

Similar as above you can use a video element in the HTML page:

```html
<video id="video" width="300" height="200" style="border: 1px solid gray"></video>
```

And to decode the video from an url:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();
const videoSrc = 'your url to a video';

codeReader.decodeFromVideoSource(videoSrc, 'video')
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

You can also decode the video url without showing it in the page, in this case no `video` element is needed in HTML.

```javascript
codeReader.decodeFromVideoSource(videoSrc)
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

### Scanning from Image

Similar as above you can use a img element in the HTML page (with src attribute set):

```html
<img id="img" src="qrcode-image.png" width="200" height="300" style="border: 1px solid gray">
```

And to decode the image:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();
const img = document.getElementById('img');

codeReader.decodeFromImage(img)
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

You can also decode the image url without showing it in the page, in this case no `img` element is needed in HTML:

```javascript
const imgSrc = 'url to image';

codeReader.decodeFromImage(undefined, imgSrc)
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

Or decode the image url directly from an url, with an `img` element in page (notice no `src` attribute is set for `img` element):

```html
<img id="img-to-decode" width="200" height="300" style="border: 1px solid gray">
```

```javascript
const imgSrc = 'url to image';
const imgDomId = 'img-to-decode';

codeReader.decodeFromImage(imgDomId, imgSrc)
    .then(result => console.log(result.text))
    .catch(err => console.error(err));
```

### Barcode generation

To generate a QR Code SVG image include 'zxing.qrcodewriter.min.js' from `build/vanillajs`. You will need to include an element where the SVG element will be appended:

```html
<div id="result"></div>
```

And then:

```javascript
const codeWriter = new ZXing.BrowserQRCodeSvgWriter('result');
const svgElement = codeWriter.write(input, 300, 300);
```

### Porting Information

See [Contributing Guide](https://github.com/zxing-js/library/blob/master/CONTRIBUTING.md) for information regarding porting approach and reasoning behind some of the approaches taken.

---

[![Bless](https://cdn.rawgit.com/LunaGao/BlessYourCodeTag/master/tags/alpaca.svg)](http://lunagao.github.io/BlessYourCodeTag/)

[0]: https://www.npmjs.com/package/@zxing/library
[1]: https://github.com/zxing/zxing
