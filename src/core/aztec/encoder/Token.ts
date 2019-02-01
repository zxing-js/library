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

import SimpleToken from './SimpleToken';
import BinaryShiftToken from './BinaryShiftToken';

export default abstract class Token {

  static /*final*/ EMPTY: Token = new SimpleToken(null, 0, 0);

  private /*final*/ previous: Token;

  constructor(previous: Token) {
    this.previous = previous;
  }

  public /*final*/ getPrevious(): Token {
    return this.previous;
  }

  public /*final*/ add(value: int, bitCount: int): Token {
    return new SimpleToken(this, value, bitCount);
  }

  public /*final*/ addBinaryShift(start: int, byteCount: int): Token {
    // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
    return new BinaryShiftToken(this, start, byteCount);
  }

  public abstract appendTo(bitArray: BitArray, text: /*byte[]*/Uint8Array): void;

}
