import Version from './Version';

import IllegalArgumentException from '../../IllegalArgumentException';

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

/**
 * <p>Encapsulates a block of data within a Data Matrix Code. Data Matrix Codes may split their data into
 * multiple blocks, each of which is a unit of data and error-correction codewords. Each
 * is represented by an instance of this class.</p>
 *
 * @author bbrown@google.com (Brian Brown)
 */
export default class DataBlock {

  private numDataCodewords: number;
  private codewords: Uint8Array;

  constructor(numDataCodewords: number, codewords: Uint8Array) {
    this.numDataCodewords = numDataCodewords;
    this.codewords = codewords;
  }

  /**
   * <p>When Data Matrix Codes use multiple data blocks, they actually interleave the bytes of each of them.
   * That is, the first byte of data block 1 to n is written, then the second bytes, and so on. This
   * method will separate the data into original blocks.</p>
   *
   * @param rawCodewords bytes as read directly from the Data Matrix Code
   * @param version version of the Data Matrix Code
   * @return DataBlocks containing original bytes, "de-interleaved" from representation in the
   *         Data Matrix Code
   */
  static getDataBlocks(rawCodewords: Int8Array,
                                   version: Version): DataBlock[]  {
    // Figure out the number and size of data blocks used by this version
    const ecBlocks = version.getECBlocks();

    // First count the total number of data blocks
    let totalBlocks = 0;
    const ecBlockArray = ecBlocks.getECBlocks();
    for (let ecBlock of ecBlockArray) {
       totalBlocks += ecBlock.getCount();
    }

    // Now establish DataBlocks of the appropriate size and number of data codewords
    const result: DataBlock[] = new Array(totalBlocks);
    let numResultBlocks = 0;
    for (let ecBlock of ecBlockArray) {
      for (let i = 0; i < ecBlock.getCount(); i++) {
        const numDataCodewords = ecBlock.getDataCodewords();
        const numBlockCodewords = ecBlocks.getECCodewords() + numDataCodewords;
        result[numResultBlocks++] = new DataBlock(numDataCodewords, new Uint8Array(numBlockCodewords));
      }
    }

    // All blocks have the same amount of data, except that the last n
    // (where n may be 0) have 1 less byte. Figure out where these start.
    // TODO(bbrown): There is only one case where there is a difference for Data Matrix for size 144
    const longerBlocksTotalCodewords = result[0].codewords.length;
    // int shorterBlocksTotalCodewords = longerBlocksTotalCodewords - 1;

    const longerBlocksNumDataCodewords = longerBlocksTotalCodewords - ecBlocks.getECCodewords();
    const shorterBlocksNumDataCodewords = longerBlocksNumDataCodewords - 1;
    // The last elements of result may be 1 element shorter for 144 matrix
    // first fill out as many elements as all of them have minus 1
    let rawCodewordsOffset = 0;
    for (let i = 0; i < shorterBlocksNumDataCodewords; i++) {
      for (let j = 0; j < numResultBlocks; j++) {
        result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
      }
    }

    // Fill out the last data block in the longer ones
    const specialVersion = version.getVersionNumber() === 24;
    const numLongerBlocks = specialVersion ? 8 : numResultBlocks;
    for (let j = 0; j < numLongerBlocks; j++) {
      result[j].codewords[longerBlocksNumDataCodewords - 1] = rawCodewords[rawCodewordsOffset++];
    }

    // Now add in error correction blocks
    const max = result[0].codewords.length;
    for (let i = longerBlocksNumDataCodewords; i < max; i++) {
      for (let j = 0; j < numResultBlocks; j++) {
        const jOffset = specialVersion ? (j + 8) % numResultBlocks : j;
        const iOffset = specialVersion && jOffset > 7 ? i - 1 : i;
        result[jOffset].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
      }
    }

    if (rawCodewordsOffset !== rawCodewords.length) {
      throw new IllegalArgumentException();
    }

    return result;
  }

  getNumDataCodewords(): number {
    return this.numDataCodewords;
  }

  getCodewords(): Uint8Array {
    return this.codewords;
  }

}
