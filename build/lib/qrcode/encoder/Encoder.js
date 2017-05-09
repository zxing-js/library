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
var EncodeHintType_1 = require("./../../EncodeHintType");
var BitArray_1 = require("./../../common/BitArray");
var CharacterSetECI_1 = require("./../../common/CharacterSetECI");
var GenericGF_1 = require("./../../common/reedsolomon/GenericGF");
var ReedSolomonEncoder_1 = require("./../../common/reedsolomon/ReedSolomonEncoder");
var Mode_1 = require("./../decoder/Mode");
var Version_1 = require("./../decoder/Version");
var MaskUtil_1 = require("./MaskUtil");
var ByteMatrix_1 = require("./ByteMatrix");
var QRCode_1 = require("./QRCode");
var Exception_1 = require("./../../Exception");
var MatrixUtil_1 = require("./MatrixUtil");
var StringEncoding_1 = require("./../../util/StringEncoding");
var BlockPair_1 = require("./BlockPair");
/*import java.io.UnsupportedEncodingException;*/
/*import java.util.ArrayList;*/
/*import java.util.Collection;*/
/*import java.util.Map;*/
/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
var Encoder = (function () {
    function Encoder() {
    }
    // The mask penalty calculation is complicated.  See Table 21 of JISX0510:2004 (p.45) for details.
    // Basically it applies four rules and summate all penalties.
    Encoder.calculateMaskPenalty = function (matrix) {
        return MaskUtil_1.default.applyMaskPenaltyRule1(matrix)
            + MaskUtil_1.default.applyMaskPenaltyRule2(matrix)
            + MaskUtil_1.default.applyMaskPenaltyRule3(matrix)
            + MaskUtil_1.default.applyMaskPenaltyRule4(matrix);
    };
    /**
     * @param content text to encode
     * @param ecLevel error correction level to use
     * @return {@link QRCode} representing the encoded QR code
     * @throws WriterException if encoding can't succeed, because of for example invalid content
     *   or configuration
     */
    // public static encode(content: string, ecLevel: ErrorCorrectionLevel): QRCode /*throws WriterException*/ {
    //   return encode(content, ecLevel, null)
    // }
    Encoder.encode = function (content, ecLevel, hints) {
        // Determine what character encoding has been specified by the caller, if any
        var encoding = Encoder.DEFAULT_BYTE_MODE_ENCODING;
        var hasEncodingHint = (hints !== null && hints !== undefined) && undefined !== hints.get(EncodeHintType_1.default.CHARACTER_SET);
        if (hasEncodingHint) {
            encoding = hints.get(EncodeHintType_1.default.CHARACTER_SET).toString();
        }
        // Pick an encoding mode appropriate for the content. Note that this will not attempt to use
        // multiple modes / segments even if that were more efficient. Twould be nice.
        var mode = this.chooseMode(content, encoding);
        // This will store the header information, like mode and
        // length, as well as "header" segments like an ECI segment.
        var headerBits = new BitArray_1.default();
        // Append ECI segment if applicable
        if (mode == Mode_1.default.BYTE && (hasEncodingHint || Encoder.DEFAULT_BYTE_MODE_ENCODING !== encoding)) {
            var eci = CharacterSetECI_1.default.getCharacterSetECIByName(encoding);
            if (eci !== null) {
                this.appendECI(eci, headerBits);
            }
        }
        // (With ECI in place,) Write the mode marker
        this.appendModeInfo(mode, headerBits);
        // Collect data within the main segment, separately, to count its size if needed. Don't add it to
        // main payload yet.
        var dataBits = new BitArray_1.default();
        this.appendBytes(content, mode, dataBits, encoding);
        var version;
        if (hints !== null && hints !== undefined && undefined !== hints.get(EncodeHintType_1.default.QR_VERSION)) {
            var versionNumber = Number.parseInt(hints.get(EncodeHintType_1.default.QR_VERSION).toString(), 10);
            version = Version_1.default.getVersionForNumber(versionNumber);
            var bitsNeeded = this.calculateBitsNeeded(mode, headerBits, dataBits, version);
            if (!this.willFit(bitsNeeded, version, ecLevel)) {
                throw new Exception_1.default("WriterException", "Data too big for requested version");
            }
        }
        else {
            version = this.recommendVersion(ecLevel, mode, headerBits, dataBits);
        }
        var headerAndDataBits = new BitArray_1.default();
        headerAndDataBits.appendBitArray(headerBits);
        // Find "length" of main segment and write it
        var numLetters = mode == Mode_1.default.BYTE ? dataBits.getSizeInBytes() : content.length;
        this.appendLengthInfo(numLetters, version, mode, headerAndDataBits);
        // Put data together into the overall payload
        headerAndDataBits.appendBitArray(dataBits);
        var ecBlocks = version.getECBlocksForLevel(ecLevel);
        var numDataBytes = version.getTotalCodewords() - ecBlocks.getTotalECCodewords();
        // Terminate the bits properly.
        this.terminateBits(numDataBytes, headerAndDataBits);
        // Interleave data bits with error correction code.
        var finalBits = this.interleaveWithECBytes(headerAndDataBits, version.getTotalCodewords(), numDataBytes, ecBlocks.getNumBlocks());
        var qrCode = new QRCode_1.default();
        qrCode.setECLevel(ecLevel);
        qrCode.setMode(mode);
        qrCode.setVersion(version);
        //  Choose the mask pattern and set to "qrCode".
        var dimension = version.getDimensionForVersion();
        var matrix = new ByteMatrix_1.default(dimension, dimension);
        var maskPattern = this.chooseMaskPattern(finalBits, ecLevel, version, matrix);
        qrCode.setMaskPattern(maskPattern);
        // Build the matrix and set it to "qrCode".
        MatrixUtil_1.default.buildMatrix(finalBits, ecLevel, version, maskPattern, matrix);
        qrCode.setMatrix(matrix);
        return qrCode;
    };
    /**
     * Decides the smallest version of QR code that will contain all of the provided data.
     *
     * @throws WriterException if the data cannot fit in any version
     */
    Encoder.recommendVersion = function (ecLevel, mode, headerBits, dataBits) {
        // Hard part: need to know version to know how many bits length takes. But need to know how many
        // bits it takes to know version. First we take a guess at version by assuming version will be
        // the minimum, 1:
        var provisionalBitsNeeded = this.calculateBitsNeeded(mode, headerBits, dataBits, Version_1.default.getVersionForNumber(1));
        var provisionalVersion = this.chooseVersion(provisionalBitsNeeded, ecLevel);
        // Use that guess to calculate the right version. I am still not sure this works in 100% of cases.
        var bitsNeeded = this.calculateBitsNeeded(mode, headerBits, dataBits, provisionalVersion);
        return this.chooseVersion(bitsNeeded, ecLevel);
    };
    Encoder.calculateBitsNeeded = function (mode, headerBits, dataBits, version) {
        return headerBits.getSize() + mode.getCharacterCountBits(version) + dataBits.getSize();
    };
    /**
     * @return the code point of the table used in alphanumeric mode or
     *  -1 if there is no corresponding code in the table.
     */
    Encoder.getAlphanumericCode = function (code /*int*/) {
        if (code < Encoder.ALPHANUMERIC_TABLE.length) {
            return Encoder.ALPHANUMERIC_TABLE[code];
        }
        return -1;
    };
    // public static chooseMode(content: string): Mode {
    //   return chooseMode(content, null);
    // }
    /**
     * Choose the best mode by examining the content. Note that 'encoding' is used as a hint;
     * if it is Shift_JIS, and the input is only double-byte Kanji, then we return {@link Mode#KANJI}.
     */
    Encoder.chooseMode = function (content, encoding) {
        if ("Shift_JIS" === encoding && this.isOnlyDoubleByteKanji(content)) {
            // Choose Kanji mode if all input are double-byte characters
            return Mode_1.default.KANJI;
        }
        var hasNumeric = false;
        var hasAlphanumeric = false;
        for (var i = 0, length = content.length; i < length; ++i) {
            var c = content.charAt(i);
            if (StringEncoding_1.default.isDigit(c)) {
                hasNumeric = true;
            }
            else if (this.getAlphanumericCode(c.charCodeAt(0)) != -1) {
                hasAlphanumeric = true;
            }
            else {
                return Mode_1.default.BYTE;
            }
        }
        if (hasAlphanumeric) {
            return Mode_1.default.ALPHANUMERIC;
        }
        if (hasNumeric) {
            return Mode_1.default.NUMERIC;
        }
        return Mode_1.default.BYTE;
    };
    Encoder.isOnlyDoubleByteKanji = function (content) {
        var bytes;
        try {
            bytes = StringEncoding_1.default.encode(content, "Shift_JIS"); //content.getBytes("Shift_JIS")
        }
        catch (ignored /*: UnsupportedEncodingException*/) {
            return false;
        }
        var length = bytes.length;
        if (length % 2 != 0) {
            return false;
        }
        for (var i = 0; i < length; i += 2) {
            var byte1 = bytes[i] & 0xFF;
            if ((byte1 < 0x81 || byte1 > 0x9F) && (byte1 < 0xE0 || byte1 > 0xEB)) {
                return false;
            }
        }
        return true;
    };
    Encoder.chooseMaskPattern = function (bits, ecLevel, version, matrix) {
        var minPenalty = Number.MAX_SAFE_INTEGER; // Lower penalty is better.
        var bestMaskPattern = -1;
        // We try all mask patterns to choose the best one.
        for (var maskPattern = 0; maskPattern < QRCode_1.default.NUM_MASK_PATTERNS; maskPattern++) {
            MatrixUtil_1.default.buildMatrix(bits, ecLevel, version, maskPattern, matrix);
            var penalty = this.calculateMaskPenalty(matrix);
            if (penalty < minPenalty) {
                minPenalty = penalty;
                bestMaskPattern = maskPattern;
            }
        }
        return bestMaskPattern;
    };
    Encoder.chooseVersion = function (numInputBits /*int*/, ecLevel) {
        for (var versionNum = 1; versionNum <= 40; versionNum++) {
            var version = Version_1.default.getVersionForNumber(versionNum);
            if (Encoder.willFit(numInputBits, version, ecLevel)) {
                return version;
            }
        }
        throw new Exception_1.default("WriterException", "Data too big");
    };
    /**
     * @return true if the number of input bits will fit in a code with the specified version and
     * error correction level.
     */
    Encoder.willFit = function (numInputBits /*int*/, version, ecLevel) {
        // In the following comments, we use numbers of Version 7-H.
        // numBytes = 196
        var numBytes = version.getTotalCodewords();
        // getNumECBytes = 130
        var ecBlocks = version.getECBlocksForLevel(ecLevel);
        var numEcBytes = ecBlocks.getTotalECCodewords();
        // getNumDataBytes = 196 - 130 = 66
        var numDataBytes = numBytes - numEcBytes;
        var totalInputBytes = (numInputBits + 7) / 8;
        return numDataBytes >= totalInputBytes;
    };
    /**
     * Terminate bits as described in 8.4.8 and 8.4.9 of JISX0510:2004 (p.24).
     */
    Encoder.terminateBits = function (numDataBytes /*int*/, bits) {
        var capacity = numDataBytes * 8;
        if (bits.getSize() > capacity) {
            throw new Exception_1.default("WriterException", "data bits cannot fit in the QR Code" + bits.getSize() + " > " +
                capacity);
        }
        for (var i = 0; i < 4 && bits.getSize() < capacity; ++i) {
            bits.appendBit(false);
        }
        // Append termination bits. See 8.4.8 of JISX0510:2004 (p.24) for details.
        // If the last byte isn't 8-bit aligned, we'll add padding bits.
        var numBitsInLastByte = bits.getSize() & 0x07;
        if (numBitsInLastByte > 0) {
            for (var i = numBitsInLastByte; i < 8; i++) {
                bits.appendBit(false);
            }
        }
        // If we have more space, we'll fill the space with padding patterns defined in 8.4.9 (p.24).
        var numPaddingBytes = numDataBytes - bits.getSizeInBytes();
        for (var i = 0; i < numPaddingBytes; ++i) {
            bits.appendBits((i & 0x01) == 0 ? 0xEC : 0x11, 8);
        }
        if (bits.getSize() != capacity) {
            throw new Exception_1.default("WriterException", "Bits size does not equal capacity");
        }
    };
    /**
     * Get number of data bytes and number of error correction bytes for block id "blockID". Store
     * the result in "numDataBytesInBlock", and "numECBytesInBlock". See table 12 in 8.5.1 of
     * JISX0510:2004 (p.30)
     */
    Encoder.getNumDataBytesAndNumECBytesForBlockID = function (numTotalBytes /*int*/, numDataBytes /*int*/, numRSBlocks /*int*/, blockID /*int*/, numDataBytesInBlock, numECBytesInBlock) {
        if (blockID >= numRSBlocks) {
            throw new Exception_1.default("WriterException", "Block ID too large");
        }
        // numRsBlocksInGroup2 = 196 % 5 = 1
        var numRsBlocksInGroup2 = numTotalBytes % numRSBlocks;
        // numRsBlocksInGroup1 = 5 - 1 = 4
        var numRsBlocksInGroup1 = numRSBlocks - numRsBlocksInGroup2;
        // numTotalBytesInGroup1 = 196 / 5 = 39
        var numTotalBytesInGroup1 = numTotalBytes / numRSBlocks;
        // numTotalBytesInGroup2 = 39 + 1 = 40
        var numTotalBytesInGroup2 = numTotalBytesInGroup1 + 1;
        // numDataBytesInGroup1 = 66 / 5 = 13
        var numDataBytesInGroup1 = numDataBytes / numRSBlocks;
        // numDataBytesInGroup2 = 13 + 1 = 14
        var numDataBytesInGroup2 = numDataBytesInGroup1 + 1;
        // numEcBytesInGroup1 = 39 - 13 = 26
        var numEcBytesInGroup1 = numTotalBytesInGroup1 - numDataBytesInGroup1;
        // numEcBytesInGroup2 = 40 - 14 = 26
        var numEcBytesInGroup2 = numTotalBytesInGroup2 - numDataBytesInGroup2;
        // Sanity checks.
        // 26 = 26
        if (numEcBytesInGroup1 != numEcBytesInGroup2) {
            throw new Exception_1.default("WriterException", "EC bytes mismatch");
        }
        // 5 = 4 + 1.
        if (numRSBlocks != numRsBlocksInGroup1 + numRsBlocksInGroup2) {
            throw new Exception_1.default("WriterException", "RS blocks mismatch");
        }
        // 196 = (13 + 26) * 4 + (14 + 26) * 1
        if (numTotalBytes !=
            ((numDataBytesInGroup1 + numEcBytesInGroup1) *
                numRsBlocksInGroup1) +
                ((numDataBytesInGroup2 + numEcBytesInGroup2) *
                    numRsBlocksInGroup2)) {
            throw new Exception_1.default("WriterException", "Total bytes mismatch");
        }
        if (blockID < numRsBlocksInGroup1) {
            numDataBytesInBlock[0] = numDataBytesInGroup1;
            numECBytesInBlock[0] = numEcBytesInGroup1;
        }
        else {
            numDataBytesInBlock[0] = numDataBytesInGroup2;
            numECBytesInBlock[0] = numEcBytesInGroup2;
        }
    };
    /**
     * Interleave "bits" with corresponding error correction bytes. On success, store the result in
     * "result". The interleave rule is complicated. See 8.6 of JISX0510:2004 (p.37) for details.
     */
    Encoder.interleaveWithECBytes = function (bits, numTotalBytes /*int*/, numDataBytes /*int*/, numRSBlocks /*int*/) {
        // "bits" must have "getNumDataBytes" bytes of data.
        if (bits.getSizeInBytes() != numDataBytes) {
            throw new Exception_1.default("WriterException", "Number of bits and data bytes does not match");
        }
        // Step 1.  Divide data bytes into blocks and generate error correction bytes for them. We'll
        // store the divided data bytes blocks and error correction bytes blocks into "blocks".
        var dataBytesOffset = 0;
        var maxNumDataBytes = 0;
        var maxNumEcBytes = 0;
        // Since, we know the number of reedsolmon blocks, we can initialize the vector with the number.
        var blocks = new Array(); //new Array<BlockPair>(numRSBlocks)
        for (var i = 0; i < numRSBlocks; ++i) {
            var numDataBytesInBlock = new Int32Array(1);
            var numEcBytesInBlock = new Int32Array(1);
            Encoder.getNumDataBytesAndNumECBytesForBlockID(numTotalBytes, numDataBytes, numRSBlocks, i, numDataBytesInBlock, numEcBytesInBlock);
            var size = numDataBytesInBlock[0];
            var dataBytes = new Uint8Array(size);
            bits.toBytes(8 * dataBytesOffset, dataBytes, 0, size);
            var ecBytes = Encoder.generateECBytes(dataBytes, numEcBytesInBlock[0]);
            blocks.push(new BlockPair_1.default(dataBytes, ecBytes));
            maxNumDataBytes = Math.max(maxNumDataBytes, size);
            maxNumEcBytes = Math.max(maxNumEcBytes, ecBytes.length);
            dataBytesOffset += numDataBytesInBlock[0];
        }
        if (numDataBytes != dataBytesOffset) {
            throw new Exception_1.default("WriterException", "Data bytes does not match offset");
        }
        var result = new BitArray_1.default();
        // First, place data blocks.
        for (var i = 0; i < maxNumDataBytes; ++i) {
            for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
                var block = blocks_1[_i];
                var dataBytes = block.getDataBytes();
                if (i < dataBytes.length) {
                    result.appendBits(dataBytes[i], 8);
                }
            }
        }
        // Then, place error correction blocks.
        for (var i = 0; i < maxNumEcBytes; ++i) {
            for (var _a = 0, blocks_2 = blocks; _a < blocks_2.length; _a++) {
                var block = blocks_2[_a];
                var ecBytes = block.getErrorCorrectionBytes();
                if (i < ecBytes.length) {
                    result.appendBits(ecBytes[i], 8);
                }
            }
        }
        if (numTotalBytes != result.getSizeInBytes()) {
            throw new Exception_1.default("WriterException", "Interleaving error: " + numTotalBytes + " and " +
                result.getSizeInBytes() + " differ.");
        }
        return result;
    };
    Encoder.generateECBytes = function (dataBytes, numEcBytesInBlock /*int*/) {
        var numDataBytes = dataBytes.length;
        var toEncode = new Int32Array(numDataBytes + numEcBytesInBlock); //int[numDataBytes + numEcBytesInBlock]
        for (var i = 0; i < numDataBytes; i++) {
            toEncode[i] = dataBytes[i] & 0xFF;
        }
        new ReedSolomonEncoder_1.default(GenericGF_1.default.QR_CODE_FIELD_256).encode(toEncode, numEcBytesInBlock);
        var ecBytes = new Uint8Array(numEcBytesInBlock);
        for (var i = 0; i < numEcBytesInBlock; i++) {
            ecBytes[i] = toEncode[numDataBytes + i];
        }
        return ecBytes;
    };
    /**
     * Append mode info. On success, store the result in "bits".
     */
    Encoder.appendModeInfo = function (mode, bits) {
        bits.appendBits(mode.getBits(), 4);
    };
    /**
     * Append length info. On success, store the result in "bits".
     */
    Encoder.appendLengthInfo = function (numLetters /*int*/, version, mode, bits) {
        var numBits = mode.getCharacterCountBits(version);
        if (numLetters >= (1 << numBits)) {
            throw new Exception_1.default("WriterException", numLetters + " is bigger than " + ((1 << numBits) - 1));
        }
        bits.appendBits(numLetters, numBits);
    };
    /**
     * Append "bytes" in "mode" mode (encoding) into "bits". On success, store the result in "bits".
     */
    Encoder.appendBytes = function (content, mode, bits, encoding) {
        switch (mode) {
            case Mode_1.default.NUMERIC:
                Encoder.appendNumericBytes(content, bits);
                break;
            case Mode_1.default.ALPHANUMERIC:
                Encoder.appendAlphanumericBytes(content, bits);
                break;
            case Mode_1.default.BYTE:
                Encoder.append8BitBytes(content, bits, encoding);
                break;
            case Mode_1.default.KANJI:
                Encoder.appendKanjiBytes(content, bits);
                break;
            default:
                throw new Exception_1.default("WriterException", "Invalid mode: " + mode);
        }
    };
    Encoder.appendNumericBytes = function (content, bits) {
        var length = content.length;
        var i = 0;
        while (i < length) {
            var num1 = StringEncoding_1.default.getDigit(content.charAt(i));
            if (i + 2 < length) {
                // Encode three numeric letters in ten bits.
                var num2 = StringEncoding_1.default.getDigit(content.charAt(i + 1));
                var num3 = StringEncoding_1.default.getDigit(content.charAt(i + 2));
                bits.appendBits(num1 * 100 + num2 * 10 + num3, 10);
                i += 3;
            }
            else if (i + 1 < length) {
                // Encode two numeric letters in seven bits.
                var num2 = StringEncoding_1.default.getDigit(content.charAt(i + 1));
                bits.appendBits(num1 * 10 + num2, 7);
                i += 2;
            }
            else {
                // Encode one numeric letter in four bits.
                bits.appendBits(num1, 4);
                i++;
            }
        }
    };
    Encoder.appendAlphanumericBytes = function (content, bits) {
        var length = content.length;
        var i = 0;
        while (i < length) {
            var code1 = Encoder.getAlphanumericCode(content.charCodeAt(i));
            if (code1 == -1) {
                throw new Exception_1.default("WriterException");
            }
            if (i + 1 < length) {
                var code2 = Encoder.getAlphanumericCode(content.charCodeAt(i + 1));
                if (code2 == -1) {
                    throw new Exception_1.default("WriterException");
                }
                // Encode two alphanumeric letters in 11 bits.
                bits.appendBits(code1 * 45 + code2, 11);
                i += 2;
            }
            else {
                // Encode one alphanumeric letter in six bits.
                bits.appendBits(code1, 6);
                i++;
            }
        }
    };
    Encoder.append8BitBytes = function (content, bits, encoding) {
        var bytes;
        try {
            bytes = StringEncoding_1.default.encode(content, encoding);
        }
        catch (uee /*: UnsupportedEncodingException*/) {
            throw new Exception_1.default("WriterException", uee);
        }
        for (var i = 0, length = bytes.length; i != length; i++) {
            var b = bytes[i];
            bits.appendBits(b, 8);
        }
    };
    Encoder.appendKanjiBytes = function (content, bits) {
        var bytes;
        try {
            bytes = StringEncoding_1.default.encode(content, "Shift_JIS");
        }
        catch (uee /*: UnsupportedEncodingException*/) {
            throw new Exception_1.default("WriterException", uee);
        }
        var length = bytes.length;
        for (var i = 0; i < length; i += 2) {
            var byte1 = bytes[i] & 0xFF;
            var byte2 = bytes[i + 1] & 0xFF;
            var code = (byte1 << 8) | byte2;
            var subtracted = -1;
            if (code >= 0x8140 && code <= 0x9ffc) {
                subtracted = code - 0x8140;
            }
            else if (code >= 0xe040 && code <= 0xebbf) {
                subtracted = code - 0xc140;
            }
            if (subtracted == -1) {
                throw new Exception_1.default("WriterException", "Invalid byte sequence");
            }
            var encoded = ((subtracted >> 8) * 0xc0) + (subtracted & 0xff);
            bits.appendBits(encoded, 13);
        }
    };
    Encoder.appendECI = function (eci, bits) {
        bits.appendBits(Mode_1.default.ECI.getBits(), 4);
        // This is correct for values up to 127, which is all we need now.
        bits.appendBits(eci.getValue(), 8);
    };
    return Encoder;
}());
// The original table is defined in the table 5 of JISX0510:2004 (p.19).
Encoder.ALPHANUMERIC_TABLE = Int32Array.from([
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    36, -1, -1, -1, 37, 38, -1, -1, -1, -1, 39, 40, -1, 41, 42, 43,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 44, -1, -1, -1, -1, -1,
    -1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1,
]);
Encoder.DEFAULT_BYTE_MODE_ENCODING = "ISO-8859-1";
exports.default = Encoder;
//# sourceMappingURL=Encoder.js.map