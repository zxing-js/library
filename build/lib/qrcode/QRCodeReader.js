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
var Result_1 = require("./../Result");
var ResultMetadataType_1 = require("./../ResultMetadataType");
var BitMatrix_1 = require("./../common/BitMatrix");
var Decoder_1 = require("./decoder/Decoder");
var QRCodeDecoderMetaData_1 = require("./decoder/QRCodeDecoderMetaData");
var Detector_1 = require("./detector/Detector");
var Exception_1 = require("./../Exception");
/*import java.util.List;*/
/*import java.util.Map;*/
/**
 * This implementation can detect and decode QR Codes in an image.
 *
 * @author Sean Owen
 */
var QRCodeReader = (function () {
    function QRCodeReader() {
        this.decoder = new Decoder_1.default();
    }
    QRCodeReader.prototype.getDecoder = function () {
        return this.decoder;
    };
    /**
     * Locates and decodes a QR code in an image.
     *
     * @return a representing: string the content encoded by the QR code
     * @throws NotFoundException if a QR code cannot be found
     * @throws FormatException if a QR code cannot be decoded
     * @throws ChecksumException if error correction fails
     */
    /*@Override*/
    // public decode(image: BinaryBitmap): Result /*throws NotFoundException, ChecksumException, FormatException */ {
    //   return this.decode(image, null)
    // }
    /*@Override*/
    QRCodeReader.prototype.decode = function (image, hints) {
        var decoderResult;
        var points;
        if (hints !== undefined && hints !== null && undefined !== hints.get(1 /* PURE_BARCODE */)) {
            var bits = QRCodeReader.extractPureBits(image.getBlackMatrix());
            var decoderResult_1 = this.decoder.decodeBitMatrix(bits, hints);
            points = QRCodeReader.NO_POINTS;
        }
        else {
            var detectorResult = new Detector_1.default(image.getBlackMatrix()).detect(hints);
            var decoderResult_2 = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints);
            points = detectorResult.getPoints();
        }
        // If the code was mirrored: swap the bottom-left and the top-right points.
        if (decoderResult.getOther() instanceof QRCodeDecoderMetaData_1.default) {
            decoderResult.getOther().applyMirroredCorrection(points);
        }
        var result = new Result_1.default(decoderResult.getText(), decoderResult.getRawBytes(), undefined, points, 11 /* QR_CODE */, undefined);
        var byteSegments = decoderResult.getByteSegments();
        if (byteSegments !== null) {
            result.putMetadata(ResultMetadataType_1.default.BYTE_SEGMENTS, byteSegments);
        }
        var ecLevel = decoderResult.getECLevel();
        if (ecLevel !== null) {
            result.putMetadata(ResultMetadataType_1.default.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        if (decoderResult.hasStructuredAppend()) {
            result.putMetadata(ResultMetadataType_1.default.STRUCTURED_APPEND_SEQUENCE, decoderResult.getStructuredAppendSequenceNumber());
            result.putMetadata(ResultMetadataType_1.default.STRUCTURED_APPEND_PARITY, decoderResult.getStructuredAppendParity());
        }
        return result;
    };
    /*@Override*/
    QRCodeReader.prototype.reset = function () {
        // do nothing
    };
    /**
     * This method detects a code in a "pure" image -- that is, pure monochrome image
     * which contains only an unrotated, unskewed, image of a code, with some white border
     * around it. This is a specialized method that works exceptionally fast in this special
     * case.
     *
     * @see com.google.zxing.datamatrix.DataMatrixReader#extractPureBits(BitMatrix)
     */
    QRCodeReader.extractPureBits = function (image) {
        var leftTopBlack = image.getTopLeftOnBit();
        var rightBottomBlack = image.getBottomRightOnBit();
        if (leftTopBlack === null || rightBottomBlack === null) {
            throw new Exception_1.default("NotFoundException");
        }
        var moduleSize = this.moduleSize(leftTopBlack, image);
        var top = leftTopBlack[1];
        var bottom = rightBottomBlack[1];
        var left = leftTopBlack[0];
        var right = rightBottomBlack[0];
        // Sanity check!
        if (left >= right || top >= bottom) {
            throw new Exception_1.default("NotFoundException");
        }
        if (bottom - top != right - left) {
            // Special case, where bottom-right module wasn't black so we found something else in the last row
            // Assume it's a square, so use height as the width
            right = left + (bottom - top);
            if (right >= image.getWidth()) {
                // Abort if that would not make sense -- off image
                throw new Exception_1.default("NotFoundException");
            }
        }
        var matrixWidth = Math.round((right - left + 1) / moduleSize);
        var matrixHeight = Math.round((bottom - top + 1) / moduleSize);
        if (matrixWidth <= 0 || matrixHeight <= 0) {
            throw new Exception_1.default("NotFoundException");
        }
        if (matrixHeight != matrixWidth) {
            // Only possibly decode square regions
            throw new Exception_1.default("NotFoundException");
        }
        // Push in the "border" by half the module width so that we start
        // sampling in the middle of the module. Just in case the image is a
        // little off, this will help recover.
        var nudge = Math.floor(moduleSize / 2.0);
        top += nudge;
        left += nudge;
        // But careful that this does not sample off the edge
        // "right" is the farthest-right valid pixel location -- right+1 is not necessarily
        // This is positive by how much the inner x loop below would be too large
        var nudgedTooFarRight = left + Math.floor((matrixWidth - 1) * moduleSize) - right;
        if (nudgedTooFarRight > 0) {
            if (nudgedTooFarRight > nudge) {
                // Neither way fits; abort
                throw new Exception_1.default("NotFoundException");
            }
            left -= nudgedTooFarRight;
        }
        // See logic above
        var nudgedTooFarDown = top + Math.floor((matrixHeight - 1) * moduleSize) - bottom;
        if (nudgedTooFarDown > 0) {
            if (nudgedTooFarDown > nudge) {
                // Neither way fits; abort
                throw new Exception_1.default("NotFoundException");
            }
            top -= nudgedTooFarDown;
        }
        // Now just read off the bits
        var bits = new BitMatrix_1.default(matrixWidth, matrixHeight);
        for (var y = 0; y < matrixHeight; y++) {
            var iOffset = top + Math.floor(y * moduleSize);
            for (var x = 0; x < matrixWidth; x++) {
                if (image.get(left + Math.floor(x * moduleSize), iOffset)) {
                    bits.set(x, y);
                }
            }
        }
        return bits;
    };
    QRCodeReader.moduleSize = function (leftTopBlack, image) {
        var height = image.getHeight();
        var width = image.getWidth();
        var x = leftTopBlack[0];
        var y = leftTopBlack[1];
        var inBlack = true;
        var transitions = 0;
        while (x < width && y < height) {
            if (inBlack != image.get(x, y)) {
                if (++transitions == 5) {
                    break;
                }
                inBlack = !inBlack;
            }
            x++;
            y++;
        }
        if (x == width || y == height) {
            throw new Exception_1.default("NotFoundException");
        }
        return (x - leftTopBlack[0]) / 7.0;
    };
    return QRCodeReader;
}());
QRCodeReader.NO_POINTS = new Array();
exports.default = QRCodeReader;
//# sourceMappingURL=QRCodeReader.js.map