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

// package com.google.zxing.pdf417.decoder;

// import com.google.zxing.common.detector.MathUtils;
import MathUtils from '../../common/detector/MathUtils';
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';

import Float from '../../util/Float';
import { int, float } from '../../../customTypings';

/**
 * @author Guenther Grau
 * @author creatale GmbH (christoph.schulz@creatale.de)
 */
export default /*final*/ class PDF417CodewordDecoder {

  // flag that the table is ready for use
  private static bSymbolTableReady: boolean = false;

  private static /*final float[][]*/ RATIOS_TABLE: number[][] =
      new Array(PDF417Common.SYMBOL_TABLE.length).map(x => x = new Array(PDF417Common.BARS_IN_MODULE));

  /* @note
   * this action have to be performed before first use of class
   * - static constructor
   * working with 32bit float (based from Java logic)
  */
  static initialize() {
     // Pre-computes the symbol ratio table.
    for (/*int*/let i = 0; i < PDF417Common.SYMBOL_TABLE.length; i++) {
      let currentSymbol: int = PDF417Common.SYMBOL_TABLE[i];
      let currentBit: int = currentSymbol & 0x1;
      for (/*int*/ let j = 0; j < PDF417Common.BARS_IN_MODULE; j++) {
        let size: float = 0.0;
        while ((currentSymbol & 0x1) === currentBit) {
          size += 1.0;
          currentSymbol >>= 1;
        }
        currentBit = currentSymbol & 0x1;
        if (!PDF417CodewordDecoder.RATIOS_TABLE[i]) {
          PDF417CodewordDecoder.RATIOS_TABLE[i] = new Array(PDF417Common.BARS_IN_MODULE);
        }
        PDF417CodewordDecoder.RATIOS_TABLE[i][PDF417Common.BARS_IN_MODULE - j - 1] = Math.fround(size / PDF417Common.MODULES_IN_CODEWORD);
      }
    }
    this.bSymbolTableReady = true;
  }

  static getDecodedValue(moduleBitCount: Int32Array): int {
   let decodedValue: int = PDF417CodewordDecoder.getDecodedCodewordValue(PDF417CodewordDecoder.sampleBitCounts(moduleBitCount));
   if (decodedValue !== -1) {
      return decodedValue;
   }
    return PDF417CodewordDecoder.getClosestDecodedValue(moduleBitCount);
  }

  private static sampleBitCounts(moduleBitCount: Int32Array): Int32Array {
    let bitCountSum: float = MathUtils.sum(moduleBitCount);
    let result: Int32Array = new Int32Array(PDF417Common.BARS_IN_MODULE);
    let bitCountIndex: int = 0;
    let sumPreviousBits: int = 0;
    for (/*int*/ let i = 0; i < PDF417Common.MODULES_IN_CODEWORD; i++) {
      let sampleIndex: float =
          bitCountSum / (2 * PDF417Common.MODULES_IN_CODEWORD) +
          (i * bitCountSum) / PDF417Common.MODULES_IN_CODEWORD;
      if (sumPreviousBits + moduleBitCount[bitCountIndex] <= sampleIndex) {
        sumPreviousBits += moduleBitCount[bitCountIndex];
        bitCountIndex++;
      }
      result[bitCountIndex]++;
    }
    return result;
  }

  private static getDecodedCodewordValue(moduleBitCount: Int32Array): int {
    let decodedValue: int = PDF417CodewordDecoder.getBitValue(moduleBitCount);
    return PDF417Common.getCodeword(decodedValue) === -1 ? -1 : decodedValue;
  }

  private static getBitValue(moduleBitCount: Int32Array): int {
    let result: /*long*/ number = 0;
    for (let /*int*/ i = 0; i < moduleBitCount.length; i++) {
      for (/*int*/ let bit = 0; bit < moduleBitCount[i]; bit++) {
        result = (result << 1) | (i % 2 === 0 ? 1 : 0);
      }
    }
    return <int> Math.trunc(result);
  }

  // working with 32bit float (as in Java)
  private static getClosestDecodedValue(moduleBitCount: Int32Array): int {
    let bitCountSum: int = MathUtils.sum(moduleBitCount);
    let bitCountRatios: float[] = new Array(PDF417Common.BARS_IN_MODULE);
    if (bitCountSum > 1) {
      for (let /*int*/ i = 0; i < bitCountRatios.length; i++) {
        bitCountRatios[i] = Math.fround(moduleBitCount[i] / <float>bitCountSum);
      }
    }
    let bestMatchError: float = Float.MAX_VALUE;
    let bestMatch: int = -1;
    if (!this.bSymbolTableReady) {
      PDF417CodewordDecoder.initialize();
    }
    for (/*int*/ let j = 0; j < PDF417CodewordDecoder.RATIOS_TABLE.length; j++) {
      let error: float = 0.0;
      let ratioTableRow: float[] = PDF417CodewordDecoder.RATIOS_TABLE[j];
      for (/*int*/ let k = 0; k < PDF417Common.BARS_IN_MODULE; k++) {
        let diff: float = Math.fround(ratioTableRow[k] - bitCountRatios[k]);
        error += Math.fround(diff * diff);
        if (error >= bestMatchError) {
          break;
        }
      }
      if (error < bestMatchError) {
        bestMatchError = error;
        bestMatch = PDF417Common.SYMBOL_TABLE[j];
      }
    }
    return bestMatch;
  }

}
