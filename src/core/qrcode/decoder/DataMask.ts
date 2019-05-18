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

/*namespace com.google.zxing.qrcode.decoder {*/

import BitMatrix from '../../common/BitMatrix';

export enum DataMaskValues {
  DATA_MASK_000,
  DATA_MASK_001,
  DATA_MASK_010,
  DATA_MASK_011,
  DATA_MASK_100,
  DATA_MASK_101,
  DATA_MASK_110,
  DATA_MASK_111
}

/**
 * <p>Encapsulates data masks for the data bits in a QR code, per ISO 18004:2006 6.8. Implementations
 * of this class can un-mask a raw BitMatrix. For simplicity, they will unmask the entire BitMatrix,
 * including areas used for finder patterns, timing patterns, etc. These areas should be unused
 * after the point they are unmasked anyway.</p>
 *
 * <p>Note that the diagram in section 6.8.1 is misleading since it indicates that i is column position
 * and j is row position. In fact, as the text says, i is row position and j is column position.</p>
 *
 * @author Sean Owen
 */
export default class DataMask {

  // See ISO 18004:2006 6.8.1

  public constructor(private value: DataMaskValues, private isMasked: (i: number, j: number) => boolean) {
  }

  public static values = new Map<DataMaskValues, DataMask>([
    /**
     * 000: mask bits for which (x + y) mod 2 == 0
     */
    [DataMaskValues.DATA_MASK_000, new DataMask(DataMaskValues.DATA_MASK_000, (i: number /*int*/, j: number /*int*/) => { return ((i + j) & 0x01) === 0; })],

    /**
     * 001: mask bits for which x mod 2 == 0
     */
    [DataMaskValues.DATA_MASK_001, new DataMask(DataMaskValues.DATA_MASK_001, (i: number /*int*/, j: number /*int*/) => { return (i & 0x01) === 0; })],

    /**
     * 010: mask bits for which y mod 3 == 0
     */
    [DataMaskValues.DATA_MASK_010, new DataMask(DataMaskValues.DATA_MASK_010, (i: number /*int*/, j: number /*int*/) => { return j % 3 === 0; })],

    /**
     * 011: mask bits for which (x + y) mod 3 == 0
     */
    [DataMaskValues.DATA_MASK_011, new DataMask(DataMaskValues.DATA_MASK_011, (i: number /*int*/, j: number /*int*/) => { return (i + j) % 3 === 0; })],

    /**
     * 100: mask bits for which (x/2 + y/3) mod 2 == 0
     */
    [DataMaskValues.DATA_MASK_100, new DataMask(DataMaskValues.DATA_MASK_100, (i: number /*int*/, j: number /*int*/) => { return ((Math.floor(i / 2) + Math.floor(j / 3)) & 0x01) === 0; })],

    /**
     * 101: mask bits for which xy mod 2 + xy mod 3 == 0
     * equivalently, such that xy mod 6 == 0
     */
    [DataMaskValues.DATA_MASK_101, new DataMask(DataMaskValues.DATA_MASK_101, (i: number /*int*/, j: number /*int*/) => { return (i * j) % 6 === 0; })],

    /**
     * 110: mask bits for which (xy mod 2 + xy mod 3) mod 2 == 0
     * equivalently, such that xy mod 6 < 3
     */
    [DataMaskValues.DATA_MASK_110, new DataMask(DataMaskValues.DATA_MASK_110, (i: number /*int*/, j: number /*int*/) => { return ((i * j) % 6) < 3; })],

    /**
     * 111: mask bits for which ((x+y)mod 2 + xy mod 3) mod 2 == 0
     * equivalently, such that (x + y + xy mod 3) mod 2 == 0
     */
    [DataMaskValues.DATA_MASK_111, new DataMask(DataMaskValues.DATA_MASK_111, (i: number /*int*/, j: number /*int*/) => { return ((i + j + ((i * j) % 3)) & 0x01) === 0; })],
  ]);

  // End of enum constants.


  /**
   * <p>Implementations of this method reverse the data masking process applied to a QR Code and
   * make its bits ready to read.</p>
   *
   * @param bits representation of QR Code bits
   * @param dimension dimension of QR Code, represented by bits, being unmasked
   */
  public unmaskBitMatrix(bits: BitMatrix, dimension: number /*int*/): void {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  }

  // abstract boolean isMasked(i: number /*int*/, j: number /*int*/);

}
