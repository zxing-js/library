## Installation

zxing-js/library runs on Node.js and is available as an NPM package. You can install zxing-js/library in your project's directory as usual:

`npm i @zxing/library --save`

or using yarn

`yarn add @zxing/library`

## Usage

Example of a simple `QRCodeReader` in an ES6 environment.

```typescript
import { BinaryBitmap, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';

const reader = new QRCodeReader();

// Extracted image byte array and dimensions
const luminanceSource = new RGBLuminanceSource(imgByteArray, imgWidth, imgHeight);
const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

try {
  reader.decode(binaryBitmap);
} catch (err) {
  console.error(err);
}
```
