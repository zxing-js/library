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
var Exception_1 = require("./../../Exception");
/**
 * <p>See ISO 18004:2006, 6.4.1, Tables 2 and 3. This enum encapsulates the various modes in which
 * data can be encoded to bits in the QR code standard.</p>
 *
 * @author Sean Owen
 */
var Mode = (function () {
    function Mode(value, characterCountBitsForVersions, bits /*int*/) {
        this.value = value;
        this.characterCountBitsForVersions = characterCountBitsForVersions;
        this.bits = bits; /*int*/
        Mode.FOR_BITS.set(bits, this);
        Mode.FOR_VALUE.set(value, this);
    }
    /**
     * @param bits four bits encoding a QR Code data mode
     * @return Mode encoded by these bits
     * @throws IllegalArgumentException if bits do not correspond to a known mode
     */
    Mode.forBits = function (bits /*int*/) {
        if (bits < 0 || bits >= Mode.FOR_BITS.size) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        return Mode.FOR_BITS[bits];
    };
    /**
     * @param version version in question
     * @return number of bits used, in this QR Code symbol {@link Version}, to encode the
     *         count of characters that will follow encoded in this Mode
     */
    Mode.prototype.getCharacterCountBits = function (version) {
        var number = version.getVersionNumber();
        var offset;
        if (number <= 9) {
            offset = 0;
        }
        else if (number <= 26) {
            offset = 1;
        }
        else {
            offset = 2;
        }
        return this.characterCountBitsForVersions[offset];
    };
    Mode.prototype.getValue = function () {
        return this.value;
    };
    Mode.prototype.getBits = function () {
        return this.bits;
    };
    return Mode;
}());
Mode.TERMINATOR = new Mode(0 /* TERMINATOR */, Int32Array.from([0, 0, 0]), 0x00); // Not really a mode... 
Mode.NUMERIC = new Mode(0 /* TERMINATOR */, Int32Array.from([10, 12, 14]), 0x01);
Mode.ALPHANUMERIC = new Mode(0 /* TERMINATOR */, Int32Array.from([9, 11, 13]), 0x02);
Mode.STRUCTURED_APPEND = new Mode(0 /* TERMINATOR */, Int32Array.from([0, 0, 0]), 0x03); // Not supported
Mode.BYTE = new Mode(0 /* TERMINATOR */, Int32Array.from([8, 16, 16]), 0x04);
Mode.ECI = new Mode(0 /* TERMINATOR */, Int32Array.from([0, 0, 0]), 0x07); // character counts don't apply
Mode.KANJI = new Mode(0 /* TERMINATOR */, Int32Array.from([8, 10, 12]), 0x08);
Mode.FNC1_FIRST_POSITION = new Mode(0 /* TERMINATOR */, Int32Array.from([0, 0, 0]), 0x05);
Mode.FNC1_SECOND_POSITION = new Mode(0 /* TERMINATOR */, Int32Array.from([0, 0, 0]), 0x09);
/** See GBT 18284-2000; "Hanzi" is a transliteration of this mode name. */
Mode.HANZI = new Mode(0 /* TERMINATOR */, Int32Array.from([8, 10, 12]), 0x0D);
Mode.FOR_BITS = new Map();
Mode.FOR_VALUE = new Map();
exports.default = Mode;
//# sourceMappingURL=Mode.js.map