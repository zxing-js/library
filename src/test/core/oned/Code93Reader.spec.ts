
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

// package com.google.zxing.oned;

import { assertEquals, assertFalse, assertTrue, assertNull } from '../util/AssertUtils';

import { BitArray } from '@zxing/library';
import { BitMatrix } from '@zxing/library';
import { Code93Reader } from '@zxing/library';
import { Result } from '@zxing/library';

function doTest(expectedResult: string, encodedResult: string): void {
    const sut = new Code93Reader();
    const matrix = BitMatrix.parseFromString(encodedResult, '1', '0');
    const row = new BitArray(matrix.getWidth());
    matrix.getRow(0, row);
    const result = sut.decodeRow(0, row, null);
    assertEquals(expectedResult, result.getText());
  }

/**
 * @author Daisuke Makiuchi
 */
 describe('Code93ReaderTestCase', () => {
    it('testDecode', async () => {
        doTest('Code93!\n$%/+ :\u001b;[{\u007f\u0000@`\u007f\u007f\u007f',
        '0000001010111101101000101001100101001011001001100101100101001001100101100100101000010101010000101110101101101010001001001101001101001110010101101011101011011101011101101110100101110101101001110101110110101101010001110110101100010101110110101000110101110110101000101101110110101101001101110110101100101101110110101100110101110110101011011001110110101011001101110110101001101101110110101001110101001100101101010001010111101111'
        );
    });
});