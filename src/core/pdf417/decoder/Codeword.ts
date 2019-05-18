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
export default /*final*/ class Codeword {

  private static /*final*/ BARCODE_ROW_UNKNOWN: /*int*/ number = -1;

  private /*final*/ startX: /*int*/ number;
  private /*final*/ endX: /*int*/ number;
  private /*final*/ bucket: /*int*/ number;
  private /*final*/ value: /*int*/ number;
  private rowNumber: /*int*/ number = Codeword.BARCODE_ROW_UNKNOWN;

  constructor(startX: /*int*/ number, endX: /*int*/ number, bucket: /*int*/ number, value: /*int*/ number) {
    this.startX = startX;
    this.endX = endX;
    this.bucket = bucket;
    this.value = value;
  }

  hasValidRowNumber(): boolean {
    return this.isValidRowNumber(this.rowNumber);
  }

  isValidRowNumber(rowNumber: /*int*/ number): boolean {
    return rowNumber !== Codeword.BARCODE_ROW_UNKNOWN && this.bucket === (rowNumber % 3) * 3;
  }

  setRowNumberAsRowIndicatorColumn(): void {
    this.rowNumber = (this.value / 30) * 3 + this.bucket / 3;
  }

  getWidth(): /*int*/ number {
    return this.endX - this.startX;
  }

  getStartX(): /*int*/ number {
    return this.startX;
  }

  getEndX(): /*int*/ number {
    return this.endX;
  }

  getBucket(): /*int*/ number {
    return this.bucket;
  }

  getValue(): /*int*/ number {
    return this.value;
  }

  getRowNumber(): /*int*/ number {
    return this.rowNumber;
  }

  setRowNumber(rowNumber: /*int*/ number ): void {
    this.rowNumber = rowNumber;
  }

//   @Override
  public  toString(): string {
    return this.rowNumber + '|' + this.value;
  }

}
