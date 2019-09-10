/*
 * Copyright 2007 ZXing authors
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

/*namespace com.google.zxing.common.reedsolomon {*/

import GenericGFPoly from './GenericGFPoly';
import AbstractGenericGF from './AbstractGenericGF';

import Integer from '../../util/Integer';
import IllegalArgumentException from '../../IllegalArgumentException';
import ArithmeticException from '../../ArithmeticException';

/**
 * <p>This class contains utility methods for performing mathematical operations over
 * the Galois Fields. Operations use a given primitive polynomial in calculations.</p>
 *
 * <p>Throughout this package, elements of the GF are represented as an {@code int}
 * for convenience and speed (but at the cost of memory).
 * </p>
 *
 * @author Sean Owen
 * @author David Olivier
 */
export default class GenericGF extends AbstractGenericGF {
  public static AZTEC_DATA_12 = new GenericGF(0x1069, 4096, 1); // x^12 + x^6 + x^5 + x^3 + 1
  public static AZTEC_DATA_10 = new GenericGF(0x409, 1024, 1); // x^10 + x^3 + 1
  public static AZTEC_DATA_6 = new GenericGF(0x43, 64, 1); // x^6 + x + 1
  public static AZTEC_PARAM = new GenericGF(0x13, 16, 1); // x^4 + x + 1
  public static QR_CODE_FIELD_256 = new GenericGF(0x011d, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
  public static DATA_MATRIX_FIELD_256 = new GenericGF(0x012d, 256, 1); // x^8 + x^5 + x^3 + x^2 + 1
  public static AZTEC_DATA_8 = GenericGF.DATA_MATRIX_FIELD_256;
  public static MAXICODE_FIELD_64 = GenericGF.AZTEC_DATA_6;

  private zero: GenericGFPoly;
  private one: GenericGFPoly;

  /**
   * Create a representation of GF(size) using the given primitive polynomial.
   *
   * @param primitive irreducible polynomial whose coefficients are represented by
   *  the bits of an int, where the least-significant bit represents the constant
   *  coefficient
   * @param size the size of the field
   * @param b the factor b in the generator polynomial can be 0- or 1-based
   *  (g(x) = (x+a^b)(x+a^(b+1))...(x+a^(b+2t-1))).
   *  In most cases it should be 1, but for QR code it is 0.
   */
  public constructor(
    private primitive: number /*int*/,
    private size: number /*int*/,
    private generatorBase: number /*int*/
  ) {
    super();
    const expTable = new Int32Array(size);
    let x = 1;
    for (let i = 0; i < size; i++) {
      expTable[i] = x;
      x *= 2; // we're assuming the generator alpha is 2
      if (x >= size) {
        x ^= primitive;
        x &= size - 1;
      }
    }
    this.expTable = expTable;

    const logTable = new Int32Array(size);
    for (let i = 0; i < size - 1; i++) {
      logTable[expTable[i]] = i;
    }
    this.logTable = logTable;

    // logTable[0] == 0 but this should never be used
    this.zero = new GenericGFPoly(this, Int32Array.from([0]));
    this.one = new GenericGFPoly(this, Int32Array.from([1]));
  }

  public getZero(): GenericGFPoly {
    return this.zero;
  }

  public getOne(): GenericGFPoly {
    return this.one;
  }

  /**
   * @return the monomial representing coefficient * x^degree
   */
  public buildMonomial(
    degree: number /*int*/,
    coefficient: number /*int*/
  ): GenericGFPoly {
    if (degree < 0) {
      throw new IllegalArgumentException();
    }
    if (coefficient === 0) {
      return this.zero;
    }
    const coefficients = new Int32Array(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGFPoly(this, coefficients);
  }

  /**
   * @return multiplicative inverse of a
   */
  public inverse(a: number /*int*/): number /*int*/ {
    if (a === 0) {
      throw new ArithmeticException();
    }
    return this.expTable[this.size - this.logTable[a] - 1];
  }

  /**
   * @return product of a and b in GF(size)
   */
  public multiply(a: number /*int*/, b: number /*int*/): number /*int*/ {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.expTable[
      (this.logTable[a] + this.logTable[b]) % (this.size - 1)
    ];
  }

  public getSize(): number /*int*/ {
    return this.size;
  }

  public getGeneratorBase(): number /*int*/ {
    return this.generatorBase;
  }

  /*@Override*/
  public toString(): string {
    return (
      'GF(0x' + Integer.toHexString(this.primitive) + ',' + this.size + ')'
    );
  }

  public equals(o: Object): boolean {
    return o === this;
  }
}
