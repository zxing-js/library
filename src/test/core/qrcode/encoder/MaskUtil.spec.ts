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
import { QRCodeByteMatrix } from '@zxing/library';
import { QRCodeMaskUtil } from '@zxing/library';

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author mysen@google.com (Chris Mysen) - ported from C++
 */
describe('QRCodeMaskUtil', () => {

    it('testApplyMaskPenaltyRule1', () => {
        let matrix = new QRCodeByteMatrix(4, 1);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(2, 0, 0);
        matrix.setNumber(3, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule1(matrix), 0);
        // Horizontal.
        matrix = new QRCodeByteMatrix(6, 1);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(2, 0, 0);
        matrix.setNumber(3, 0, 0);
        matrix.setNumber(4, 0, 0);
        matrix.setNumber(5, 0, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule1(matrix), 3);
        matrix.setNumber(5, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule1(matrix), 4);
        // Vertical.
        matrix = new QRCodeByteMatrix(1, 6);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(0, 2, 0);
        matrix.setNumber(0, 3, 0);
        matrix.setNumber(0, 4, 0);
        matrix.setNumber(0, 5, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule1(matrix), 3);
        matrix.setNumber(0, 5, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule1(matrix), 4);
    });

    it('testApplyMaskPenaltyRule2', () => {
        let matrix = new QRCodeByteMatrix(1, 1);
        matrix.setNumber(0, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule2(matrix), 0);
        matrix = new QRCodeByteMatrix(2, 2);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(1, 1, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule2(matrix), 0);
        matrix = new QRCodeByteMatrix(2, 2);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(1, 1, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule2(matrix), 3);
        matrix = new QRCodeByteMatrix(3, 3);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(2, 0, 0);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(1, 1, 0);
        matrix.setNumber(2, 1, 0);
        matrix.setNumber(0, 2, 0);
        matrix.setNumber(1, 2, 0);
        matrix.setNumber(2, 2, 0);
        // Four instances of 2x2 blocks.
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule2(matrix), 3 * 4);
    });

    it('testApplyMaskPenaltyRule3', () => {
        // Horizontal 00001011101.
        let matrix = new QRCodeByteMatrix(11, 1);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(2, 0, 0);
        matrix.setNumber(3, 0, 0);
        matrix.setNumber(4, 0, 1);
        matrix.setNumber(5, 0, 0);
        matrix.setNumber(6, 0, 1);
        matrix.setNumber(7, 0, 1);
        matrix.setNumber(8, 0, 1);
        matrix.setNumber(9, 0, 0);
        matrix.setNumber(10, 0, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule3(matrix), 40);
        // Horizontal 10111010000.
        matrix = new QRCodeByteMatrix(11, 1);
        matrix.setNumber(0, 0, 1);
        matrix.setNumber(1, 0, 0);
        matrix.setNumber(2, 0, 1);
        matrix.setNumber(3, 0, 1);
        matrix.setNumber(4, 0, 1);
        matrix.setNumber(5, 0, 0);
        matrix.setNumber(6, 0, 1);
        matrix.setNumber(7, 0, 0);
        matrix.setNumber(8, 0, 0);
        matrix.setNumber(9, 0, 0);
        matrix.setNumber(10, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule3(matrix), 40);
        // Vertical 00001011101.
        matrix = new QRCodeByteMatrix(1, 11);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(0, 2, 0);
        matrix.setNumber(0, 3, 0);
        matrix.setNumber(0, 4, 1);
        matrix.setNumber(0, 5, 0);
        matrix.setNumber(0, 6, 1);
        matrix.setNumber(0, 7, 1);
        matrix.setNumber(0, 8, 1);
        matrix.setNumber(0, 9, 0);
        matrix.setNumber(0, 10, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule3(matrix), 40);
        // Vertical 10111010000.
        matrix = new QRCodeByteMatrix(1, 11);
        matrix.setNumber(0, 0, 1);
        matrix.setNumber(0, 1, 0);
        matrix.setNumber(0, 2, 1);
        matrix.setNumber(0, 3, 1);
        matrix.setNumber(0, 4, 1);
        matrix.setNumber(0, 5, 0);
        matrix.setNumber(0, 6, 1);
        matrix.setNumber(0, 7, 0);
        matrix.setNumber(0, 8, 0);
        matrix.setNumber(0, 9, 0);
        matrix.setNumber(0, 10, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule3(matrix), 40);
    });

    it('testApplyMaskPenaltyRule4', () => {
        // Dark cell ratio = 0%
        let matrix = new QRCodeByteMatrix(1, 1);
        matrix.setNumber(0, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule4(matrix), 100);
        // Dark cell ratio = 5%
        matrix = new QRCodeByteMatrix(2, 1);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(0, 0, 1);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule4(matrix), 0);
        // Dark cell ratio = 66.67%
        matrix = new QRCodeByteMatrix(6, 1);
        matrix.setNumber(0, 0, 0);
        matrix.setNumber(1, 0, 1);
        matrix.setNumber(2, 0, 1);
        matrix.setNumber(3, 0, 1);
        matrix.setNumber(4, 0, 1);
        matrix.setNumber(5, 0, 0);
        assert.strictEqual(QRCodeMaskUtil.applyMaskPenaltyRule4(matrix), 30);
    });

    function TestGetDataMaskBitInternal(maskPattern: number /*int*/, expected: Array<Int32Array>): boolean {
        for (let x: number /*int*/ = 0; x < 6; ++x) {
            for (let y: number /*int*/ = 0; y < 6; ++y) {
                if ((expected[y][x] === 1) !== QRCodeMaskUtil.getDataMaskBit(maskPattern, x, y)) {
                    return false;
                }
            }
        }
        return true;
    }

    // See mask patterns on the page 43 of JISX0510:2004.
    it('testGetDataMaskBit', () => {
        const mask0 = [
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([0, 1, 0, 1, 0, 1]),
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([0, 1, 0, 1, 0, 1]),
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([0, 1, 0, 1, 0, 1])
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(0, mask0), true);
        const mask1 = [
            Int32Array.from([1, 1, 1, 1, 1, 1]),
            Int32Array.from([0, 0, 0, 0, 0, 0]),
            Int32Array.from([1, 1, 1, 1, 1, 1]),
            Int32Array.from([0, 0, 0, 0, 0, 0]),
            Int32Array.from([1, 1, 1, 1, 1, 1]),
            Int32Array.from([0, 0, 0, 0, 0, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(1, mask1), true);
        const mask2 = [
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(2, mask2), true);
        const mask3 = [
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([0, 0, 1, 0, 0, 1]),
            Int32Array.from([0, 1, 0, 0, 1, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([0, 0, 1, 0, 0, 1]),
            Int32Array.from([0, 1, 0, 0, 1, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(3, mask3), true);
        const mask4 = [
            Int32Array.from([1, 1, 1, 0, 0, 0]),
            Int32Array.from([1, 1, 1, 0, 0, 0]),
            Int32Array.from([0, 0, 0, 1, 1, 1]),
            Int32Array.from([0, 0, 0, 1, 1, 1]),
            Int32Array.from([1, 1, 1, 0, 0, 0]),
            Int32Array.from([1, 1, 1, 0, 0, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(4, mask4), true);
        const mask5 = [
            Int32Array.from([1, 1, 1, 1, 1, 1]),
            Int32Array.from([1, 0, 0, 0, 0, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([1, 0, 0, 1, 0, 0]),
            Int32Array.from([1, 0, 0, 0, 0, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(5, mask5), true);
        const mask6 = [
            Int32Array.from([1, 1, 1, 1, 1, 1]),
            Int32Array.from([1, 1, 1, 0, 0, 0]),
            Int32Array.from([1, 1, 0, 1, 1, 0]),
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([1, 0, 1, 1, 0, 1]),
            Int32Array.from([1, 0, 0, 0, 1, 1]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(6, mask6), true);
        const mask7 = [
            Int32Array.from([1, 0, 1, 0, 1, 0]),
            Int32Array.from([0, 0, 0, 1, 1, 1]),
            Int32Array.from([1, 0, 0, 0, 1, 1]),
            Int32Array.from([0, 1, 0, 1, 0, 1]),
            Int32Array.from([1, 1, 1, 0, 0, 0]),
            Int32Array.from([0, 1, 1, 1, 0, 0]),
        ];
        assert.strictEqual(TestGetDataMaskBitInternal(7, mask7), true);
    });
});
