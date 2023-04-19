import BarcodeFormat from '../../../BarcodeFormat';
// import ResultPoint from '../../../ResultPoint';
import BitArray from '../../../common/BitArray';
import MathUtils from '../../../common/detector/MathUtils';
import DecodeHintType from '../../../DecodeHintType';
// import FormatException from '../../../FormatException';
import NotFoundException from '../../../NotFoundException';
import Result from '../../../Result';
import System from '../../../util/System';
import AbstractRSSReader from '../../rss/AbstractRSSReader';
import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';
import RSSUtils from '../../rss/RSSUtils';
import AbstractExpandedDecoder from '../expanded/decoders/AbstractExpandedDecoder';
import BitArrayBuilder from './BitArrayBuilder';
import { createDecoder } from './decoders/AbstractExpandedDecoderComplement';
import ExpandedPair from './ExpandedPair';
import ExpandedRow from './ExpandedRow';

// import java.util.ArrayList;
// import java.util.Iterator;
// import java.util.List;
// import java.util.Map;
// import java.util.Collections;

/** @experimental */
export default class RSSExpandedReader extends AbstractRSSReader {
  private static readonly SYMBOL_WIDEST = [7, 5, 4, 3, 1];
  private static readonly EVEN_TOTAL_SUBSET = [4, 20, 52, 104, 204];
  private static readonly GSUM = [0, 348, 1388, 2948, 3988];

  private static readonly FINDER_PATTERNS = [
    Int32Array.from([1, 8, 4, 1]), // A
    Int32Array.from([3, 6, 4, 1]), // B
    Int32Array.from([3, 4, 6, 1]), // C
    Int32Array.from([3, 2, 8, 1]), // D
    Int32Array.from([2, 6, 5, 1]), // E
    Int32Array.from([2, 2, 9, 1]), // F
  ];

  private static readonly WEIGHTS = [
    [1, 3, 9, 27, 81, 32, 96, 77],
    [20, 60, 180, 118, 143, 7, 21, 63],
    [189, 145, 13, 39, 117, 140, 209, 205],
    [193, 157, 49, 147, 19, 57, 171, 91],
    [62, 186, 136, 197, 169, 85, 44, 132],
    [185, 133, 188, 142, 4, 12, 36, 108],
    [113, 128, 173, 97, 80, 29, 87, 50],
    [150, 28, 84, 41, 123, 158, 52, 156],
    [46, 138, 203, 187, 139, 206, 196, 166],
    [76, 17, 51, 153, 37, 111, 122, 155],
    [43, 129, 176, 106, 107, 110, 119, 146],
    [16, 48, 144, 10, 30, 90, 59, 177],
    [109, 116, 137, 200, 178, 112, 125, 164],
    [70, 210, 208, 202, 184, 130, 179, 115],
    [134, 191, 151, 31, 93, 68, 204, 190],
    [148, 22, 66, 198, 172, 94, 71, 2],
    [6, 18, 54, 162, 64, 192, 154, 40],
    [120, 149, 25, 75, 14, 42, 126, 167],
    [79, 26, 78, 23, 69, 207, 199, 175],
    [103, 98, 83, 38, 114, 131, 182, 124],
    [161, 61, 183, 127, 170, 88, 53, 159],
    [55, 165, 73, 8, 24, 72, 5, 15],
    [45, 135, 194, 160, 58, 174, 100, 89],
  ];

  private static readonly FINDER_PAT_A = 0;
  private static readonly FINDER_PAT_B = 1;
  private static readonly FINDER_PAT_C = 2;
  private static readonly FINDER_PAT_D = 3;
  private static readonly FINDER_PAT_E = 4;
  private static readonly FINDER_PAT_F = 5;

