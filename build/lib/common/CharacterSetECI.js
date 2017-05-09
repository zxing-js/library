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
/*namespace com.google.zxing.common {*/
var Exception_1 = require("./../Exception");
/**
 * Encapsulates a Character Set ECI, according to "Extended Channel Interpretations" 5.3.1.1
 * of ISO 18004.
 *
 * @author Sean Owen
 */
var CharacterSetECI = (function () {
    function CharacterSetECI(valueIdentifier, valuesParam, name) {
        var otherEncodingNames = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            otherEncodingNames[_i - 3] = arguments[_i];
        }
        this.valueIdentifier = valueIdentifier;
        this.name = name;
        if (typeof valuesParam === "number") {
            this.values = Int32Array.from([valuesParam]);
        }
        else {
            this.values = valuesParam;
        }
        this.otherEncodingNames = otherEncodingNames;
        CharacterSetECI.VALUE_IDENTIFIER_TO_ECI.set(valueIdentifier, this);
        CharacterSetECI.NAME_TO_ECI.set(name, this);
    }
    // CharacterSetECI(value: number/*int*/) {
    //   this(new Int32Array {value})
    // }
    // CharacterSetECI(value: number/*int*/, String... otherEncodingNames) {
    //   this.values = new Int32Array {value}
    //   this.otherEncodingNames = otherEncodingNames
    // }
    // CharacterSetECI(values: Int32Array, String... otherEncodingNames) {
    //   this.values = values
    //   this.otherEncodingNames = otherEncodingNames
    // }
    CharacterSetECI.prototype.getValueIdentifier = function () {
        return this.valueIdentifier;
    };
    CharacterSetECI.prototype.getName = function () {
        return this.name;
    };
    CharacterSetECI.prototype.getValue = function () {
        return this.values[0];
    };
    /**
     * @param value character set ECI value
     * @return {@code CharacterSetECI} representing ECI of given value, or null if it is legal but
     *   unsupported
     * @throws FormatException if ECI value is invalid
     */
    CharacterSetECI.getCharacterSetECIByValue = function (value /*int*/) {
        if (value < 0 || value >= 900) {
            throw new Exception_1.default("FormatException", "incorect value");
        }
        return CharacterSetECI.VALUE_IDENTIFIER_TO_ECI.get(value);
    };
    /**
     * @param name character set ECI encoding name
     * @return CharacterSetECI representing ECI for character encoding, or null if it is legal
     *   but unsupported
     */
    CharacterSetECI.getCharacterSetECIByName = function (name) {
        return CharacterSetECI.NAME_TO_ECI.get(name);
    };
    return CharacterSetECI;
}());
// Enum name is a Java encoding valid for java.lang and java.io
CharacterSetECI.Cp437 = new CharacterSetECI(0 /* Cp437 */, Int32Array.from([0, 2]), "Cp437");
CharacterSetECI.ISO8859_1 = new CharacterSetECI(1 /* ISO8859_1 */, Int32Array.from([1, 3]), "ISO8859_1", "ISO-8859-1");
CharacterSetECI.ISO8859_2 = new CharacterSetECI(2 /* ISO8859_2 */, 4, "ISO8859_2", "ISO-8859-2");
CharacterSetECI.ISO8859_3 = new CharacterSetECI(3 /* ISO8859_3 */, 5, "ISO8859_3", "ISO-8859-3");
CharacterSetECI.ISO8859_4 = new CharacterSetECI(4 /* ISO8859_4 */, 6, "ISO8859_4", "ISO-8859-4");
CharacterSetECI.ISO8859_5 = new CharacterSetECI(5 /* ISO8859_5 */, 7, "ISO8859_5", "ISO-8859-5");
CharacterSetECI.ISO8859_6 = new CharacterSetECI(6 /* ISO8859_6 */, 8, "ISO8859_6", "ISO-8859-6");
CharacterSetECI.ISO8859_7 = new CharacterSetECI(7 /* ISO8859_7 */, 9, "ISO8859_7", "ISO-8859-7");
CharacterSetECI.ISO8859_8 = new CharacterSetECI(8 /* ISO8859_8 */, 10, "ISO8859_8", "ISO-8859-8");
CharacterSetECI.ISO8859_9 = new CharacterSetECI(9 /* ISO8859_9 */, 11, "ISO8859_9", "ISO-8859-9");
CharacterSetECI.ISO8859_10 = new CharacterSetECI(10 /* ISO8859_10 */, 12, "ISO8859_10", "ISO-8859-10");
CharacterSetECI.ISO8859_11 = new CharacterSetECI(11 /* ISO8859_11 */, 13, "ISO8859_11", "ISO-8859-11");
CharacterSetECI.ISO8859_13 = new CharacterSetECI(12 /* ISO8859_13 */, 15, "ISO8859_13", "ISO-8859-13");
CharacterSetECI.ISO8859_14 = new CharacterSetECI(13 /* ISO8859_14 */, 16, "ISO8859_14", "ISO-8859-14");
CharacterSetECI.ISO8859_15 = new CharacterSetECI(14 /* ISO8859_15 */, 17, "ISO8859_15", "ISO-8859-15");
CharacterSetECI.ISO8859_16 = new CharacterSetECI(15 /* ISO8859_16 */, 18, "ISO8859_16", "ISO-8859-16");
CharacterSetECI.SJIS = new CharacterSetECI(16 /* SJIS */, 20, "SJIS", "Shift_JIS");
CharacterSetECI.Cp1250 = new CharacterSetECI(17 /* Cp1250 */, 21, "Cp1250", "windows-1250");
CharacterSetECI.Cp1251 = new CharacterSetECI(18 /* Cp1251 */, 22, "Cp1251", "windows-1251");
CharacterSetECI.Cp1252 = new CharacterSetECI(19 /* Cp1252 */, 23, "Cp1252", "windows-1252");
CharacterSetECI.Cp1256 = new CharacterSetECI(20 /* Cp1256 */, 24, "Cp1256", "windows-1256");
CharacterSetECI.UnicodeBigUnmarked = new CharacterSetECI(21 /* UnicodeBigUnmarked */, 25, "UnicodeBigUnmarked", "UTF-16BE", "UnicodeBig");
CharacterSetECI.UTF8 = new CharacterSetECI(22 /* UTF8 */, 26, "UTF8", "UTF-8");
CharacterSetECI.ASCII = new CharacterSetECI(23 /* ASCII */, Int32Array.from([27, 170]), "ASCII", "US-ASCII");
CharacterSetECI.Big5 = new CharacterSetECI(24 /* Big5 */, 28, "Big5");
CharacterSetECI.GB18030 = new CharacterSetECI(25 /* GB18030 */, 29, "GB18030", "GB2312", "EUC_CN", "GBK");
CharacterSetECI.EUC_KR = new CharacterSetECI(26 /* EUC_KR */, 30, "EUC_KR", "EUC-KR");
CharacterSetECI.VALUE_IDENTIFIER_TO_ECI = new Map();
CharacterSetECI.NAME_TO_ECI = new Map();
exports.default = CharacterSetECI;
//# sourceMappingURL=CharacterSetECI.js.map