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

/*namespace com.google.zxing.oned {*/

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import FormatException from '../FormatException';
import NotFoundException from '../NotFoundException';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
import StringBuilder from '../util/StringBuilder';
import System from '../util/System';
import OneDReader from './OneDReader';


/**
 * <p>Decodes ITF barcodes.</p>
 *
 * @author Tjieco
 */
export default class ITFReader extends OneDReader {

  // private static W = 3; // Pixel width of a 3x wide line
  // private static w = 2; // Pixel width of a 2x wide line
  // private static N = 1; // Pixed width of a narrow line

    private static PATTERNS: Int32Array[] = [
        Int32Array.from([1, 1, 2, 2, 1]), // 0
        Int32Array.from([2, 1, 1, 1, 2]), // 1
        Int32Array.from([1, 2, 1, 1, 2]), // 2
        Int32Array.from([2, 2, 1, 1, 1]), // 3
        Int32Array.from([1, 1, 2, 1, 2]), // 4
        Int32Array.from([2, 1, 2, 1, 1]), // 5
        Int32Array.from([1, 2, 2, 1, 1]), // 6
        Int32Array.from([1, 1, 1, 2, 2]), // 7
        Int32Array.from([2, 1, 1, 2, 1]), // 8
        Int32Array.from([1, 2, 1, 2, 1]), // 9
        Int32Array.from([1, 1, 3, 3, 1]), // 0
        Int32Array.from([3, 1, 1, 1, 3]), // 1
        Int32Array.from([1, 3, 1, 1, 3]), // 2
        Int32Array.from([3, 3, 1, 1, 1]), // 3
        Int32Array.from([1, 1, 3, 1, 3]), // 4
        Int32Array.from([3, 1, 3, 1, 1]), // 5
        Int32Array.from([1, 3, 3, 1, 1]), // 6
        Int32Array.from([1, 1, 1, 3, 3]), // 7
        Int32Array.from([3, 1, 1, 3, 1]), // 8
        Int32Array.from([1, 3, 1, 3, 1])  // 9
    ];

  private static MAX_AVG_VARIANCE = 0.38;
  private static MAX_INDIVIDUAL_VARIANCE = 0.5;



  /* /!** Valid ITF lengths. Anything longer than the largest value is also allowed. *!/*/
  private static DEFAULT_ALLOWED_LENGTHS: number[] = [6, 8, 10, 12, 14];

  // Stores the actual narrow line width of the image being decoded.
  private narrowLineWidth = -1;

    /*/!**
     * Start/end guard pattern.
     *
     * Note: The end pattern is reversed because the row is reversed before
     * searching for the END_PATTERN
     *!/*/
    private static START_PATTERN = Int32Array.from([1, 1, 1, 1]);
    private static END_PATTERN_REVERSED: Int32Array[] = [
        Int32Array.from([1, 1, 2]), // 2x
        Int32Array.from([1, 1, 3])  // 3x
    ];

  // See ITFWriter.PATTERNS
  /*

  /!**
   * Patterns of Wide / Narrow lines to indicate each digit
   *!/
  */

