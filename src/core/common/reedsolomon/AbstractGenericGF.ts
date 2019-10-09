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

// import GenericGFPoly from './GenericGFPoly';

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
export default abstract class AbstractGenericGF {
  protected expTable: Int32Array;
  protected logTable: Int32Array;

  public abstract getZero(): any; // GenericGFPoly
  public abstract buildMonomial(
    degree: number /*int*/,
    coefficient: number /*int*/
  ): any; // GenericGFPoly
  public abstract equals(o: Object): boolean;
  public abstract multiply(a: number /*int*/, b: number /*int*/): number;
  public abstract inverse(a: number /*int*/): number;

  /**
   * @return 2 to the power of a in GF(size)
   */
  public exp(a: number): number /*int*/ {
    return this.expTable[a];
  }

  /**
   * @return base 2 log of a in GF(size)
   */
  public log(a: number /*int*/): number /*int*/ {
    if (a === 0) {
      throw new IllegalArgumentException();
    }
    return this.logTable[a];
  }

  /**
   * Implements both addition and subtraction -- they are the same in GF(size).
   *
   * @return sum/difference of a and b
   */
  public static addOrSubtract(
    a: number /*int*/,
    b: number /*int*/
  ): number /*int*/ {
    return a ^ b;
  }
}
