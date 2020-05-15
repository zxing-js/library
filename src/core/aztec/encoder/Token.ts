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

import { int } from '../../../customTypings';

export default abstract class Token {

  private /*final*/ previous: Token;

  constructor(previous: Token) {
    this.previous = previous;
  }

  public /*final*/ getPrevious(): Token {
    return this.previous;
  }

  public /*final*/ abstract add(value: int, bitCount: int): Token;

  public /*final*/ abstract addBinaryShift(start: int, byteCount: int): Token;

  public abstract appendTo(bitArray: BitArray, text: /*byte[]*/Uint8Array): void;

}
