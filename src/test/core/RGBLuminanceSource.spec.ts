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
import { LuminanceSource } from '@zxing/library';
import { RGBLuminanceSource } from '@zxing/library';

describe('RGBLuminanceSource', () => {

    const SOURCE = new RGBLuminanceSource(Int32Array.from([
        0x000000, 0x7F7F7F, 0xFFFFFF,
        0xFF0000, 0x00FF00, 0x0000FF,
        0x0000FF, 0x00FF00, 0xFF0000]), 3, 3);

    it('testCrop', () => {
        assert.strictEqual(SOURCE.isCropSupported(), true);
        const cropped: LuminanceSource = SOURCE.crop(1, 1, 1, 1);
        assert.strictEqual(cropped.getHeight(), 1);
        assert.strictEqual(cropped.getWidth(), 1);
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([0x7F]), cropped.getRow(0, null)), true);
    });

    it('testMatrix', () => {
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([0x00, 0x7F, 0xFF, 0x3F, 0x7F, 0x3F, 0x3F, 0x7F, 0x3F]),
            SOURCE.getMatrix()), true);
        const croppedFullWidth: LuminanceSource = SOURCE.crop(0, 1, 3, 2);
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([0x3F, 0x7F, 0x3F, 0x3F, 0x7F, 0x3F]),
            croppedFullWidth.getMatrix()), true);
        const croppedCorner: LuminanceSource = SOURCE.crop(1, 1, 2, 2);
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([0x7F, 0x3F, 0x7F, 0x3F]),
            croppedCorner.getMatrix()), true);
    });

    it('testGetRow', () => {
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([0x3F, 0x7F, 0x3F]), SOURCE.getRow(2, new Uint8ClampedArray(3))), true);
    });

    it('testToString', () => {
        assert.strictEqual(SOURCE.toString(), '#+ \n#+#\n#+#\n');
    });

});
