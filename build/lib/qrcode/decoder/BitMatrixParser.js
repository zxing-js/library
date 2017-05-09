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
var Version_1 = require("./Version");
var FormatInformation_1 = require("./FormatInformation");
var Exception_1 = require("./../../Exception");
var DataMask_1 = require("./DataMask");
/**
 * @author Sean Owen
 */
var BitMatrixParser = (function () {
    /**
     * @param bitMatrix {@link BitMatrix} to parse
     * @throws FormatException if dimension is not >= 21 and 1 mod 4
     */
    function BitMatrixParser(bitMatrix) {
        var dimension = bitMatrix.getHeight();
        if (dimension < 21 || (dimension & 0x03) != 1) {
            throw new Exception_1.default("FormatException");
        }
        this.bitMatrix = bitMatrix;
    }
    /**
     * <p>Reads format information from one of its two locations within the QR Code.</p>
     *
     * @return {@link FormatInformation} encapsulating the QR Code's format info
     * @throws FormatException if both format information locations cannot be parsed as
     * the valid encoding of format information
     */
    BitMatrixParser.prototype.readFormatInformation = function () {
        if (this.parsedFormatInfo !== null) {
            return this.parsedFormatInfo;
        }
        // Read top-left format info bits
        var formatInfoBits1 = 0;
        for (var i = 0; i < 6; i++) {
            formatInfoBits1 = this.copyBit(i, 8, formatInfoBits1);
        }
        // .. and skip a bit in the timing pattern ...
        formatInfoBits1 = this.copyBit(7, 8, formatInfoBits1);
        formatInfoBits1 = this.copyBit(8, 8, formatInfoBits1);
        formatInfoBits1 = this.copyBit(8, 7, formatInfoBits1);
        // .. and skip a bit in the timing pattern ...
        for (var j = 5; j >= 0; j--) {
            formatInfoBits1 = this.copyBit(8, j, formatInfoBits1);
        }
        // Read the top-right/bottom-left pattern too
        var dimension = this.bitMatrix.getHeight();
        var formatInfoBits2 = 0;
        var jMin = dimension - 7;
        for (var j = dimension - 1; j >= jMin; j--) {
            formatInfoBits2 = this.copyBit(8, j, formatInfoBits2);
        }
        for (var i = dimension - 8; i < dimension; i++) {
            formatInfoBits2 = this.copyBit(i, 8, formatInfoBits2);
        }
        this.parsedFormatInfo = FormatInformation_1.default.decodeFormatInformation(formatInfoBits1, formatInfoBits2);
        if (this.parsedFormatInfo !== null) {
            return this.parsedFormatInfo;
        }
        throw new Exception_1.default("FormatException");
    };
    /**
     * <p>Reads version information from one of its two locations within the QR Code.</p>
     *
     * @return {@link Version} encapsulating the QR Code's version
     * @throws FormatException if both version information locations cannot be parsed as
     * the valid encoding of version information
     */
    BitMatrixParser.prototype.readVersion = function () {
        if (this.parsedVersion !== null) {
            return this.parsedVersion;
        }
        var dimension = this.bitMatrix.getHeight();
        var provisionalVersion = (dimension - 17) / 4;
        if (provisionalVersion <= 6) {
            return Version_1.default.getVersionForNumber(provisionalVersion);
        }
        // Read top-right version info: 3 wide by 6 tall
        var versionBits = 0;
        var ijMin = dimension - 11;
        for (var j = 5; j >= 0; j--) {
            for (var i = dimension - 9; i >= ijMin; i--) {
                versionBits = this.copyBit(i, j, versionBits);
            }
        }
        var theParsedVersion = Version_1.default.decodeVersionInformation(versionBits);
        if (theParsedVersion !== null && theParsedVersion.getDimensionForVersion() == dimension) {
            this.parsedVersion = theParsedVersion;
            return theParsedVersion;
        }
        // Hmm, failed. Try bottom left: 6 wide by 3 tall
        versionBits = 0;
        for (var i = 5; i >= 0; i--) {
            for (var j = dimension - 9; j >= ijMin; j--) {
                versionBits = this.copyBit(i, j, versionBits);
            }
        }
        theParsedVersion = Version_1.default.decodeVersionInformation(versionBits);
        if (theParsedVersion !== null && theParsedVersion.getDimensionForVersion() == dimension) {
            this.parsedVersion = theParsedVersion;
            return theParsedVersion;
        }
        throw new Exception_1.default("FormatException");
    };
    BitMatrixParser.prototype.copyBit = function (i /*int*/, j /*int*/, versionBits /*int*/) {
        var bit = this.isMirror ? this.bitMatrix.get(j, i) : this.bitMatrix.get(i, j);
        return bit ? (versionBits << 1) | 0x1 : versionBits << 1;
    };
    /**
     * <p>Reads the bits in the {@link BitMatrix} representing the finder pattern in the
     * correct order in order to reconstruct the codewords bytes contained within the
     * QR Code.</p>
     *
     * @return bytes encoded within the QR Code
     * @throws FormatException if the exact number of bytes expected is not read
     */
    BitMatrixParser.prototype.readCodewords = function () {
        var formatInfo = this.readFormatInformation();
        var version = this.readVersion();
        // Get the data mask for the format used in this QR Code. This will exclude
        // some bits from reading as we wind through the bit matrix.
        var dataMask = DataMask_1.default.values[formatInfo.getDataMask()];
        var dimension = this.bitMatrix.getHeight();
        dataMask.unmaskBitMatrix(this.bitMatrix, dimension);
        var functionPattern = version.buildFunctionPattern();
        var readingUp = true;
        var result = new Uint8Array(version.getTotalCodewords());
        var resultOffset = 0;
        var currentByte = 0;
        var bitsRead = 0;
        // Read columns in pairs, from right to left
        for (var j = dimension - 1; j > 0; j -= 2) {
            if (j == 6) {
                // Skip whole column with vertical alignment pattern
                // saves time and makes the other code proceed more cleanly
                j--;
            }
            // Read alternatingly from bottom to top then top to bottom
            for (var count = 0; count < dimension; count++) {
                var i = readingUp ? dimension - 1 - count : count;
                for (var col = 0; col < 2; col++) {
                    // Ignore bits covered by the function pattern
                    if (!functionPattern.get(j - col, i)) {
                        // Read a bit
                        bitsRead++;
                        currentByte <<= 1;
                        if (this.bitMatrix.get(j - col, i)) {
                            currentByte |= 1;
                        }
                        // If we've made a whole byte, save it off
                        if (bitsRead == 8) {
                            result[resultOffset++] = currentByte;
                            bitsRead = 0;
                            currentByte = 0;
                        }
                    }
                }
            }
            readingUp = !readingUp; //readingUp ^= true; // readingUp = !readingUp; // switch directions
        }
        if (resultOffset != version.getTotalCodewords()) {
            throw new Exception_1.default("FormatException");
        }
        return result;
    };
    /**
     * Revert the mask removal done while reading the code words. The bit matrix should revert to its original state.
     */
    BitMatrixParser.prototype.remask = function () {
        if (this.parsedFormatInfo === null) {
            return; // We have no format information, and have no data mask
        }
        var dataMask = DataMask_1.default.values[this.parsedFormatInfo.getDataMask()];
        var dimension = this.bitMatrix.getHeight();
        dataMask.unmaskBitMatrix(this.bitMatrix, dimension);
    };
    /**
     * Prepare the parser for a mirrored operation.
     * This flag has effect only on the {@link #readFormatInformation()} and the
     * {@link #readVersion()}. Before proceeding with {@link #readCodewords()} the
     * {@link #mirror()} method should be called.
     *
     * @param mirror Whether to read version and format information mirrored.
     */
    BitMatrixParser.prototype.setMirror = function (isMirror) {
        this.parsedVersion = null;
        this.parsedFormatInfo = null;
        this.isMirror = isMirror;
    };
    /** Mirror the bit matrix in order to attempt a second reading. */
    BitMatrixParser.prototype.mirror = function () {
        var bitMatrix = this.bitMatrix;
        for (var x = 0; x < bitMatrix.getWidth(); x++) {
            for (var y = x + 1; y < bitMatrix.getHeight(); y++) {
                if (bitMatrix.get(x, y) !== bitMatrix.get(y, x)) {
                    bitMatrix.flip(y, x);
                    bitMatrix.flip(x, y);
                }
            }
        }
    };
    return BitMatrixParser;
}());
exports.default = BitMatrixParser;
//# sourceMappingURL=BitMatrixParser.js.map