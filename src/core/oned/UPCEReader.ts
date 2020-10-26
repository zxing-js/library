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

import UPCEANReader from './UPCEANReader';
import BitArray from '../common/BitArray';
import StringBuilder from '../util/StringBuilder';
import NotFoundException from '../NotFoundException';
import BarcodeFormat from '../BarcodeFormat';
import { int, char } from 'src/customTypings';

// package com.google.zxing.oned;

// import com.google.zxing.BarcodeFormat;
// import com.google.zxing.FormatException;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.common.BitArray;

/**
 * <p>Implements decoding of the UPC-E format.</p>
 * <p><a href="http://www.barcodeisland.com/upce.phtml">This</a> is a great reference for
 * UPC-E information.</p>
 *
 * @author Sean Owen
 *
 * @source https://github.com/zxing/zxing/blob/3c96923276dd5785d58eb970b6ba3f80d36a9505/core/src/main/java/com/google/zxing/oned/UPCEReader.java
 *
 * @experimental
 */
export default /* final */ class UPCEReader extends UPCEANReader {

  /**
   * The pattern that marks the middle, and end, of a UPC-E pattern.
   * There is no "second half" to a UPC-E barcode.
   */
  private static /*final*/ MIDDLE_END_PATTERN: Int32Array = Int32Array.from([1, 1, 1, 1, 1, 1]);

  // For an UPC-E barcode, the final digit is represented by the parities used
  // to encode the middle six digits, according to the table below.
  //
  //                Parity of next 6 digits
  //    Digit   0     1     2     3     4     5
  //       0    Even   Even  Even Odd  Odd   Odd
  //       1    Even   Even  Odd  Even Odd   Odd
  //       2    Even   Even  Odd  Odd  Even  Odd
  //       3    Even   Even  Odd  Odd  Odd   Even
  //       4    Even   Odd   Even Even Odd   Odd
  //       5    Even   Odd   Odd  Even Even  Odd
  //       6    Even   Odd   Odd  Odd  Even  Even
  //       7    Even   Odd   Even Odd  Even  Odd
  //       8    Even   Odd   Even Odd  Odd   Even
  //       9    Even   Odd   Odd  Even Odd   Even
  //
  // The encoding is represented by the following array, which is a bit pattern
  // using Odd = 0 and Even = 1. For example, 5 is represented by:
  //
  //              Odd Even Even Odd Odd Even
  // in binary:
  //                0    1    1   0   0    1   == 0x19
  //

  /**
   * See {@link #L_AND_G_PATTERNS}; these values similarly represent patterns of
   * even-odd parity encodings of digits that imply both the number system (0 or 1)
   * used, and the check digit.
   */
  static /*final*/  NUMSYS_AND_CHECK_DIGIT_PATTERNS: Int32Array[] = [
    Int32Array.from([0x38, 0x34, 0x32, 0x31, 0x2C, 0x26, 0x23, 0x2A, 0x29, 0x25]),
    Int32Array.from([0x07, 0x0B, 0x0D, 0x0E, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1]),
  ];

  private /*final*/  decodeMiddleCounters: Int32Array;

  public constructor() {
    super();
    this.decodeMiddleCounters = new Int32Array(4);
  }

  /**
   * @throws NotFoundException
   */
  // @Override
  public decodeMiddle(row: BitArray, startRange: Int32Array, result: string) {
    const counters: Int32Array = this.decodeMiddleCounters.map(x => x);
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;
    const end: int = row.getSize();
    let rowOffset: int = startRange[1];

    let lgPatternFound: int = 0;

    for (let x: int = 0; x < 6 && rowOffset < end; x++) {
      const bestMatch: int = UPCEReader.decodeDigit(row, counters, rowOffset, UPCEReader.L_AND_G_PATTERNS);
      result += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
      for (let counter of counters) {
        rowOffset += counter;
      }
      if (bestMatch >= 10) {
        lgPatternFound |= 1 << (5 - x);
      }
    }

    UPCEReader.determineNumSysAndCheckDigit(new StringBuilder(result), lgPatternFound);

    return rowOffset;
  }

  /**
   * @throws NotFoundException
   */
  // @Override
  protected decodeEnd(row: BitArray, endStart: int): Int32Array {
    return UPCEReader.findGuardPatternWithoutCounters(row, endStart, true, UPCEReader.MIDDLE_END_PATTERN);
  }

  /**
   * @throws FormatException
   */
  // @Override
  protected checkChecksum(s: string): boolean {
    return UPCEANReader.checkChecksum(UPCEReader.convertUPCEtoUPCA(s));
  }

  /**
   * @throws NotFoundException
   */
  private static determineNumSysAndCheckDigit(resultString: StringBuilder, lgPatternFound: int): void {

    for (let numSys: int = 0; numSys <= 1; numSys++) {
      for (let d: int = 0; d < 10; d++) {
        if (lgPatternFound === this.NUMSYS_AND_CHECK_DIGIT_PATTERNS[numSys][d]) {
          resultString.insert(0, /*(char)*/('0' + numSys));
          resultString.append(/*(char)*/('0' + d));
          return;
        }
      }
    }
    throw NotFoundException.getNotFoundInstance();
  }

  // @Override
  getBarcodeFormat(): BarcodeFormat {
    return BarcodeFormat.UPC_E;
  }

  /**
   * Expands a UPC-E value back into its full, equivalent UPC-A code value.
   *
   * @param upce UPC-E code as string of digits
   * @return equivalent UPC-A code as string of digits
   */
  public static convertUPCEtoUPCA(upce: string): string {
    // the following line is equivalent to upce.getChars(1, 7, upceChars, 0);
    const upceChars = upce.slice(1, 7).split('').map(x => x.charCodeAt(0));
    const result: StringBuilder = new StringBuilder(/*12*/);
    result.append(upce.charAt(0));
    let lastChar: char = upceChars[5];
    switch (lastChar) {
      case 0:
      case 1:
      case 2:
        result.appendChars(upceChars, 0, 2);
        result.append(lastChar);
        result.append('0000');
        result.appendChars(upceChars, 2, 3);
        break;
      case 3:
        result.appendChars(upceChars, 0, 3);
        result.append('00000');
        result.appendChars(upceChars, 3, 2);
        break;
      case 4:
        result.appendChars(upceChars, 0, 4);
        result.append('00000');
        result.append(upceChars[4]);
        break;
      default:
        result.appendChars(upceChars, 0, 5);
        result.append('0000');
        result.append(lastChar);
        break;
    }
    // Only append check digit in conversion if supplied
    if (upce.length >= 8) {
      result.append(upce.charAt(7));
    }
    return result.toString();
  }

}
