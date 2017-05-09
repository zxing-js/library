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
/*namespace com.google.zxing.qrcode.decoder {*/
var BitMatrix_1 = require("./../../common/BitMatrix");
var Exception_1 = require("./../../Exception");
var FormatInformation_1 = require("./FormatInformation");
var ECBlocks_1 = require("./ECBlocks");
var ECB_1 = require("./ECB");
/**
 * See ISO 18004:2006 Annex D
 *
 * @author Sean Owen
 */
var Version = (function () {
    function Version(versionNumber /*int*/, alignmentPatternCenters) {
        var ecBlocks = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            ecBlocks[_i - 2] = arguments[_i];
        }
        this.versionNumber = versionNumber; /*int*/
        this.alignmentPatternCenters = alignmentPatternCenters;
        this.ecBlocks = ecBlocks;
        var total = 0;
        var ecCodewords = ecBlocks[0].getECCodewordsPerBlock();
        var ecbArray = ecBlocks[0].getECBlocks();
        for (var _a = 0, ecbArray_1 = ecbArray; _a < ecbArray_1.length; _a++) {
            var ecBlock = ecbArray_1[_a];
            total += ecBlock.getCount() * (ecBlock.getDataCodewords() + ecCodewords);
        }
        this.totalCodewords = total;
    }
    Version.prototype.getVersionNumber = function () {
        return this.versionNumber;
    };
    Version.prototype.getAlignmentPatternCenters = function () {
        return this.alignmentPatternCenters;
    };
    Version.prototype.getTotalCodewords = function () {
        return this.totalCodewords;
    };
    Version.prototype.getDimensionForVersion = function () {
        return 17 + 4 * this.versionNumber;
    };
    Version.prototype.getECBlocksForLevel = function (ecLevel) {
        return this.ecBlocks[ecLevel.value];
        // TYPESCRIPTPORT: original was using ordinal, and using the order of levels as defined in ErrorCorrectionLevel enum (LMQH)
        // I will use the direct value from ErrorCorrectionLevelValues enum which in typescript goes to a number
    };
    /**
     * <p>Deduces version information purely from QR Code dimensions.</p>
     *
     * @param dimension dimension in modules
     * @return Version for a QR Code of that dimension
     * @throws FormatException if dimension is not 1 mod 4
     */
    Version.getProvisionalVersionForDimension = function (dimension /*int*/) {
        if (dimension % 4 != 1) {
            throw new Exception_1.default("FormatException");
        }
        try {
            return this.getVersionForNumber((dimension - 17) / 4);
        }
        catch (ignored /*: IllegalArgumentException*/) {
            throw new Exception_1.default("FormatException");
        }
    };
    Version.getVersionForNumber = function (versionNumber /*int*/) {
        if (versionNumber < 1 || versionNumber > 40) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        return Version.VERSIONS[versionNumber - 1];
    };
    Version.decodeVersionInformation = function (versionBits /*int*/) {
        var bestDifference = Number.MAX_SAFE_INTEGER;
        var bestVersion = 0;
        for (var i = 0; i < Version.VERSION_DECODE_INFO.length; i++) {
            var targetVersion = Version.VERSION_DECODE_INFO[i];
            // Do the version info bits match exactly? done.
            if (targetVersion === versionBits) {
                return Version.getVersionForNumber(i + 7);
            }
            // Otherwise see if this is the closest to a real version info bit string
            // we have seen so far
            var bitsDifference = FormatInformation_1.default.numBitsDiffering(versionBits, targetVersion);
            if (bitsDifference < bestDifference) {
                bestVersion = i + 7;
                bestDifference = bitsDifference;
            }
        }
        // We can tolerate up to 3 bits of error since no two version info codewords will
        // differ in less than 8 bits.
        if (bestDifference <= 3) {
            return Version.getVersionForNumber(bestVersion);
        }
        // If we didn't find a close enough match, fail
        return null;
    };
    /**
     * See ISO 18004:2006 Annex E
     */
    Version.prototype.buildFunctionPattern = function () {
        var dimension = this.getDimensionForVersion();
        var bitMatrix = new BitMatrix_1.default(dimension);
        // Top left finder pattern + separator + format
        bitMatrix.setRegion(0, 0, 9, 9);
        // Top right finder pattern + separator + format
        bitMatrix.setRegion(dimension - 8, 0, 8, 9);
        // Bottom left finder pattern + separator + format
        bitMatrix.setRegion(0, dimension - 8, 9, 8);
        // Alignment patterns
        var max = this.alignmentPatternCenters.length;
        for (var x = 0; x < max; x++) {
            var i = this.alignmentPatternCenters[x] - 2;
            for (var y = 0; y < max; y++) {
                if ((x == 0 && (y == 0 || y == max - 1)) || (x == max - 1 && y == 0)) {
                    // No alignment patterns near the three finder patterns
                    continue;
                }
                bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
            }
        }
        // Vertical timing pattern
        bitMatrix.setRegion(6, 9, 1, dimension - 17);
        // Horizontal timing pattern
        bitMatrix.setRegion(9, 6, dimension - 17, 1);
        if (this.versionNumber > 6) {
            // Version info, top right
            bitMatrix.setRegion(dimension - 11, 0, 3, 6);
            // Version info, bottom left
            bitMatrix.setRegion(0, dimension - 11, 6, 3);
        }
        return bitMatrix;
    };
    /*@Override*/
    Version.prototype.toString = function () {
        return "" + this.versionNumber;
    };
    return Version;
}());
/**
   * See ISO 18004:2006 Annex D.
   * Element i represents the raw version bits that specify version i + 7
   */
