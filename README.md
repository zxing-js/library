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

## Demo

See [Live Preview](https://zxing-js.github.io/library/) in browser.

**Note:** All the examples are using ES6, be sure is supported in your browser or modify as needed, Chrome recommended.

## Installation

`npm i @zxing/library --save`

or

`yarn add @zxing/library`

## Usage

### Use on browser with ES6 modules:

```html
<script type="module">
  import { BrowserQRCodeReader } from '@zxing/library';

  const codeReader = new BrowserQRCodeReader();
  const img = document.getElementById('img');

  try {
      const result = await codeReader.decodeFromImage(img);
  } catch (err) {
      console.error(err);
  }

  console.log(result);
</script>
```

#### Or asynchronously:

```html
<script type="module">
  import('@zxing/library').then({ BrowserQRCodeReader } => {

    const codeReader = new BrowserQRCodeReader();
    const img = document.getElementById('img');

    try {
        const result = await codeReader.decodeFromImage(img);
    } catch (err) {
        console.error(err);
    }

    console.log(result);

  });
</script>
```

### Use on browser with AMD:

```html
<script type="text/javascript" src="https://unpkg.com/requirejs"></script>
<script type="text/javascript">
  require(['@zxing/library'], ZXing => {
    const codeReader = new ZXing.BrowserQRCodeReader();
    const img = document.getElementById('img');

    try {
        const result = await codeReader.decodeFromImage(img);
    } catch (err) {
        console.error(err);
    }

    console.log(result);
  });
</script>
```

### Use on browser with UMD:

```html
<script type="text/javascript" src="https://unpkg.com/@zxing/library@latest"></script>
<script type="text/javascript">
  window.addEventListener('load', () => {
    const codeReader = new ZXing.BrowserQRCodeReader();
    const img = document.getElementById('img');

    try {
        const result = await codeReader.decodeFromImage(img);
    } catch (err) {
        console.error(err);
    }

    console.log(result);
  });
</script>
```

### Use outside the browser with CommonJS:

```javascript
const { MultiFormatReader, BarcodeFormat } = require('@zxing/library/esm5'); // use this path since v0.5.1

const hints = new Map();
const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX/*, ...*/];

hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

const reader = new MultiFormatReader();

reader.setHints(hints);

const luminanceSource = new RGBLuminanceSource(imgByteArray, imgWidth, imgHeight);
const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

reader.decode(binaryBitmap);
```

## Browser Support

The browser layer is using the [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) web API which is not supported by older browsers.

_You can use external polyfills like [WebRTC adapter](https://github.com/webrtc/adapter) to increase browser compatibility._

Also, note that the library is using the [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) (`Int32Array`, `Uint8ClampedArray`, etc.) which are not available in older browsers (e.g. Android 4 default browser).

_You can use [core-js](https://github.com/zloirock/core-js) to add support to these browsers._

In the PDF 417 decoder recent addition, the library now makes use of the new `BigInt` type, which [is not supported by all browsers][2] as well. There's no way to polyfill that and ponyfill libraries are **way to big**, but even if PDF 417 decoding relies on `BigInt` the rest of the library shall work ok in browsers that doesn't support it.

_There's no polyfills for `BigInt` in the way it's coded in here._

### Scanning from Video Camera

To display the input from the video camera you will need to add a video element in the HTML page:

```html
<video
  id="video"
  width="300"
  height="200"
  style="border: 1px solid gray"
></video>
```

To start decoding, first obtain a list of video input devices with:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();

codeReader
  .listVideoInputDevices()
  .then(videoInputDevices => {
    videoInputDevices.forEach(device =>
      console.log(`${device.label}, ${device.deviceId}`)
    );
  })
  .catch(err => console.error(err));
```

If there is just one input device you can use the first `deviceId` and the video element id (in the example below is also 'video') to decode:

```javascript
const firstDeviceId = videoInputDevices[0].deviceId;

codeReader
  .decodeOnceFromVideoDevice(firstDeviceId, 'video')
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

If there are more input devices then you will need to chose one for `codeReader.decodeOnceFromVideoDevice` device id parameter.

You can also provide `undefined` for the device id parameter in which case the library will automatically choose the camera, preferring the main (environment facing) camera if more are available:

```javascript
codeReader
  .decodeOnceFromVideoDevice(undefined, 'video')
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

### Scanning from Video File

Similar as above you can use a video element in the HTML page:

```html
<video
  id="video"
  width="300"
  height="200"
  style="border: 1px solid gray"
></video>
```

And to decode the video from an url:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();
const videoSrc = 'your url to a video';

codeReader
  .decodeFromVideo('video', videoSrc)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

You can also decode the video url without showing it in the page, in this case no `video` element is needed in HTML.

```javascript
codeReader
  .decodeFromVideoUrl(videoUrl)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));

// or alternatively

codeReader
  .decodeFromVideo(null, videoUrl)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

### Scanning from Image

Similar as above you can use a img element in the HTML page (with src attribute set):

```html
<img
  id="img"
  src="qrcode-image.png"
  width="200"
  height="300"
  style="border: 1px solid gray"
/>
```

And to decode the image:

```javascript
const codeReader = new ZXing.BrowserQRCodeReader();
const img = document.getElementById('img');

codeReader
  .decodeFromImage(img)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

You can also decode the image url without showing it in the page, in this case no `img` element is needed in HTML:

```javascript
const imgSrc = 'url to image';

codeReader
  .decodeFromImage(undefined, imgSrc)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

Or decode the image url directly from an url, with an `img` element in page (notice no `src` attribute is set for `img` element):

```html
<img
  id="img-to-decode"
  width="200"
  height="300"
  style="border: 1px solid gray"
/>
```

```javascript
const imgSrc = 'url to image';
const imgDomId = 'img-to-decode';

codeReader
  .decodeFromImage(imgDomId, imgSrc)
  .then(result => console.log(result.text))
  .catch(err => console.error(err));
```

## Barcode generation

To generate a QR Code SVG image include 'zxing.qrcodewriter.min.js' from `build/vanillajs`. You will need to include an element where the SVG element will be appended:

```html
<div id="result"></div>
```

And then:

```javascript
const codeWriter = new ZXing.BrowserQRCodeSvgWriter();
// you can get a SVG element.
const svgElement = codeWriter.write(input, 300, 300);
// or render it directly to DOM.
codeWriter.writeToDom('#result', input, 300, 300);
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
