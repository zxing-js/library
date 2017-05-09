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
var ErrorCorrectionLevel_1 = require("./ErrorCorrectionLevel");
var Integer_1 = require("./../../util/Integer");
/**
 * <p>Encapsulates a QR Code's format information, including the data mask used and
 * error correction level.</p>
 *
 * @author Sean Owen
 * @see DataMask
 * @see ErrorCorrectionLevel
 */
var FormatInformation = (function () {
    function FormatInformation(formatInfo /*int*/) {
        this.formatInfo = formatInfo; /*int*/
        // Bits 3,4
        this.errorCorrectionLevel = ErrorCorrectionLevel_1.default.forBits((formatInfo >> 3) & 0x03);
        // Bottom 3 bits
        this.dataMask = (formatInfo & 0x07);
    }
    FormatInformation.numBitsDiffering = function (a /*int*/, b /*int*/) {
        return Integer_1.default.bitCount(a ^ b);
    };
    /**
     * @param maskedFormatInfo1 format info indicator, with mask still applied
     * @param maskedFormatInfo2 second copy of same info; both are checked at the same time
     *  to establish best match
     * @return information about the format it specifies, or {@code null}
     *  if doesn't seem to match any known pattern
     */
    FormatInformation.decodeFormatInformation = function (maskedFormatInfo1 /*int*/, maskedFormatInfo2 /*int*/) {
        var formatInfo = FormatInformation.doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2);
        if (formatInfo !== null) {
            return formatInfo;
        }
        // Should return null, but, some QR codes apparently
        // do not mask this info. Try again by actually masking the pattern
        // first
        return FormatInformation.doDecodeFormatInformation(maskedFormatInfo1 ^ FormatInformation.FORMAT_INFO_MASK_QR, maskedFormatInfo2 ^ FormatInformation.FORMAT_INFO_MASK_QR);
    };
    FormatInformation.doDecodeFormatInformation = function (maskedFormatInfo1 /*int*/, maskedFormatInfo2 /*int*/) {
        // Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
        var bestDifference = Number.MAX_SAFE_INTEGER;
        var bestFormatInfo = 0;
        for (var _i = 0, _a = FormatInformation.FORMAT_INFO_DECODE_LOOKUP; _i < _a.length; _i++) {
            var decodeInfo = _a[_i];
            var targetInfo = decodeInfo[0];
            if (targetInfo === maskedFormatInfo1 || targetInfo === maskedFormatInfo2) {
                // Found an exact match
                return new FormatInformation(decodeInfo[1]);
            }
            var bitsDifference = FormatInformation.numBitsDiffering(maskedFormatInfo1, targetInfo);
            if (bitsDifference < bestDifference) {
                bestFormatInfo = decodeInfo[1];
                bestDifference = bitsDifference;
            }
            if (maskedFormatInfo1 != maskedFormatInfo2) {
                // also try the other option
                bitsDifference = FormatInformation.numBitsDiffering(maskedFormatInfo2, targetInfo);
                if (bitsDifference < bestDifference) {
                    bestFormatInfo = decodeInfo[1];
                    bestDifference = bitsDifference;
                }
            }
        }
        // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits
        // differing means we found a match
        if (bestDifference <= 3) {
            return new FormatInformation(bestFormatInfo);
        }
        return null;
    };
    FormatInformation.prototype.getErrorCorrectionLevel = function () {
        return this.errorCorrectionLevel;
    };
    FormatInformation.prototype.getDataMask = function () {
        return this.dataMask;
    };
    /*@Override*/
    FormatInformation.prototype.hashCode = function () {
        return (this.errorCorrectionLevel.bits << 3) | this.dataMask;
    };
    /*@Override*/
    FormatInformation.prototype.equals = function (o) {
        if (!(o instanceof FormatInformation)) {
            return false;
        }
        var other = o;
        return this.errorCorrectionLevel === other.errorCorrectionLevel &&
            this.dataMask === other.dataMask;
    };
    return FormatInformation;
}());
FormatInformation.FORMAT_INFO_MASK_QR = 0x5412;
/**
 * See ISO 18004:2006, Annex C, Table C.1
 */
FormatInformation.FORMAT_INFO_DECODE_LOOKUP = [
    Int32Array.from([0x5412, 0x00]),
    Int32Array.from([0x5125, 0x01]),
    Int32Array.from([0x5E7C, 0x02]),
    Int32Array.from([0x5B4B, 0x03]),
    Int32Array.from([0x45F9, 0x04]),
    Int32Array.from([0x40CE, 0x05]),
    Int32Array.from([0x4F97, 0x06]),
    Int32Array.from([0x4AA0, 0x07]),
    Int32Array.from([0x77C4, 0x08]),
    Int32Array.from([0x72F3, 0x09]),
    Int32Array.from([0x7DAA, 0x0A]),
    Int32Array.from([0x789D, 0x0B]),
    Int32Array.from([0x662F, 0x0C]),
    Int32Array.from([0x6318, 0x0D]),
    Int32Array.from([0x6C41, 0x0E]),
    Int32Array.from([0x6976, 0x0F]),
    Int32Array.from([0x1689, 0x10]),
    Int32Array.from([0x13BE, 0x11]),
    Int32Array.from([0x1CE7, 0x12]),
    Int32Array.from([0x19D0, 0x13]),
    Int32Array.from([0x0762, 0x14]),
    Int32Array.from([0x0255, 0x15]),
    Int32Array.from([0x0D0C, 0x16]),
    Int32Array.from([0x083B, 0x17]),
    Int32Array.from([0x355F, 0x18]),
    Int32Array.from([0x3068, 0x19]),
    Int32Array.from([0x3F31, 0x1A]),
    Int32Array.from([0x3A06, 0x1B]),
    Int32Array.from([0x24B4, 0x1C]),
    Int32Array.from([0x2183, 0x1D]),
    Int32Array.from([0x2EDA, 0x1E]),
    Int32Array.from([0x2BED, 0x1F]),
];
exports.default = FormatInformation;
//# sourceMappingURL=FormatInformation.js.map