Version.VERSION_DECODE_INFO = Int32Array.from([
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
    0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
    0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
    0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
    0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
    0x2542E, 0x26A64, 0x27541, 0x28C69
]);
/**
   * See ISO 18004:2006 6.5.1 Table 9
   */
Version.VERSIONS = [
    new Version(1, new Int32Array(0), new ECBlocks_1.default(7, new ECB_1.default(1, 19)), new ECBlocks_1.default(10, new ECB_1.default(1, 16)), new ECBlocks_1.default(13, new ECB_1.default(1, 13)), new ECBlocks_1.default(17, new ECB_1.default(1, 9))),
    new Version(2, Int32Array.from([6, 18]), new ECBlocks_1.default(10, new ECB_1.default(1, 34)), new ECBlocks_1.default(16, new ECB_1.default(1, 28)), new ECBlocks_1.default(22, new ECB_1.default(1, 22)), new ECBlocks_1.default(28, new ECB_1.default(1, 16))),
    new Version(3, Int32Array.from([6, 22]), new ECBlocks_1.default(15, new ECB_1.default(1, 55)), new ECBlocks_1.default(26, new ECB_1.default(1, 44)), new ECBlocks_1.default(18, new ECB_1.default(2, 17)), new ECBlocks_1.default(22, new ECB_1.default(2, 13))),
    new Version(4, Int32Array.from([6, 26]), new ECBlocks_1.default(20, new ECB_1.default(1, 80)), new ECBlocks_1.default(18, new ECB_1.default(2, 32)), new ECBlocks_1.default(26, new ECB_1.default(2, 24)), new ECBlocks_1.default(16, new ECB_1.default(4, 9))),
    new Version(5, Int32Array.from([6, 30]), new ECBlocks_1.default(26, new ECB_1.default(1, 108)), new ECBlocks_1.default(24, new ECB_1.default(2, 43)), new ECBlocks_1.default(18, new ECB_1.default(2, 15), new ECB_1.default(2, 16)), new ECBlocks_1.default(22, new ECB_1.default(2, 11), new ECB_1.default(2, 12))),
    new Version(6, Int32Array.from([6, 34]), new ECBlocks_1.default(18, new ECB_1.default(2, 68)), new ECBlocks_1.default(16, new ECB_1.default(4, 27)), new ECBlocks_1.default(24, new ECB_1.default(4, 19)), new ECBlocks_1.default(28, new ECB_1.default(4, 15))),
    new Version(7, Int32Array.from([6, 22, 38]), new ECBlocks_1.default(20, new ECB_1.default(2, 78)), new ECBlocks_1.default(18, new ECB_1.default(4, 31)), new ECBlocks_1.default(18, new ECB_1.default(2, 14), new ECB_1.default(4, 15)), new ECBlocks_1.default(26, new ECB_1.default(4, 13), new ECB_1.default(1, 14))),
    new Version(8, Int32Array.from([6, 24, 42]), new ECBlocks_1.default(24, new ECB_1.default(2, 97)), new ECBlocks_1.default(22, new ECB_1.default(2, 38), new ECB_1.default(2, 39)), new ECBlocks_1.default(22, new ECB_1.default(4, 18), new ECB_1.default(2, 19)), new ECBlocks_1.default(26, new ECB_1.default(4, 14), new ECB_1.default(2, 15))),
    new Version(9, Int32Array.from([6, 26, 46]), new ECBlocks_1.default(30, new ECB_1.default(2, 116)), new ECBlocks_1.default(22, new ECB_1.default(3, 36), new ECB_1.default(2, 37)), new ECBlocks_1.default(20, new ECB_1.default(4, 16), new ECB_1.default(4, 17)), new ECBlocks_1.default(24, new ECB_1.default(4, 12), new ECB_1.default(4, 13))),
    new Version(10, Int32Array.from([6, 28, 50]), new ECBlocks_1.default(18, new ECB_1.default(2, 68), new ECB_1.default(2, 69)), new ECBlocks_1.default(26, new ECB_1.default(4, 43), new ECB_1.default(1, 44)), new ECBlocks_1.default(24, new ECB_1.default(6, 19), new ECB_1.default(2, 20)), new ECBlocks_1.default(28, new ECB_1.default(6, 15), new ECB_1.default(2, 16))),
    new Version(11, Int32Array.from([6, 30, 54]), new ECBlocks_1.default(20, new ECB_1.default(4, 81)), new ECBlocks_1.default(30, new ECB_1.default(1, 50), new ECB_1.default(4, 51)), new ECBlocks_1.default(28, new ECB_1.default(4, 22), new ECB_1.default(4, 23)), new ECBlocks_1.default(24, new ECB_1.default(3, 12), new ECB_1.default(8, 13))),
    new Version(12, Int32Array.from([6, 32, 58]), new ECBlocks_1.default(24, new ECB_1.default(2, 92), new ECB_1.default(2, 93)), new ECBlocks_1.default(22, new ECB_1.default(6, 36), new ECB_1.default(2, 37)), new ECBlocks_1.default(26, new ECB_1.default(4, 20), new ECB_1.default(6, 21)), new ECBlocks_1.default(28, new ECB_1.default(7, 14), new ECB_1.default(4, 15))),
    new Version(13, Int32Array.from([6, 34, 62]), new ECBlocks_1.default(26, new ECB_1.default(4, 107)), new ECBlocks_1.default(22, new ECB_1.default(8, 37), new ECB_1.default(1, 38)), new ECBlocks_1.default(24, new ECB_1.default(8, 20), new ECB_1.default(4, 21)), new ECBlocks_1.default(22, new ECB_1.default(12, 11), new ECB_1.default(4, 12))),
    new Version(14, Int32Array.from([6, 26, 46, 66]), new ECBlocks_1.default(30, new ECB_1.default(3, 115), new ECB_1.default(1, 116)), new ECBlocks_1.default(24, new ECB_1.default(4, 40), new ECB_1.default(5, 41)), new ECBlocks_1.default(20, new ECB_1.default(11, 16), new ECB_1.default(5, 17)), new ECBlocks_1.default(24, new ECB_1.default(11, 12), new ECB_1.default(5, 13))),
    new Version(15, Int32Array.from([6, 26, 48, 70]), new ECBlocks_1.default(22, new ECB_1.default(5, 87), new ECB_1.default(1, 88)), new ECBlocks_1.default(24, new ECB_1.default(5, 41), new ECB_1.default(5, 42)), new ECBlocks_1.default(30, new ECB_1.default(5, 24), new ECB_1.default(7, 25)), new ECBlocks_1.default(24, new ECB_1.default(11, 12), new ECB_1.default(7, 13))),
    new Version(16, Int32Array.from([6, 26, 50, 74]), new ECBlocks_1.default(24, new ECB_1.default(5, 98), new ECB_1.default(1, 99)), new ECBlocks_1.default(28, new ECB_1.default(7, 45), new ECB_1.default(3, 46)), new ECBlocks_1.default(24, new ECB_1.default(15, 19), new ECB_1.default(2, 20)), new ECBlocks_1.default(30, new ECB_1.default(3, 15), new ECB_1.default(13, 16))),
    new Version(17, Int32Array.from([6, 30, 54, 78]), new ECBlocks_1.default(28, new ECB_1.default(1, 107), new ECB_1.default(5, 108)), new ECBlocks_1.default(28, new ECB_1.default(10, 46), new ECB_1.default(1, 47)), new ECBlocks_1.default(28, new ECB_1.default(1, 22), new ECB_1.default(15, 23)), new ECBlocks_1.default(28, new ECB_1.default(2, 14), new ECB_1.default(17, 15))),
    new Version(18, Int32Array.from([6, 30, 56, 82]), new ECBlocks_1.default(30, new ECB_1.default(5, 120), new ECB_1.default(1, 121)), new ECBlocks_1.default(26, new ECB_1.default(9, 43), new ECB_1.default(4, 44)), new ECBlocks_1.default(28, new ECB_1.default(17, 22), new ECB_1.default(1, 23)), new ECBlocks_1.default(28, new ECB_1.default(2, 14), new ECB_1.default(19, 15))),
    new Version(19, Int32Array.from([6, 30, 58, 86]), new ECBlocks_1.default(28, new ECB_1.default(3, 113), new ECB_1.default(4, 114)), new ECBlocks_1.default(26, new ECB_1.default(3, 44), new ECB_1.default(11, 45)), new ECBlocks_1.default(26, new ECB_1.default(17, 21), new ECB_1.default(4, 22)), new ECBlocks_1.default(26, new ECB_1.default(9, 13), new ECB_1.default(16, 14))),
    new Version(20, Int32Array.from([6, 34, 62, 90]), new ECBlocks_1.default(28, new ECB_1.default(3, 107), new ECB_1.default(5, 108)), new ECBlocks_1.default(26, new ECB_1.default(3, 41), new ECB_1.default(13, 42)), new ECBlocks_1.default(30, new ECB_1.default(15, 24), new ECB_1.default(5, 25)), new ECBlocks_1.default(28, new ECB_1.default(15, 15), new ECB_1.default(10, 16))),
    new Version(21, Int32Array.from([6, 28, 50, 72, 94]), new ECBlocks_1.default(28, new ECB_1.default(4, 116), new ECB_1.default(4, 117)), new ECBlocks_1.default(26, new ECB_1.default(17, 42)), new ECBlocks_1.default(28, new ECB_1.default(17, 22), new ECB_1.default(6, 23)), new ECBlocks_1.default(30, new ECB_1.default(19, 16), new ECB_1.default(6, 17))),
    new Version(22, Int32Array.from([6, 26, 50, 74, 98]), new ECBlocks_1.default(28, new ECB_1.default(2, 111), new ECB_1.default(7, 112)), new ECBlocks_1.default(28, new ECB_1.default(17, 46)), new ECBlocks_1.default(30, new ECB_1.default(7, 24), new ECB_1.default(16, 25)), new ECBlocks_1.default(24, new ECB_1.default(34, 13))),
    new Version(23, Int32Array.from([6, 30, 54, 78, 102]), new ECBlocks_1.default(30, new ECB_1.default(4, 121), new ECB_1.default(5, 122)), new ECBlocks_1.default(28, new ECB_1.default(4, 47), new ECB_1.default(14, 48)), new ECBlocks_1.default(30, new ECB_1.default(11, 24), new ECB_1.default(14, 25)), new ECBlocks_1.default(30, new ECB_1.default(16, 15), new ECB_1.default(14, 16))),
    new Version(24, Int32Array.from([6, 28, 54, 80, 106]), new ECBlocks_1.default(30, new ECB_1.default(6, 117), new ECB_1.default(4, 118)), new ECBlocks_1.default(28, new ECB_1.default(6, 45), new ECB_1.default(14, 46)), new ECBlocks_1.default(30, new ECB_1.default(11, 24), new ECB_1.default(16, 25)), new ECBlocks_1.default(30, new ECB_1.default(30, 16), new ECB_1.default(2, 17))),
    new Version(25, Int32Array.from([6, 32, 58, 84, 110]), new ECBlocks_1.default(26, new ECB_1.default(8, 106), new ECB_1.default(4, 107)), new ECBlocks_1.default(28, new ECB_1.default(8, 47), new ECB_1.default(13, 48)), new ECBlocks_1.default(30, new ECB_1.default(7, 24), new ECB_1.default(22, 25)), new ECBlocks_1.default(30, new ECB_1.default(22, 15), new ECB_1.default(13, 16))),
    new Version(26, Int32Array.from([6, 30, 58, 86, 114]), new ECBlocks_1.default(28, new ECB_1.default(10, 114), new ECB_1.default(2, 115)), new ECBlocks_1.default(28, new ECB_1.default(19, 46), new ECB_1.default(4, 47)), new ECBlocks_1.default(28, new ECB_1.default(28, 22), new ECB_1.default(6, 23)), new ECBlocks_1.default(30, new ECB_1.default(33, 16), new ECB_1.default(4, 17))),
    new Version(27, Int32Array.from([6, 34, 62, 90, 118]), new ECBlocks_1.default(30, new ECB_1.default(8, 122), new ECB_1.default(4, 123)), new ECBlocks_1.default(28, new ECB_1.default(22, 45), new ECB_1.default(3, 46)), new ECBlocks_1.default(30, new ECB_1.default(8, 23), new ECB_1.default(26, 24)), new ECBlocks_1.default(30, new ECB_1.default(12, 15), new ECB_1.default(28, 16))),
    new Version(28, Int32Array.from([6, 26, 50, 74, 98, 122]), new ECBlocks_1.default(30, new ECB_1.default(3, 117), new ECB_1.default(10, 118)), new ECBlocks_1.default(28, new ECB_1.default(3, 45), new ECB_1.default(23, 46)), new ECBlocks_1.default(30, new ECB_1.default(4, 24), new ECB_1.default(31, 25)), new ECBlocks_1.default(30, new ECB_1.default(11, 15), new ECB_1.default(31, 16))),
    new Version(29, Int32Array.from([6, 30, 54, 78, 102, 126]), new ECBlocks_1.default(30, new ECB_1.default(7, 116), new ECB_1.default(7, 117)), new ECBlocks_1.default(28, new ECB_1.default(21, 45), new ECB_1.default(7, 46)), new ECBlocks_1.default(30, new ECB_1.default(1, 23), new ECB_1.default(37, 24)), new ECBlocks_1.default(30, new ECB_1.default(19, 15), new ECB_1.default(26, 16))),
    new Version(30, Int32Array.from([6, 26, 52, 78, 104, 130]), new ECBlocks_1.default(30, new ECB_1.default(5, 115), new ECB_1.default(10, 116)), new ECBlocks_1.default(28, new ECB_1.default(19, 47), new ECB_1.default(10, 48)), new ECBlocks_1.default(30, new ECB_1.default(15, 24), new ECB_1.default(25, 25)), new ECBlocks_1.default(30, new ECB_1.default(23, 15), new ECB_1.default(25, 16))),
    new Version(31, Int32Array.from([6, 30, 56, 82, 108, 134]), new ECBlocks_1.default(30, new ECB_1.default(13, 115), new ECB_1.default(3, 116)), new ECBlocks_1.default(28, new ECB_1.default(2, 46), new ECB_1.default(29, 47)), new ECBlocks_1.default(30, new ECB_1.default(42, 24), new ECB_1.default(1, 25)), new ECBlocks_1.default(30, new ECB_1.default(23, 15), new ECB_1.default(28, 16))),
    new Version(32, Int32Array.from([6, 34, 60, 86, 112, 138]), new ECBlocks_1.default(30, new ECB_1.default(17, 115)), new ECBlocks_1.default(28, new ECB_1.default(10, 46), new ECB_1.default(23, 47)), new ECBlocks_1.default(30, new ECB_1.default(10, 24), new ECB_1.default(35, 25)), new ECBlocks_1.default(30, new ECB_1.default(19, 15), new ECB_1.default(35, 16))),
    new Version(33, Int32Array.from([6, 30, 58, 86, 114, 142]), new ECBlocks_1.default(30, new ECB_1.default(17, 115), new ECB_1.default(1, 116)), new ECBlocks_1.default(28, new ECB_1.default(14, 46), new ECB_1.default(21, 47)), new ECBlocks_1.default(30, new ECB_1.default(29, 24), new ECB_1.default(19, 25)), new ECBlocks_1.default(30, new ECB_1.default(11, 15), new ECB_1.default(46, 16))),
    new Version(34, Int32Array.from([6, 34, 62, 90, 118, 146]), new ECBlocks_1.default(30, new ECB_1.default(13, 115), new ECB_1.default(6, 116)), new ECBlocks_1.default(28, new ECB_1.default(14, 46), new ECB_1.default(23, 47)), new ECBlocks_1.default(30, new ECB_1.default(44, 24), new ECB_1.default(7, 25)), new ECBlocks_1.default(30, new ECB_1.default(59, 16), new ECB_1.default(1, 17))),
    new Version(35, Int32Array.from([6, 30, 54, 78, 102, 126, 150]), new ECBlocks_1.default(30, new ECB_1.default(12, 121), new ECB_1.default(7, 122)), new ECBlocks_1.default(28, new ECB_1.default(12, 47), new ECB_1.default(26, 48)), new ECBlocks_1.default(30, new ECB_1.default(39, 24), new ECB_1.default(14, 25)), new ECBlocks_1.default(30, new ECB_1.default(22, 15), new ECB_1.default(41, 16))),
    new Version(36, Int32Array.from([6, 24, 50, 76, 102, 128, 154]), new ECBlocks_1.default(30, new ECB_1.default(6, 121), new ECB_1.default(14, 122)), new ECBlocks_1.default(28, new ECB_1.default(6, 47), new ECB_1.default(34, 48)), new ECBlocks_1.default(30, new ECB_1.default(46, 24), new ECB_1.default(10, 25)), new ECBlocks_1.default(30, new ECB_1.default(2, 15), new ECB_1.default(64, 16))),
    new Version(37, Int32Array.from([6, 28, 54, 80, 106, 132, 158]), new ECBlocks_1.default(30, new ECB_1.default(17, 122), new ECB_1.default(4, 123)), new ECBlocks_1.default(28, new ECB_1.default(29, 46), new ECB_1.default(14, 47)), new ECBlocks_1.default(30, new ECB_1.default(49, 24), new ECB_1.default(10, 25)), new ECBlocks_1.default(30, new ECB_1.default(24, 15), new ECB_1.default(46, 16))),
    new Version(38, Int32Array.from([6, 32, 58, 84, 110, 136, 162]), new ECBlocks_1.default(30, new ECB_1.default(4, 122), new ECB_1.default(18, 123)), new ECBlocks_1.default(28, new ECB_1.default(13, 46), new ECB_1.default(32, 47)), new ECBlocks_1.default(30, new ECB_1.default(48, 24), new ECB_1.default(14, 25)), new ECBlocks_1.default(30, new ECB_1.default(42, 15), new ECB_1.default(32, 16))),
    new Version(39, Int32Array.from([6, 26, 54, 82, 110, 138, 166]), new ECBlocks_1.default(30, new ECB_1.default(20, 117), new ECB_1.default(4, 118)), new ECBlocks_1.default(28, new ECB_1.default(40, 47), new ECB_1.default(7, 48)), new ECBlocks_1.default(30, new ECB_1.default(43, 24), new ECB_1.default(22, 25)), new ECBlocks_1.default(30, new ECB_1.default(10, 15), new ECB_1.default(67, 16))),
    new Version(40, Int32Array.from([6, 30, 58, 86, 114, 142, 170]), new ECBlocks_1.default(30, new ECB_1.default(19, 118), new ECB_1.default(6, 119)), new ECBlocks_1.default(28, new ECB_1.default(18, 47), new ECB_1.default(31, 48)), new ECBlocks_1.default(30, new ECB_1.default(34, 24), new ECB_1.default(34, 25)), new ECBlocks_1.default(30, new ECB_1.default(20, 15), new ECB_1.default(61, 16)))
];
exports.default = Version;
//# sourceMappingURL=Version.js.map