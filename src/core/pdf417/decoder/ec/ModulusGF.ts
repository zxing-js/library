

/*
 * Copyright 2012 ZXing authors
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

// package com.google.zxing.pdf417.decoder.ec;

// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../../PDF417Common';

import ModulusPoly from './ModulusPoly';

import IllegalArgumentException from '../../../IllegalArgumentException';
import ModulusBase from './ModulusBase';


/**
 * <p>A field based on powers of a generator integer, modulo some modulus.</p>
 *
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.GenericGF
 */
export default /*public final*/ class ModulusGF extends ModulusBase {

  public static /*final*/ PDF417_GF: ModulusGF = new ModulusGF(PDF417Common.NUMBER_OF_CODEWORDS, 3);

  // private /*final*/ expTable: Int32Array;
  // private /*final*/ logTable: Int32Array;
  private /*final*/ zero: ModulusPoly;
  private /*final*/ one: ModulusPoly;
  // private /*final*/ modulus: /*int*/ number;

  private constructor(modulus: /*int*/ number, generator: /*int*/ number) {
    super();
    this.modulus = modulus;
    this.expTable = new Int32Array(modulus);
    this.logTable = new Int32Array(modulus);
    let x: /*int*/ number = 1;
    for (let i /*int*/ = 0; i < modulus; i++) {
      this.expTable[i] = x;
      x = (x * generator) % modulus;
    }
    for (let i /*int*/ = 0; i < modulus - 1; i++) {
      this.logTable[this.expTable[i]] = i;
    }
    // logTable[0] == 0 but this should never be used
    this.zero = new ModulusPoly(this, new Int32Array([0]));
    this.one = new ModulusPoly(this, new Int32Array([1]));
  }


  getZero(): ModulusPoly {
    return this.zero;
  }

  getOne(): ModulusPoly {
    return this.one;
  }

  buildMonomial(degree: /*int*/ number, coefficient: /*int*/ number): ModulusPoly {
    if (degree < 0) {
      throw new IllegalArgumentException();
    }
    if (coefficient === 0) {
      return this.zero;
    }
    let coefficients: Int32Array = new Int32Array(degree + 1);
    coefficients[0] = coefficient;
    return new ModulusPoly(this, coefficients);
  }

}
