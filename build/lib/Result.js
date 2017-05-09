"use strict";
/*
 * Copyright 2007 ZXing authors
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
/*namespace com.google.zxing {*/
/*import java.util.EnumMap;*/
/*import java.util.Map;*/
var ResultPoint_1 = require("./ResultPoint");
var System_1 = require("./util/System");
/**
 * <p>Encapsulates the result of decoding a barcode within an image.</p>
 *
 * @author Sean Owen
 */
var Result = (function () {
    // public constructor(private text: string,
    //               Uint8Array rawBytes,
    //               ResultPoconst resultPoints: Int32Array,
    //               BarcodeFormat format) {
    //   this(text, rawBytes, resultPoints, format, System.currentTimeMillis())
    // }
    // public constructor(text: string,
    //               Uint8Array rawBytes,
    //               ResultPoconst resultPoints: Int32Array,
    //               BarcodeFormat format,
    //               long timestamp) {
    //   this(text, rawBytes, rawBytes == null ? 0 : 8 * rawBytes.length,
    //        resultPoints, format, timestamp)
    // }
    function Result(text, rawBytes, numBits /*int*/, resultPoints, format, timestamp /*long*/) {
        this.text = text;
        this.rawBytes = rawBytes;
        this.numBits = numBits; /*int*/
        this.resultPoints = resultPoints;
        this.format = format;
        this.timestamp = timestamp; /*long*/
        this.text = text;
        this.rawBytes = rawBytes;
        if (undefined === numBits || null === numBits) {
            this.numBits = (rawBytes === null || rawBytes === undefined) ? 0 : 8 * rawBytes.length;
        }
        else {
            this.numBits = numBits;
        }
        this.resultPoints = resultPoints;
        this.format = format;
        this.resultMetadata = null;
        if (undefined === timestamp || null === timestamp) {
            this.timestamp = System_1.default.currentTimeMillis();
        }
        else {
            this.timestamp = timestamp;
        }
    }
    /**
     * @return raw text encoded by the barcode
     */
    Result.prototype.getText = function () {
        return this.text;
    };
    /**
     * @return raw bytes encoded by the barcode, if applicable, otherwise {@code null}
     */
    Result.prototype.getRawBytes = function () {
        return this.rawBytes;
    };
    /**
     * @return how many bits of {@link #getRawBytes()} are valid; typically 8 times its length
     * @since 3.3.0
     */
    Result.prototype.getNumBits = function () {
        return this.numBits;
    };
    /**
     * @return points related to the barcode in the image. These are typically points
     *         identifying finder patterns or the corners of the barcode. The exact meaning is
     *         specific to the type of barcode that was decoded.
     */
    Result.prototype.getResultPoints = function () {
        return this.resultPoints;
    };
    /**
     * @return {@link BarcodeFormat} representing the format of the barcode that was decoded
     */
    Result.prototype.getBarcodeFormat = function () {
        return this.format;
    };
    /**
     * @return {@link Map} mapping {@link ResultMetadataType} keys to values. May be
     *   {@code null}. This contains optional metadata about what was detected about the barcode,
     *   like orientation.
     */
    Result.prototype.getResultMetadata = function () {
        return this.resultMetadata;
    };
    Result.prototype.putMetadata = function (type, value) {
        if (this.resultMetadata === null) {
            this.resultMetadata = new Map();
        }
        this.resultMetadata.set(type, value);
    };
    Result.prototype.putAllMetadata = function (metadata) {
        if (metadata !== null) {
            if (this.resultMetadata === null) {
                this.resultMetadata = metadata;
            }
            else {
                this.resultMetadata = new Map(metadata);
            }
        }
    };
    Result.prototype.addResultPoints = function (newPoints) {
        var oldPoints = this.resultPoints;
        if (oldPoints === null) {
            this.resultPoints = newPoints;
        }
        else if (newPoints !== null && newPoints.length > 0) {
            var allPoints = new ResultPoint_1.default[oldPoints.length + newPoints.length];
            System_1.default.arraycopy(oldPoints, 0, allPoints, 0, oldPoints.length);
            System_1.default.arraycopy(newPoints, 0, allPoints, oldPoints.length, newPoints.length);
            this.resultPoints = allPoints;
        }
    };
    Result.prototype.getTimestamp = function () {
        return this.timestamp;
    };
    /*@Override*/
    Result.prototype.toString = function () {
        return this.text;
    };
    return Result;
}());
exports.default = Result;
//# sourceMappingURL=Result.js.map