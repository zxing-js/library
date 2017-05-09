"use strict";
/*
 * Copyright 2008 ZXing authors
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
/*namespace com.google.zxing.qrcode.encoder {*/
var BitArray_1 = require("./../../common/BitArray");
var Exception_1 = require("./../../Exception");
var Integer_1 = require("./../../util/Integer");
var QRCode_1 = require("./QRCode");
var MaskUtil_1 = require("./MaskUtil");
/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
var MatrixUtil = (function () {
    function MatrixUtil() {
        // do nothing
    }
    // Set all cells to -1.  -1 means that the cell is empty (not set yet).
    //
    // JAVAPORT: We shouldn't need to do this at all. The code should be rewritten to begin encoding
    // with the ByteMatrix initialized all to zero.
    MatrixUtil.clearMatrix = function (matrix) {
        matrix.clear(/*(byte) */ -1);
    };
    // Build 2D matrix of QR Code from "dataBits" with "ecLevel", "version" and "getMaskPattern". On
    // success, store the result in "matrix" and return true.
    MatrixUtil.buildMatrix = function (dataBits, ecLevel, version, maskPattern /*int*/, matrix) {
        MatrixUtil.clearMatrix(matrix);
        MatrixUtil.embedBasicPatterns(version, matrix);
        // Type information appear with any version.
        MatrixUtil.embedTypeInfo(ecLevel, maskPattern, matrix);
        // Version info appear if version >= 7.
        MatrixUtil.maybeEmbedVersionInfo(version, matrix);
        // Data should be embedded at end.
        MatrixUtil.embedDataBits(dataBits, maskPattern, matrix);
    };
    // Embed basic patterns. On success, modify the matrix and return true.
    // The basic patterns are:
    // - Position detection patterns
    // - Timing patterns
    // - Dark dot at the left bottom corner
    // - Position adjustment patterns, if need be
    MatrixUtil.embedBasicPatterns = function (version, matrix) {
        // Let's get started with embedding big squares at corners.
        MatrixUtil.embedPositionDetectionPatternsAndSeparators(matrix);
        // Then, embed the dark dot at the left bottom corner.
        MatrixUtil.embedDarkDotAtLeftBottomCorner(matrix);
        // Position adjustment patterns appear if version >= 2.
        MatrixUtil.maybeEmbedPositionAdjustmentPatterns(version, matrix);
        // Timing patterns should be embedded after position adj. patterns.
        MatrixUtil.embedTimingPatterns(matrix);
    };
    // Embed type information. On success, modify the matrix.
    MatrixUtil.embedTypeInfo = function (ecLevel, maskPattern /*int*/, matrix) {
        var typeInfoBits = new BitArray_1.default();
        MatrixUtil.makeTypeInfoBits(ecLevel, maskPattern, typeInfoBits);
        for (var i = 0, size = typeInfoBits.getSize(); i < size; ++i) {
            // Place bits in LSB to MSB order.  LSB (least significant bit) is the last value in
            // "typeInfoBits".
            var bit = typeInfoBits.get(typeInfoBits.getSize() - 1 - i);
            // Type info bits at the left top corner. See 8.9 of JISX0510:2004 (p.46).
            var coordinates = MatrixUtil.TYPE_INFO_COORDINATES[i];
            var x1 = coordinates[0];
            var y1 = coordinates[1];
            matrix.setBoolean(x1, y1, bit);
            if (i < 8) {
                // Right top corner.
                var x2 = matrix.getWidth() - i - 1;
                var y2 = 8;
                matrix.setBoolean(x2, y2, bit);
            }
            else {
                // Left bottom corner.
                var x2 = 8;
                var y2 = matrix.getHeight() - 7 + (i - 8);
                matrix.setBoolean(x2, y2, bit);
            }
        }
    };
    // Embed version information if need be. On success, modify the matrix and return true.
    // See 8.10 of JISX0510:2004 (p.47) for how to embed version information.
    MatrixUtil.maybeEmbedVersionInfo = function (version, matrix) {
        if (version.getVersionNumber() < 7) {
            return; // Don't need version info.
        }
        var versionInfoBits = new BitArray_1.default();
        MatrixUtil.makeVersionInfoBits(version, versionInfoBits);
        var bitIndex = 6 * 3 - 1; // It will decrease from 17 to 0.
        for (var i = 0; i < 6; ++i) {
            for (var j = 0; j < 3; ++j) {
                // Place bits in LSB (least significant bit) to MSB order.
                var bit = versionInfoBits.get(bitIndex);
                bitIndex--;
                // Left bottom corner.
                matrix.setBoolean(i, matrix.getHeight() - 11 + j, bit);
                // Right bottom corner.
                matrix.setBoolean(matrix.getHeight() - 11 + j, i, bit);
            }
        }
    };
    // Embed "dataBits" using "getMaskPattern". On success, modify the matrix and return true.
    // For debugging purposes, it skips masking process if "getMaskPattern" is -1.
    // See 8.7 of JISX0510:2004 (p.38) for how to embed data bits.
    MatrixUtil.embedDataBits = function (dataBits, maskPattern /*int*/, matrix) {
        var bitIndex = 0;
        var direction = -1;
        // Start from the right bottom cell.
        var x = matrix.getWidth() - 1;
        var y = matrix.getHeight() - 1;
        while (x > 0) {
            // Skip the vertical timing pattern.
            if (x == 6) {
                x -= 1;
            }
            while (y >= 0 && y < matrix.getHeight()) {
                for (var i = 0; i < 2; ++i) {
                    var xx = x - i;
                    // Skip the cell if it's not empty.
                    if (!MatrixUtil.isEmpty(matrix.get(xx, y))) {
                        continue;
                    }
                    var bit = void 0;
                    if (bitIndex < dataBits.getSize()) {
                        bit = dataBits.get(bitIndex);
                        ++bitIndex;
                    }
                    else {
                        // Padding bit. If there is no bit left, we'll fill the left cells with 0, as described
                        // in 8.4.9 of JISX0510:2004 (p. 24).
                        bit = false;
                    }
                    // Skip masking if mask_pattern is -1.
                    if (maskPattern !== -1 && MaskUtil_1.default.getDataMaskBit(maskPattern, xx, y)) {
                        bit = !bit;
                    }
                    matrix.setBoolean(xx, y, bit);
                }
                y += direction;
            }
            direction = -direction; // Reverse the direction.
            y += direction;
            x -= 2; // Move to the left.
        }
        // All bits should be consumed.
        if (bitIndex !== dataBits.getSize()) {
            throw new Exception_1.default("WriterException", "Not all bits consumed: " + bitIndex + '/' + dataBits.getSize());
        }
    };
    // Return the position of the most significant bit set (one: to) in the "value". The most
    // significant bit is position 32. If there is no bit set, return 0. Examples:
    // - findMSBSet(0) => 0
    // - findMSBSet(1) => 1
    // - findMSBSet(255) => 8
    MatrixUtil.findMSBSet = function (value /*int*/) {
        return 32 - Integer_1.default.numberOfLeadingZeros(value);
    };
    // Calculate BCH (Bose-Chaudhuri-Hocquenghem) code for "value" using polynomial "poly". The BCH
    // code is used for encoding type information and version information.
    // Example: Calculation of version information of 7.
    // f(x) is created from 7.
    //   - 7 = 000111 in 6 bits
    //   - f(x) = x^2 + x^1 + x^0
    // g(x) is given by the standard (p. 67)
    //   - g(x) = x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1
    // Multiply f(x) by x^(18 - 6)
    //   - f'(x) = f(x) * x^(18 - 6)
    //   - f'(x) = x^14 + x^13 + x^12
    // Calculate the remainder of f'(x) / g(x)
    //         x^2
    //         __________________________________________________
    //   g(x) )x^14 + x^13 + x^12
    //         x^14 + x^13 + x^12 + x^11 + x^10 + x^7 + x^4 + x^2
    //         --------------------------------------------------
    //                              x^11 + x^10 + x^7 + x^4 + x^2
    //
    // The remainder is x^11 + x^10 + x^7 + x^4 + x^2
    // Encode it in binary: 110010010100
    // The return value is 0xc94 (1100 1001 0100)
    //
    // Since all coefficients in the polynomials are 1 or 0, we can do the calculation by bit
    // operations. We don't care if coefficients are positive or negative.
    MatrixUtil.calculateBCHCode = function (value /*int*/, poly /*int*/) {
        if (poly === 0) {
            throw new Exception_1.default("IllegalArgumentException", "0 polynomial");
        }
        // If poly is "1 1111 0010 0101" (version info poly), msbSetInPoly is 13. We'll subtract 1
        // from 13 to make it 12.
        var msbSetInPoly = MatrixUtil.findMSBSet(poly);
        value <<= msbSetInPoly - 1;
        // Do the division business using exclusive-or operations.
        while (MatrixUtil.findMSBSet(value) >= msbSetInPoly) {
            value ^= poly << (MatrixUtil.findMSBSet(value) - msbSetInPoly);
        }
        // Now the "value" is the remainder (i.e. the BCH code)
        return value;
    };
    // Make bit vector of type information. On success, store the result in "bits" and return true.
    // Encode error correction level and mask pattern. See 8.9 of
    // JISX0510:2004 (p.45) for details.
    MatrixUtil.makeTypeInfoBits = function (ecLevel, maskPattern /*int*/, bits) {
        if (!QRCode_1.default.isValidMaskPattern(maskPattern)) {
            throw new Exception_1.default("WriterException", "Invalid mask pattern");
        }
        var typeInfo = (ecLevel.getBits() << 3) | maskPattern;
        bits.appendBits(typeInfo, 5);
        var bchCode = MatrixUtil.calculateBCHCode(typeInfo, MatrixUtil.TYPE_INFO_POLY);
        bits.appendBits(bchCode, 10);
        var maskBits = new BitArray_1.default();
        maskBits.appendBits(MatrixUtil.TYPE_INFO_MASK_PATTERN, 15);
        bits.xor(maskBits);
        if (bits.getSize() !== 15) {
            throw new Exception_1.default("WriterException", "should not happen but we got: " + bits.getSize());
        }
    };
    // Make bit vector of version information. On success, store the result in "bits" and return true.
    // See 8.10 of JISX0510:2004 (p.45) for details.
    MatrixUtil.makeVersionInfoBits = function (version, bits) {
        bits.appendBits(version.getVersionNumber(), 6);
        var bchCode = MatrixUtil.calculateBCHCode(version.getVersionNumber(), MatrixUtil.VERSION_INFO_POLY);
        bits.appendBits(bchCode, 12);
        if (bits.getSize() !== 18) {
            throw new Exception_1.default("WriterException", "should not happen but we got: " + bits.getSize());
        }
    };
    // Check if "value" is empty.
    MatrixUtil.isEmpty = function (value /*int*/) {
        return value === -1;
    };
    MatrixUtil.embedTimingPatterns = function (matrix) {
        // -8 is for skipping position detection patterns (7: size), and two horizontal/vertical
        // separation patterns (1: size). Thus, 8 = 7 + 1.
        for (var i = 8; i < matrix.getWidth() - 8; ++i) {
            var bit = (i + 1) % 2;
            // Horizontal line.
            if (MatrixUtil.isEmpty(matrix.get(i, 6))) {
                matrix.setNumber(i, 6, bit);
            }
            // Vertical line.
            if (MatrixUtil.isEmpty(matrix.get(6, i))) {
                matrix.setNumber(6, i, bit);
            }
        }
    };
    // Embed the lonely dark dot at left bottom corner. JISX0510:2004 (p.46)
    MatrixUtil.embedDarkDotAtLeftBottomCorner = function (matrix) {
        if (matrix.get(8, matrix.getHeight() - 8) === 0) {
            throw new Exception_1.default("WriterException");
        }
        matrix.setNumber(8, matrix.getHeight() - 8, 1);
    };
    MatrixUtil.embedHorizontalSeparationPattern = function (xStart /*int*/, yStart /*int*/, matrix) {
        for (var x = 0; x < 8; ++x) {
            if (!MatrixUtil.isEmpty(matrix.get(xStart + x, yStart))) {
                throw new Exception_1.default("WriterException");
            }
            matrix.setNumber(xStart + x, yStart, 0);
        }
    };
    MatrixUtil.embedVerticalSeparationPattern = function (xStart /*int*/, yStart /*int*/, matrix) {
        for (var y = 0; y < 7; ++y) {
            if (!MatrixUtil.isEmpty(matrix.get(xStart, yStart + y))) {
                throw new Exception_1.default("WriterException");
            }
            matrix.setNumber(xStart, yStart + y, 0);
        }
    };
    MatrixUtil.embedPositionAdjustmentPattern = function (xStart /*int*/, yStart /*int*/, matrix) {
        for (var y = 0; y < 5; ++y) {
            var patternY = MatrixUtil.POSITION_ADJUSTMENT_PATTERN[y];
            for (var x = 0; x < 5; ++x) {
                matrix.setNumber(xStart + x, yStart + y, patternY[x]);
            }
        }
    };
    MatrixUtil.embedPositionDetectionPattern = function (xStart /*int*/, yStart /*int*/, matrix) {
        for (var y = 0; y < 7; ++y) {
            var patternY = MatrixUtil.POSITION_DETECTION_PATTERN[y];
            for (var x = 0; x < 7; ++x) {
                matrix.setNumber(xStart + x, yStart + y, patternY[x]);
            }
        }
    };
    // Embed position detection patterns and surrounding vertical/horizontal separators.
    MatrixUtil.embedPositionDetectionPatternsAndSeparators = function (matrix) {
        // Embed three big squares at corners.
        var pdpWidth = MatrixUtil.POSITION_DETECTION_PATTERN[0].length;
        // Left top corner.
        MatrixUtil.embedPositionDetectionPattern(0, 0, matrix);
        // Right top corner.
        MatrixUtil.embedPositionDetectionPattern(matrix.getWidth() - pdpWidth, 0, matrix);
        // Left bottom corner.
        MatrixUtil.embedPositionDetectionPattern(0, matrix.getWidth() - pdpWidth, matrix);
        // Embed horizontal separation patterns around the squares.
        var hspWidth = 8;
        // Left top corner.
        MatrixUtil.embedHorizontalSeparationPattern(0, hspWidth - 1, matrix);
        // Right top corner.
        MatrixUtil.embedHorizontalSeparationPattern(matrix.getWidth() - hspWidth, hspWidth - 1, matrix);
        // Left bottom corner.
        MatrixUtil.embedHorizontalSeparationPattern(0, matrix.getWidth() - hspWidth, matrix);
        // Embed vertical separation patterns around the squares.
        var vspSize = 7;
        // Left top corner.
        MatrixUtil.embedVerticalSeparationPattern(vspSize, 0, matrix);
        // Right top corner.
        MatrixUtil.embedVerticalSeparationPattern(matrix.getHeight() - vspSize - 1, 0, matrix);
        // Left bottom corner.
        MatrixUtil.embedVerticalSeparationPattern(vspSize, matrix.getHeight() - vspSize, matrix);
    };
    // Embed position adjustment patterns if need be.
    MatrixUtil.maybeEmbedPositionAdjustmentPatterns = function (version, matrix) {
        if (version.getVersionNumber() < 2) {
            return;
        }
        var index = version.getVersionNumber() - 1;
        var coordinates = MatrixUtil.POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[index];
        for (var i = 0, lenght = coordinates.length; i != lenght; i++) {
            var y = coordinates[i];
            if (y >= 0) {
                for (var j = 0; j != lenght; j++) {
                    var x = coordinates[j];
                    if (x >= 0 && MatrixUtil.isEmpty(matrix.get(x, y))) {
                        // If the cell is unset, we embed the position adjustment pattern here.
                        // -2 is necessary since the x/y coordinates point to the center of the pattern, not the
                        // left top corner.
                        MatrixUtil.embedPositionAdjustmentPattern(x - 2, y - 2, matrix);
                    }
                }
            }
        }
    };
    return MatrixUtil;
}());
MatrixUtil.POSITION_DETECTION_PATTERN = Array.from([
    Int32Array.from([1, 1, 1, 1, 1, 1, 1]),
    Int32Array.from([1, 0, 0, 0, 0, 0, 1]),
    Int32Array.from([1, 0, 1, 1, 1, 0, 1]),
    Int32Array.from([1, 0, 1, 1, 1, 0, 1]),
    Int32Array.from([1, 0, 1, 1, 1, 0, 1]),
    Int32Array.from([1, 0, 0, 0, 0, 0, 1]),
    Int32Array.from([1, 1, 1, 1, 1, 1, 1]),
]);
MatrixUtil.POSITION_ADJUSTMENT_PATTERN = Array.from([
    Int32Array.from([1, 1, 1, 1, 1]),
    Int32Array.from([1, 0, 0, 0, 1]),
    Int32Array.from([1, 0, 1, 0, 1]),
    Int32Array.from([1, 0, 0, 0, 1]),
    Int32Array.from([1, 1, 1, 1, 1]),
]);
// From Appendix E. Table 1, JIS0510X:2004 (71: p). The table was double-checked by komatsu.
MatrixUtil.POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE = Array.from([
    Int32Array.from([-1, -1, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 18, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 22, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 26, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 30, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 34, -1, -1, -1, -1, -1]),
    Int32Array.from([6, 22, 38, -1, -1, -1, -1]),
    Int32Array.from([6, 24, 42, -1, -1, -1, -1]),
    Int32Array.from([6, 26, 46, -1, -1, -1, -1]),
    Int32Array.from([6, 28, 50, -1, -1, -1, -1]),
    Int32Array.from([6, 30, 54, -1, -1, -1, -1]),
    Int32Array.from([6, 32, 58, -1, -1, -1, -1]),
    Int32Array.from([6, 34, 62, -1, -1, -1, -1]),
    Int32Array.from([6, 26, 46, 66, -1, -1, -1]),
    Int32Array.from([6, 26, 48, 70, -1, -1, -1]),
    Int32Array.from([6, 26, 50, 74, -1, -1, -1]),
    Int32Array.from([6, 30, 54, 78, -1, -1, -1]),
    Int32Array.from([6, 30, 56, 82, -1, -1, -1]),
    Int32Array.from([6, 30, 58, 86, -1, -1, -1]),
    Int32Array.from([6, 34, 62, 90, -1, -1, -1]),
    Int32Array.from([6, 28, 50, 72, 94, -1, -1]),
    Int32Array.from([6, 26, 50, 74, 98, -1, -1]),
    Int32Array.from([6, 30, 54, 78, 102, -1, -1]),
    Int32Array.from([6, 28, 54, 80, 106, -1, -1]),
    Int32Array.from([6, 32, 58, 84, 110, -1, -1]),
    Int32Array.from([6, 30, 58, 86, 114, -1, -1]),
    Int32Array.from([6, 34, 62, 90, 118, -1, -1]),
    Int32Array.from([6, 26, 50, 74, 98, 122, -1]),
    Int32Array.from([6, 30, 54, 78, 102, 126, -1]),
    Int32Array.from([6, 26, 52, 78, 104, 130, -1]),
    Int32Array.from([6, 30, 56, 82, 108, 134, -1]),
    Int32Array.from([6, 34, 60, 86, 112, 138, -1]),
    Int32Array.from([6, 30, 58, 86, 114, 142, -1]),
    Int32Array.from([6, 34, 62, 90, 118, 146, -1]),
    Int32Array.from([6, 30, 54, 78, 102, 126, 150]),
    Int32Array.from([6, 24, 50, 76, 102, 128, 154]),
    Int32Array.from([6, 28, 54, 80, 106, 132, 158]),
    Int32Array.from([6, 32, 58, 84, 110, 136, 162]),
    Int32Array.from([6, 26, 54, 82, 110, 138, 166]),
    Int32Array.from([6, 30, 58, 86, 114, 142, 170]),
]);
// Type info cells at the left top corner.
MatrixUtil.TYPE_INFO_COORDINATES = Array.from([
    Int32Array.from([8, 0]),
    Int32Array.from([8, 1]),
    Int32Array.from([8, 2]),
    Int32Array.from([8, 3]),
    Int32Array.from([8, 4]),
    Int32Array.from([8, 5]),
    Int32Array.from([8, 7]),
    Int32Array.from([8, 8]),
    Int32Array.from([7, 8]),
    Int32Array.from([5, 8]),
    Int32Array.from([4, 8]),
    Int32Array.from([3, 8]),
    Int32Array.from([2, 8]),
    Int32Array.from([1, 8]),
    Int32Array.from([0, 8]),
]);
// From Appendix D in JISX0510:2004 (p. 67)
MatrixUtil.VERSION_INFO_POLY = 0x1f25; // 1 1111 0010 0101
// From Appendix C in JISX0510:2004 (p.65).
MatrixUtil.TYPE_INFO_POLY = 0x537;
MatrixUtil.TYPE_INFO_MASK_PATTERN = 0x5412;
exports.default = MatrixUtil;
//# sourceMappingURL=MatrixUtil.js.map