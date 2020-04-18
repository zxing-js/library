/*
* Copyright 2013 ZXing authors
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

// package com.google.zxing.aztec.encoder;

// import com.google.zxing.common.BitArray;
import BitArray from '../../common/BitArray';

import Token from './Token';
import Integer from '../../util/Integer';

import { short, int } from '../../../customTypings';

export default /*final*/ class SimpleToken extends Token {

  // For normal words, indicates value and bitCount
  private /*final*/ value: short;
  private /*final*/ bitCount: short;

  constructor(previous: Token, value: int, bitCount: int) {
    super(previous);
    this.value = <short>value;
    this.bitCount = <short>bitCount;
  }

  /**
   * @Override
   */
  appendTo(bitArray: BitArray, text: /*byte[]*/Uint8Array): void {
    bitArray.appendBits(this.value, this.bitCount);
  }

  public /*final*/ add(value: int, bitCount: int): Token {
    return new SimpleToken(this, value, bitCount);
  }

  public /*final*/ addBinaryShift(start: int, byteCount: int): Token {
    // no-op can't binary shift a simple token
    console.warn('addBinaryShift on SimpleToken, this simply returns a copy of this token');
    return new SimpleToken(this, start, byteCount);
  }

  /**
   * @Override
   */
  public toString(): String {
    let value: int = this.value & ((1 << this.bitCount) - 1);
    value |= 1 << this.bitCount;
    return '<' + Integer.toBinaryString(value | (1 << this.bitCount)).substring(1) + '>';
  }

}
