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
export default /*final*/ class Codeword {

  private static /*final*/ BARCODE_ROW_UNKNOWN: int = -1;

  private /*final*/ startX: int;
  private /*final*/ endX: int;
  private /*final*/ bucket: int;
  private /*final*/ value: int;
  private rowNumber: int = Codeword.BARCODE_ROW_UNKNOWN;

  constructor(startX: int, endX: int, bucket: int, value: int) {
    this.startX = Math.trunc(startX);
    this.endX = Math.trunc(endX);
    this.bucket = Math.trunc(bucket);
    this.value = Math.trunc(value);
  }

  hasValidRowNumber(): boolean {
    return this.isValidRowNumber(this.rowNumber);
  }

  isValidRowNumber(rowNumber: int): boolean {
    return rowNumber !== Codeword.BARCODE_ROW_UNKNOWN && this.bucket === (rowNumber % 3) * 3;
  }

  setRowNumberAsRowIndicatorColumn(): void {
    this.rowNumber = Math.trunc((Math.trunc(this.value / 30)) * 3 + Math.trunc(this.bucket / 3));
  }

  getWidth(): int {
    return this.endX - this.startX;
  }

  getStartX(): int {
    return this.startX;
  }

  getEndX(): int {
    return this.endX;
  }

  getBucket(): int {
    return this.bucket;
  }

  getValue(): int {
    return this.value;
  }

  getRowNumber(): int {
    return this.rowNumber;
  }

  setRowNumber(rowNumber: int ): void {
    this.rowNumber = rowNumber;
  }

//   @Override
  public  toString(): string {
    return this.rowNumber + '|' + this.value;
  }

}
