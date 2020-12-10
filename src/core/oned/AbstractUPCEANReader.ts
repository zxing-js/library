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

import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import StringBuilder from '../util/StringBuilder';

import Result from '../Result';
import OneDReader from './OneDReader';
import NotFoundException from '../NotFoundException';
import FormatException from '../FormatException';
import { int } from '../../customTypings';

/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default abstract class AbstractUPCEANReader extends OneDReader {
  // These two values are critical for determining how permissive the decoding will be.
  // We've arrived at these values through a lot of trial and error. Setting them any higher
  // lets false positives creep in quickly.
  private static MAX_AVG_VARIANCE = 0.48;
  private static MAX_INDIVIDUAL_VARIANCE = 0.7;

  /**
   * Start/end guard pattern.
 */
  public static START_END_PATTERN: Int32Array = Int32Array.from([1, 1, 1]);

  /**
   * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
 */
  public static MIDDLE_PATTERN: Int32Array = Int32Array.from([1, 1, 1, 1, 1]);
  /**
   * end guard pattern.
 */
  public static END_PATTERN: Int32Array = Int32Array.from([1, 1, 1, 1, 1, 1]);
  /**
   * "Odd", or "L" patterns used to encode UPC/EAN digits.
 */
  public static L_PATTERNS: Int32Array[] = [
    Int32Array.from([3, 2, 1, 1]), // 0
    Int32Array.from([2, 2, 2, 1]), // 1
    Int32Array.from([2, 1, 2, 2]), // 2
    Int32Array.from([1, 4, 1, 1]), // 3
    Int32Array.from([1, 1, 3, 2]), // 4
    Int32Array.from([1, 2, 3, 1]), // 5
    Int32Array.from([1, 1, 1, 4]), // 6
    Int32Array.from([1, 3, 1, 2]), // 7
    Int32Array.from([1, 2, 1, 3]), // 8
    Int32Array.from([3, 1, 1, 2]), // 9
  ];

  /**
   * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
 */
  public static L_AND_G_PATTERNS: Int32Array[];

  protected decodeRowStringBuffer = new StringBuilder();
  // private final UPCEANExtensionSupport extensionReader;
  // private final EANManufacturerOrgSupport eanManSupport;


  /*
  protected UPCEANReader() {
      decodeRowStringBuffer = new StringBuilder(20);
      extensionReader = new UPCEANExtensionSupport();
      eanManSupport = new EANManufacturerOrgSupport();
  }
 */

  static findStartGuardPattern(row: BitArray): Int32Array {
    let foundStart = false;
    let startRange: Int32Array;
    let nextStart = 0;
    let counters: Int32Array;
    while (!foundStart) {
      counters = new Int32Array(3);
      startRange = AbstractUPCEANReader.findGuardPattern(row, nextStart, false, this.START_END_PATTERN, counters);
      let start = startRange[0];
      nextStart = startRange[1];
      let quietStart = start - (nextStart - start);
      if (quietStart >= 0) {
        foundStart = row.isRange(quietStart, start, false);
      }
    }
    return startRange;
  }

  /**
   * Attempts to decode a one-dimensional barcode format given a single row of
   * an image.
   *
   * @param rowNumber row number from top of the row
   * @param row the black/white pixel data of the row
   * @param hints hints that influence decoding
   * @return containing encoded string and start/end of barcode
   * @throws {@link NotFoundException} if no potential barcode is found
   * @throws {@link ChecksumException} if a potential barcode is found but does not pass its checksum
   * @throws {@link FormatException} if a potential barcode is found but format is invalid
   */
  public abstract decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result;
  /**
   * Attempts to decode a one-dimensional barcode format given a single row of
   * an image, but allows caller to inform method about where the UPC/EAN start pattern is found.
   * This allows this to be computed once and reused across many implementations.
   *
   * @param rowNumber row number from top of the row
   * @param row the black/white pixel data of the row
   * @param startGuardRange start/end column where the opening start pattern is found
   * @param hints hints that influence decoding
   * @return encapsulating the result of decoding a barcode in the row
   * @throws {@link NotFoundException} if no potential barcode is found
   * @throws {@link ChecksumException} if a potential barcode is found but does not pass its checksum
   * @throws {@link FormatException} if a potential barcode is found but format is invalid
   */
  public abstract decodeRow(rowNumber: number, row: BitArray, startGuardRange: Int32Array, hints?: Map<DecodeHintType, any>): Result;

  static checkChecksum(s: string): boolean {
    return AbstractUPCEANReader.checkStandardUPCEANChecksum(s);
  }

  static checkStandardUPCEANChecksum(s: string): boolean {
    let length = s.length;
    if (length === 0) return false;

    let check = parseInt(s.charAt(length - 1), 10);
    return AbstractUPCEANReader.getStandardUPCEANChecksum(s.substring(0, length - 1)) === check;
  }

  static getStandardUPCEANChecksum(s: string): number {
    let length = s.length;
    let sum = 0;
    for (let i = length - 1; i >= 0; i -= 2) {
      let digit = s.charCodeAt(i) - '0'.charCodeAt(0);
      if (digit < 0 || digit > 9) {
        throw new FormatException();
      }
      sum += digit;
    }
    sum *= 3;
    for (let i = length - 2; i >= 0; i -= 2) {
      let digit = s.charCodeAt(i) - '0'.charCodeAt(0);
      if (digit < 0 || digit > 9) {
        throw new FormatException();
      }
      sum += digit;
    }
    return (1000 - sum) % 10;
  }

  protected decodeEnd(row: BitArray, endStart: number): Int32Array {
    return AbstractUPCEANReader.findGuardPattern(row, endStart, false, AbstractUPCEANReader.START_END_PATTERN);
  }

  /**
   * @param row row of black/white values to search
   * @param rowOffset position to start search
   * @param whiteFirst if true, indicates that the pattern specifies white/black/white/...
   * pixel counts, otherwise, it is interpreted as black/white/black/...
   * @param pattern pattern of counts of number of black and white pixels that are being
   * searched for as a pattern
   * @return start/end horizontal offset of guard pattern, as an array of two ints
   * @throws {@link NotFoundException} if pattern is not found
   */
  static findGuardPattern(row: BitArray, rowOffset: int, whiteFirst: boolean, pattern: Int32Array): Int32Array;
  /**
   * @param row row of black/white values to search
   * @param rowOffset position to start search
   * @param whiteFirst if true, indicates that the pattern specifies white/black/white/...
   * pixel counts, otherwise, it is interpreted as black/white/black/...
   * @param pattern pattern of counts of number of black and white pixels that are being
   * searched for as a pattern
   * @param counters array of counters, as long as pattern, to re-use
   * @return start/end horizontal offset of guard pattern, as an array of two ints
   * @throws {@link NotFoundException} if pattern is not found
   */
  static findGuardPattern(row: BitArray, rowOffset: number, whiteFirst: boolean, pattern: Int32Array, counters: Int32Array): Int32Array;
  static findGuardPattern(row: BitArray, rowOffset: number, whiteFirst: boolean, pattern: Int32Array, counters?: Int32Array): Int32Array {
    if (typeof counters === 'undefined') counters = new Int32Array(pattern.length);
    return this.findGuardPatternImpl(row, rowOffset, whiteFirst, pattern, counters);
  }

  static findGuardPatternImpl(row: BitArray, rowOffset: number, whiteFirst: boolean, pattern: Int32Array, counters: Int32Array): Int32Array {
    let width = row.getSize();
    rowOffset = whiteFirst ? row.getNextUnset(rowOffset) : row.getNextSet(rowOffset);
    let counterPosition = 0;
    let patternStart = rowOffset;
    let patternLength = pattern.length;
    let isWhite = whiteFirst;
    for (let x = rowOffset; x < width; x++) {
      if (row.get(x) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (OneDReader.patternMatchVariance(counters, pattern, AbstractUPCEANReader.MAX_INDIVIDUAL_VARIANCE) < AbstractUPCEANReader.MAX_AVG_VARIANCE) {
            return new Int32Array([patternStart, x]);
          }
          patternStart += counters[0] + counters[1];
          counters.copyWithin(0, 2, 2 + counterPosition - 1);
          counters[counterPosition - 1] = 0;
          counters[counterPosition] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        counters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw new NotFoundException();
  }

  static decodeDigit(row: BitArray, counters: Int32Array, rowOffset: int, patterns: Int32Array[]) {
    this.recordPattern(row, rowOffset, counters);
    let bestVariance = this.MAX_AVG_VARIANCE;
    let bestMatch = -1;
    let max = patterns.length;
    for (let i = 0; i < max; i++) {
      let pattern = patterns[i];
      let variance = OneDReader.patternMatchVariance(counters, pattern, AbstractUPCEANReader.MAX_INDIVIDUAL_VARIANCE);
      if (variance < bestVariance) {
        bestVariance = variance;
        bestMatch = i;
      }
    }
    if (bestMatch >= 0) {
      return bestMatch;
    } else {
      throw new NotFoundException();
    }
  }

  /**
   * Get the format of this decoder.
   *
   * @return The 1D format.
 */
  public abstract getBarcodeFormat();

  /**
   * Subclasses override this to decode the portion of a barcode between the start
   * and end guard patterns.
   *
   * @param row row of black/white values to search
   * @param startRange start/end offset of start guard pattern
   * @param resultString to append decoded chars to
   * @return horizontal offset of first pixel after the "middle" that was decoded
   * @throws NotFoundException if decoding could not complete successfully
 */
  public abstract decodeMiddle(row: BitArray, startRange: Int32Array, resultString: StringBuilder);
}
