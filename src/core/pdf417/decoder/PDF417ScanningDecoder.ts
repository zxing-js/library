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

// import com.google.zxing.ChecksumException;
import ChecksumException from '../../ChecksumException';
// import com.google.zxing.FormatException;
import FormatException from '../../FormatException';
// import com.google.zxing.NotFoundException;
import NotFoundException from '../../NotFoundException';
// import com.google.zxing.ResultPoint;
import ResultPoint from '../../ResultPoint';
// import com.google.zxing.common.BitMatrix;
import BitMatrix from '../../common/BitMatrix';
// import com.google.zxing.common.DecoderResult;
import DecoderResult from '../../common/DecoderResult';
// import com.google.zxing.common.detector.MathUtils;
import MathUtils from '../../common/detector/MathUtils';
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';
// import com.google.zxing.pdf417.decoder.ec.ErrorCorrection;
import ErrorCorrection from './ec/ErrorCorrection';

// local
import BoundingBox from './BoundingBox';
import DetectionResultRowIndicatorColumn from './DetectionResultRowIndicatorColumn';
import DetectionResult from './DetectionResult';
import DetectionResultColumn from './DetectionResultColumn';
import Codeword from './Codeword';
import BarcodeMetadata from './BarcodeMetadata';
import BarcodeValue from './BarcodeValue';
import PDF417CodewordDecoder from './PDF417CodewordDecoder';
import DecodedBitStreamParser from './DecodedBitStreamParser';

// utils
import Formatter from '../../util/Formatter';
import { int, List, Collection } from '../../../customTypings';

// import java.util.ArrayList;
// import java.util.Collection;
// import java.util.Formatter;
// import java.util.List;

/**
 * @author Guenther Grau
 */
