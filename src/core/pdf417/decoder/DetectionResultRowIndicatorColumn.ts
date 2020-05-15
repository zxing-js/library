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

// import com.google.zxing.ResultPoint;
import ResultPoint from '../../ResultPoint';
// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';

import BarcodeMetadata from './BarcodeMetadata';
import BoundingBox from './BoundingBox';
import DetectionResultColumn from './DetectionResultColumn';
import Codeword from './Codeword';
import BarcodeValue from './BarcodeValue';

import { int } from '../../../customTypings';

/**
 * @author Guenther Grau
 */
export default /*final*/ class DetectionResultRowIndicatorColumn extends DetectionResultColumn {

  private /*final*/ _isLeft: boolean;

  constructor(boundingBox: BoundingBox, isLeft: boolean) {
    super(boundingBox);
    this._isLeft = isLeft;
  }

  private setRowNumbers(): void {
    for (let codeword /*Codeword*/ of this.getCodewords()) {
      if (codeword != null) {
        codeword.setRowNumberAsRowIndicatorColumn();
      }
    }
  }

  // TODO implement properly
  // TODO maybe we should add missing codewords to store the correct row number to make
  // finding row numbers for other columns easier
  // use row height count to make detection of invalid row numbers more reliable
  adjustCompleteIndicatorColumnRowNumbers(barcodeMetadata: BarcodeMetadata): void {
    let codewords: Codeword[] = this.getCodewords();
    this.setRowNumbers();
    this.removeIncorrectCodewords(codewords, barcodeMetadata);
    let boundingBox: BoundingBox = this.getBoundingBox();
    let top: ResultPoint = this._isLeft ? boundingBox.getTopLeft() : boundingBox.getTopRight();
    let bottom: ResultPoint = this._isLeft ? boundingBox.getBottomLeft() : boundingBox.getBottomRight();
    let firstRow: int = this.imageRowToCodewordIndex(<int> Math.trunc(top.getY()));
    let lastRow: int = this.imageRowToCodewordIndex(<int> Math.trunc(bottom.getY()));
    // We need to be careful using the average row height. Barcode could be skewed so that we have smaller and
    // taller rows
    // float averageRowHeight = (lastRow - firstRow) / /*(float)*/ barcodeMetadata.getRowCount();
    let barcodeRow: int = -1;
    let maxRowHeight: int = 1;
    let currentRowHeight: int = 0;
    for (let codewordsRow /*int*/ = firstRow; codewordsRow < lastRow; codewordsRow++) {
      if (codewords[codewordsRow] == null) {
        continue;
      }
      let codeword: Codeword = codewords[codewordsRow];

      //      float expectedRowNumber = (codewordsRow - firstRow) / averageRowHeight;
      //      if (Math.abs(codeword.getRowNumber() - expectedRowNumber) > 2) {
      //        SimpleLog.log(LEVEL.WARNING,
      //            "Removing codeword, rowNumberSkew too high, codeword[" + codewordsRow + "]: Expected Row: " +
      //                expectedRowNumber + ", RealRow: " + codeword.getRowNumber() + ", value: " + codeword.getValue());
      //        codewords[codewordsRow] = null;
      //      }

      let rowDifference: int = codeword.getRowNumber() - barcodeRow;

      // TODO improve handling with case where first row indicator doesn't start with 0

      if (rowDifference === 0) {
        currentRowHeight++;
      } else if (rowDifference === 1) {
        maxRowHeight = Math.max(maxRowHeight, currentRowHeight);
        currentRowHeight = 1;
        barcodeRow = codeword.getRowNumber();
      } else if (rowDifference < 0 ||
                 codeword.getRowNumber() >= barcodeMetadata.getRowCount() ||
                 rowDifference > codewordsRow) {
        codewords[codewordsRow] = null;
      } else {
        let checkedRows: int;
        if (maxRowHeight > 2) {
          checkedRows = (maxRowHeight - 2) * rowDifference;
        } else {
          checkedRows = rowDifference;
        }
        let closePreviousCodewordFound: boolean = checkedRows >= codewordsRow;
        for (let i /*int*/ = 1; i <= checkedRows && !closePreviousCodewordFound; i++) {
          // there must be (height * rowDifference) number of codewords missing. For now we assume height = 1.
          // This should hopefully get rid of most problems already.
          closePreviousCodewordFound = codewords[codewordsRow - i] != null;
        }
        if (closePreviousCodewordFound) {
          codewords[codewordsRow] = null;
        } else {
          barcodeRow = codeword.getRowNumber();
          currentRowHeight = 1;
        }
      }
    }
    // return (int) (averageRowHeight + 0.5);
  }

  getRowHeights(): Int32Array {
    let barcodeMetadata: BarcodeMetadata = this.getBarcodeMetadata();
    if (barcodeMetadata == null) {
      return null;
    }
    this.adjustIncompleteIndicatorColumnRowNumbers(barcodeMetadata);
    let result: Int32Array = new Int32Array(barcodeMetadata.getRowCount());
    for (let codeword /*Codeword*/ of this.getCodewords()) {
      if (codeword != null) {
        let rowNumber: int = codeword.getRowNumber();
        if (rowNumber >= result.length) {
          // We have more rows than the barcode metadata allows for, ignore them.
          continue;
        }
        result[rowNumber]++;
      } // else throw exception?
    }
    return result;
  }

  // TODO maybe we should add missing codewords to store the correct row number to make
  // finding row numbers for other columns easier
  // use row height count to make detection of invalid row numbers more reliable
  private adjustIncompleteIndicatorColumnRowNumbers(barcodeMetadata: BarcodeMetadata): void {
    let boundingBox: BoundingBox = this.getBoundingBox();
    let top: ResultPoint = this._isLeft ? boundingBox.getTopLeft() : boundingBox.getTopRight();
    let bottom: ResultPoint = this._isLeft ? boundingBox.getBottomLeft() : boundingBox.getBottomRight();
    let firstRow: int = this.imageRowToCodewordIndex(<int> Math.trunc(top.getY()));
    let lastRow: int = this.imageRowToCodewordIndex(<int> Math.trunc(bottom.getY()));
    // float averageRowHeight = (lastRow - firstRow) / /*(float)*/ barcodeMetadata.getRowCount();
    let codewords: Codeword[] = this.getCodewords();
    let barcodeRow: int = -1;
    let maxRowHeight: int = 1;
    let currentRowHeight: int = 0;
    for (let codewordsRow /*int*/ = firstRow; codewordsRow < lastRow; codewordsRow++) {
      if (codewords[codewordsRow] == null) {
        continue;
      }
      let codeword: Codeword = codewords[codewordsRow];

      codeword.setRowNumberAsRowIndicatorColumn();

      let rowDifference: int = codeword.getRowNumber() - barcodeRow;

      // TODO improve handling with case where first row indicator doesn't start with 0

      if (rowDifference === 0) {
        currentRowHeight++;
      } else if (rowDifference === 1) {
        maxRowHeight = Math.max(maxRowHeight, currentRowHeight);
        currentRowHeight = 1;
        barcodeRow = codeword.getRowNumber();
      } else if (codeword.getRowNumber() >= barcodeMetadata.getRowCount()) {
        codewords[codewordsRow] = null;
      } else {
        barcodeRow = codeword.getRowNumber();
        currentRowHeight = 1;
      }
    }
    // return (int) (averageRowHeight + 0.5);
  }

  getBarcodeMetadata(): BarcodeMetadata {
    let codewords: Codeword[] = this.getCodewords();
    let barcodeColumnCount: BarcodeValue = new BarcodeValue();
    let barcodeRowCountUpperPart: BarcodeValue = new BarcodeValue();
    let barcodeRowCountLowerPart: BarcodeValue = new BarcodeValue();
    let barcodeECLevel: BarcodeValue = new BarcodeValue();
    for (let codeword /*Codeword*/ of codewords) {
      if (codeword == null) {
        continue;
      }
      codeword.setRowNumberAsRowIndicatorColumn();
      let rowIndicatorValue: int = codeword.getValue() % 30;
      let codewordRowNumber: int = codeword.getRowNumber();
      if (!this._isLeft) {
        codewordRowNumber += 2;
      }
      switch (codewordRowNumber % 3) {
        case 0:
          barcodeRowCountUpperPart.setValue(rowIndicatorValue * 3 + 1);
          break;
        case 1:
          barcodeECLevel.setValue(rowIndicatorValue / 3);
          barcodeRowCountLowerPart.setValue(rowIndicatorValue % 3);
          break;
        case 2:
          barcodeColumnCount.setValue(rowIndicatorValue + 1);
          break;
      }
    }
    // Maybe we should check if we have ambiguous values?
    if ((barcodeColumnCount.getValue().length === 0) ||
        (barcodeRowCountUpperPart.getValue().length === 0) ||
        (barcodeRowCountLowerPart.getValue().length === 0) ||
        (barcodeECLevel.getValue().length === 0) ||
        barcodeColumnCount.getValue()[0] < 1 ||
        barcodeRowCountUpperPart.getValue()[0] + barcodeRowCountLowerPart.getValue()[0] < PDF417Common.MIN_ROWS_IN_BARCODE ||
        barcodeRowCountUpperPart.getValue()[0] + barcodeRowCountLowerPart.getValue()[0] > PDF417Common.MAX_ROWS_IN_BARCODE) {
      return null;
    }
    let barcodeMetadata: BarcodeMetadata = new BarcodeMetadata(barcodeColumnCount.getValue()[0],
        barcodeRowCountUpperPart.getValue()[0], barcodeRowCountLowerPart.getValue()[0], barcodeECLevel.getValue()[0]);
    this.removeIncorrectCodewords(codewords, barcodeMetadata);
    return barcodeMetadata;
  }

  private removeIncorrectCodewords(codewords: Codeword[], barcodeMetadata: BarcodeMetadata): void {
    // Remove codewords which do not match the metadata
    // TODO Maybe we should keep the incorrect codewords for the start and end positions?
    for (let codewordRow /*int*/ = 0; codewordRow < codewords.length; codewordRow++) {
      let codeword: Codeword = codewords[codewordRow];
      if (codewords[codewordRow] == null) {
        continue;
      }
      let rowIndicatorValue: int = codeword.getValue() % 30;
      let codewordRowNumber: int = codeword.getRowNumber();
      if (codewordRowNumber > barcodeMetadata.getRowCount()) {
        codewords[codewordRow] = null;
        continue;
      }
      if (!this._isLeft) {
        codewordRowNumber += 2;
      }
      switch (codewordRowNumber % 3) {
        case 0:
          if (rowIndicatorValue * 3 + 1 !== barcodeMetadata.getRowCountUpperPart()) {
            codewords[codewordRow] = null;
          }
          break;
        case 1:
          if (Math.trunc(rowIndicatorValue / 3) !== barcodeMetadata.getErrorCorrectionLevel() ||
              rowIndicatorValue % 3 !== barcodeMetadata.getRowCountLowerPart()) {
            codewords[codewordRow] = null;
          }
          break;
        case 2:
          if (rowIndicatorValue + 1 !== barcodeMetadata.getColumnCount()) {
            codewords[codewordRow] = null;
          }
          break;
      }
    }
  }

  isLeft(): boolean {
    return this._isLeft;
  }

  // @Override
  public toString(): string {
    return 'IsLeft: ' + this._isLeft + '\n' + super.toString();
  }

}
