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
import SimpleToken from './SimpleToken';

import { short, int } from '../../../customTypings';

export default /*final*/ class BinaryShiftToken extends SimpleToken {

  private /*final*/  binaryShiftStart: short;
  private /*final*/  binaryShiftByteCount: short;

  constructor(
    previous: Token,
    binaryShiftStart: int,
    binaryShiftByteCount: int
  ) {
    super(previous, 0, 0);
    this.binaryShiftStart = <short>binaryShiftStart;
    this.binaryShiftByteCount = <short>binaryShiftByteCount;
  }

  /**
   * @Override
   */
  public appendTo(bitArray: BitArray, text: /*byte[]*/ Uint8Array): void {
    for (let i = 0; i < this.binaryShiftByteCount; i++) {
      if (i === 0 || (i === 31 && this.binaryShiftByteCount <= 62)) {
        // We need a header before the first character, and before
        // character 31 when the total byte code is <= 62
        bitArray.appendBits(31, 5);  // BINARY_SHIFT
        if (this.binaryShiftByteCount > 62) {
          bitArray.appendBits(this.binaryShiftByteCount - 31, 16);
        } else if (i === 0) {
          // 1 <= binaryShiftByteCode <= 62
          bitArray.appendBits(Math.min(this.binaryShiftByteCount, 31), 5);
        } else {
          // 32 <= binaryShiftCount <= 62 and i == 31
          bitArray.appendBits(this.binaryShiftByteCount - 31, 5);
        }
      }
      bitArray.appendBits(text[this.binaryShiftStart + i], 8);
    }
  }

  public /*final*/ addBinaryShift(start: int, byteCount: int): Token {
    // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
    return new BinaryShiftToken(this, start, byteCount);
  }

  /**
   * @Override
   */
  public toString(): string {
    return '<' + this.binaryShiftStart + '::' + (this.binaryShiftStart + this.binaryShiftByteCount - 1) + '>';
  }

}