export default /*public final*/ class PDF417ScanningDecoder {

  /*final*/ static CODEWORD_SKEW_SIZE: int = 2;

  /*final*/ static MAX_ERRORS: int = 3;
  /*final*/ static MAX_EC_CODEWORDS: int = 512;
  /*final*/ static errorCorrection: ErrorCorrection = new ErrorCorrection();

  private constructor() {}

  /**
   * @TODO don't pass in minCodewordWidth and maxCodewordWidth, pass in barcode columns for start and stop pattern
   *
   * columns. That way width can be deducted from the pattern column.
   * This approach also allows to detect more details about the barcode, e.g. if a bar type (white or black) is wider
   * than it should be. This can happen if the scanner used a bad blackpoint.
   *
   * @param BitMatrix
   * @param image
   * @param ResultPoint
   * @param imageTopLeft
   * @param ResultPoint
   * @param imageBottomLeft
   * @param ResultPoint
   * @param imageTopRight
   * @param ResultPoint
   * @param imageBottomRight
   * @param int
   * @param minCodewordWidth
   * @param int
   * @param maxCodewordWidth
   *
   * @throws NotFoundException
   * @throws FormatException
   * @throws ChecksumException
   */
  public static decode(image: BitMatrix,
    imageTopLeft: ResultPoint,
    imageBottomLeft: ResultPoint,
    imageTopRight: ResultPoint,
    imageBottomRight: ResultPoint,
    minCodewordWidth: int,
    maxCodewordWidth: int): DecoderResult {
    let boundingBox: BoundingBox = new BoundingBox(image, imageTopLeft, imageBottomLeft, imageTopRight, imageBottomRight);
    let leftRowIndicatorColumn: DetectionResultRowIndicatorColumn = null;
    let rightRowIndicatorColumn: DetectionResultRowIndicatorColumn = null;
    let detectionResult: DetectionResult;
    for (let firstPass /*boolean*/ = true; ; firstPass = false) {
      if (imageTopLeft != null) {
        leftRowIndicatorColumn = PDF417ScanningDecoder.getRowIndicatorColumn(image, boundingBox, imageTopLeft, true, minCodewordWidth,
          maxCodewordWidth);
      }
      if (imageTopRight != null) {
        rightRowIndicatorColumn = PDF417ScanningDecoder.getRowIndicatorColumn(image, boundingBox, imageTopRight, false, minCodewordWidth,
          maxCodewordWidth);
      }
      detectionResult = PDF417ScanningDecoder.merge(leftRowIndicatorColumn, rightRowIndicatorColumn);
      if (detectionResult == null) {
        throw NotFoundException.getNotFoundInstance();
      }
      let resultBox: BoundingBox = detectionResult.getBoundingBox();
      if (firstPass && resultBox != null &&
        (resultBox.getMinY() < boundingBox.getMinY() || resultBox.getMaxY() > boundingBox.getMaxY())) {
        boundingBox = resultBox;
      } else {
        break;
      }
    }
    detectionResult.setBoundingBox(boundingBox);
    let maxBarcodeColumn: int = detectionResult.getBarcodeColumnCount() + 1;
    detectionResult.setDetectionResultColumn(0, leftRowIndicatorColumn);
    detectionResult.setDetectionResultColumn(maxBarcodeColumn, rightRowIndicatorColumn);

    let leftToRight: boolean = leftRowIndicatorColumn != null;
    for (let barcodeColumnCount /*int*/ = 1; barcodeColumnCount <= maxBarcodeColumn; barcodeColumnCount++) {
      let barcodeColumn: int = leftToRight ? barcodeColumnCount : maxBarcodeColumn - barcodeColumnCount;
      if (detectionResult.getDetectionResultColumn(barcodeColumn) !== /* null */ undefined) {
        // This will be the case for the opposite row indicator column, which doesn't need to be decoded again.
        continue;
      }
      let detectionResultColumn: DetectionResultColumn;
      if (barcodeColumn === 0 || barcodeColumn === maxBarcodeColumn) {
        detectionResultColumn = new DetectionResultRowIndicatorColumn(boundingBox, barcodeColumn === 0);
      } else {
        detectionResultColumn = new DetectionResultColumn(boundingBox);
      }
      detectionResult.setDetectionResultColumn(barcodeColumn, detectionResultColumn);
      let startColumn: int = -1;
      let previousStartColumn: int = startColumn;
      // TODO start at a row for which we know the start position, then detect upwards and downwards from there.
      for (let imageRow /*int*/ = boundingBox.getMinY(); imageRow <= boundingBox.getMaxY(); imageRow++) {
        startColumn = PDF417ScanningDecoder.getStartColumn(detectionResult, barcodeColumn, imageRow, leftToRight);
        if (startColumn < 0 || startColumn > boundingBox.getMaxX()) {
          if (previousStartColumn === -1) {
            continue;
          }
          startColumn = previousStartColumn;
        }
        let codeword: Codeword = PDF417ScanningDecoder.detectCodeword(image, boundingBox.getMinX(), boundingBox.getMaxX(), leftToRight,
          startColumn, imageRow, minCodewordWidth, maxCodewordWidth);
        if (codeword != null) {
          detectionResultColumn.setCodeword(imageRow, codeword);
          previousStartColumn = startColumn;
          minCodewordWidth = Math.min(minCodewordWidth, codeword.getWidth());
          maxCodewordWidth = Math.max(maxCodewordWidth, codeword.getWidth());
        }
      }
    }
    return PDF417ScanningDecoder.createDecoderResult(detectionResult);
  }

  /**
   *
   * @param leftRowIndicatorColumn
   * @param rightRowIndicatorColumn
   *
   * @throws NotFoundException
   */
  private static merge(leftRowIndicatorColumn: DetectionResultRowIndicatorColumn,
    rightRowIndicatorColumn: DetectionResultRowIndicatorColumn): DetectionResult {
    if (leftRowIndicatorColumn == null && rightRowIndicatorColumn == null) {
      return null;
    }
    let barcodeMetadata: BarcodeMetadata = PDF417ScanningDecoder.getBarcodeMetadata(leftRowIndicatorColumn, rightRowIndicatorColumn);
    if (barcodeMetadata == null) {
      return null;
    }
    let boundingBox: BoundingBox = BoundingBox.merge(PDF417ScanningDecoder.adjustBoundingBox(leftRowIndicatorColumn),
      PDF417ScanningDecoder.adjustBoundingBox(rightRowIndicatorColumn));
    return new DetectionResult(barcodeMetadata, boundingBox);
  }

  /**
   *
   * @param rowIndicatorColumn
   *
   * @throws NotFoundException
   */
  private static adjustBoundingBox(rowIndicatorColumn: DetectionResultRowIndicatorColumn): BoundingBox {
    if (rowIndicatorColumn == null) {
      return null;
    }
    let rowHeights: Int32Array = rowIndicatorColumn.getRowHeights();
    if (rowHeights == null) {
      return null;
    }
    let maxRowHeight: int = PDF417ScanningDecoder.getMax(rowHeights);
    let missingStartRows: int = 0;
    for (let rowHeight /*int*/ of rowHeights) {
      missingStartRows += maxRowHeight - rowHeight;
      if (rowHeight > 0) {
        break;
      }
    }
    let codewords: Codeword[] = rowIndicatorColumn.getCodewords();
    for (let row /*int*/ = 0; missingStartRows > 0 && codewords[row] == null; row++) {
      missingStartRows--;
    }
    let missingEndRows: int = 0;
    for (let row /*int*/ = rowHeights.length - 1; row >= 0; row--) {
      missingEndRows += maxRowHeight - rowHeights[row];
      if (rowHeights[row] > 0) {
        break;
      }
    }
    for (let row /*int*/ = codewords.length - 1; missingEndRows > 0 && codewords[row] == null; row--) {
      missingEndRows--;
    }
    return rowIndicatorColumn.getBoundingBox().addMissingRows(missingStartRows, missingEndRows,
      rowIndicatorColumn.isLeft());
  }

  private static getMax(values: Int32Array): int {
    let maxValue: int = -1;
    for (let value /*int*/ of values) {
      maxValue = Math.max(maxValue, value);
    }
    return maxValue;
  }

  private static getBarcodeMetadata(leftRowIndicatorColumn: DetectionResultRowIndicatorColumn,
    rightRowIndicatorColumn: DetectionResultRowIndicatorColumn): BarcodeMetadata {
    let leftBarcodeMetadata: BarcodeMetadata;
    if (leftRowIndicatorColumn == null ||
      (leftBarcodeMetadata = leftRowIndicatorColumn.getBarcodeMetadata()) == null) {
      return rightRowIndicatorColumn == null ? null : rightRowIndicatorColumn.getBarcodeMetadata();
    }
    let rightBarcodeMetadata: BarcodeMetadata;
    if (rightRowIndicatorColumn == null ||
      (rightBarcodeMetadata = rightRowIndicatorColumn.getBarcodeMetadata()) == null) {
      return leftBarcodeMetadata;
    }

    if (leftBarcodeMetadata.getColumnCount() !== rightBarcodeMetadata.getColumnCount() &&
      leftBarcodeMetadata.getErrorCorrectionLevel() !== rightBarcodeMetadata.getErrorCorrectionLevel() &&
      leftBarcodeMetadata.getRowCount() !== rightBarcodeMetadata.getRowCount()) {
      return null;
    }
    return leftBarcodeMetadata;
  }

  private static getRowIndicatorColumn(image: BitMatrix,
    boundingBox: BoundingBox,
    startPoint: ResultPoint,
    leftToRight: boolean,
    minCodewordWidth: int,
    maxCodewordWidth: int): DetectionResultRowIndicatorColumn {
    let rowIndicatorColumn: DetectionResultRowIndicatorColumn = new DetectionResultRowIndicatorColumn(boundingBox,
      leftToRight);
    for (let i /*int*/ = 0; i < 2; i++) {
      let increment: int = i === 0 ? 1 : -1;
      let startColumn: int = Math.trunc(<int>Math.trunc(startPoint.getX()));
      for (let imageRow /*int*/ = Math.trunc(<int>Math.trunc(startPoint.getY())); imageRow <= boundingBox.getMaxY() &&
        imageRow >= boundingBox.getMinY(); imageRow += increment) {
        let codeword: Codeword = PDF417ScanningDecoder.detectCodeword(image, 0, image.getWidth(), leftToRight, startColumn, imageRow,
          minCodewordWidth, maxCodewordWidth);
        if (codeword != null) {
          rowIndicatorColumn.setCodeword(imageRow, codeword);
          if (leftToRight) {
            startColumn = codeword.getStartX();
          } else {
            startColumn = codeword.getEndX();
          }
        }
      }
    }
    return rowIndicatorColumn;
  }

  /**
   *
   * @param detectionResult
   * @param BarcodeValue
   * @param param2
   * @param param3
   * @param barcodeMatrix
   *
   * @throws NotFoundException
   */
  private static adjustCodewordCount(detectionResult: DetectionResult, barcodeMatrix: BarcodeValue[][]): void {
    let barcodeMatrix01: BarcodeValue = barcodeMatrix[0][1];
    let numberOfCodewords: Int32Array = barcodeMatrix01.getValue();
    let calculatedNumberOfCodewords: int = detectionResult.getBarcodeColumnCount() *
      detectionResult.getBarcodeRowCount() -
      PDF417ScanningDecoder.getNumberOfECCodeWords(detectionResult.getBarcodeECLevel());
    if (numberOfCodewords.length === 0) {
      if (calculatedNumberOfCodewords < 1 || calculatedNumberOfCodewords > PDF417Common.MAX_CODEWORDS_IN_BARCODE) {
        throw NotFoundException.getNotFoundInstance();
      }
      barcodeMatrix01.setValue(calculatedNumberOfCodewords);
    } else if (numberOfCodewords[0] !== calculatedNumberOfCodewords) {
      // The calculated one is more reliable as it is derived from the row indicator columns
      barcodeMatrix01.setValue(calculatedNumberOfCodewords);
    }
  }

  /**
   *
   * @param detectionResult
   *
   * @throws FormatException
   * @throws ChecksumException
   * @throws NotFoundException
   */
  private static createDecoderResult(detectionResult: DetectionResult): DecoderResult {
    let barcodeMatrix: BarcodeValue[][] = PDF417ScanningDecoder.createBarcodeMatrix(detectionResult);
    PDF417ScanningDecoder.adjustCodewordCount(detectionResult, barcodeMatrix);
    let erasures /*Collection<Integer>*/ = new Array<number>();
    let codewords: Int32Array = new Int32Array(detectionResult.getBarcodeRowCount() * detectionResult.getBarcodeColumnCount());
    let ambiguousIndexValuesList: /*List<int[]>*/ List<Int32Array> = [];
    let ambiguousIndexesList: /*Collection<Integer>*/ Collection<int> = new Array<int>();
    for (let row /*int*/ = 0; row < detectionResult.getBarcodeRowCount(); row++) {
      for (let column /*int*/ = 0; column < detectionResult.getBarcodeColumnCount(); column++) {
        let values: Int32Array = barcodeMatrix[row][column + 1].getValue();
        let codewordIndex: int = row * detectionResult.getBarcodeColumnCount() + column;
        if (values.length === 0) {
          erasures.push(codewordIndex);
        } else if (values.length === 1) {
          codewords[codewordIndex] = values[0];
        } else {
          ambiguousIndexesList.push(codewordIndex);
          ambiguousIndexValuesList.push(values);
        }
      }
    }
    let ambiguousIndexValues: Int32Array[] = new Array<Int32Array>(ambiguousIndexValuesList.length);
    for (let i /*int*/ = 0; i < ambiguousIndexValues.length; i++) {
      ambiguousIndexValues[i] = ambiguousIndexValuesList[i];
    }
    return PDF417ScanningDecoder.createDecoderResultFromAmbiguousValues(detectionResult.getBarcodeECLevel(), codewords,
      PDF417Common.toIntArray(erasures), PDF417Common.toIntArray(ambiguousIndexesList), ambiguousIndexValues);
  }

  /**
   * This method deals with the fact, that the decoding process doesn't always yield a single most likely value. The
   * current error correction implementation doesn't deal with erasures very well, so it's better to provide a value
   * for these ambiguous codewords instead of treating it as an erasure. The problem is that we don't know which of
   * the ambiguous values to choose. We try decode using the first value, and if that fails, we use another of the
   * ambiguous values and try to decode again. This usually only happens on very hard to read and decode barcodes,
   * so decoding the normal barcodes is not affected by this.
   *
   * @param erasureArray contains the indexes of erasures
   * @param ambiguousIndexes array with the indexes that have more than one most likely value
   * @param ambiguousIndexValues two dimensional array that contains the ambiguous values. The first dimension must
   * be the same length as the ambiguousIndexes array
   *
   * @throws FormatException
   * @throws ChecksumException
   */
  private static createDecoderResultFromAmbiguousValues(ecLevel: int,
    codewords: Int32Array,
    erasureArray: Int32Array,
    ambiguousIndexes: Int32Array,
    ambiguousIndexValues: Int32Array[]): DecoderResult {
    let ambiguousIndexCount: Int32Array = new Int32Array(ambiguousIndexes.length);

    let tries: int = 100;
    while (tries-- > 0) {
      for (let i /*int*/ = 0; i < ambiguousIndexCount.length; i++) {
        codewords[ambiguousIndexes[i]] = ambiguousIndexValues[i][ambiguousIndexCount[i]];
      }
      try {
        return PDF417ScanningDecoder.decodeCodewords(codewords, ecLevel, erasureArray);
      } catch (err) {
        let ignored = err instanceof ChecksumException;
        if (!ignored) {
          throw err;
        }
      }
      if (ambiguousIndexCount.length === 0) {
        throw ChecksumException.getChecksumInstance();
      }
      for (let i /*int*/ = 0; i < ambiguousIndexCount.length; i++) {
        if (ambiguousIndexCount[i] < ambiguousIndexValues[i].length - 1) {
          ambiguousIndexCount[i]++;
          break;
        } else {
          ambiguousIndexCount[i] = 0;
          if (i === ambiguousIndexCount.length - 1) {
            throw ChecksumException.getChecksumInstance();
          }
        }
      }
    }
    throw ChecksumException.getChecksumInstance();
  }

  private static createBarcodeMatrix(detectionResult: DetectionResult): BarcodeValue[][] {
    // let barcodeMatrix: BarcodeValue[][] =
      // new BarcodeValue[detectionResult.getBarcodeRowCount()][detectionResult.getBarcodeColumnCount() + 2];
    let barcodeMatrix: BarcodeValue[][] =
      Array.from({ length: detectionResult.getBarcodeRowCount() }, () => new Array(detectionResult.getBarcodeColumnCount() + 2));
    for (let row /*int*/ = 0; row < barcodeMatrix.length; row++) {
      for (let column /*int*/ = 0; column < barcodeMatrix[row].length; column++) {
        barcodeMatrix[row][column] = new BarcodeValue();
      }
    }

    let column: int = 0;
    for (let detectionResultColumn /*DetectionResultColumn*/ of detectionResult.getDetectionResultColumns()) {
      if (detectionResultColumn != null) {
        for (let codeword /*Codeword*/ of detectionResultColumn.getCodewords()) {
          if (codeword != null) {
            let rowNumber: int = codeword.getRowNumber();
            if (rowNumber >= 0) {
              if (rowNumber >= barcodeMatrix.length) {
                // We have more rows than the barcode metadata allows for, ignore them.
                continue;
              }
              barcodeMatrix[rowNumber][column].setValue(codeword.getValue());
            }
          }
        }
      }
      column++;
    }
    return barcodeMatrix;
  }

  private static isValidBarcodeColumn(detectionResult: DetectionResult, barcodeColumn: int): boolean {
    return barcodeColumn >= 0 && barcodeColumn <= detectionResult.getBarcodeColumnCount() + 1;
  }

  private static getStartColumn(detectionResult: DetectionResult,
    barcodeColumn: int,
    imageRow: int,
    leftToRight: boolean): int {
    let offset: int = leftToRight ? 1 : -1;
    let codeword: Codeword = null;
    if (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
      codeword = detectionResult.getDetectionResultColumn(barcodeColumn - offset).getCodeword(imageRow);
    }
    if (codeword != null) {
      return leftToRight ? codeword.getEndX() : codeword.getStartX();
    }
    codeword = detectionResult.getDetectionResultColumn(barcodeColumn).getCodewordNearby(imageRow);
    if (codeword != null) {
      return leftToRight ? codeword.getStartX() : codeword.getEndX();
    }
    if (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
      codeword = detectionResult.getDetectionResultColumn(barcodeColumn - offset).getCodewordNearby(imageRow);
    }
    if (codeword != null) {
      return leftToRight ? codeword.getEndX() : codeword.getStartX();
    }
    let skippedColumns: int = 0;

    while (PDF417ScanningDecoder.isValidBarcodeColumn(detectionResult, barcodeColumn - offset)) {
      barcodeColumn -= offset;
      for (let previousRowCodeword /*Codeword*/ of detectionResult.getDetectionResultColumn(barcodeColumn).getCodewords()) {
        if (previousRowCodeword != null) {
          return (leftToRight ? previousRowCodeword.getEndX() : previousRowCodeword.getStartX()) +
            offset *
            skippedColumns *
            (previousRowCodeword.getEndX() - previousRowCodeword.getStartX());
        }
      }
      skippedColumns++;
    }
    return leftToRight ? detectionResult.getBoundingBox().getMinX() : detectionResult.getBoundingBox().getMaxX();
  }

  private static detectCodeword(image: BitMatrix,
    minColumn: int,
    maxColumn: int,
    leftToRight: boolean,
    startColumn: int,
    imageRow: int,
    minCodewordWidth: int,
    maxCodewordWidth: int): Codeword {
    startColumn = PDF417ScanningDecoder.adjustCodewordStartColumn(image, minColumn, maxColumn, leftToRight, startColumn, imageRow);
    // we usually know fairly exact now how long a codeword is. We should provide minimum and maximum expected length
    // and try to adjust the read pixels, e.g. remove single pixel errors or try to cut off exceeding pixels.
    // min and maxCodewordWidth should not be used as they are calculated for the whole barcode an can be inaccurate
    // for the current position
    let moduleBitCount: Int32Array = PDF417ScanningDecoder.getModuleBitCount(image, minColumn, maxColumn, leftToRight, startColumn, imageRow);
    if (moduleBitCount == null) {
      return null;
    }
    let endColumn: int;
    let codewordBitCount: int = MathUtils.sum(moduleBitCount);
    if (leftToRight) {
      endColumn = startColumn + codewordBitCount;
    } else {
      for (let i /*int*/ = 0; i < moduleBitCount.length / 2; i++) {
        let tmpCount: int = moduleBitCount[i];
        moduleBitCount[i] = moduleBitCount[moduleBitCount.length - 1 - i];
        moduleBitCount[moduleBitCount.length - 1 - i] = tmpCount;
      }
      endColumn = startColumn;
      startColumn = endColumn - codewordBitCount;
    }
    // TODO implement check for width and correction of black and white bars
    // use start (and maybe stop pattern) to determine if black bars are wider than white bars. If so, adjust.
    // should probably done only for codewords with a lot more than 17 bits.
    // The following fixes 10-1.png, which has wide black bars and small white bars
    //    for (let i /*int*/ = 0; i < moduleBitCount.length; i++) {
    //      if (i % 2 === 0) {
    //        moduleBitCount[i]--;
    //      } else {
    //        moduleBitCount[i]++;
    //      }
    //    }

    // We could also use the width of surrounding codewords for more accurate results, but this seems
    // sufficient for now
    if (!PDF417ScanningDecoder.checkCodewordSkew(codewordBitCount, minCodewordWidth, maxCodewordWidth)) {
      // We could try to use the startX and endX position of the codeword in the same column in the previous row,
      // create the bit count from it and normalize it to 8. This would help with single pixel errors.
      return null;
    }

    let decodedValue: int = PDF417CodewordDecoder.getDecodedValue(moduleBitCount);
    let codeword: int = PDF417Common.getCodeword(decodedValue);
    if (codeword === -1) {
      return null;
    }
    return new Codeword(startColumn, endColumn, PDF417ScanningDecoder.getCodewordBucketNumber(decodedValue), codeword);
  }

  private static getModuleBitCount(image: BitMatrix,
    minColumn: int,
    maxColumn: int,
    leftToRight: boolean,
    startColumn: int,
    imageRow: int): Int32Array {
    let imageColumn: int = startColumn;
    let moduleBitCount: Int32Array = new Int32Array(8);
    let moduleNumber: int = 0;
    let increment: int = leftToRight ? 1 : -1;
    let previousPixelValue: boolean = leftToRight;
    while ((leftToRight ? imageColumn < maxColumn : imageColumn >= minColumn) &&
      moduleNumber < moduleBitCount.length) {
      if (image.get(imageColumn, imageRow) === previousPixelValue) {
        moduleBitCount[moduleNumber]++;
        imageColumn += increment;
      } else {
        moduleNumber++;
        previousPixelValue = !previousPixelValue;
      }
    }
    if (moduleNumber === moduleBitCount.length ||
      ((imageColumn === (leftToRight ? maxColumn : minColumn)) &&
        moduleNumber === moduleBitCount.length - 1)) {
      return moduleBitCount;
    }
    return null;
  }

  private static getNumberOfECCodeWords(barcodeECLevel: int): int {
    return 2 << barcodeECLevel;
  }

  private static adjustCodewordStartColumn(image: BitMatrix,
    minColumn: int,
    maxColumn: int,
    leftToRight: boolean,
    codewordStartColumn: int,
    imageRow: int): int {
    let correctedStartColumn: int = codewordStartColumn;
    let increment: int = leftToRight ? -1 : 1;
    // there should be no black pixels before the start column. If there are, then we need to start earlier.
    for (let i /*int*/ = 0; i < 2; i++) {
      while ((leftToRight ? correctedStartColumn >= minColumn : correctedStartColumn < maxColumn) &&
        leftToRight === image.get(correctedStartColumn, imageRow)) {
        if (Math.abs(codewordStartColumn - correctedStartColumn) > PDF417ScanningDecoder.CODEWORD_SKEW_SIZE) {
          return codewordStartColumn;
        }
        correctedStartColumn += increment;
      }
      increment = -increment;
      leftToRight = !leftToRight;
    }
    return correctedStartColumn;
  }

  private static checkCodewordSkew(codewordSize: int, minCodewordWidth: int, maxCodewordWidth: int): boolean {
    return minCodewordWidth - PDF417ScanningDecoder.CODEWORD_SKEW_SIZE <= codewordSize &&
      codewordSize <= maxCodewordWidth + PDF417ScanningDecoder.CODEWORD_SKEW_SIZE;
  }

  /**
   * @throws FormatException,
   * @throws ChecksumException
   */
  private static decodeCodewords(codewords: Int32Array, ecLevel: int, erasures: Int32Array): DecoderResult {
    if (codewords.length === 0) {
      throw FormatException.getFormatInstance();
    }

    let numECCodewords: int = 1 << (ecLevel + 1);
    let correctedErrorsCount: int = PDF417ScanningDecoder.correctErrors(codewords, erasures, numECCodewords);
    PDF417ScanningDecoder.verifyCodewordCount(codewords, numECCodewords);

    // Decode the codewords
    let decoderResult: DecoderResult = DecodedBitStreamParser.decode(codewords, '' + ecLevel);
    decoderResult.setErrorsCorrected(correctedErrorsCount);
    decoderResult.setErasures(erasures.length);
    return decoderResult;
  }

  /**
   * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
   * correct the errors in-place.</p>
   *
   * @param codewords   data and error correction codewords
   * @param erasures positions of any known erasures
   * @param numECCodewords number of error correction codewords that are available in codewords
   * @throws ChecksumException if error correction fails
   */
  private static correctErrors(codewords: Int32Array, erasures: Int32Array, numECCodewords: int): int {
    if (erasures != null &&
      erasures.length > numECCodewords / 2 + PDF417ScanningDecoder.MAX_ERRORS ||
      numECCodewords < 0 ||
      numECCodewords > PDF417ScanningDecoder.MAX_EC_CODEWORDS) {
      // Too many errors or EC Codewords is corrupted
      throw ChecksumException.getChecksumInstance();
    }
    return PDF417ScanningDecoder.errorCorrection.decode(codewords, numECCodewords, erasures);
  }

  /**
   * Verify that all is OK with the codeword array.
   * @throws FormatException
   */
  private static verifyCodewordCount(codewords: Int32Array, numECCodewords: int): void {
    if (codewords.length < 4) {
      // Codeword array size should be at least 4 allowing for
      // Count CW, At least one Data CW, Error Correction CW, Error Correction CW
      throw FormatException.getFormatInstance();
    }
    // The first codeword, the Symbol Length Descriptor, shall always encode the total number of data
    // codewords in the symbol, including the Symbol Length Descriptor itself, data codewords and pad
    // codewords, but excluding the number of error correction codewords.
    let numberOfCodewords: int = codewords[0];
    if (numberOfCodewords > codewords.length) {
      throw FormatException.getFormatInstance();
    }
    if (numberOfCodewords === 0) {
      // Reset to the length of the array - 8 (Allow for at least level 3 Error Correction (8 Error Codewords)
      if (numECCodewords < codewords.length) {
        codewords[0] = codewords.length - numECCodewords;
      } else {
        throw FormatException.getFormatInstance();
      }
    }
  }

  private static getBitCountForCodeword(codeword: int): Int32Array {
    let result: Int32Array = new Int32Array(8);
    let previousValue: int = 0;
    let i: int = result.length - 1;
    while (true) {
      if ((codeword & 0x1) !== previousValue) {
        previousValue = codeword & 0x1;
        i--;
        if (i < 0) {
          break;
        }
      }
      result[i]++;
      codeword >>= 1;
    }
    return result;
  }

  private static getCodewordBucketNumber(codeword: int | Int32Array): int {
    if (codeword instanceof Int32Array) {
      return this.getCodewordBucketNumber_Int32Array(codeword);
    }
    return this.getCodewordBucketNumber_number(codeword);
  }

  private static getCodewordBucketNumber_number(codeword: int): int {
    return PDF417ScanningDecoder.getCodewordBucketNumber(PDF417ScanningDecoder.getBitCountForCodeword(codeword));
  }

  private static getCodewordBucketNumber_Int32Array(moduleBitCount: Int32Array): int {
    return (moduleBitCount[0] - moduleBitCount[2] + moduleBitCount[4] - moduleBitCount[6] + 9) % 9;
  }

  public static toString(barcodeMatrix: BarcodeValue[][]): String {
    let formatter = new Formatter();
    // try (let formatter = new Formatter()) {
    for (let row /*int*/ = 0; row < barcodeMatrix.length; row++) {
      formatter.format('Row %2d: ', row);
      for (let column /*int*/ = 0; column < barcodeMatrix[row].length; column++) {
        let barcodeValue: BarcodeValue = barcodeMatrix[row][column];
        if (barcodeValue.getValue().length === 0) {
          formatter.format('        ', <Object[]>null);
        } else {
          formatter.format('%4d(%2d)', barcodeValue.getValue()[0],
            barcodeValue.getConfidence(barcodeValue.getValue()[0]));
        }
      }
      formatter.format('%n');
    }
    return formatter.toString();
    // }
  }

}
