/*
 * Copyright 2010 ZXing authors
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

/*namespace com.google.zxing.oned {*/

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import ChecksumException from '../ChecksumException';
import DecodeHintType from '../DecodeHintType';
import FormatException from '../FormatException';
import NotFoundException from '../NotFoundException';
import OneDReader from './OneDReader';
import Result from '../Result';
//import com.google.zxing.ResultMetadataType;
import ResultPoint from '../ResultPoint';


/**
 * <p>Decodes Code 93 barcodes.</p>
 *
 * @author Sean Owen
 * @see Code39Reader
 */
 export default class Code93Reader extends OneDReader {

  // Note that 'abcd' are dummy characters in place of control characters.
  private static readonly ALPHABET_STRING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*";

  /**
   * These represent the encodings of characters, as patterns of wide and narrow bars.
   * The 9 least-significant bits of each int correspond to the pattern of wide and narrow.
   */
  private static readonly CHARACTER_ENCODINGS: number[] = [
      0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A, // 0-9
      0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134, // A-J
      0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6, // K-T
      0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A, // U-Z
      0x12E, 0x1D4, 0x1D2, 0x1CA, 0x16E, 0x176, 0x1AE, // - - %
      0x126, 0x1DA, 0x1D6, 0x132, 0x15E, // Control chars? $-*
  ];
  private static readonly ASTERISK_ENCODING = Code93Reader.CHARACTER_ENCODINGS[47];

  private decodeRowResult: string;
  private counters: Int32Array;

  //public Code93Reader() {
  //  decodeRowResult = new StringBuilder(20);
  //  counters = new int[6];
  //}
  public constructor() {
    super();
    this.decodeRowResult = '';
    this.counters = new Int32Array(6);
  }

  public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {

    let start = this.findAsteriskPattern(row);
    // Read off white space
    let nextStart = row.getNextSet(start[1]);
    let end = row.getSize();

    let theCounters = this.counters;
    theCounters.fill(0);
    this.decodeRowResult = '';

    let decodedChar: string;
    let lastStart: number;
    do {
      Code93Reader.recordPattern(row, nextStart, theCounters);
      let pattern = this.toPattern(theCounters);
      if (pattern < 0) {
        throw new NotFoundException();
      }
      decodedChar = this.patternToChar(pattern);
      this.decodeRowResult += decodedChar;
      lastStart = nextStart;
      for (let counter of theCounters) {
        nextStart += counter;
      }
      // Read off white space
      nextStart = row.getNextSet(nextStart);
    } while (decodedChar !== '*');
    this.decodeRowResult = this.decodeRowResult.substring(0, this.decodeRowResult.length - 1); // remove asterisk

    let lastPatternSize = 0;
    for (let counter of theCounters) {
      lastPatternSize += counter;
    }

    // Should be at least one more black module
    if (nextStart === end || !row.get(nextStart)) {
      throw new NotFoundException();
    }

    if (this.decodeRowResult.length < 2) {
      // false positive -- need at least 2 checksum digits
      throw new NotFoundException();
    }

    this.checkChecksums(this.decodeRowResult);
    // Remove checksum digits
    this.decodeRowResult = this.decodeRowResult.substring(0, this.decodeRowResult.length - 2);

    let resultString = this.decodeExtended(this.decodeRowResult);

    let left = (start[1] + start[0]) / 2.0;
    let right = lastStart + lastPatternSize / 2.0;
    return new Result(
        resultString,
        null,
        0,
        [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)],
        BarcodeFormat.CODE_93,
        new Date().getTime());

  }

  private findAsteriskPattern(row: BitArray): Int32Array {
    let width = row.getSize();
    let rowOffset = row.getNextSet(0);

    this.counters.fill(0);
    let theCounters = this.counters;
    let patternStart = rowOffset;
    let isWhite = false;
    let patternLength = theCounters.length;

    let counterPosition = 0;
    for (let i = rowOffset; i < width; i++) {
      if (row.get(i) !== isWhite) {
        theCounters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (this.toPattern(theCounters) === Code93Reader.ASTERISK_ENCODING) {
            return new Int32Array([patternStart, i]);
          }
          patternStart += theCounters[0] + theCounters[1];
          theCounters.copyWithin(0, 2, 2 + counterPosition - 1);
          theCounters[counterPosition - 1] = 0;
          theCounters[counterPosition] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        theCounters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw new NotFoundException;
  }

  private toPattern(counters: Int32Array): number {
    let sum = 0;
    for (const counter of counters) {
      sum += counter;
    }
    let pattern = 0;
    let max = counters.length;
    for (let i = 0; i < max; i++) {
      let scaled = Math.round(counters[i] * 9.0 / sum);
      if (scaled < 1 || scaled > 4) {
        return -1;
      }
      if ((i & 0x01) === 0) {
        for (let j = 0; j < scaled; j++) {
          pattern = (pattern << 1) | 0x01;
        }
      } else {
        pattern <<= scaled;
      }
    }
    return pattern;
  }

  private patternToChar(pattern: number): string {
    for (let i = 0; i < Code93Reader.CHARACTER_ENCODINGS.length; i++) {
      if (Code93Reader.CHARACTER_ENCODINGS[i] === pattern) {
        return Code93Reader.ALPHABET_STRING.charAt(i);
      }
    }
    throw new NotFoundException();
  }

  private decodeExtended(encoded: string): string {
    let length = encoded.length;
    let decoded = '';
    for (let i = 0; i < length; i++) {
      let c = encoded.charAt(i);
      if (c >= 'a' && c <= 'd') {
        if (i >= length - 1) {
            throw new FormatException();
        }
        let next = encoded.charAt(i + 1);
        let decodedChar = '\0';
        switch (c) {
          case 'd':
            // +A to +Z map to a to z
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 32);
            } else {
              throw new FormatException();
            }
            break;
          case 'a':
            // $A to $Z map to control codes SH to SB
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 64);
            } else {
              throw new FormatException();
            }
            break;
          case 'b':
            if (next >= 'A' && next <= 'E') {
              // %A to %E map to control codes ESC to USep
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 38);
            } else if (next >= 'F' && next <= 'J') {
              // %F to %J map to ; < = > ?
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 11);
            } else if (next >= 'K' && next <= 'O') {
              // %K to %O map to [ \ ] ^ _
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 16);
            } else if (next >= 'P' && next <= 'T') {
              // %P to %T map to { | } ~ DEL
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 43);
            } else if (next === 'U') {
              // %U map to NUL
              decodedChar = '\0';
            } else if (next === 'V') {
              // %V map to @
              decodedChar = '@';
            } else if (next === 'W') {
              // %W map to `
              decodedChar = '`';
            } else if (next >= 'X' && next <= 'Z') {
              // %X to %Z all map to DEL (127)
              decodedChar = String.fromCharCode(127);
            } else {
              throw new FormatException();
            }
            break;
          case 'c':
            // /A to /O map to ! to , and /Z maps to :
            if (next >= 'A' && next <= 'O') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 32);
            } else if (next === 'Z') {
              decodedChar = ':';
            } else {
              throw new FormatException();
            }
            break;
        }
        decoded += decodedChar;
        // bump up i again since we read two characters
        i++;
      } else {
        decoded += c;
      }
    }
    return decoded;
  }

  private checkChecksums(result: string): void {
    let length = result.length;
    this.checkOneChecksum(result, length - 2, 20);
    this.checkOneChecksum(result, length - 1, 15);
  }

  private checkOneChecksum(result: string, checkPosition: number, weightMax: number): void {
    let weight = 1;
    let total = 0;
    for (let i = checkPosition - 1; i >= 0; i--) {
      total += weight * Code93Reader.ALPHABET_STRING.indexOf(result.charAt(i));
      if (++weight > weightMax) {
        weight = 1;
      }
    }
    if (result.charAt(checkPosition) !== Code93Reader.ALPHABET_STRING[total % 47]) {
      throw new ChecksumException;
    }
  }

}