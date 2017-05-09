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
/*namespace com.google.zxing.common {*/
/*import java.util.List;*/
/**
 * <p>Encapsulates the result of decoding a matrix of bits. This typically
 * applies to 2D barcode formats. For now it contains the raw bytes obtained,
 * as well as a String interpretation of those bytes, if applicable.</p>
 *
 * @author Sean Owen
 */
var DecoderResult = (function () {
    // public constructor(rawBytes: Uint8Array,
    //                      text: string,
    //                      List<Uint8Array> byteSegments,
    //                      String ecLevel) {
    //   this(rawBytes, text, byteSegments, ecLevel, -1, -1)
    // }
    function DecoderResult(rawBytes, text, byteSegments, ecLevel, structuredAppendSequenceNumber /*int*/, structuredAppendParity /*int*/) {
        this.rawBytes = rawBytes;
        this.text = text;
        this.byteSegments = byteSegments;
        this.ecLevel = ecLevel;
        this.structuredAppendSequenceNumber = structuredAppendSequenceNumber; /*int*/
        this.structuredAppendParity = structuredAppendParity; /*int*/
        this.numBits = (rawBytes === undefined || rawBytes === null) ? 0 : 8 * rawBytes.length;
    }
    /**
     * @return raw bytes representing the result, or {@code null} if not applicable
     */
    DecoderResult.prototype.getRawBytes = function () {
        return this.rawBytes;
    };
    /**
     * @return how many bits of {@link #getRawBytes()} are valid; typically 8 times its length
     * @since 3.3.0
     */
    DecoderResult.prototype.getNumBits = function () {
        return this.numBits;
    };
    /**
     * @param numBits overrides the number of bits that are valid in {@link #getRawBytes()}
     * @since 3.3.0
     */
    DecoderResult.prototype.setNumBits = function (numBits /*int*/) {
        this.numBits = numBits;
    };
    /**
     * @return text representation of the result
     */
    DecoderResult.prototype.getText = function () {
        return this.text;
    };
    /**
     * @return list of byte segments in the result, or {@code null} if not applicable
     */
    DecoderResult.prototype.getByteSegments = function () {
        return this.byteSegments;
    };
    /**
     * @return name of error correction level used, or {@code null} if not applicable
     */
    DecoderResult.prototype.getECLevel = function () {
        return this.ecLevel;
    };
    /**
     * @return number of errors corrected, or {@code null} if not applicable
     */
    DecoderResult.prototype.getErrorsCorrected = function () {
        return this.errorsCorrected;
    };
    DecoderResult.prototype.setErrorsCorrected = function (errorsCorrected /*Integer*/) {
        this.errorsCorrected = errorsCorrected;
    };
    /**
     * @return number of erasures corrected, or {@code null} if not applicable
     */
    DecoderResult.prototype.getErasures = function () {
        return this.erasures;
    };
    DecoderResult.prototype.setErasures = function (erasures /*Integer*/) {
        this.erasures = erasures;
    };
    /**
     * @return arbitrary additional metadata
     */
    DecoderResult.prototype.getOther = function () {
        return this.other;
    };
    DecoderResult.prototype.setOther = function (other) {
        this.other = other;
    };
    DecoderResult.prototype.hasStructuredAppend = function () {
        return this.structuredAppendParity >= 0 && this.structuredAppendSequenceNumber >= 0;
    };
    DecoderResult.prototype.getStructuredAppendParity = function () {
        return this.structuredAppendParity;
    };
    DecoderResult.prototype.getStructuredAppendSequenceNumber = function () {
        return this.structuredAppendSequenceNumber;
    };
    return DecoderResult;
}());
exports.default = DecoderResult;
//# sourceMappingURL=DecoderResult.js.map