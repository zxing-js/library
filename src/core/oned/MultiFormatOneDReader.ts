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
import NotFoundException from '../NotFoundException';
import Result from '../Result';
import Code128Reader from './Code128Reader';
import Code39Reader from './Code39Reader';
import Code93Reader from './Code93Reader';
import ITFReader from './ITFReader';
import MultiFormatUPCEANReader from './MultiFormatUPCEANReader';
import OneDReader from './OneDReader';
import CodaBarReader from './CodaBarReader';
import RSSExpandedReader from './rss/expanded/RSSExpandedReader';
import RSS14Reader from './rss/RSS14Reader';

/**
 * @author Daniel Switkin <dswitkin@google.com>
 * @author Sean Owen
 */
export default class MultiFormatOneDReader extends OneDReader {

  private readers: OneDReader[] = [];

  public constructor(hints?: Map<DecodeHintType, any>) {
    super();
    const possibleFormats = !hints ? null : <BarcodeFormat[]>hints.get(DecodeHintType.POSSIBLE_FORMATS);
    const useCode39CheckDigit = hints && hints.get(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT) !== undefined;

    if (possibleFormats) {
      if (possibleFormats.includes(BarcodeFormat.EAN_13) ||
        possibleFormats.includes(BarcodeFormat.UPC_A) ||
        possibleFormats.includes(BarcodeFormat.EAN_8) ||
        possibleFormats.includes(BarcodeFormat.UPC_E)) {
        this.readers.push(new MultiFormatUPCEANReader(hints));
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_39)) {
        this.readers.push(new Code39Reader(useCode39CheckDigit));
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_93)) {
          this.readers.push(new Code93Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_128)) {
        this.readers.push(new Code128Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.ITF)) {
        this.readers.push(new ITFReader());
      }
      if (possibleFormats.includes(BarcodeFormat.CODABAR)) {
         this.readers.push(new CodaBarReader());
      }
      if (possibleFormats.includes(BarcodeFormat.RSS_14)) {
        this.readers.push(new RSS14Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.RSS_EXPANDED)) {
        console.warn('RSS Expanded reader IS NOT ready for production yet! use at your own risk.');
        this.readers.push(new RSSExpandedReader());
      }
    }
    if (this.readers.length === 0) {
      this.readers.push(new MultiFormatUPCEANReader(hints));
      this.readers.push(new Code39Reader());
      // this.readers.push(new CodaBarReader());
      this.readers.push(new Code93Reader());
      this.readers.push(new MultiFormatUPCEANReader(hints));
      this.readers.push(new Code128Reader());
      this.readers.push(new ITFReader());
      this.readers.push(new RSS14Reader());
      // this.readers.push(new RSSExpandedReader());
    }
  }

  // @Override
  public decodeRow(
    rowNumber: number,
    row: BitArray,
    hints: Map<DecodeHintType, any>
  ): Result {

    for (let i = 0; i < this.readers.length; i++) {
      try {
        return this.readers[i].decodeRow(rowNumber, row, hints);
      } catch (re) {
        // continue
      }
    }

    throw new NotFoundException();
  }

  // @Override
  public reset(): void {
    this.readers.forEach(reader => reader.reset());
  }
}
