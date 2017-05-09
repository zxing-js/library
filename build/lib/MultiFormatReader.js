"use strict";
/*
 * Copyright 2009 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var QRCodeReader_1 = require("./qrcode/QRCodeReader");
var Exception_1 = require("./Exception");
/*namespace com.google.zxing {*/
/**
 * MultiFormatReader is a convenience class and the main entry point into the library for most uses.
 * By default it attempts to decode all barcode formats that the library supports. Optionally, you
 * can provide a hints object to request different behavior, for example only decoding QR codes.
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
var MultiFormatReader = (function () {
    function MultiFormatReader() {
    }
    /**
     * This version of decode honors the intent of Reader.decode(BinaryBitmap) in that it
     * passes null as a hint to the decoders. However, that makes it inefficient to call repeatedly.
     * Use setHints() followed by decodeWithState() for continuous scan applications.
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    // public decode(image: BinaryBitmap): Result /*throws NotFoundException */ {
    //   setHints(null)
    //   return decodeInternal(image)
    // }
    /**
     * Decode an image using the hints provided. Does not honor existing state.
     *
     * @param image The pixel data to decode
     * @param hints The hints to use, clearing the previous state.
     * @return The contents of the image
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    MultiFormatReader.prototype.decode = function (image, hints) {
        this.setHints(hints);
        return this.decodeInternal(image);
    };
    /**
     * Decode an image using the state set up by calling setHints() previously. Continuous scan
     * clients will get a <b>large</b> speed increase by using this instead of decode().
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     * @throws NotFoundException Any errors which occurred
     */
    MultiFormatReader.prototype.decodeWithState = function (image) {
        // Make sure to set up the default state so we don't crash
        if (this.readers === null) {
            this.setHints(null);
        }
        return this.decodeInternal(image);
    };
    /**
     * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
     * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
     * is important for performance in continuous scan clients.
     *
     * @param hints The set of hints to use for subsequent calls to decode(image)
     */
    MultiFormatReader.prototype.setHints = function (hints) {
        this.hints = hints;
        var tryHarder = hints !== null && hints !== undefined && undefined !== hints.get(3 /* TRY_HARDER */);
        /*@SuppressWarnings("unchecked")*/
        var formats = hints === null || hints === undefined ? null : hints.get(2 /* POSSIBLE_FORMATS */);
        var readers = new Array();
        if (formats !== null) {
            var addOneDReader = formats.contains(14 /* UPC_A */) ||
                formats.contains(15 /* UPC_E */) ||
                formats.contains(7 /* EAN_13 */) ||
                formats.contains(6 /* EAN_8 */) ||
                formats.contains(1 /* CODABAR */) ||
                formats.contains(2 /* CODE_39 */) ||
                formats.contains(3 /* CODE_93 */) ||
                formats.contains(4 /* CODE_128 */) ||
                formats.contains(8 /* ITF */) ||
                formats.contains(12 /* RSS_14 */) ||
                formats.contains(13 /* RSS_EXPANDED */);
            // Put 1D readers upfront in "normal" mode
            // TYPESCRIPTPORT: TODO: uncomment below as they are ported
            // if (addOneDReader && !tryHarder) {
            //   readers.push(new MultiFormatOneDReader(hints))
            // }
            if (formats.contains(11 /* QR_CODE */)) {
                readers.push(new QRCodeReader_1.default());
            }
            // if (formats.contains(BarcodeFormat.DATA_MATRIX)) {
            //   readers.push(new DataMatrixReader())
            // }
            // if (formats.contains(BarcodeFormat.AZTEC)) {
            //   readers.push(new AztecReader())
            // }
            // if (formats.contains(BarcodeFormat.PDF_417)) {
            //    readers.push(new PDF417Reader())
            // }
            // if (formats.contains(BarcodeFormat.MAXICODE)) {
            //    readers.push(new MaxiCodeReader())
            // }
            // // At end in "try harder" mode
            // if (addOneDReader && tryHarder) {
            //   readers.push(new MultiFormatOneDReader(hints))
            // }
        }
        if (readers.length === 0) {
            // if (!tryHarder) {
            //   readers.push(new MultiFormatOneDReader(hints))
            // }
            readers.push(new QRCodeReader_1.default());
            // readers.push(new DataMatrixReader())
            // readers.push(new AztecReader())
            // readers.push(new PDF417Reader())
            // readers.push(new MaxiCodeReader())
            // if (tryHarder) {
            //   readers.push(new MultiFormatOneDReader(hints))
            // }
        }
        this.readers = readers; //.toArray(new Reader[readers.size()])
    };
    /*@Override*/
    MultiFormatReader.prototype.reset = function () {
        if (this.readers !== null) {
            for (var _i = 0, _a = this.readers; _i < _a.length; _i++) {
                var reader = _a[_i];
                reader.reset();
            }
        }
    };
    MultiFormatReader.prototype.decodeInternal = function (image) {
        if (this.readers !== null) {
            for (var _i = 0, _a = this.readers; _i < _a.length; _i++) {
                var reader = _a[_i];
                try {
                    return reader.decode(image, this.hints);
                }
                catch (re /*ReaderException*/) {
                    // continue
                }
            }
        }
        throw new Exception_1.default("NotFoundException");
    };
    return MultiFormatReader;
}());
exports.default = MultiFormatReader;
//# sourceMappingURL=MultiFormatReader.js.map