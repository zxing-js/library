import ChecksumException from '../../ChecksumException';
import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import BitMatrixParser from './BitMatrixParser';
import DataBlock from './DataBlock';
import DecodedBitStreamParser from './DecodedBitStreamParser';

/*
 * Copyright 2007 ZXing authors
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
 * <p>The main class which implements Data Matrix Code decoding -- as opposed to locating and extracting
 * the Data Matrix Code from an image.</p>
 *
 * @author bbrown@google.com (Brian Brown)
 */
export default class Decoder {

  private rsDecoder: ReedSolomonDecoder;

  constructor() {
    this.rsDecoder = new ReedSolomonDecoder(GenericGF.DATA_MATRIX_FIELD_256);
  }

  /**
   * <p>Decodes a Data Matrix Code represented as a {@link BitMatrix}. A 1 or "true" is taken
   * to mean a black module.</p>
   *
   * @param bits booleans representing white/black Data Matrix Code modules
   * @return text and bytes encoded within the Data Matrix Code
   * @throws FormatException if the Data Matrix Code cannot be decoded
   * @throws ChecksumException if error correction fails
   */
  public decode(bits: BitMatrix): DecoderResult {
    // Construct a parser and read version, error-correction level
    const parser = new BitMatrixParser(bits);
    const version = parser.getVersion();

    // Read codewords
    const codewords = parser.readCodewords();
    // Separate into data blocks
    const dataBlocks = DataBlock.getDataBlocks(codewords, version);

    // Count total number of data bytes
    let totalBytes = 0;
    for (let db of dataBlocks) {
      totalBytes += db.getNumDataCodewords();
    }
    const resultBytes = new Uint8Array(totalBytes);

    const dataBlocksCount = dataBlocks.length;
    // Error-correct and copy data blocks together into a stream of bytes
    for (let j = 0; j < dataBlocksCount; j++) {
      const dataBlock = dataBlocks[j];
      const codewordBytes = dataBlock.getCodewords();
      const numDataCodewords = dataBlock.getNumDataCodewords();
      this.correctErrors(codewordBytes, numDataCodewords);
      for (let i = 0; i < numDataCodewords; i++) {
        // De-interlace data blocks.
        resultBytes[i * dataBlocksCount + j] = codewordBytes[i];
      }
    }

    // Decode the contents of that stream of bytes
    return DecodedBitStreamParser.decode(resultBytes);
  }

  /**
   * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
   * correct the errors in-place using Reed-Solomon error correction.</p>
   *
   * @param codewordBytes data and error correction codewords
   * @param numDataCodewords number of codewords that are data bytes
   * @throws ChecksumException if error correction fails
   */
  private correctErrors(codewordBytes: Uint8Array, numDataCodewords: number): void {
    // const numCodewords = codewordBytes.length;
    // First read into an array of ints
    const codewordsInts = new Int32Array(codewordBytes);
    // for (let i = 0; i < numCodewords; i++) {
    //   codewordsInts[i] = codewordBytes[i] & 0xFF;
    // }
    try {
      this.rsDecoder.decode(codewordsInts, codewordBytes.length - numDataCodewords);
    } catch (ignored /* ReedSolomonException */) {
      throw new ChecksumException();
    }
    // Copy back into array of bytes -- only need to worry about the bytes that were data
    // We don't care about errors in the error-correction codewords
    for (let i = 0; i < numDataCodewords; i++) {
      codewordBytes[i] = codewordsInts[i];
    }
  }

}
