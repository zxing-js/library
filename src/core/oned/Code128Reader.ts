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
import ChecksumException from '../ChecksumException';
// import BinaryBitmap from '../BinaryBitmap';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import FormatException from '../FormatException';
import NotFoundException from '../NotFoundException';
// import Reader from '../Reader';
import Result from '../Result';
// import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import OneDReader from './OneDReader';


/**
 * <p>Decodes Code 128 barcodes.</p>
 *
 * @author Sean Owen
 */
export default class Code128Reader extends OneDReader {

    private static CODE_PATTERNS: Int32Array[] = [
        Int32Array.from([2, 1, 2, 2, 2, 2]),
        Int32Array.from([2, 2, 2, 1, 2, 2]),
        Int32Array.from([2, 2, 2, 2, 2, 1]),
        Int32Array.from([1, 2, 1, 2, 2, 3]),
        Int32Array.from([1, 2, 1, 3, 2, 2]),
        Int32Array.from([1, 3, 1, 2, 2, 2]),
        Int32Array.from([1, 2, 2, 2, 1, 3]),
        Int32Array.from([1, 2, 2, 3, 1, 2]),
        Int32Array.from([1, 3, 2, 2, 1, 2]),
        Int32Array.from([2, 2, 1, 2, 1, 3]),
        Int32Array.from([2, 2, 1, 3, 1, 2]),
        Int32Array.from([2, 3, 1, 2, 1, 2]),
        Int32Array.from([1, 1, 2, 2, 3, 2]),
        Int32Array.from([1, 2, 2, 1, 3, 2]),
        Int32Array.from([1, 2, 2, 2, 3, 1]),
        Int32Array.from([1, 1, 3, 2, 2, 2]),
        Int32Array.from([1, 2, 3, 1, 2, 2]),
        Int32Array.from([1, 2, 3, 2, 2, 1]),
        Int32Array.from([2, 2, 3, 2, 1, 1]),
        Int32Array.from([2, 2, 1, 1, 3, 2]),
        Int32Array.from([2, 2, 1, 2, 3, 1]),
        Int32Array.from([2, 1, 3, 2, 1, 2]),
        Int32Array.from([2, 2, 3, 1, 1, 2]),
        Int32Array.from([3, 1, 2, 1, 3, 1]),
        Int32Array.from([3, 1, 1, 2, 2, 2]),
        Int32Array.from([3, 2, 1, 1, 2, 2]),
        Int32Array.from([3, 2, 1, 2, 2, 1]),
        Int32Array.from([3, 1, 2, 2, 1, 2]),
        Int32Array.from([3, 2, 2, 1, 1, 2]),
        Int32Array.from([3, 2, 2, 2, 1, 1]),
        Int32Array.from([2, 1, 2, 1, 2, 3]),
        Int32Array.from([2, 1, 2, 3, 2, 1]),
        Int32Array.from([2, 3, 2, 1, 2, 1]),
        Int32Array.from([1, 1, 1, 3, 2, 3]),
        Int32Array.from([1, 3, 1, 1, 2, 3]),
        Int32Array.from([1, 3, 1, 3, 2, 1]),
        Int32Array.from([1, 1, 2, 3, 1, 3]),
        Int32Array.from([1, 3, 2, 1, 1, 3]),
        Int32Array.from([1, 3, 2, 3, 1, 1]),
        Int32Array.from([2, 1, 1, 3, 1, 3]),
        Int32Array.from([2, 3, 1, 1, 1, 3]),
        Int32Array.from([2, 3, 1, 3, 1, 1]),
        Int32Array.from([1, 1, 2, 1, 3, 3]),
        Int32Array.from([1, 1, 2, 3, 3, 1]),
        Int32Array.from([1, 3, 2, 1, 3, 1]),
        Int32Array.from([1, 1, 3, 1, 2, 3]),
        Int32Array.from([1, 1, 3, 3, 2, 1]),
        Int32Array.from([1, 3, 3, 1, 2, 1]),
        Int32Array.from([3, 1, 3, 1, 2, 1]),
        Int32Array.from([2, 1, 1, 3, 3, 1]),
        Int32Array.from([2, 3, 1, 1, 3, 1]),
        Int32Array.from([2, 1, 3, 1, 1, 3]),
        Int32Array.from([2, 1, 3, 3, 1, 1]),
        Int32Array.from([2, 1, 3, 1, 3, 1]),
        Int32Array.from([3, 1, 1, 1, 2, 3]),
        Int32Array.from([3, 1, 1, 3, 2, 1]),
        Int32Array.from([3, 3, 1, 1, 2, 1]),
        Int32Array.from([3, 1, 2, 1, 1, 3]),
        Int32Array.from([3, 1, 2, 3, 1, 1]),
        Int32Array.from([3, 3, 2, 1, 1, 1]),
        Int32Array.from([3, 1, 4, 1, 1, 1]),
        Int32Array.from([2, 2, 1, 4, 1, 1]),
        Int32Array.from([4, 3, 1, 1, 1, 1]),
        Int32Array.from([1, 1, 1, 2, 2, 4]),
        Int32Array.from([1, 1, 1, 4, 2, 2]),
        Int32Array.from([1, 2, 1, 1, 2, 4]),
        Int32Array.from([1, 2, 1, 4, 2, 1]),
        Int32Array.from([1, 4, 1, 1, 2, 2]),
        Int32Array.from([1, 4, 1, 2, 2, 1]),
        Int32Array.from([1, 1, 2, 2, 1, 4]),
        Int32Array.from([1, 1, 2, 4, 1, 2]),
        Int32Array.from([1, 2, 2, 1, 1, 4]),
        Int32Array.from([1, 2, 2, 4, 1, 1]),
        Int32Array.from([1, 4, 2, 1, 1, 2]),
        Int32Array.from([1, 4, 2, 2, 1, 1]),
        Int32Array.from([2, 4, 1, 2, 1, 1]),
        Int32Array.from([2, 2, 1, 1, 1, 4]),
        Int32Array.from([4, 1, 3, 1, 1, 1]),
        Int32Array.from([2, 4, 1, 1, 1, 2]),
        Int32Array.from([1, 3, 4, 1, 1, 1]),
        Int32Array.from([1, 1, 1, 2, 4, 2]),
        Int32Array.from([1, 2, 1, 1, 4, 2]),
        Int32Array.from([1, 2, 1, 2, 4, 1]),
        Int32Array.from([1, 1, 4, 2, 1, 2]),
        Int32Array.from([1, 2, 4, 1, 1, 2]),
        Int32Array.from([1, 2, 4, 2, 1, 1]),
        Int32Array.from([4, 1, 1, 2, 1, 2]),
        Int32Array.from([4, 2, 1, 1, 1, 2]),
        Int32Array.from([4, 2, 1, 2, 1, 1]),
        Int32Array.from([2, 1, 2, 1, 4, 1]),
        Int32Array.from([2, 1, 4, 1, 2, 1]),
        Int32Array.from([4, 1, 2, 1, 2, 1]),
        Int32Array.from([1, 1, 1, 1, 4, 3]),
        Int32Array.from([1, 1, 1, 3, 4, 1]),
        Int32Array.from([1, 3, 1, 1, 4, 1]),
        Int32Array.from([1, 1, 4, 1, 1, 3]),
        Int32Array.from([1, 1, 4, 3, 1, 1]),
        Int32Array.from([4, 1, 1, 1, 1, 3]),
        Int32Array.from([4, 1, 1, 3, 1, 1]),
        Int32Array.from([1, 1, 3, 1, 4, 1]),
        Int32Array.from([1, 1, 4, 1, 3, 1]),
        Int32Array.from([3, 1, 1, 1, 4, 1]),
        Int32Array.from([4, 1, 1, 1, 3, 1]),
        Int32Array.from([2, 1, 1, 4, 1, 2]),
        Int32Array.from([2, 1, 1, 2, 1, 4]),
        Int32Array.from([2, 1, 1, 2, 3, 2]),
        Int32Array.from([2, 3, 3, 1, 1, 1, 2]),
      ];

