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
var BitMatrix_1 = require("./../../common/BitMatrix");
var GenericGF_1 = require("./../../common/reedsolomon/GenericGF");
var ReedSolomonDecoder_1 = require("./../../common/reedsolomon/ReedSolomonDecoder");
var BitMatrixParser_1 = require("./BitMatrixParser");
var QRCodeDecoderMetaData_1 = require("./QRCodeDecoderMetaData");
var DataBlock_1 = require("./DataBlock");
var DecodedBitStreamParser_1 = require("./DecodedBitStreamParser");
var Exception_1 = require("./../../Exception");
/*import java.util.Map;*/
/**
 * <p>The main class which implements QR Code decoding -- as opposed to locating and extracting
 * the QR Code from an image.</p>
 *
 * @author Sean Owen
 */
var Decoder = (function () {
    function Decoder() {
        this.rsDecoder = new ReedSolomonDecoder_1.default(GenericGF_1.default.QR_CODE_FIELD_256);
    }
    // public decode(image: boolean[][]): DecoderResult /*throws ChecksumException, FormatException*/ {
    //   return decode(image, null)
    // }
    /**
     * <p>Convenience method that can decode a QR Code represented as a 2D array of booleans.
     * "true" is taken to mean a black module.</p>
     *
     * @param image booleans representing white/black QR Code modules
     * @param hints decoding hints that should be used to influence decoding
     * @return text and bytes encoded within the QR Code
     * @throws FormatException if the QR Code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.decodeBooleanArray = function (image, hints) {
        return this.decodeBitMatrix(BitMatrix_1.default.parseFromBooleanArray(image), hints);
    };
    // public decodeBitMatrix(bits: BitMatrix): DecoderResult /*throws ChecksumException, FormatException*/ {
    //   return decode(bits, null)
    // }
    /**
     * <p>Decodes a QR Code represented as a {@link BitMatrix}. A 1 or "true" is taken to mean a black module.</p>
     *
     * @param bits booleans representing white/black QR Code modules
     * @param hints decoding hints that should be used to influence decoding
     * @return text and bytes encoded within the QR Code
     * @throws FormatException if the QR Code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.decodeBitMatrix = function (bits, hints) {
        // Construct a parser and read version, error-correction level
        var parser = new BitMatrixParser_1.default(bits);
        var ex = null;
        try {
            return this.decodeBitMatrixParser(parser, hints);
        }
        catch (e /*: FormatException, ChecksumException*/) {
            ex = e;
        }
        try {
            // Revert the bit matrix
            parser.remask();
            // Will be attempting a mirrored reading of the version and format info.
            parser.setMirror(true);
            // Preemptively read the version.
            parser.readVersion();
            // Preemptively read the format information.
            parser.readFormatInformation();
            /*
             * Since we're here, this means we have successfully detected some kind
             * of version and format information when mirrored. This is a good sign,
             * that the QR code may be mirrored, and we should try once more with a
             * mirrored content.
             */
            // Prepare for a mirrored reading.
            parser.mirror();
            var result = this.decodeBitMatrixParser(parser, hints);
            // Success! Notify the caller that the code was mirrored.
            result.setOther(new QRCodeDecoderMetaData_1.default(true));
            return result;
        }
        catch (e /*FormatException | ChecksumException*/) {
            // Throw the exception from the original reading
            if (ex !== null) {
                throw ex;
            }
            throw e;
        }
    };
    Decoder.prototype.decodeBitMatrixParser = function (parser, hints) {
        var version = parser.readVersion();
        var ecLevel = parser.readFormatInformation().getErrorCorrectionLevel();
        // Read codewords
        var codewords = parser.readCodewords();
        // Separate into data blocks
        var dataBlocks = DataBlock_1.default.getDataBlocks(codewords, version, ecLevel);
        // Count total number of data bytes
        var totalBytes = 0;
        for (var _i = 0, dataBlocks_1 = dataBlocks; _i < dataBlocks_1.length; _i++) {
            var dataBlock = dataBlocks_1[_i];
            totalBytes += dataBlock.getNumDataCodewords();
        }
        var resultBytes = new Uint8Array(totalBytes);
        var resultOffset = 0;
        // Error-correct and copy data blocks together into a stream of bytes
        for (var _a = 0, dataBlocks_2 = dataBlocks; _a < dataBlocks_2.length; _a++) {
            var dataBlock = dataBlocks_2[_a];
            var codewordBytes = dataBlock.getCodewords();
            var numDataCodewords = dataBlock.getNumDataCodewords();
            this.correctErrors(codewordBytes, numDataCodewords);
            for (var i = 0; i < numDataCodewords; i++) {
                resultBytes[resultOffset++] = codewordBytes[i];
            }
        }
        // Decode the contents of that stream of bytes
        return DecodedBitStreamParser_1.default.decode(resultBytes, version, ecLevel, hints);
    };
    /**
     * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
     * correct the errors in-place using Reed-Solomon error correction.</p>
     *
     * @param codewordBytes data and error correction codewords
     * @param numDataCodewords number of codewords that are data bytes
     * @throws ChecksumException if error correction fails
     */
    Decoder.prototype.correctErrors = function (codewordBytes, numDataCodewords /*int*/) {
        var numCodewords = codewordBytes.length;
        // First read into an array of ints
        var codewordsInts = new Int32Array(numCodewords);
        for (var i = 0; i < numCodewords; i++) {
            codewordsInts[i] = codewordBytes[i] & 0xFF;
        }
        try {
            this.rsDecoder.decode(codewordsInts, codewordBytes.length - numDataCodewords);
        }
        catch (ignored /*: ReedSolomonException*/) {
            throw new Exception_1.default("ChecksumException");
        }
        // Copy back into array of bytes -- only need to worry about the bytes that were data
        // We don't care about errors in the error-correction codewords
        for (var i = 0; i < numDataCodewords; i++) {
            codewordBytes[i] = codewordsInts[i];
        }
    };
    return Decoder;
}());
exports.default = Decoder;
//# sourceMappingURL=Decoder.js.map