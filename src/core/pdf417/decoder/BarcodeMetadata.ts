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

import { int } from '../../../customTypings';

// package com.google.zxing.pdf417.decoder;

/**
 * @author Guenther Grau
 */
export default /*final*/ class BarcodeMetadata {

  private /*final*/ columnCount: int;
  private /*final*/ errorCorrectionLevel: int;
  private /*final*/ rowCountUpperPart: int;
  private /*final*/ rowCountLowerPart: int;
  private /*final*/ rowCount: int;

  constructor(columnCount: int, rowCountUpperPart: int, rowCountLowerPart: int, errorCorrectionLevel: int) {
    this.columnCount = columnCount;
    this.errorCorrectionLevel = errorCorrectionLevel;
    this.rowCountUpperPart = rowCountUpperPart;
    this.rowCountLowerPart = rowCountLowerPart;
    this.rowCount = rowCountUpperPart + rowCountLowerPart;
  }

  getColumnCount(): int {
    return this.columnCount;
  }

  getErrorCorrectionLevel(): int {
    return this.errorCorrectionLevel;
  }

  getRowCount(): int {
    return this.rowCount;
  }

  getRowCountUpperPart(): int {
    return this.rowCountUpperPart;
  }

  getRowCountLowerPart(): int {
    return this.rowCountLowerPart;
  }

}
