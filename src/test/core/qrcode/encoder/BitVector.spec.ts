/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing.qrcode.encoder;*/

import * as assert from 'assert';
import { BitArray } from '@zxing/library';

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
describe('BitVector', () => {

    // TYPESCRIPTPORT: cannot use long (64 bits) as we only have 53 bits in number so I will just use a string for testing purposes
    // function getUnsignedInt(v: BitArray, index: number /*int*/): number/*long*/ {
    //   let result: number = 0
    //   for (let i: number /*int*/ = 0, offset = index * 8; i < 32; i++) {
    //     if (v.get(offset + i)) {
    //       result |= 1 << (31 - i)
    //     }
    //   }
    //   return result
    // }
    function getUnsignedIntAsString(v: BitArray, index: number /*int*/): string/*long*/ {
        let result = '';
        for (let i: number /*int*/ = 0, offset = index * 8; i < 32; i++) {
            result = result + (v.get(offset + i) ? '1' : '0');
        }
        return ('00000000000000000000000000000000' + result).substring(result.length);
    }

    it('testAppendBit', () => {
        const v = new BitArray();
        assert.strictEqual(v.getSizeInBytes(), 0);
        // 1
        v.appendBit(true);
        assert.strictEqual(v.getSize(), 1);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0x80000000.toString(2));
        // 10
        v.appendBit(false);
        assert.strictEqual(v.getSize(), 2);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0x80000000.toString(2));
        // 101
        v.appendBit(true);
        assert.strictEqual(v.getSize(), 3);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xa0000000.toString(2));
        // 1010
        v.appendBit(false);
        assert.strictEqual(v.getSize(), 4);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xa0000000.toString(2));
        // 10101
        v.appendBit(true);
        assert.strictEqual(v.getSize(), 5);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xa8000000.toString(2));
        // 101010
        v.appendBit(false);
        assert.strictEqual(v.getSize(), 6);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xa8000000.toString(2));
        // 1010101
        v.appendBit(true);
        assert.strictEqual(v.getSize(), 7);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xaa000000.toString(2));
        // 10101010
        v.appendBit(false);
        assert.strictEqual(v.getSize(), 8);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xaa000000.toString(2));
        // 10101010 1
        v.appendBit(true);
        assert.strictEqual(v.getSize(), 9);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xaa800000.toString(2));
        // 10101010 10
        v.appendBit(false);
        assert.strictEqual(v.getSize(), 10);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xaa800000.toString(2));
    });

    it('testAppendBits', () => {
        let v = new BitArray();
        v.appendBits(0x1, 1);
        assert.strictEqual(v.getSize(), 1);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0x80000000.toString(2));
        v = new BitArray();
        v.appendBits(0xff, 8);
        assert.strictEqual(v.getSize(), 8);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xff000000.toString(2));
        v = new BitArray();
        v.appendBits(0xff7, 12);
        assert.strictEqual(v.getSize(), 12);
        assert.strictEqual(getUnsignedIntAsString(v, 0), 0xff700000.toString(2));
    });

    it('testNumBytes', () => {
        const v = new BitArray();
        assert.strictEqual(v.getSizeInBytes(), 0);
        v.appendBit(false);
        // 1 bit was added in the vector, so 1 byte should be consumed.
        assert.strictEqual(v.getSizeInBytes(), 1);
        v.appendBits(0, 7);
        assert.strictEqual(v.getSizeInBytes(), 1);
        v.appendBits(0, 8);
        assert.strictEqual(v.getSizeInBytes(), 2);
        v.appendBits(0, 1);
        // We now have 17 bits, so 3 bytes should be consumed.
        assert.strictEqual(v.getSizeInBytes(), 3);
    });

    it('testAppendBitVector', () => {
        const v1 = new BitArray();
        v1.appendBits(0xbe, 8);
        const v2 = new BitArray();
        v2.appendBits(0xef, 8);
        v1.appendBitArray(v2);
        // beef = 1011 1110 1110 1111
        assert.strictEqual(v1.toString(), ' X.XXXXX. XXX.XXXX');
    });

    it('testXOR', () => {
        const v1 = new BitArray();
        v1.appendBits(0x5555aaaa, 32);
        const v2 = new BitArray();
        v2.appendBits(0xaaaa5555, 32);
        v1.xor(v2);
        assert.strictEqual(getUnsignedIntAsString(v1, 0), 0xffffffff.toString(2));
    });

    it('testXOR2', () => {
        const v1 = new BitArray();
        v1.appendBits(0x2a, 7);  // 010 1010
        const v2 = new BitArray();
        v2.appendBits(0x55, 7);  // 101 0101
        v1.xor(v2);
        assert.strictEqual(getUnsignedIntAsString(v1, 0), 0xfe000000.toString(2));  // 1111 1110
    });

    it('testAt', () => {
        const v = new BitArray();
        v.appendBits(0xdead, 16);  // 1101 1110 1010 1101
        assert.strictEqual(v.get(0), true);
        assert.strictEqual(v.get(1), true);
        assert.strictEqual(v.get(2), false);
        assert.strictEqual(v.get(3), true);

        assert.strictEqual(v.get(4), true);
        assert.strictEqual(v.get(5), true);
        assert.strictEqual(v.get(6), true);
        assert.strictEqual(v.get(7), false);

        assert.strictEqual(v.get(8), true);
        assert.strictEqual(v.get(9), false);
        assert.strictEqual(v.get(10), true);
        assert.strictEqual(v.get(11), false);

        assert.strictEqual(v.get(12), true);
        assert.strictEqual(v.get(13), true);
        assert.strictEqual(v.get(14), false);
        assert.strictEqual(v.get(15), true);
    });

    it('testToString', () => {
        const v = new BitArray();
        v.appendBits(0xdead, 16);  // 1101 1110 1010 1101
        assert.strictEqual(v.toString(), ' XX.XXXX. X.X.XX.X');
    });

});
