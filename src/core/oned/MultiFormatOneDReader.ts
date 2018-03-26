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

import DecodeHintType from './../DecodeHintType';
import OneDReader from './OneDReader';
import BarcodeFormat from '../BarcodeFormat';
import Code128Reader from './Code128Reader';
import Result from '../Result';
import BitArray from './../common/BitArray';
import Exception from '../Exception';

/**
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */
export default class MultiFormatOneDReader extends OneDReader {

  private readers: OneDReader[] = [];

  public constructor(private hints: Map<DecodeHintType, any>) {
    super();
    const possibleFormats = !hints ? null : hints.get(DecodeHintType.POSSIBLE_FORMATS);
    const useCode39CheckDigit = hints && hints.get(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT) !== undefined;

    if (possibleFormats) {
      // if (possibleFormats.contains(BarcodeFormat.EAN_13) ||
      //     possibleFormats.contains(BarcodeFormat.UPC_A)  ||
      //     possibleFormats.contains(BarcodeFormat.EAN_8)  ||
      //     possibleFormats.contains(BarcodeFormat.UPC_E)) {
      //   readers.push(new MultiFormatUPCEANReader(hints));
      // }
      // if (possibleFormats.contains(BarcodeFormat.CODE_39)) {
      //    this.readers.push(new Code39Reader(useCode39CheckDigit));
      // }
      // if (possibleFormats.contains(BarcodeFormat.CODE_93)) {
      //    this.readers.push(new Code93Reader());
      // }
      if (possibleFormats.contains(BarcodeFormat.CODE_128)) {
        this.readers.push(new Code128Reader());
      }
      // if (possibleFormats.contains(BarcodeFormat.ITF)) {
      //    this.readers.push(new ITFReader());
      // }
      // if (possibleFormats.contains(BarcodeFormat.CODABAR)) {
      //    this.readers.push(new CodaBarReader());
      // }
      // if (possibleFormats.contains(BarcodeFormat.RSS_14)) {
      //    this.readers.push(new RSS14Reader());
      // }
      // if (possibleFormats.contains(BarcodeFormat.RSS_EXPANDED)) {
      //   this.readers.push(new RSSExpandedReader());
      // }
    }
    if (this.readers.length === 0) {
      // this.readers.push(new MultiFormatUPCEANReader(hints));
      // this.readers.push(new Code39Reader());
      // this.readers.push(new CodaBarReader());
      // this.readers.push(new Code93Reader());
      this.readers.push(new Code128Reader());
      // this.readers.push(new ITFReader());
      // this.readers.push(new RSS14Reader());
      // this.readers.push(new RSSExpandedReader());
    }
  }

  // @Override
  public decodeRow(rowNumber: number, row: BitArray, hints: Map<DecodeHintType, any>): Result {
    for (let i = 0; i < this.readers.length; i++) {
      try {
        return this.readers[i].decodeRow(rowNumber, row, hints);
      } catch (re) {
        // continue
      }
    }

    throw new Exception(Exception.NotFoundException);
  }

  // @Override
  public reset(): void {
    this.readers.forEach(reader => reader.reset());
  }
}