  private static MAX_AVG_VARIANCE = 0.25;
  private static MAX_INDIVIDUAL_VARIANCE = 0.7;

  private static CODE_SHIFT = 98;

  private static CODE_CODE_C = 99;
  private static CODE_CODE_B = 100;
  private static CODE_CODE_A = 101;

  private static CODE_FNC_1 = 102;
  private static CODE_FNC_2 = 97;
  private static CODE_FNC_3 = 96;
  private static CODE_FNC_4_A = 101;
  private static CODE_FNC_4_B = 100;

  private static CODE_START_A = 103;
  private static CODE_START_B = 104;
  private static CODE_START_C = 105;
  private static CODE_STOP = 106;

  private static findStartPattern(row: BitArray): Int32Array {
    const width = row.getSize();
    const rowOffset = row.getNextSet(0);

        let counterPosition = 0;
        let counters = Int32Array.from([0, 0, 0, 0, 0, 0]);
        let patternStart = rowOffset;
        let isWhite = false;
        const patternLength = 6;

    for (let i = rowOffset; i < width; i++) {
      if (row.get(i) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === (patternLength - 1)) {
          let bestVariance = Code128Reader.MAX_AVG_VARIANCE;
          let bestMatch = -1;
          for (let startCode = Code128Reader.CODE_START_A; startCode <= Code128Reader.CODE_START_C; startCode++) {
            const variance = OneDReader.patternMatchVariance(counters,
              Code128Reader.CODE_PATTERNS[startCode], Code128Reader.MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
              bestVariance = variance;
              bestMatch = startCode;
            }
          }
          // Look for whitespace before start pattern, >= 50% of width of start pattern
          if (bestMatch >= 0 &&
            row.isRange(Math.max(0, patternStart - (i - patternStart) / 2), patternStart, false)) {
            return Int32Array.from([patternStart, i, bestMatch]);
          }
          patternStart += counters[0] + counters[1];

          counters = counters.slice(2, counters.length - 1);
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

  private static decodeCode(row: BitArray, counters: Int32Array, rowOffset: number): number {
    OneDReader.recordPattern(row, rowOffset, counters);
    let bestVariance = Code128Reader.MAX_AVG_VARIANCE; // worst variance we'll accept
    let bestMatch = -1;
    for (let d = 0; d < Code128Reader.CODE_PATTERNS.length; d++) {
      const pattern = Code128Reader.CODE_PATTERNS[d];
      const variance = this.patternMatchVariance(counters, pattern, Code128Reader.MAX_INDIVIDUAL_VARIANCE);
      if (variance < bestVariance) {
        bestVariance = variance;
        bestMatch = d;
      }
    }
    // TODO We're overlooking the fact that the STOP pattern has 7 values, not 6.
    if (bestMatch >= 0) {
      return bestMatch;
    } else {
      throw new NotFoundException();
    }
  }

  public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {
    const convertFNC1 = hints && (hints.get(DecodeHintType.ASSUME_GS1) === true);

    const startPatternInfo = Code128Reader.findStartPattern(row);
    const startCode = startPatternInfo[2];

    let currentRawCodesIndex = 0;
    const rawCodes: Uint8Array = new Uint8Array(20);
    rawCodes[currentRawCodesIndex++] = startCode;

    let codeSet;
    switch (startCode) {
      case Code128Reader.CODE_START_A:
        codeSet = Code128Reader.CODE_CODE_A;
        break;
      case Code128Reader.CODE_START_B:
        codeSet = Code128Reader.CODE_CODE_B;
        break;
      case Code128Reader.CODE_START_C:
        codeSet = Code128Reader.CODE_CODE_C;
        break;
      default:
        throw new FormatException();
    }

    let done = false;
    let isNextShifted = false;

    let result = '';

    let lastStart = startPatternInfo[0];
    let nextStart = startPatternInfo[1];
    const counters: Int32Array = Int32Array.from([0, 0, 0, 0, 0, 0]);

    let lastCode = 0;
    let code = 0;
    let checksumTotal = startCode;
    let multiplier = 0;
    let lastCharacterWasPrintable = true;
    let upperMode = false;
    let shiftUpperMode = false;

    while (!done) {

      const unshift = isNextShifted;
      isNextShifted = false;

      // Save off last code
      lastCode = code;

      // Decode another code from image
      code = Code128Reader.decodeCode(row, counters, nextStart);

      rawCodes[currentRawCodesIndex++] = code;

      // Remember whether the last code was printable or not (excluding CODE_STOP)
      if (code !== Code128Reader.CODE_STOP) {
        lastCharacterWasPrintable = true;
      }

      // Add to checksum computation (if not CODE_STOP of course)
      if (code !== Code128Reader.CODE_STOP) {
        multiplier++;
        checksumTotal += multiplier * code;
      }

      // Advance to where the next code will to start
      lastStart = nextStart;
      nextStart += counters.reduce((previous, current) => previous + current, 0);

      // Take care of illegal start codes
      switch (code) {
        case Code128Reader.CODE_START_A:
        case Code128Reader.CODE_START_B:
        case Code128Reader.CODE_START_C:
          throw new FormatException();
      }

      switch (codeSet) {

        case Code128Reader.CODE_CODE_A:
          if (code < 64) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode((' '.charCodeAt(0) + code));
            } else {
              result += String.fromCharCode((' '.charCodeAt(0) + code + 128));
            }
            shiftUpperMode = false;
          } else if (code < 96) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode((code - 64));
            } else {
              result += String.fromCharCode((code + 64));
            }
            shiftUpperMode = false;
          } else {
            // Don't let CODE_STOP, which always appears, affect whether whether we think the last
            // code was printable or not.
            if (code !== Code128Reader.CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case Code128Reader.CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += ']C1';
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case Code128Reader.CODE_FNC_2:
              case Code128Reader.CODE_FNC_3:
                // do nothing?
                break;
              case Code128Reader.CODE_FNC_4_A:
                if (!upperMode && shiftUpperMode) {
                  upperMode = true;
                  shiftUpperMode = false;
                } else if (upperMode && shiftUpperMode) {
                  upperMode = false;
                  shiftUpperMode = false;
                } else {
                  shiftUpperMode = true;
                }
                break;
              case Code128Reader.CODE_SHIFT:
                isNextShifted = true;
                codeSet = Code128Reader.CODE_CODE_B;
                break;
              case Code128Reader.CODE_CODE_B:
                codeSet = Code128Reader.CODE_CODE_B;
                break;
              case Code128Reader.CODE_CODE_C:
                codeSet = Code128Reader.CODE_CODE_C;
                break;
              case Code128Reader.CODE_STOP:
                done = true;
                break;
            }
          }
          break;
        case Code128Reader.CODE_CODE_B:
          if (code < 96) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode((' '.charCodeAt(0) + code));
            } else {
              result += String.fromCharCode((' '.charCodeAt(0) + code + 128));
            }
            shiftUpperMode = false;
          } else {
            if (code !== Code128Reader.CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case Code128Reader.CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += ']C1';
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case Code128Reader.CODE_FNC_2:
              case Code128Reader.CODE_FNC_3:
                // do nothing?
                break;
              case Code128Reader.CODE_FNC_4_B:
                if (!upperMode && shiftUpperMode) {
                  upperMode = true;
                  shiftUpperMode = false;
                } else if (upperMode && shiftUpperMode) {
                  upperMode = false;
                  shiftUpperMode = false;
                } else {
                  shiftUpperMode = true;
                }
                break;
              case Code128Reader.CODE_SHIFT:
                isNextShifted = true;
                codeSet = Code128Reader.CODE_CODE_A;
                break;
              case Code128Reader.CODE_CODE_A:
                codeSet = Code128Reader.CODE_CODE_A;
                break;
              case Code128Reader.CODE_CODE_C:
                codeSet = Code128Reader.CODE_CODE_C;
                break;
              case Code128Reader.CODE_STOP:
                done = true;
                break;
            }
          }
          break;
        case Code128Reader.CODE_CODE_C:
          if (code < 100) {
            if (code < 10) {
              result += '0';
            }
            result += code;
          } else {
            if (code !== Code128Reader.CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case Code128Reader.CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += ']C1';
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case Code128Reader.CODE_CODE_A:
                codeSet = Code128Reader.CODE_CODE_A;
                break;
              case Code128Reader.CODE_CODE_B:
                codeSet = Code128Reader.CODE_CODE_B;
                break;
              case Code128Reader.CODE_STOP:
                done = true;
                break;
            }
          }
          break;
      }

      // Unshift back to another code set if we were shifted
      if (unshift) {
        codeSet = codeSet === Code128Reader.CODE_CODE_A ? Code128Reader.CODE_CODE_B : Code128Reader.CODE_CODE_A;
      }

    }

    const lastPatternSize = nextStart - lastStart;

    // Check for ample whitespace following pattern, but, to do this we first need to remember that
    // we fudged decoding CODE_STOP since it actually has 7 bars, not 6. There is a black bar left
    // to read off. Would be slightly better to properly read. Here we just skip it:
    nextStart = row.getNextUnset(nextStart);
    if (!row.isRange(nextStart,
      Math.min(row.getSize(), nextStart + (nextStart - lastStart) / 2),
      false)) {
      throw new NotFoundException();
    }

    // Pull out from sum the value of the penultimate check code
    checksumTotal -= multiplier * lastCode;
    // lastCode is the checksum then:
    if (checksumTotal % 103 !== lastCode) {
      throw new ChecksumException();
    }

    // Need to pull out the check digits from string
    const resultLength = result.length;
    if (resultLength === 0) {
      // false positive
      throw new NotFoundException();
    }

    // Only bother if the result had at least one character, and if the checksum digit happened to
    // be a printable character. If it was just interpreted as a control code, nothing to remove.
    if (resultLength > 0 && lastCharacterWasPrintable) {
      if (codeSet === Code128Reader.CODE_CODE_C) {
        result = result.substring(0, resultLength - 2);
      } else {
        result = result.substring(0, resultLength - 1);
      }
    }

    const left = (startPatternInfo[1] + startPatternInfo[0]) / 2.0;
    const right = lastStart + lastPatternSize / 2.0;

    const rawCodesSize = rawCodes.length;
    const rawBytes: Uint8Array = new Uint8Array(rawCodesSize);

    for (let i = 0; i < rawCodesSize; i++) {
      rawBytes[i] = rawCodes[i];
    }

    const points: ResultPoint[] = [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)];

    return new Result(result, rawBytes, 0, points, BarcodeFormat.CODE_128, new Date().getTime());
  }
}
