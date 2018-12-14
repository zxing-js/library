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

/**
 * @author Guenther Grau
 */
export default /*final*/ class BarcodeMetadata {

  private /*final int*/ columnCount: /*int*/ number;
  private /*final int*/ errorCorrectionLevel: /*int*/ number;
  private /*final int*/ rowCountUpperPart: /*int*/ number;
  private /*final int*/ rowCountLowerPart: /*int*/ number;
  private /*final int*/ rowCount: /*int*/ number;

  constructor(columnCount: /*int*/ number, rowCountUpperPart: /*int*/ number, rowCountLowerPart: /*int*/ number, errorCorrectionLevel: /*int*/ number) {
    this.columnCount = columnCount;
    this.errorCorrectionLevel = errorCorrectionLevel;
    this.rowCountUpperPart = rowCountUpperPart;
    this.rowCountLowerPart = rowCountLowerPart;
    this.rowCount = rowCountUpperPart + rowCountLowerPart;
  }

  getColumnCount(): /*int*/ number {
    return this.columnCount;
  }

  getErrorCorrectionLevel(): /*int*/ number {
    return this.errorCorrectionLevel;
  }

  getRowCount(): /*int*/ number {
    return this.rowCount;
  }

  getRowCountUpperPart(): /*int*/ number {
    return this.rowCountUpperPart;
  }

  getRowCountLowerPart(): /*int*/ number {
    return this.rowCountLowerPart;
  }

}