  public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {

    // Find out where the Middle section (payload) starts & ends
    let startRange: number[] = this.decodeStart(row);
    let endRange: number[] = this.decodeEnd(row);

    let result: StringBuilder = new StringBuilder();
    ITFReader.decodeMiddle(row, startRange[1], endRange[0], result);
    let resultString: string = result.toString();

    let allowedLengths: number[] = null;
    if (hints != null) {
      allowedLengths = hints.get(DecodeHintType.ALLOWED_LENGTHS);

    }
    if (allowedLengths == null) {
      allowedLengths = ITFReader.DEFAULT_ALLOWED_LENGTHS;
    }

    // To avoid false positives with 2D barcodes (and other patterns), make
    // an assumption that the decoded string must be a 'standard' length if it's short
    let length: number = resultString.length;
    let lengthOK: boolean = false;
    let maxAllowedLength: number = 0;

    for (let value of allowedLengths) {
      if (length === value) {
        lengthOK = true;
        break;
      }
      if (value > maxAllowedLength) {
        maxAllowedLength = value;
      }
    }

    if (!lengthOK && length > maxAllowedLength) {
      lengthOK = true;
    }

    if (!lengthOK) {
      throw new FormatException();
    }

    const points: ResultPoint[] = [new ResultPoint(startRange[1], rowNumber), new ResultPoint(endRange[0], rowNumber)];

    let resultReturn: Result = new Result(
      resultString,
      null, // no natural byte representation for these barcodes
      0,
      points,
      BarcodeFormat.ITF,
      new Date().getTime()
    );

    return resultReturn;
  }
  /*
  /!**
   * @param row          row of black/white values to search
   * @param payloadStart offset of start pattern
   * @param resultString {@link StringBuilder} to append decoded chars to
   * @throws NotFoundException if decoding could not complete successfully
   *!/*/
  private static decodeMiddle(
    row: BitArray,
    payloadStart: number,
    payloadEnd: number,
    resultString: StringBuilder
  ) {

    // Digits are interleaved in pairs - 5 black lines for one digit, and the
    // 5
    // interleaved white lines for the second digit.
    // Therefore, need to scan 10 lines and then
    // split these into two arrays

        let counterDigitPair: Int32Array = new Int32Array(10); // 10
        let counterBlack: Int32Array = new Int32Array(5); // 5
        let counterWhite: Int32Array = new Int32Array(5); // 5

    counterDigitPair.fill(0);
    counterBlack.fill(0);
    counterWhite.fill(0);

    while (payloadStart < payloadEnd) {

      // Get 10 runs of black/white.
      OneDReader.recordPattern(row, payloadStart, counterDigitPair);
      // Split them into each array
      for (let k = 0; k < 5; k++) {
        let twoK: number = 2 * k;
        counterBlack[k] = counterDigitPair[twoK];
        counterWhite[k] = counterDigitPair[twoK + 1];
      }

      let bestMatch: number = ITFReader.decodeDigit(counterBlack);
      resultString.append(bestMatch.toString());
      bestMatch = this.decodeDigit(counterWhite);
      resultString.append(bestMatch.toString());

      counterDigitPair.forEach(function (counterDigit) {
        payloadStart += counterDigit;
      });
    }
  }

  /*/!**
   * Identify where the start of the middle / payload section starts.
   *
   * @param row row of black/white values to search
   * @return Array, containing index of start of 'start block' and end of
   *         'start block'
   *!/*/
  private decodeStart(row: BitArray): number[] {

    let endStart = ITFReader.skipWhiteSpace(row);
    let startPattern: number[] = ITFReader.findGuardPattern(row, endStart, ITFReader.START_PATTERN);

    // Determine the width of a narrow line in pixels. We can do this by
    // getting the width of the start pattern and dividing by 4 because its
    // made up of 4 narrow lines.
    this.narrowLineWidth = (startPattern[1] - startPattern[0]) / 4;

    this.validateQuietZone(row, startPattern[0]);

    return startPattern;
  }

  /*/!**
   * The start & end patterns must be pre/post fixed by a quiet zone. This
   * zone must be at least 10 times the width of a narrow line.  Scan back until
   * we either get to the start of the barcode or match the necessary number of
   * quiet zone pixels.
   *
   * Note: Its assumed the row is reversed when using this method to find
   * quiet zone after the end pattern.
   *
   * ref: http://www.barcode-1.net/i25code.html
   *
   * @param row bit array representing the scanned barcode.
   * @param startPattern index into row of the start or end pattern.
   * @throws NotFoundException if the quiet zone cannot be found
   *!/*/
  private validateQuietZone(row: BitArray, startPattern: number): void {

    let quietCount: number = this.narrowLineWidth * 10;  // expect to find this many pixels of quiet zone

    // if there are not so many pixel at all let's try as many as possible
    quietCount = quietCount < startPattern ? quietCount : startPattern;

    for (let i = startPattern - 1; quietCount > 0 && i >= 0; i--) {
      if (row.get(i)) {
        break;
      }
      quietCount--;
    }
    if (quietCount !== 0) {
      // Unable to find the necessary number of quiet zone pixels.
      throw new NotFoundException();
    }
  }
  /*
  /!**
   * Skip all whitespace until we get to the first black line.
   *
   * @param row row of black/white values to search
   * @return index of the first black line.
   * @throws NotFoundException Throws exception if no black lines are found in the row
   *!/*/
  private static skipWhiteSpace(row: BitArray): number {

    const width = row.getSize();
    const endStart = row.getNextSet(0);

    if (endStart === width) {
      throw new NotFoundException();
    }

    return endStart;
  }