  private static readonly FINDER_PATTERN_SEQUENCES = [
    [RSSExpandedReader.FINDER_PAT_A, RSSExpandedReader.FINDER_PAT_A],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_B,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_D,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_C,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_F,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_F,
      RSSExpandedReader.FINDER_PAT_F,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_D,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_E,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_F,
      RSSExpandedReader.FINDER_PAT_F,
    ],
    [
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_A,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_B,
      RSSExpandedReader.FINDER_PAT_C,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_D,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_E,
      RSSExpandedReader.FINDER_PAT_F,
      RSSExpandedReader.FINDER_PAT_F,
    ],
  ];

  private static readonly MAX_PAIRS = 11;

  private pairs: any = new Array<any>(RSSExpandedReader.MAX_PAIRS);
  private rows: any = new Array<any>();

  private readonly startEnd = [2];
  private startFromEven: boolean;

  public decodeRow(
    rowNumber: number,
    row: BitArray,
    hints: Map<DecodeHintType, any>
  ): Result {
    // Rows can start with even pattern in case in prev rows there where odd number of patters.
    // So lets try twice
    // this.pairs.clear();
    this.pairs.length = 0;
    this.startFromEven = false;
    try {
      return RSSExpandedReader.constructResult(
        this.decodeRow2pairs(rowNumber, row)
      );
    } catch (e) {
      // OK
      // console.log(e);
    }

    this.pairs.length = 0;
    this.startFromEven = true;
    return RSSExpandedReader.constructResult(
      this.decodeRow2pairs(rowNumber, row)
    );
  }

  public reset(): void {
    this.pairs.length = 0;
    this.rows.length = 0;
  }

  // Not private for testing
  decodeRow2pairs(rowNumber: number, row: BitArray): Array<ExpandedPair> {
    let done = false;
    while (!done) {
      try {
        this.pairs.push(this.retrieveNextPair(row, this.pairs, rowNumber));
      } catch (error) {
        if (error instanceof NotFoundException) {
          if (!this.pairs.length) {
            throw new NotFoundException();
          }
          // exit this loop when retrieveNextPair() fails and throws
          done = true;
        }
      }
    }

    // TODO: verify sequence of finder patterns as in checkPairSequence()
    if (this.checkChecksum()) {
      return this.pairs;
    }
    let tryStackedDecode;
    if (this.rows.length) {
      tryStackedDecode = true;
    } else {
      tryStackedDecode = false;
    }
    // let tryStackedDecode = !this.rows.isEmpty();
    this.storeRow(rowNumber, false); // TODO: deal with reversed rows
    if (tryStackedDecode) {
      // When the image is 180-rotated, then rows are sorted in wrong direction.
      // Try twice with both the directions.
      let ps = this.checkRowsBoolean(false);
      if (ps != null) {
        return ps;
      }
      ps = this.checkRowsBoolean(true);
      if (ps != null) {
        return ps;
      }
    }

    throw new NotFoundException();
  }
  // Need to Verify
  private checkRowsBoolean(reverse: boolean): Array<ExpandedPair> {
    // Limit number of rows we are checking
    // We use recursive algorithm with pure complexity and don't want it to take forever
    // Stacked barcode can have up to 11 rows, so 25 seems reasonable enough
    if (this.rows.length > 25) {
      this.rows.length = 0; // We will never have a chance to get result, so clear it
      return null;
    }

    this.pairs.length = 0;
    if (reverse) {
      this.rows = this.rows.reverse();
      // Collections.reverse(this.rows);
    }
    let ps: Array<ExpandedPair> = null;
    try {
      ps = this.checkRows(new Array<ExpandedRow>(), 0);
    } catch (e) {
      // OK
      console.log(e);
    }

    if (reverse) {
      this.rows = this.rows.reverse();
      // Collections.reverse(this.rows);
    }

    return ps;
  }

  // Try to construct a valid rows sequence
  // Recursion is used to implement backtracking
  private checkRows(
    collectedRows: any,
    currentRow: number
  ): Array<ExpandedPair> {
    for (let i = currentRow; i < this.rows.length; i++) {
      let row: any = this.rows[i];
      this.pairs.length = 0;
      for (let collectedRow of collectedRows) {
        this.pairs.push(collectedRow.getPairs());
      }
      this.pairs.push(row.getPairs());

      if (!RSSExpandedReader.isValidSequence(this.pairs)) {
        continue;
      }

      if (this.checkChecksum()) {
        return this.pairs;
      }

      let rs = new Array<any>(collectedRows);
      rs.push(row);
      try {
        // Recursion: try to add more rows
        return this.checkRows(rs, i + 1);
      } catch (e) {
        // We failed, try the next candidate
        console.log(e);
      }
    }

    throw new NotFoundException();
  }

  // Whether the pairs form a valid find pattern sequence,
  // either complete or a prefix
  private static isValidSequence(pairs: Array<ExpandedPair>): boolean {
    for (let sequence of RSSExpandedReader.FINDER_PATTERN_SEQUENCES) {
      if (pairs.length > sequence.length) {
        continue;
      }

      let stop = true;
      for (let j = 0; j < pairs.length; j++) {
        if (pairs[j].getFinderPattern().getValue() !== sequence[j]) {
          stop = false;
          break;
        }
      }

      if (stop) {
        return true;
      }
    }

    return false;
  }

  private storeRow(rowNumber: number, wasReversed: boolean): void {
    // Discard if duplicate above or below; otherwise insert in order by row number.
    let insertPos = 0;
    let prevIsSame = false;
    let nextIsSame = false;
    while (insertPos < this.rows.length) {
      let erow = this.rows[insertPos];
      if (erow.getRowNumber() > rowNumber) {
        nextIsSame = erow.isEquivalent(this.pairs);
        break;
      }
      prevIsSame = erow.isEquivalent(this.pairs);
      insertPos++;
    }
    if (nextIsSame || prevIsSame) {
      return;
    }

    // When the row was partially decoded (e.g. 2 pairs found instead of 3),
    // it will prevent us from detecting the barcode.
    // Try to merge partial rows

    // Check whether the row is part of an allready detected row
    if (RSSExpandedReader.isPartialRow(this.pairs, this.rows)) {
      return;
    }

    this.rows.push(
      insertPos,
      new ExpandedRow(this.pairs, rowNumber, wasReversed)
    );

    this.removePartialRows(this.pairs, this.rows);
  }

  // Remove all the rows that contains only specified pairs
  private removePartialRows(
    pairs: Array<ExpandedPair>,
    rows: Array<ExpandedRow>
  ): void {
    // for (Iterator<ExpandedRow> iterator = rows.iterator(); iterator.hasNext();) {
    //   ExpandedRow r = iterator.next();
    //   if (r.getPairs().size() == pairs.size()) {
    //     continue;
    //   }
    //   boolean allFound = true;
    //   for (ExpandedPair p : r.getPairs()) {
    //     boolean found = false;
    //     for (ExpandedPair pp : pairs) {
    //       if (p.equals(pp)) {
    //         found = true;
    //         break;
    //       }
    //     }
    //     if (!found) {
    //       allFound = false;
    //       break;
    //     }
    //   }
    //   if (allFound) {
    //     // 'pairs' contains all the pairs from the row 'r'
    //     iterator.remove();
    //   }
    // }
    for (let row of rows) {
      if (row.getPairs().length === pairs.length) {
        continue;
      }
      let allFound = true;
      for (let p of row.getPairs()) {
        let found = false;
        for (let pp of pairs) {
          if (ExpandedPair.equals(p, pp)) {
            found = true;
            break;
          }
        }
        if (!found) {
          allFound = false;
        }
      }
    }
  }

  // Returns true when one of the rows already contains all the pairs
  private static isPartialRow(pairs: any, rows: any): boolean {
    for (let r of rows) {
      let allFound = true;
      for (let p of pairs) {
        let found = false;
        for (let pp of r.getPairs()) {
          if (p.equals(pp)) {
            found = true;
            break;
          }
        }
        if (!found) {
          allFound = false;
          break;
        }
      }
      if (allFound) {
        // the row 'r' contain all the pairs from 'pairs'
        return true;
      }
    }
    return false;
  }

  // Only used for unit testing
  getRows() {
    return this.rows;
  }

  // Not private for unit testing
  static constructResult(pairs: Array<ExpandedPair>) {
    let binary = BitArrayBuilder.buildBitArray(pairs);

    let decoder = createDecoder(binary);
    let resultingString = decoder.parseInformation();

    let firstPoints = pairs[0].getFinderPattern().getResultPoints();
    let lastPoints = pairs[pairs.length - 1]
      .getFinderPattern()
      .getResultPoints();
    let points = [firstPoints[0], firstPoints[1], lastPoints[0], lastPoints[1]];
    return new Result(
      resultingString,
      null,
      null,
      points,
      BarcodeFormat.RSS_EXPANDED,
      null
    );
  }

  private checkChecksum(): boolean {
    let firstPair = this.pairs.get(0);
    let checkCharacter = firstPair.getLeftChar();
    let firstCharacter = firstPair.getRightChar();

    if (firstCharacter === null) {
      return false;
    }

    let checksum = firstCharacter.getChecksumPortion();
    let s = 2;

    for (let i = 1; i < this.pairs.size(); ++i) {
      let currentPair = this.pairs.get(i);
      checksum += currentPair.getLeftChar().getChecksumPortion();
      s++;
      let currentRightChar = currentPair.getRightChar();
      if (currentRightChar != null) {
        checksum += currentRightChar.getChecksumPortion();
        s++;
      }
    }

    checksum %= 211;

    let checkCharacterValue = 211 * (s - 4) + checksum;

    return checkCharacterValue === checkCharacter.getValue();
  }

  private static getNextSecondBar(row: BitArray, initialPos: number): number {
    let currentPos;
    if (row.get(initialPos)) {
      currentPos = row.getNextUnset(initialPos);
      currentPos = row.getNextSet(currentPos);
    } else {
      currentPos = row.getNextSet(initialPos);
      currentPos = row.getNextUnset(currentPos);
    }
    return currentPos;
  }

  // not private for testing
  retrieveNextPair(
    row: BitArray,
    previousPairs: Array<ExpandedPair>,
    rowNumber: number
  ): ExpandedPair {
    let isOddPattern = previousPairs.length % 2 === 0;
    if (this.startFromEven) {
      isOddPattern = !isOddPattern;
    }

    let pattern;

    let keepFinding = true;
    let forcedOffset = -1;
    do {
      this.findNextPair(row, previousPairs, forcedOffset);
      pattern = this.parseFoundFinderPattern(row, rowNumber, isOddPattern);
      if (pattern === null) {
        forcedOffset = RSSExpandedReader.getNextSecondBar(
          row,
          this.startEnd[0]
        );
      } else {
        keepFinding = false;
      }
    } while (keepFinding);

    // When stacked symbol is split over multiple rows, there's no way to guess if this pair can be last or not.
    // boolean mayBeLast = checkPairSequence(previousPairs, pattern);

    let leftChar = this.decodeDataCharacter(row, pattern, isOddPattern, true);

    if (
      !this.isEmptyPair(previousPairs) &&
      previousPairs[previousPairs.length - 1].mustBeLast()
    ) {
      throw new NotFoundException();
    }

    let rightChar;
    try {
      rightChar = this.decodeDataCharacter(row, pattern, isOddPattern, false);
    } catch (e) {
      rightChar = null;
      console.log(e);
    }
    return new ExpandedPair(leftChar, rightChar, pattern, true);
  }
  isEmptyPair(pairs) {
    if (pairs.length === 0) {
      return true;
    }
    return false;
  }
  private findNextPair(
    row: BitArray,
    previousPairs: Array<ExpandedPair>,
    forcedOffset: number
  ): void {
    let counters = this.getDecodeFinderCounters();
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;

    let width = row.getSize();

    let rowOffset;
    if (forcedOffset >= 0) {
      rowOffset = forcedOffset;
    } else if (this.isEmptyPair(previousPairs)) {
      rowOffset = 0;
    } else {
      let lastPair = previousPairs[previousPairs.length - 1];
      rowOffset = lastPair.getFinderPattern().getStartEnd()[1];
    }
    let searchingEvenPair = previousPairs.length % 2 !== 0;
    if (this.startFromEven) {
      searchingEvenPair = !searchingEvenPair;
    }

    let isWhite = false;
    while (rowOffset < width) {
      isWhite = !row.get(rowOffset);
      if (!isWhite) {
        break;
      }
      rowOffset++;
    }

    let counterPosition = 0;
    let patternStart = rowOffset;
    for (let x = rowOffset; x < width; x++) {
      if (row.get(x) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === 3) {
          if (searchingEvenPair) {
            RSSExpandedReader.reverseCounters(counters);
          }

          if (RSSExpandedReader.isFinderPattern(counters)) {
            this.startEnd[0] = patternStart;
            this.startEnd[1] = x;
            return;
          }

          if (searchingEvenPair) {
            RSSExpandedReader.reverseCounters(counters);
          }

          patternStart += counters[0] + counters[1];
          counters[0] = counters[2];
          counters[1] = counters[3];
          counters[2] = 0;
          counters[3] = 0;
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

  private static reverseCounters(counters): void {
    let length = counters.length;
    for (let i = 0; i < length / 2; ++i) {
      let tmp = counters[i];
      counters[i] = counters[length - i - 1];
      counters[length - i - 1] = tmp;
    }
  }

  private parseFoundFinderPattern(
    row: BitArray,
    rowNumber: number,
    oddPattern: boolean
  ): FinderPattern {
    // Actually we found elements 2-5.
    let firstCounter;
    let start;
    let end;

    if (oddPattern) {
      // If pattern number is odd, we need to locate element 1 *before* the current block.

      let firstElementStart = this.startEnd[0] - 1;
      // Locate element 1
      while (firstElementStart >= 0 && !row.get(firstElementStart)) {
        firstElementStart--;
      }

      firstElementStart++;
      firstCounter = this.startEnd[0] - firstElementStart;
      start = firstElementStart;
      end = this.startEnd[1];
    } else {
      // If pattern number is even, the pattern is reversed, so we need to locate element 1 *after* the current block.

      start = this.startEnd[0];

      end = row.getNextUnset(this.startEnd[1] + 1);
      firstCounter = end - this.startEnd[1];
    }

    // Make 'counters' hold 1-4
    let counters = this.getDecodeFinderCounters();
    System.arraycopy(counters, 0, counters, 1, counters.length - 1);

    counters[0] = firstCounter;
    let value;
    try {
      value = this.parseFinderValue(
        counters,
        RSSExpandedReader.FINDER_PATTERNS
      );
    } catch (e) {
      return null;
    }
    // return new FinderPattern(value, new int[] { start, end }, start, end, rowNumber});
    return new FinderPattern(value, [start, end], start, end, rowNumber);
  }

  decodeDataCharacter(
    row: BitArray,
    pattern: FinderPattern,
    isOddPattern: boolean,
    leftChar: boolean
  ) {
    let counters = this.getDataCharacterCounters();
    for (let x = 0; x < counters.length; x++) {
      counters[x] = 0;
    }

    if (leftChar) {
      RSSExpandedReader.recordPatternInReverse(
        row,
        pattern.getStartEnd()[0],
        counters
      );
    } else {
      RSSExpandedReader.recordPattern(row, pattern.getStartEnd()[1], counters);
      // reverse it
      for (let i = 0, j = counters.length - 1; i < j; i++, j--) {
        let temp = counters[i];
        counters[i] = counters[j];
        counters[j] = temp;
      }
    } // counters[] has the pixels of the module

    let numModules = 17; // left and right data characters have all the same length
    let elementWidth = MathUtils.sum(new Int32Array(counters)) / numModules;

    // Sanity check: element width for pattern and the character should match
    let expectedElementWidth =
      (pattern.getStartEnd()[1] - pattern.getStartEnd()[0]) / 15.0;
    if (
      Math.abs(elementWidth - expectedElementWidth) / expectedElementWidth >
      0.3
    ) {
      throw new NotFoundException();
    }

    let oddCounts = this.getOddCounts();
    let evenCounts = this.getEvenCounts();
    let oddRoundingErrors = this.getOddRoundingErrors();
    let evenRoundingErrors = this.getEvenRoundingErrors();

    for (let i = 0; i < counters.length; i++) {
      let value = (1.0 * counters[i]) / elementWidth;
      let count = value + 0.5; // Round
      if (count < 1) {
        if (value < 0.3) {
          throw new NotFoundException();
        }
        count = 1;
      } else if (count > 8) {
        if (value > 8.7) {
          throw new NotFoundException();
        }
        count = 8;
      }
      let offset = i / 2;
      if ((i & 0x01) === 0) {
        oddCounts[offset] = count;
        oddRoundingErrors[offset] = value - count;
      } else {
        evenCounts[offset] = count;
        evenRoundingErrors[offset] = value - count;
      }
    }

    this.adjustOddEvenCounts(numModules);

    let weightRowNumber =
      4 * pattern.getValue() + (isOddPattern ? 0 : 2) + (leftChar ? 0 : 1) - 1;

    let oddSum = 0;
    let oddChecksumPortion = 0;
    for (let i = oddCounts.length - 1; i >= 0; i--) {
      if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
        let weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i];
        oddChecksumPortion += oddCounts[i] * weight;
      }
      oddSum += oddCounts[i];
    }
    let evenChecksumPortion = 0;
    // int evenSum = 0;
    for (let i = evenCounts.length - 1; i >= 0; i--) {
      if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
        let weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i + 1];
        evenChecksumPortion += evenCounts[i] * weight;
      }
      // evenSum += evenCounts[i];
    }
    let checksumPortion = oddChecksumPortion + evenChecksumPortion;

    if ((oddSum & 0x01) !== 0 || oddSum > 13 || oddSum < 4) {
      throw new NotFoundException();
    }

    let group = (13 - oddSum) / 2;
    let oddWidest = RSSExpandedReader.SYMBOL_WIDEST[group];
    let evenWidest = 9 - oddWidest;
    let vOdd = RSSUtils.getRSSvalue(oddCounts, oddWidest, true);
    let vEven = RSSUtils.getRSSvalue(evenCounts, evenWidest, false);
    let tEven = RSSExpandedReader.EVEN_TOTAL_SUBSET[group];
    let gSum = RSSExpandedReader.GSUM[group];
    let value = vOdd * tEven + vEven + gSum;

    return new DataCharacter(value, checksumPortion);
  }

  private static isNotA1left(
    pattern: FinderPattern,
    isOddPattern: boolean,
    leftChar: boolean
  ): boolean {
    // A1: pattern.getValue is 0 (A), and it's an oddPattern, and it is a left char
    return !(pattern.getValue() === 0 && isOddPattern && leftChar);
  }

  private adjustOddEvenCounts(numModules) {
    let oddSum = MathUtils.sum(new Int32Array(this.getOddCounts()));
    let evenSum = MathUtils.sum(new Int32Array(this.getEvenCounts()));

    let incrementOdd = false;
    let decrementOdd = false;

    if (oddSum > 13) {
      decrementOdd = true;
    } else if (oddSum < 4) {
      incrementOdd = true;
    }
    let incrementEven = false;
    let decrementEven = false;
    if (evenSum > 13) {
      decrementEven = true;
    } else if (evenSum < 4) {
      incrementEven = true;
    }

    let mismatch = oddSum + evenSum - numModules;
    let oddParityBad = (oddSum & 0x01) === 1;
    let evenParityBad = (evenSum & 0x01) === 0;
    if (mismatch === 1) {
      if (oddParityBad) {
        if (evenParityBad) {
          throw new NotFoundException();
        }
        decrementOdd = true;
      } else {
        if (!evenParityBad) {
          throw new NotFoundException();
        }
        decrementEven = true;
      }
    } else if (mismatch === -1) {
      if (oddParityBad) {
        if (evenParityBad) {
          throw new NotFoundException();
        }
        incrementOdd = true;
      } else {
        if (!evenParityBad) {
          throw new NotFoundException();
        }
        incrementEven = true;
      }
    } else if (mismatch === 0) {
      if (oddParityBad) {
        if (!evenParityBad) {
          throw new NotFoundException();
        }
        // Both bad
        if (oddSum < evenSum) {
          incrementOdd = true;
          decrementEven = true;
        } else {
          decrementOdd = true;
          incrementEven = true;
        }
      } else {
        if (evenParityBad) {
          throw new NotFoundException();
        }
        // Nothing to do!
      }
    } else {
      throw new NotFoundException();
    }

    if (incrementOdd) {
      if (decrementOdd) {
        throw new NotFoundException();
      }
      RSSExpandedReader.increment(
        this.getOddCounts(),
        this.getOddRoundingErrors()
      );
    }
    if (decrementOdd) {
      RSSExpandedReader.decrement(
        this.getOddCounts(),
        this.getOddRoundingErrors()
      );
    }
    if (incrementEven) {
      if (decrementEven) {
        throw new NotFoundException();
      }
      RSSExpandedReader.increment(
        this.getEvenCounts(),
        this.getOddRoundingErrors()
      );
    }
    if (decrementEven) {
      RSSExpandedReader.decrement(
        this.getEvenCounts(),
        this.getEvenRoundingErrors()
      );
    }
  }
}
