/*
 * Copyright 2007 ZXing authors
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

/*package com.google.zxing.common;*/

import * as assert from 'assert';
import Random from '../util/Random';
import { BitArray } from '@zxing/library';
import { ZXingInteger } from '@zxing/library';
import AssertUtils from '../util/AssertUtils';

/**
 * @author Sean Owen
 */
describe('BitArray', () => {

    it('testGetSet', () => {
        const array = new BitArray(33);
        for (let i = 0; i < 33; i++) {
            assert.strictEqual(array.get(i), false);
            array.set(i);
            assert.strictEqual(array.get(i), true);
        }
    });

    it('testGetNextSet1', () => {
        let array = new BitArray(32);
        for (let i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 32, '' + i);
        }
        array = new BitArray(33);
        for (let i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 33, '' + i);
        }
    });


    it('testGetNextSet2', () => {
        let array = new BitArray(33);
        array.set(31);
        for (let i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), i <= 31 ? 31 : 33, '' + i);
        }
        array = new BitArray(33);
        array.set(32);
        for (let i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 32, '' + i);
        }
    });


    it('testGetNextSet3', () => {
        const array = new BitArray(63);
        array.set(31);
        array.set(32);
        for (let i = 0; i < array.getSize(); i++) {
            let expected;
            if (i <= 31) {
                expected = 31;
            } else if (i === 32) {
                expected = 32;
            } else {
                expected = 63;
            }
            assert.strictEqual(array.getNextSet(i), expected, '' + i);
        }
    });


    it('testGetNextSet4', () => {
        const array = new BitArray(63);
        array.set(33);
        array.set(40);
        for (let i = 0; i < array.getSize(); i++) {
            let expected;
            if (i <= 33) {
                expected = 33;
            } else if (i <= 40) {
                expected = 40;
            } else {
                expected = 63;
            }
            assert.strictEqual(array.getNextSet(i), expected, '' + i);
        }
    });


    it('testGetNextSet5', () => {
        const r = new Random('0xDEADBEEF');
        for (let i = 0; i < 10; i++) {
            const array = new BitArray(1 + r.next(100));
            const numSet = r.next(20);
            for (let j = 0; j < numSet; j++) {
                array.set(r.next(array.getSize()));
            }
            const numQueries = r.next(20);
            for (let j = 0; j < numQueries; j++) {
                const query = r.next(array.getSize());
                let expected = query;
                while (expected < array.getSize() && !array.get(expected)) {
                    expected++;
                }
                const actual = array.getNextSet(query);
                assert.strictEqual(actual, expected);
            }
        }
    });


    it('testSetBulk', () => {
        const array = new BitArray(64);
        array.setBulk(32, 0xFFFF0000);
        for (let i = 0; i < 48; i++) {
            assert.strictEqual(array.get(i), false);
        }
        for (let i = 48; i < 64; i++) {
            assert.strictEqual(array.get(i), true);
        }
    });


    it('testSetRange', () => {
        const array = new BitArray(64);
        array.setRange(28, 36);
        assert.strictEqual(array.get(27), false);
        for (let i = 28; i < 36; i++) {
            assert.strictEqual(array.get(i), true);
        }
        assert.strictEqual(array.get(36), false);
    });


    it('testClear', () => {
        const array = new BitArray(32);
        for (let i = 0; i < 32; i++) {
            array.set(i);
        }
        array.clear();
        for (let i = 0; i < 32; i++) {
            assert.strictEqual(array.get(i), false);
        }
    });


    it('testFlip', () => {
        const array = new BitArray(32);
        assert.strictEqual(array.get(5), false);
        array.flip(5);
        assert.strictEqual(array.get(5), true);
        array.flip(5);
        assert.strictEqual(array.get(5), false);
    });


    it('testGetArray', () => {
        const array = new BitArray(64);
        array.set(0);
        array.set(63);
        const ints = array.getBitArray();
        assert.strictEqual(ints[0], 1);
        assert.strictEqual(ints[1], ZXingInteger.MIN_VALUE_32_BITS); // Integer.MIN_VALUE)
    });


    it('testIsRange', () => {
        const array = new BitArray(64);
        assert.strictEqual(array.isRange(0, 64, false), true);
        assert.strictEqual(array.isRange(0, 64, true), false);
        array.set(32);
        assert.strictEqual(array.isRange(32, 33, true), true);
        array.set(31);
        assert.strictEqual(array.isRange(31, 33, true), true);
        array.set(34);
        assert.strictEqual(array.isRange(31, 35, true), false);
        for (let i = 0; i < 31; i++) {
            array.set(i);
        }
        assert.strictEqual(array.isRange(0, 33, true), true);
        for (let i = 33; i < 64; i++) {
            array.set(i);
        }
        assert.strictEqual(array.isRange(0, 64, true), true);
        assert.strictEqual(array.isRange(0, 64, false), false);
    });


    it('reverseAlgorithmTest', () => {
        const oldBits = Int32Array.from([128, 256, 512, 6453324, 50934953]);
        for (let size = 1; size < 160; size++) {
            const newBitsOriginal = reverseOriginal(oldBits.slice(), size);
            const newBitArray = new BitArray(size, oldBits.slice());
            newBitArray.reverse();
            const newBitsNew = newBitArray.getBitArray();
            assert.strictEqual(AssertUtils.typedArraysAreEqual(newBitsOriginal, newBitsNew, size / 32 + 1), true);
        }
    });


    it('testClone', () => {
        const array = new BitArray(32);
        array.clone().set(0);
        assert.strictEqual(array.get(0), false);
    });


    it('testEquals', () => {
        const a = new BitArray(32);
        const b = new BitArray(32);
        assert.strictEqual(a.equals(b), true);
        assert.strictEqual(a.hashCode(), b.hashCode());
        assert.strictEqual(a.equals(new BitArray(31)), false);
        a.set(16);
        assert.strictEqual(a.equals(new BitArray(31)), false);
        assert.notStrictEqual(a.hashCode(), b.hashCode());
        b.set(16);
        assert.strictEqual(a.equals(b), true);
        assert.strictEqual(a.hashCode(), b.hashCode());
    });


    it('testToArray', () => {
        const array = new BitArray(20);
        for (let i = 0; i < 10; i++) {
            array.set(i);
        }
        let booleanArr = array.toArray();
        for (let i = 0; i < 20; i++) {
            if (i < 10) {
                assert.strictEqual(booleanArr[i], true);
            } else {
                assert.strictEqual(booleanArr[i], false);
            }
        }
    });

    function reverseOriginal(oldBits: Int32Array, size: number): Int32Array {
        const newBits = new Int32Array(oldBits.length);
        for (let i = 0; i < size; i++) {
            if (bitSet(oldBits, size - i - 1)) {
                newBits[Math.floor(i / 32)] |= 1 << (i & 0x1F);
            }
        }
        return newBits;
    }

    function bitSet(bits: Int32Array, i: number): boolean {
        return (bits[Math.floor(i / 32)] & (1 << (i & 0x1F))) !== 0;
    }
});
