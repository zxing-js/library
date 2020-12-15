
## Using MultiFormatReader to decode multiple formats

Basic implementation of a `MultiFormatReader`, in a common.js environment, to decode QR and data matrix formats from a `RGBLuminanceSource`.

```javascript
const { MultiFormatReader, BarcodeFormat } = require('@zxing/library');

const hints = new Map();
const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, /*...*/];

hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

const reader = new MultiFormatReader();

reader.setHints(hints);

const luminanceSource = new RGBLuminanceSource(imgByteArray, imgWidth, imgHeight);
const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

reader.decodeWithState(binaryBitmap);
```
