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
var BitSource_1 = require("./../../common/BitSource");
var CharacterSetECI_1 = require("./../../common/CharacterSetECI");
var DecoderResult_1 = require("./../../common/DecoderResult");
var StringUtils_1 = require("./../../common/StringUtils");
var Mode_1 = require("./Mode");
var Exception_1 = require("./../../Exception");
var StringBuilder_1 = require("./../../util/StringBuilder");
var StringEncoding_1 = require("./../../util/StringEncoding");
/*import java.io.UnsupportedEncodingException;*/
/*import java.util.ArrayList;*/
/*import java.util.Collection;*/
/*import java.util.List;*/
/*import java.util.Map;*/
/**
 * <p>QR Codes can encode text as bits in one of several modes, and can use multiple modes
 * in one QR Code. This class decodes the bits back into text.</p>
 *
 * <p>See ISO 18004:2006, 6.4.3 - 6.4.7</p>
 *
 * @author Sean Owen
 */
var DecodedBitStreamParser = (function () {
    function DecodedBitStreamParser() {
    }
    DecodedBitStreamParser.decode = function (bytes, version, ecLevel, hints) {
        var bits = new BitSource_1.default(bytes);
        var result = new StringBuilder_1.default();
        var byteSegments = new Array(); //1
        // TYPESCRIPTPORT: I do not use constructor with size 1 as in original Java means capacity and the array length is checked below
        var symbolSequence = -1;
        var parityData = -1;
        try {
            var currentCharacterSetECI = null;
            var fc1InEffect = false;
            var mode = void 0;
            do {
                // While still another segment to read...
                if (bits.available() < 4) {
                    // OK, assume we're done. Really, a TERMINATOR mode should have been recorded here
                    mode = Mode_1.default.TERMINATOR;
                }
                else {
                    mode = Mode_1.default.forBits(bits.readBits(4)); // mode is encoded by 4 bits
                }
                switch (mode) {
                    case Mode_1.default.TERMINATOR:
                        break;
                    case Mode_1.default.FNC1_FIRST_POSITION:
                    case Mode_1.default.FNC1_SECOND_POSITION:
                        // We do little with FNC1 except alter the parsed result a bit according to the spec
                        fc1InEffect = true;
                        break;
                    case Mode_1.default.STRUCTURED_APPEND:
                        if (bits.available() < 16) {
                            throw new Exception_1.default("FormatException");
                        }
                        // sequence number and parity is added later to the result metadata
                        // Read next 8 bits (symbol sequence #) and 8 bits (data: parity), then continue
                        symbolSequence = bits.readBits(8);
                        parityData = bits.readBits(8);
                        break;
                    case Mode_1.default.ECI:
                        // Count doesn't apply to ECI
                        var value = DecodedBitStreamParser.parseECIValue(bits);
                        currentCharacterSetECI = CharacterSetECI_1.default.getCharacterSetECIByValue(value);
                        if (currentCharacterSetECI === null) {
                            throw new Exception_1.default("FormatException");
                        }
                        break;
                    case Mode_1.default.HANZI:
                        // First handle Hanzi mode which does not start with character count
                        // Chinese mode contains a sub set indicator right after mode indicator
                        var subset = bits.readBits(4);
                        var countHanzi = bits.readBits(mode.getCharacterCountBits(version));
                        if (subset == DecodedBitStreamParser.GB2312_SUBSET) {
                            DecodedBitStreamParser.decodeHanziSegment(bits, result, countHanzi);
                        }
                        break;
                    default:
                        // "Normal" QR code modes:
                        // How many characters will follow, encoded in this mode?
                        var count = bits.readBits(mode.getCharacterCountBits(version));
                        switch (mode) {
                            case Mode_1.default.NUMERIC:
                                DecodedBitStreamParser.decodeNumericSegment(bits, result, count);
                                break;
                            case Mode_1.default.ALPHANUMERIC:
                                DecodedBitStreamParser.decodeAlphanumericSegment(bits, result, count, fc1InEffect);
                                break;
                            case Mode_1.default.BYTE:
                                DecodedBitStreamParser.decodeByteSegment(bits, result, count, currentCharacterSetECI, byteSegments, hints);
                                break;
                            case Mode_1.default.KANJI:
                                DecodedBitStreamParser.decodeKanjiSegment(bits, result, count);
                                break;
                            default:
                                throw new Exception_1.default("FormatException");
                        }
                        break;
                }
            } while (mode !== Mode_1.default.TERMINATOR);
        }
        catch (iae /*: IllegalArgumentException*/) {
            // from readBits() calls
            throw new Exception_1.default("FormatException");
        }
        return new DecoderResult_1.default(bytes, result.toString(), byteSegments.length === 0 ? null : byteSegments, ecLevel == null ? null : ecLevel.toString(), symbolSequence, parityData);
    };
    /**
     * See specification GBT 18284-2000
     */
    DecodedBitStreamParser.decodeHanziSegment = function (bits, result, count /*int*/) {
        // Don't crash trying to read more bits than we have available.
        if (count * 13 > bits.available()) {
            throw new Exception_1.default("FormatException");
        }
        // Each character will require 2 bytes. Read the characters as 2-byte pairs
        // and decode as GB2312 afterwards
        var buffer = new Uint8Array(2 * count);
        var offset = 0;
        while (count > 0) {
            // Each 13 bits encodes a 2-byte character
            var twoBytes = bits.readBits(13);
            var assembledTwoBytes = ((twoBytes / 0x060) << 8) | (twoBytes % 0x060);
            if (assembledTwoBytes < 0x003BF) {
                // In the 0xA1A1 to 0xAAFE range
                assembledTwoBytes += 0x0A1A1;
            }
            else {
                // In the 0xB0A1 to 0xFAFE range
                assembledTwoBytes += 0x0A6A1;
            }
            buffer[offset] = ((assembledTwoBytes >> 8) & 0xFF);
            buffer[offset + 1] = (assembledTwoBytes & 0xFF);
            offset += 2;
            count--;
        }
        try {
            result.append(StringEncoding_1.default.decode(buffer, StringUtils_1.default.GB2312));
            // TYPESCRIPTPORT: TODO: implement GB2312 decode. StringView from MDN could be a starting point
        }
        catch (ignored /*: UnsupportedEncodingException*/) {
            throw new Exception_1.default("FormatException");
        }
    };
    DecodedBitStreamParser.decodeKanjiSegment = function (bits, result, count /*int*/) {
        // Don't crash trying to read more bits than we have available.
        if (count * 13 > bits.available()) {
            throw new Exception_1.default("FormatException");
        }
        // Each character will require 2 bytes. Read the characters as 2-byte pairs
        // and decode as Shift_JIS afterwards
        var buffer = new Uint8Array(2 * count);
        var offset = 0;
        while (count > 0) {
            // Each 13 bits encodes a 2-byte character
            var twoBytes = bits.readBits(13);
            var assembledTwoBytes = ((twoBytes / 0x0C0) << 8) | (twoBytes % 0x0C0);
            if (assembledTwoBytes < 0x01F00) {
                // In the 0x8140 to 0x9FFC range
                assembledTwoBytes += 0x08140;
            }
            else {
                // In the 0xE040 to 0xEBBF range
                assembledTwoBytes += 0x0C140;
            }
            buffer[offset] = (assembledTwoBytes >> 8);
            buffer[offset + 1] = assembledTwoBytes;
            offset += 2;
            count--;
        }
        // Shift_JIS may not be supported in some environments:
        try {
            result.append(StringEncoding_1.default.decode(buffer, StringUtils_1.default.SHIFT_JIS));
            // TYPESCRIPTPORT: TODO: implement SHIFT_JIS decode. StringView from MDN could be a starting point
        }
        catch (ignored /*: UnsupportedEncodingException*/) {
            throw new Exception_1.default("FormatException");
        }
    };
    DecodedBitStreamParser.decodeByteSegment = function (bits, result, count /*int*/, currentCharacterSetECI, byteSegments, hints) {
        // Don't crash trying to read more bits than we have available.
        if (8 * count > bits.available()) {
            throw new Exception_1.default("FormatException");
        }
        var readBytes = new Uint8Array(count);
        for (var i = 0; i < count; i++) {
            readBytes[i] = bits.readBits(8);
        }
        var encoding;
        if (currentCharacterSetECI === null) {
            // The spec isn't clear on this mode; see
            // section 6.4.5: t does not say which encoding to assuming
            // upon decoding. I have seen ISO-8859-1 used as well as
            // Shift_JIS -- without anything like an ECI designator to
            // give a hint.
            encoding = StringUtils_1.default.guessEncoding(readBytes, hints);
        }
        else {
            encoding = currentCharacterSetECI.getName();
        }
        try {
            result.append(StringEncoding_1.default.decode(readBytes, encoding));
        }
        catch (ignored /*: UnsupportedEncodingException*/) {
            throw new Exception_1.default("FormatException");
        }
        byteSegments.push(readBytes);
    };
    DecodedBitStreamParser.toAlphaNumericChar = function (value /*int*/) {
        if (value >= DecodedBitStreamParser.ALPHANUMERIC_CHARS.length) {
            throw new Exception_1.default("FormatException");
        }
        return DecodedBitStreamParser.ALPHANUMERIC_CHARS[value];
    };
    DecodedBitStreamParser.decodeAlphanumericSegment = function (bits, result, count /*int*/, fc1InEffect) {
        // Read two characters at a time
        var start = result.length();
        while (count > 1) {
            if (bits.available() < 11) {
                throw new Exception_1.default("FormatException");
            }
            var nextTwoCharsBits = bits.readBits(11);
            result.append(DecodedBitStreamParser.toAlphaNumericChar(nextTwoCharsBits / 45));
            result.append(DecodedBitStreamParser.toAlphaNumericChar(nextTwoCharsBits % 45));
            count -= 2;
        }
        if (count == 1) {
            // special case: one character left
            if (bits.available() < 6) {
                throw new Exception_1.default("FormatException");
            }
            result.append(DecodedBitStreamParser.toAlphaNumericChar(bits.readBits(6)));
        }
        // See section 6.4.8.1, 6.4.8.2
        if (fc1InEffect) {
            // We need to massage the result a bit if in an FNC1 mode:
            for (var i = start; i < result.length(); i++) {
                if (result.charAt(i) === '%') {
                    if (i < result.length() - 1 && result.charAt(i + 1) === '%') {
                        // %% is rendered as %
                        result.deleteCharAt(i + 1);
                    }
                    else {
                        // In alpha mode, % should be converted to FNC1 separator 0x1D
                        result.setCharAt(i, String.fromCharCode(0x1D));
                    }
                }
            }
        }
    };
    DecodedBitStreamParser.decodeNumericSegment = function (bits, result, count /*int*/) {
        // Read three digits at a time
        while (count >= 3) {
            // Each 10 bits encodes three digits
            if (bits.available() < 10) {
                throw new Exception_1.default("FormatException");
            }
            var threeDigitsBits = bits.readBits(10);
            if (threeDigitsBits >= 1000) {
                throw new Exception_1.default("FormatException");
            }
            result.append(DecodedBitStreamParser.toAlphaNumericChar(threeDigitsBits / 100));
            result.append(DecodedBitStreamParser.toAlphaNumericChar((threeDigitsBits / 10) % 10));
            result.append(DecodedBitStreamParser.toAlphaNumericChar(threeDigitsBits % 10));
            count -= 3;
        }
        if (count == 2) {
            // Two digits left over to read, encoded in 7 bits
            if (bits.available() < 7) {
                throw new Exception_1.default("FormatException");
            }
            var twoDigitsBits = bits.readBits(7);
            if (twoDigitsBits >= 100) {
                throw new Exception_1.default("FormatException");
            }
            result.append(DecodedBitStreamParser.toAlphaNumericChar(twoDigitsBits / 10));
            result.append(DecodedBitStreamParser.toAlphaNumericChar(twoDigitsBits % 10));
        }
        else if (count == 1) {
            // One digit left over to read
            if (bits.available() < 4) {
                throw new Exception_1.default("FormatException");
            }
            var digitBits = bits.readBits(4);
            if (digitBits >= 10) {
                throw new Exception_1.default("FormatException");
            }
            result.append(DecodedBitStreamParser.toAlphaNumericChar(digitBits));
        }
    };
    DecodedBitStreamParser.parseECIValue = function (bits) {
        var firstByte = bits.readBits(8);
        if ((firstByte & 0x80) == 0) {
            // just one byte
            return firstByte & 0x7F;
        }
        if ((firstByte & 0xC0) == 0x80) {
            // two bytes
            var secondByte = bits.readBits(8);
            return ((firstByte & 0x3F) << 8) | secondByte;
        }
        if ((firstByte & 0xE0) == 0xC0) {
            // three bytes
            var secondThirdBytes = bits.readBits(16);
            return ((firstByte & 0x1F) << 16) | secondThirdBytes;
        }
        throw new Exception_1.default("FormatException");
    };
    return DecodedBitStreamParser;
}());
/**
 * See ISO 18004:2006, 6.4.4 Table 5
 */
DecodedBitStreamParser.ALPHANUMERIC_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
DecodedBitStreamParser.GB2312_SUBSET = 1;
exports.default = DecodedBitStreamParser;
function Uint8ArrayToString(a) {
    var CHUNK_SZ = 0x8000;
    var c = new StringBuilder_1.default();
    for (var i = 0, length = a.length; i < length; i += CHUNK_SZ) {
        c.append(String.fromCharCode.apply(null, a.subarray(i, i + CHUNK_SZ)));
    }
    return c.toString();
}
//# sourceMappingURL=DecodedBitStreamParser.js.map