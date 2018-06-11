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

/*namespace com.google.zxing.qrcode.decoder {*/

import Version from './Version';
import ECBlocks from './ECBlocks';
import ECB from './ECB';
import ErrorCorrectionLevel from './ErrorCorrectionLevel';

import IllegalArgumentException from '../../IllegalArgumentException';

/**
 * <p>Encapsulates a block of data within a QR Code. QR Codes may split their data into
 * multiple blocks, each of which is a unit of data and error-correction codewords. Each
 * is represented by an instance of this class.</p>
 *
 * @author Sean Owen
 */
export default class DataBlock {

    private constructor(private numDataCodewords: number /*int*/, private codewords: Uint8Array) { }

    /**
     * <p>When QR Codes use multiple data blocks, they are actually interleaved.
     * That is, the first byte of data block 1 to n is written, then the second bytes, and so on. This
     * method will separate the data into original blocks.</p>
     *
     * @param rawCodewords bytes as read directly from the QR Code
     * @param version version of the QR Code
     * @param ecLevel error-correction level of the QR Code
     * @return DataBlocks containing original bytes, "de-interleaved" from representation in the
     *         QR Code
     */
    public static getDataBlocks(rawCodewords: Uint8Array,
        version: Version,
        ecLevel: ErrorCorrectionLevel): DataBlock[] {

        if (rawCodewords.length !== version.getTotalCodewords()) {
            throw new IllegalArgumentException();
        }

        // Figure out the number and size of data blocks used by this version and
        // error correction level
        const ecBlocks: ECBlocks = version.getECBlocksForLevel(ecLevel);

        // First count the total number of data blocks
        let totalBlocks = 0;
        const ecBlockArray: ECB[] = ecBlocks.getECBlocks();
        for (const ecBlock of ecBlockArray) {
            totalBlocks += ecBlock.getCount();
        }

        // Now establish DataBlocks of the appropriate size and number of data codewords
        const result = new Array<DataBlock>(totalBlocks);
        let numResultBlocks = 0;
        for (const ecBlock of ecBlockArray) {
            for (let i = 0; i < ecBlock.getCount(); i++) {
                const numDataCodewords = ecBlock.getDataCodewords();
                const numBlockCodewords = ecBlocks.getECCodewordsPerBlock() + numDataCodewords;
                result[numResultBlocks++] = new DataBlock(numDataCodewords, new Uint8Array(numBlockCodewords));
            }
        }

        // All blocks have the same amount of data, except that the last n
        // (where n may be 0) have 1 more byte. Figure out where these start.
        const shorterBlocksTotalCodewords = result[0].codewords.length;
        let longerBlocksStartAt = result.length - 1;
        // TYPESCRIPTPORT: check length is correct here
        while (longerBlocksStartAt >= 0) {
            const numCodewords = result[longerBlocksStartAt].codewords.length;
            if (numCodewords === shorterBlocksTotalCodewords) {
                break;
            }
            longerBlocksStartAt--;
        }
        longerBlocksStartAt++;

        const shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.getECCodewordsPerBlock();
        // The last elements of result may be 1 element longer
        // first fill out as many elements as all of them have
        let rawCodewordsOffset = 0;
        for (let i = 0; i < shorterBlocksNumDataCodewords; i++) {
            for (let j = 0; j < numResultBlocks; j++) {
                result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
            }
        }
        // Fill out the last data block in the longer ones
        for (let j = longerBlocksStartAt; j < numResultBlocks; j++) {
            result[j].codewords[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
        }
        // Now add in error correction blocks
        const max = result[0].codewords.length;
        for (let i = shorterBlocksNumDataCodewords; i < max; i++) {
            for (let j = 0; j < numResultBlocks; j++) {
                const iOffset = j < longerBlocksStartAt ? i : i + 1;
                result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
            }
        }
        return result;
    }

    public getNumDataCodewords(): number /*int*/ {
        return this.numDataCodewords;
    }

    public getCodewords(): Uint8Array {
        return this.codewords;
    }

}
