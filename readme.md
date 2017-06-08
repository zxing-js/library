ZXing TypeScript
================

[![Build Status](https://travis-ci.org/aleris/zxing-typescript.svg?branch=master)](https://travis-ci.org/aleris/zxing-typescript)

ZXing ("zebra crossing") TypeScript is an open-source, multi-format 1D/2D barcode image processing library ported to TypeScript from Java.

See https://github.com/zxing/zxing for original Java project.

Demo
====

See [some demo examples](https://github.com/aleris/zxing-typescript/docs) for browser usage code examples.

Usage
=====

The library has separate builds for node and browser so can be used:
- from node woth TypeScript (just reference anything from src/core)
- from node with plain javascript (see below)
- from browser with plain javascript (see below)

Node Usage
----------

To use in node you will need to provide an implementation the LuminanceSource for an image. A starting point is SharpImageLuminanceSource from tests that is using [sharp image processing](https://github.com/lovell/sharp) node library.


Browser Usage
-------------

QR Code is shown the examples below, all other supported barcodes work similary.

`npm install zxing-typescript --save`

Then:

`npm run build.browser.dist`

To build the javascript files and reference, for example `zxing.qrcodereader.min.js` from `build-browser` folder.

See [some demo examples](https://github.com/aleris/zxing-typescript/docs) for browser usage javascript code examples.

All the examples are using es6, be sure is supported in your browser or modify as needed (eg. var instead of const etc.).

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

A full working example for [QR Code from Video Camera](https://github.com/aleris/zxing-typescript/docs/qr-camera/) is provided in the [examples](https://github.com/aleris/zxing-typescript/docs/).

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

A full working example for [QR Code from Video File](https://github.com/aleris/zxing-typescript/docs/qr-video/) is provided in the [examples](https://github.com/aleris/zxing-typescript/docs/).


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

Or decode the image url directly from an url, with an `img` element in page (notice in this case no `src` attribute is set for `img` element):

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

A full working example for [QR Code from Image](https://github.com/aleris/zxing-typescript/docs/qr-image/) is provided in the [examples](https://github.com/aleris/zxing-typescript/docs/).

Porting Information
==================

See [TypeScript Port Info](typescriptport.md).


Status and Roadmap
==================

- [x] Port root, common and qrcode format and make it compile
- [x] Add unit test infrastructure, a first unit test and make it pass (common/BitArrayTestCase)
- [x] Add all unit tests for everything in root, common and qrcode
- [x] Add one "back box" test for qrcode
- [x] Add all "back box" tests for qrcode
- [x] Create browser integration module and demo UI for qrcode
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


