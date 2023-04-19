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
import AssertUtils from '../util/AssertUtils';
import { BitMatrix } from '@zxing/library';
import { BitArray } from '@zxing/library';

import { ZXingStringBuilder } from '@zxing/library';
import { IllegalArgumentException } from '@zxing/library';


/**
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
describe('BitMatrix', () => {

  const BIT_MATRIX_POINTS = [1, 2, 2, 0, 3, 1];

  it('testGetSet', () => {
    const matrix: BitMatrix = new BitMatrix(33);
    assert.strictEqual(33, matrix.getHeight());
    for (let y: number /*int*/ = 0; y < 33; y++) {
      for (let x: number /*int*/ = 0; x < 33; x++) {
        if (y * x % 3 === 0) {
          matrix.set(x, y);
        }
      }
    }
    for (let y: number /*int*/ = 0; y < 33; y++) {
      for (let x: number /*int*/ = 0; x < 33; x++) {
        const expected = y * x % 3 === 0;
        const value = matrix.get(x, y);
        assert.strictEqual(value, expected);
      }
    }
  });

  it('testSetRegion', () => {
    const matrix: BitMatrix = new BitMatrix(5);
    matrix.setRegion(1, 1, 3, 3);
    for (let y: number /*int*/ = 0; y < 5; y++) {
      for (let x: number /*int*/ = 0; x < 5; x++) {
        assert.strictEqual(y >= 1 && y <= 3 && x >= 1 && x <= 3, matrix.get(x, y));
      }
    }
  });

  it('testEnclosing', () => {
    const matrix: BitMatrix = new BitMatrix(5);
    assert.strictEqual(null === (matrix.getEnclosingRectangle()), true);
    matrix.setRegion(1, 1, 1, 1);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([1, 1, 1, 1]), matrix.getEnclosingRectangle()), true);
    matrix.setRegion(1, 1, 3, 2);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([1, 1, 3, 2]), matrix.getEnclosingRectangle()), true);
    matrix.setRegion(0, 0, 5, 5);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([0, 0, 5, 5]), matrix.getEnclosingRectangle()), true);
  });

  it('testOnBit', () => {
    const matrix: BitMatrix = new BitMatrix(5);
    assert.strictEqual(null === (matrix.getTopLeftOnBit()), true);
    assert.strictEqual(null === (matrix.getBottomRightOnBit()), true);
    matrix.setRegion(1, 1, 1, 1);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([1, 1]), matrix.getTopLeftOnBit()), true);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([1, 1]), matrix.getBottomRightOnBit()), true);
    matrix.setRegion(1, 1, 3, 2);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([1, 1]), matrix.getTopLeftOnBit()), true);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([3, 2]), matrix.getBottomRightOnBit()), true);
    matrix.setRegion(0, 0, 5, 5);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([0, 0]), matrix.getTopLeftOnBit()), true);
    assert.strictEqual(AssertUtils.typedArraysAreEqual(Int32Array.from([4, 4]), matrix.getBottomRightOnBit()), true);
  });

  it('testRectangularMatrix', () => {
    const matrix: BitMatrix = new BitMatrix(75, 20);
    assert.strictEqual(75, matrix.getWidth());
    assert.strictEqual(20, matrix.getHeight());
    matrix.set(10, 0);
    matrix.set(11, 1);
    matrix.set(50, 2);
    matrix.set(51, 3);
    matrix.flip(74, 4);
    matrix.flip(0, 5);

    // Should all be on
    assert.strictEqual((matrix.get(10, 0)), true);
    assert.strictEqual((matrix.get(11, 1)), true);
    assert.strictEqual((matrix.get(50, 2)), true);
    assert.strictEqual((matrix.get(51, 3)), true);
    assert.strictEqual((matrix.get(74, 4)), true);
    assert.strictEqual((matrix.get(0, 5)), true);

    // Flip a couple back off
    matrix.flip(50, 2);
    matrix.flip(51, 3);
    assert.strictEqual((matrix.get(50, 2)), false);
    assert.strictEqual((matrix.get(51, 3)), false);
  });

  it('testRectangularSetRegion', () => {
    const matrix: BitMatrix = new BitMatrix(320, 240);
    assert.strictEqual(320, matrix.getWidth());
    assert.strictEqual(240, matrix.getHeight());
    matrix.setRegion(105, 22, 80, 12);

    // Only bits in the region should be on
    for (let y: number /*int*/ = 0; y < 240; y++) {
      for (let x: number /*int*/ = 0; x < 320; x++) {
        assert.strictEqual(y >= 22 && y < 34 && x >= 105 && x < 185, matrix.get(x, y));
      }
    }
  });

  it('testGetRow', () => {
    const matrix: BitMatrix = new BitMatrix(102, 5);
    for (let x: number /*int*/ = 0; x < 102; x++) {
      if ((x & 0x03) === 0) {
        matrix.set(x, 2);
      }
    }

    // Should allocate
    const array: BitArray = matrix.getRow(2, null);
    assert.strictEqual(array.getSize(), 102);

    // Should reallocate
    let array2: BitArray = new BitArray(60);
    array2 = matrix.getRow(2, array2);
    assert.strictEqual(array2.getSize(), 102);

    // Should use provided object, with original BitArray size
    let array3: BitArray = new BitArray(200);
    array3 = matrix.getRow(2, array3);
    assert.strictEqual(array3.getSize(), 200);

    for (let x: number /*int*/ = 0; x < 102; x++) {
      const on: boolean = (x & 0x03) === 0;
      assert.strictEqual(on, array.get(x));
      assert.strictEqual(on, array2.get(x));
      assert.strictEqual(on, array3.get(x));
    }
  });


  it('testSetRow', () => {
    const a = new BitMatrix(33);
    a.set(1, 0);
    a.set(2, 0);
    a.set(31, 32);
    a.set(32, 32);

    const b = new BitMatrix(33);
    b.setRow(0, a.getRow(0));
    b.setRow(1, a.getRow(0));
    b.setRow(31, a.getRow(32));
    b.setRow(32, a.getRow(32));

    assert.strictEqual(b.get(1, 0), true);
    assert.strictEqual(b.get(2, 0), true);
    assert.strictEqual(b.get(3, 0), false);

    assert.strictEqual(b.get(1, 1), true);
    assert.strictEqual(b.get(2, 1), true);
    assert.strictEqual(b.get(3, 1), false);

    assert.strictEqual(b.get(30, 31), false);
    assert.strictEqual(b.get(31, 31), true);
    assert.strictEqual(b.get(32, 31), true);

    assert.strictEqual(b.get(30, 32), false);
    assert.strictEqual(b.get(31, 32), true);
    assert.strictEqual(b.get(32, 32), true);
  });

  it('testRotate180Simple', () => {
    const matrix: BitMatrix = new BitMatrix(3, 3);
    matrix.set(0, 0);
    matrix.set(0, 1);
    matrix.set(1, 2);
    matrix.set(2, 1);

    matrix.rotate180();

    assert.strictEqual((matrix.get(2, 2)), true);
    assert.strictEqual((matrix.get(2, 1)), true);
    assert.strictEqual((matrix.get(1, 0)), true);
    assert.strictEqual((matrix.get(0, 1)), true);
  });

  it('testRotate180', () => {
    testRotate180(7, 4);
    testRotate180(7, 5);
    testRotate180(8, 4);
    testRotate180(8, 5);
  });

  it('testParse', () => {
    const emptyMatrix: BitMatrix = new BitMatrix(3, 3);
    const fullMatrix: BitMatrix = new BitMatrix(3, 3);
    fullMatrix.setRegion(0, 0, 3, 3);
    const centerMatrix: BitMatrix = new BitMatrix(3, 3);
    centerMatrix.setRegion(1, 1, 1, 1);
    const emptyMatrix24: BitMatrix = new BitMatrix(2, 4);

    assert.strictEqual(BitMatrix.parseFromString('   \n   \n   \n', 'x', ' ').equals(emptyMatrix), true);
    assert.strictEqual(BitMatrix.parseFromString('   \n   \r\r\n   \n\r', 'x', ' ').equals(emptyMatrix), true);
    assert.strictEqual(BitMatrix.parseFromString('   \n   \n   ', 'x', ' ').equals(emptyMatrix), true);

    assert.strictEqual(BitMatrix.parseFromString('xxx\nxxx\nxxx\n', 'x', ' ').equals(fullMatrix), true);

    assert.strictEqual(BitMatrix.parseFromString('   \n x \n   \n', 'x', ' ').equals(centerMatrix), true);
    assert.strictEqual(BitMatrix.parseFromString('      \n  x   \n      \n', 'x ', '  ').equals(centerMatrix), true);
    try {
      BitMatrix.parseFromString('   \n xy\n   \n', 'x', ' ');
      assert.ok(false);
    } catch (ex) {
      if (!(ex instanceof IllegalArgumentException)) {
        assert.ok(false);
      }
    }

    assert.strictEqual(BitMatrix.parseFromString('  \n  \n  \n  \n', 'x', ' ').equals(emptyMatrix24), true);

    assert.strictEqual(BitMatrix.parseFromString(centerMatrix.toString('x', '.'), 'x', '.').equals(centerMatrix), true);
  });

  it('testClone', () => {
    const matrix: BitMatrix = new BitMatrix(33);
    matrix.set(0, 0);
    matrix.set(32, 32);
    const clone: BitMatrix = matrix.clone();
    assert.strictEqual(clone.equals(matrix), true);
  });

  it('testUnset', () => {
    const emptyMatrix: BitMatrix = new BitMatrix(3, 3);
    const matrix: BitMatrix = emptyMatrix.clone();
    matrix.set(1, 1);
    assert.strictEqual(matrix.equals(emptyMatrix), false);
    matrix.unset(1, 1);
    assert.strictEqual(matrix.equals(emptyMatrix), true);
    matrix.unset(1, 1);
    assert.strictEqual(matrix.equals(emptyMatrix), true);
  });

  it('testXOR', () => {
    const emptyMatrix: BitMatrix = new BitMatrix(3, 3);
    const fullMatrix: BitMatrix = new BitMatrix(3, 3);
    fullMatrix.setRegion(0, 0, 3, 3);
    const centerMatrix: BitMatrix = new BitMatrix(3, 3);
    centerMatrix.setRegion(1, 1, 1, 1);
    const invertedCenterMatrix: BitMatrix = fullMatrix.clone();
    invertedCenterMatrix.unset(1, 1);
    const badMatrix: BitMatrix = new BitMatrix(4, 4);

    testXOR(emptyMatrix, emptyMatrix, emptyMatrix);
    testXOR(emptyMatrix, centerMatrix, centerMatrix);
    testXOR(emptyMatrix, fullMatrix, fullMatrix);

    testXOR(centerMatrix, emptyMatrix, centerMatrix);
    testXOR(centerMatrix, centerMatrix, emptyMatrix);
    testXOR(centerMatrix, fullMatrix, invertedCenterMatrix);

    testXOR(invertedCenterMatrix, emptyMatrix, invertedCenterMatrix);
    testXOR(invertedCenterMatrix, centerMatrix, fullMatrix);
    testXOR(invertedCenterMatrix, fullMatrix, centerMatrix);

    testXOR(fullMatrix, emptyMatrix, fullMatrix);
    testXOR(fullMatrix, centerMatrix, invertedCenterMatrix);
    testXOR(fullMatrix, fullMatrix, emptyMatrix);

    try {
      emptyMatrix.clone().xor(badMatrix);
      assert.ok(false);
    } catch (ex) {
      if (!(ex instanceof IllegalArgumentException)) {
        assert.ok(false);
      }
    }

    try {
      badMatrix.clone().xor(emptyMatrix);
      assert.ok(false);
    } catch (ex) {
      if (!(ex instanceof IllegalArgumentException)) {
        assert.ok(false);
      }
    }

    function matrixToString(result: BitMatrix): string {
      assert.strictEqual(1, result.getHeight());
      const builder: ZXingStringBuilder = new ZXingStringBuilder(); // result.getWidth())
      for (let i: number /*int*/ = 0; i < result.getWidth(); i++) {
        builder.append(result.get(i, 0) ? '1' : '0');
      }
      return builder.toString();
    }

    try {
      badMatrix.clone().xor(emptyMatrix);
      assert.ok(false);
    } catch (ex) {
      if (!(ex instanceof IllegalArgumentException)) {
        assert.ok(false);
      }
    }
  });

  // function matrixToString(result: BitMatrix): string {
  //     assert.strictEqual(1, result.getHeight());
  //     const builder: StringBuilder = new StringBuilder(); // result.getWidth())
  //     for (let i: number /*int*/ = 0; i < result.getWidth(); i++) {
  //         builder.append(result.get(i, 0) ? '1' : '0');
  //     }
  //     return builder.toString();
  // }

  function testXOR(dataMatrix: BitMatrix, flipMatrix: BitMatrix, expectedMatrix: BitMatrix): void {
    const matrix: BitMatrix = dataMatrix.clone();
    matrix.xor(flipMatrix);
    assert.strictEqual(matrix.equals(expectedMatrix), true);
  }

  function testRotate180(width: number /*int*/, height: number /*int*/): void {
    const input: BitMatrix = getInput(width, height);
    input.rotate180();
    const expected: BitMatrix = getExpected(width, height);

    for (let y: number /*int*/ = 0; y < height; y++) {
      for (let x: number /*int*/ = 0; x < width; x++) {
        assert.strictEqual(input.get(x, y), expected.get(x, y), '(' + x + ',' + y + ')');
      }
    }
  }

  function getExpected(width: number /*int*/, height: number /*int*/): BitMatrix {
    const result: BitMatrix = new BitMatrix(width, height);
    for (let i: number /*int*/ = 0; i < BIT_MATRIX_POINTS.length; i += 2) {
      result.set(width - 1 - BIT_MATRIX_POINTS[i], height - 1 - BIT_MATRIX_POINTS[i + 1]);
    }
    return result;
  }

  function getInput(width: number /*int*/, height: number /*int*/): BitMatrix {
    const result: BitMatrix = new BitMatrix(width, height);
    for (let i: number /*int*/ = 0; i < BIT_MATRIX_POINTS.length; i += 2) {
      result.set(BIT_MATRIX_POINTS[i], BIT_MATRIX_POINTS[i + 1]);
    }
    return result;
  }

});