  /*/!**
   * Identify where the end of the middle / payload section ends.
   *
   * @param row row of black/white values to search
   * @return Array, containing index of start of 'end block' and end of 'end
   *         block'
   *!/*/
  private decodeEnd(row: BitArray): number[] {

    // For convenience, reverse the row and then
    // search from 'the start' for the end block
    row.reverse();

    try {
      let endStart: number = ITFReader.skipWhiteSpace(row);
      let endPattern: number[];

      try {
        endPattern = ITFReader.findGuardPattern(row, endStart, ITFReader.END_PATTERN_REVERSED[0]);
      } catch (error) {
        if (error instanceof NotFoundException) {
          endPattern = ITFReader.findGuardPattern(row, endStart, ITFReader.END_PATTERN_REVERSED[1]);
        }
      }

      // The start & end patterns must be pre/post fixed by a quiet zone. This
      // zone must be at least 10 times the width of a narrow line.
      // ref: http://www.barcode-1.net/i25code.html
      this.validateQuietZone(row, endPattern[0]);

      // Now recalculate the indices of where the 'endblock' starts & stops to
      // accommodate
      // the reversed nature of the search
      let temp = endPattern[0];
      endPattern[0] = row.getSize() - endPattern[1];
      endPattern[1] = row.getSize() - temp;

      return endPattern;

    } finally {
      // Put the row back the right way.
      row.reverse();
    }
  }

    /*
    /!**
     * @param row       row of black/white values to search
     * @param rowOffset position to start search
     * @param pattern   pattern of counts of number of black and white pixels that are
     *                  being searched for as a pattern
     * @return start/end horizontal offset of guard pattern, as an array of two
     *         ints
     * @throws NotFoundException if pattern is not found
     *!/*/
    private static findGuardPattern(
        row: BitArray,
        rowOffset: number,
        pattern: Int32Array
    ): number[] {

        let patternLength: number = pattern.length;
        let counters: Int32Array = new Int32Array(patternLength);
        let width: number = row.getSize();
        let isWhite: boolean = false;

    let counterPosition: number = 0;
    let patternStart: number = rowOffset;

    counters.fill(0);

    for (let x = rowOffset; x < width; x++) {
      if (row.get(x) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (OneDReader.patternMatchVariance(counters, pattern, ITFReader.MAX_INDIVIDUAL_VARIANCE) < ITFReader.MAX_AVG_VARIANCE) {
            return [patternStart, x];
          }
          patternStart += counters[0] + counters[1];
          System.arraycopy(counters, 2, counters, 0, counterPosition - 1);
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

    /*/!**
     * Attempts to decode a sequence of ITF black/white lines into single
     * digit.
     *
     * @param counters the counts of runs of observed black/white/black/... values
     * @return The decoded digit
     * @throws NotFoundException if digit cannot be decoded
     *!/*/
    private static decodeDigit(counters: Int32Array): number {

    let bestVariance: number = ITFReader.MAX_AVG_VARIANCE; // worst variance we'll accept
    let bestMatch: number = -1;
    let max: number = ITFReader.PATTERNS.length;

    for (let i = 0; i < max; i++) {

      let pattern = ITFReader.PATTERNS[i];
      let variance: number = OneDReader.patternMatchVariance(counters, pattern, ITFReader.MAX_INDIVIDUAL_VARIANCE);

      if (variance < bestVariance) {
        bestVariance = variance;
        bestMatch = i;
      } else if (variance === bestVariance) {
        // if we find a second 'best match' with the same variance, we can not reliably report to have a suitable match
        bestMatch = -1;
      }
    }

    if (bestMatch >= 0) {
      return bestMatch % 10;
    } else {
      throw new NotFoundException();
    }
  }

}
