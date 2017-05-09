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
/*package com.google.zxing.common;*/
// import org.junit.Assert;
// import org.junit.Test;
// import java.util.Random;
require("mocha");
var assert = require("assert");
var Random_1 = require("./../util/Random");
var BitArray_1 = require("./../../lib/common/BitArray");
var Integer_1 = require("./../../lib/util/Integer");
/**
 * @author Sean Owen
 */
describe("BitArrayTestCase", function () {
    it("testGetSet", function () {
        var array = new BitArray_1.default(33);
        for (var i = 0; i < 33; i++) {
            assert.strictEqual(array.get(i), false);
            array.set(i);
            assert.strictEqual(array.get(i), true);
        }
    });
    it("testGetNextSet1", function () {
        var array = new BitArray_1.default(32);
        for (var i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 32, "" + i);
        }
        array = new BitArray_1.default(33);
        for (var i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 33, "" + i);
        }
    });
    it("testGetNextSet2", function () {
        var array = new BitArray_1.default(33);
        array.set(31);
        for (var i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), i <= 31 ? 31 : 33, "" + i);
        }
        array = new BitArray_1.default(33);
        array.set(32);
        for (var i = 0; i < array.getSize(); i++) {
            assert.strictEqual(array.getNextSet(i), 32, "" + i);
        }
    });
    it("testGetNextSet3", function () {
        var array = new BitArray_1.default(63);
        array.set(31);
        array.set(32);
        for (var i = 0; i < array.getSize(); i++) {
            var expected = void 0;
            if (i <= 31) {
                expected = 31;
            }
            else if (i == 32) {
                expected = 32;
            }
            else {
                expected = 63;
            }
            assert.strictEqual(array.getNextSet(i), expected, "" + i);
        }
    });
    it("testGetNextSet4", function () {
        var array = new BitArray_1.default(63);
        array.set(33);
        array.set(40);
        for (var i = 0; i < array.getSize(); i++) {
            var expected = void 0;
            if (i <= 33) {
                expected = 33;
            }
            else if (i <= 40) {
                expected = 40;
            }
            else {
                expected = 63;
            }
            assert.strictEqual(array.getNextSet(i), expected, "" + i);
        }
    });
    it("testGetNextSet5", function () {
        var r = new Random_1.default("0xDEADBEEF");
        for (var i = 0; i < 10; i++) {
            var array = new BitArray_1.default(1 + r.next(100));
            var numSet = r.next(20);
            for (var j = 0; j < numSet; j++) {
                array.set(r.next(array.getSize()));
            }
            var numQueries = r.next(20);
            for (var j = 0; j < numQueries; j++) {
                var query = r.next(array.getSize());
                var expected = query;
                while (expected < array.getSize() && !array.get(expected)) {
                    expected++;
                }
                var actual = array.getNextSet(query);
                assert.strictEqual(actual, expected);
            }
        }
    });
    it("testSetBulk", function () {
        var array = new BitArray_1.default(64);
        array.setBulk(32, 0xFFFF0000);
        for (var i = 0; i < 48; i++) {
            assert.strictEqual(array.get(i), false);
        }
        for (var i = 48; i < 64; i++) {
            assert.strictEqual(array.get(i), true);
        }
    });
    it("testSetRange", function () {
        var array = new BitArray_1.default(64);
        array.setRange(28, 36);
        assert.strictEqual(array.get(27), false);
        for (var i = 28; i < 36; i++) {
            assert.strictEqual(array.get(i), true);
        }
        assert.strictEqual(array.get(36), false);
    });
    it("testClear", function () {
        var array = new BitArray_1.default(32);
        for (var i = 0; i < 32; i++) {
            array.set(i);
        }
        array.clear();
        for (var i = 0; i < 32; i++) {
            assert.strictEqual(array.get(i), false);
        }
    });
    it("testFlip", function () {
        var array = new BitArray_1.default(32);
        assert.strictEqual(array.get(5), false);
        array.flip(5);
        assert.strictEqual(array.get(5), true);
        array.flip(5);
        assert.strictEqual(array.get(5), false);
    });
    it("testGetArray", function () {
        var array = new BitArray_1.default(64);
        array.set(0);
        array.set(63);
        var ints = array.getBitArray();
        assert.strictEqual(ints[0], 1);
        assert.strictEqual(ints[1], Integer_1.default.MIN_VALUE_32_BITS); //Integer.MIN_VALUE)
    });
    it("testIsRange", function () {
        var array = new BitArray_1.default(64);
        assert.strictEqual(array.isRange(0, 64, false), true);
        assert.strictEqual(array.isRange(0, 64, true), false);
        array.set(32);
        assert.strictEqual(array.isRange(32, 33, true), true);
        array.set(31);
        assert.strictEqual(array.isRange(31, 33, true), true);
        array.set(34);
        assert.strictEqual(array.isRange(31, 35, true), false);
        for (var i = 0; i < 31; i++) {
            array.set(i);
        }
        assert.strictEqual(array.isRange(0, 33, true), true);
        for (var i = 33; i < 64; i++) {
            array.set(i);
        }
        assert.strictEqual(array.isRange(0, 64, true), true);
        assert.strictEqual(array.isRange(0, 64, false), false);
    });
    it("reverseAlgorithmTest", function () {
        var oldBits = Int32Array.from([128, 256, 512, 6453324, 50934953]);
        for (var size = 1; size < 160; size++) {
            var newBitsOriginal = reverseOriginal(oldBits.slice(), size);
            var newBitArray = new BitArray_1.default(size, oldBits.slice());
            newBitArray.reverse();
            var newBitsNew = newBitArray.getBitArray();
            assert.strictEqual(arraysAreEqual(newBitsOriginal, newBitsNew, size / 32 + 1), true);
        }
    });
    it("testClone", function () {
        var array = new BitArray_1.default(32);
        array.clone().set(0);
        assert.strictEqual(array.get(0), false);
    });
    it("testEquals", function () {
        var a = new BitArray_1.default(32);
        var b = new BitArray_1.default(32);
        assert.strictEqual(a.equals(b), true);
        assert.strictEqual(a.hashCode(), b.hashCode());
        assert.strictEqual(a.equals(new BitArray_1.default(31)), false);
        a.set(16);
        assert.strictEqual(a.equals(new BitArray_1.default(31)), false);
        assert.notStrictEqual(a.hashCode(), b.hashCode());
        b.set(16);
        assert.strictEqual(a.equals(b), true);
        assert.strictEqual(a.hashCode(), b.hashCode());
    });
    function reverseOriginal(oldBits, size) {
        var newBits = new Int32Array(oldBits.length);
        for (var i = 0; i < size; i++) {
            if (bitSet(oldBits, size - i - 1)) {
                newBits[Math.floor(i / 32)] |= 1 << (i & 0x1F);
            }
        }
        return newBits;
    }
    function bitSet(bits, i) {
        return (bits[Math.floor(i / 32)] & (1 << (i & 0x1F))) != 0;
    }
    function arraysAreEqual(left, right, size) {
        for (var i = 0; i < size; i++) {
            if (left[i] != right[i]) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=BitArrayTestCase.js.map