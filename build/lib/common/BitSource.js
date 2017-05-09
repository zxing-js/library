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
/*namespace com.google.zxing.common {*/
var Exception_1 = require("./../Exception");
/**
 * <p>This provides an easy abstraction to read bits at a time from a sequence of bytes, where the
 * number of bits read is not often a multiple of 8.</p>
 *
 * <p>This class is thread-safe but not reentrant -- unless the caller modifies the bytes array
 * it passed in, in which case all bets are off.</p>
 *
 * @author Sean Owen
 */
var BitSource = (function () {
    /**
     * @param bytes bytes from which this will read bits. Bits will be read from the first byte first.
     * Bits are read within a byte from most-significant to least-significant bit.
     */
    function BitSource(bytes) {
        this.bytes = bytes;
    }
    /**
     * @return index of next bit in current byte which would be read by the next call to {@link #readBits(int)}.
     */
    BitSource.prototype.getBitOffset = function () {
        return this.bitOffset;
    };
    /**
     * @return index of next byte in input byte array which would be read by the next call to {@link #readBits(int)}.
     */
    BitSource.prototype.getByteOffset = function () {
        return this.byteOffset;
    };
    /**
     * @param numBits number of bits to read
     * @return int representing the bits read. The bits will appear as the least-significant
     *         bits of the int
     * @throws IllegalArgumentException if numBits isn't in [1,32] or more than is available
     */
    BitSource.prototype.readBits = function (numBits /*int*/) {
        if (numBits < 1 || numBits > 32 || numBits > this.available()) {
            throw new Exception_1.default("IllegalArgumentException", "" + numBits);
        }
        var result = 0;
        var bitOffset = this.bitOffset;
        var byteOffset = this.byteOffset;
        var bytes = this.bytes;
        // First, read remainder from current byte
        if (bitOffset > 0) {
            var bitsLeft = 8 - bitOffset;
            var toRead = numBits < bitsLeft ? numBits : bitsLeft;
            var bitsToNotRead = bitsLeft - toRead;
            var mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
            result = (bytes[byteOffset] & mask) >> bitsToNotRead;
            numBits -= toRead;
            bitOffset += toRead;
            if (bitOffset == 8) {
                bitOffset = 0;
                byteOffset++;
            }
        }
        // Next read whole bytes
        if (numBits > 0) {
            while (numBits >= 8) {
                result = (result << 8) | (bytes[byteOffset] & 0xFF);
                byteOffset++;
                numBits -= 8;
            }
            // Finally read a partial byte
            if (numBits > 0) {
                var bitsToNotRead = 8 - numBits;
                var mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                result = (result << numBits) | ((bytes[byteOffset] & mask) >> bitsToNotRead);
                bitOffset += numBits;
            }
        }
        this.bitOffset = bitOffset;
        this.byteOffset = byteOffset;
        return result;
    };
    /**
     * @return number of bits that can be read successfully
     */
    BitSource.prototype.available = function () {
        return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
    };
    return BitSource;
}());
exports.default = BitSource;
//# sourceMappingURL=BitSource.js.map