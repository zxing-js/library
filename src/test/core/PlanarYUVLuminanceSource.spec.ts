/*
 * Copyright 2014 ZXing authors
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

/*package com.google.zxing;*/

import * as assert from 'assert';
import AssertUtils from './util/AssertUtils';
import { PlanarYUVLuminanceSource } from '@zxing/library';
import { ZXingSystem } from '@zxing/library';

describe('PlanarYUVLuminanceSource', () => {

    const YUV: Uint8ClampedArray = Uint8ClampedArray.from([
        0, 1, 1, 2, 3, 5,
        8, 13, 21, 34, 55, 89,
        0, -1, -1, -2, -3, -5,
        -8, -13, -21, -34, -55, -89,
        127, 127, 127, 127, 127, 127,
        127, 127, 127, 127, 127, 127,
    ]);

    const COLS: number /*int*/ = 6;
    const ROWS: number /*int*/ = 4;
    const Y = new Uint8ClampedArray(COLS * ROWS);

    ZXingSystem.arraycopy(YUV, 0, Y, 0, Y.length);

    it('testNoCrop', () => {
        const source = new PlanarYUVLuminanceSource(YUV, COLS, ROWS, 0, 0, COLS, ROWS, false);
        assertTypedArrayEquals(Y, 0, source.getMatrix(), 0, Y.length);
        for (let r: number /*int*/ = 0; r < ROWS; r++) {
            assertTypedArrayEquals(Y, r * COLS, source.getRow(r, null), 0, COLS);
        }
    });

    it('testCrop', () => {
        const source =
            new PlanarYUVLuminanceSource(YUV, COLS, ROWS, 1, 1, COLS - 2, ROWS - 2, false);
        assert.strictEqual(source.isCropSupported(), true);
        const cropMatrix: Uint8ClampedArray = source.getMatrix();
        for (let r: number /*int*/ = 0; r < ROWS - 2; r++) {
            assertTypedArrayEquals(Y, (r + 1) * COLS + 1, cropMatrix, r * (COLS - 2), COLS - 2);
        }
        for (let r: number /*int*/ = 0; r < ROWS - 2; r++) {
            assertTypedArrayEquals(Y, (r + 1) * COLS + 1, source.getRow(r, null), 0, COLS - 2);
        }
    });

    it('testThumbnail', () => {
        const source =
            new PlanarYUVLuminanceSource(YUV, COLS, ROWS, 0, 0, COLS, ROWS, false);
        AssertUtils.typedArraysAreEqual(
            Int32Array.from([0xFF000000, 0xFF010101, 0xFF030303, 0xFF000000, 0xFFFFFFFF, 0xFFFDFDFD]),
            source.renderThumbnail());
    });

    function assertTypedArrayEquals(expected: Uint8ClampedArray, expectedFrom: number /*int*/,
        actual: Uint8ClampedArray, actualFrom: number /*int*/,
        length: number /*int*/) {
        for (let i: number /*int*/ = 0; i < length; i++) {
            assert.strictEqual(actual[actualFrom + i], expected[expectedFrom + i]);
        }
    }

});
