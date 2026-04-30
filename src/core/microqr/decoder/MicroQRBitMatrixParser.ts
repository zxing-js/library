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

import BitMatrix from '../../common/BitMatrix';
import FormatException from '../../FormatException';
import MicroQRFormatInformation from './MicroQRFormatInformation';
import MicroQRVersion from './MicroQRVersion';
import MicroQRDataMask from './MicroQRDataMask';

/**
 * Reads format information and codewords from a sampled Micro QR Code BitMatrix.
 */
export default class MicroQRBitMatrixParser {

    private parsedFormatInfo: MicroQRFormatInformation | null = null;
    private parsedVersion: MicroQRVersion | null = null;

    public constructor(private readonly bitMatrix: BitMatrix) {
        const dimension = bitMatrix.getHeight();
        // Micro QR dimensions: 11, 13, 15, 17 (odd, ≥ 11)
        if (dimension < 11 || dimension > 17 || (dimension % 2) !== 1) {
            throw new FormatException();
        }
    }

    /**
     * Read the 15-bit format information from the single format info location.
     *
     * Format info modules (1-indexed in the symbol):
     *   row 8, col 1..8 → bits 14..7 (8 bits)
     *   col 8, row 7..1 → bits 6..0  (7 bits)
     */
    public readFormatInformation(): MicroQRFormatInformation {
        if (this.parsedFormatInfo !== null) {
            return this.parsedFormatInfo;
        }

        let formatInfoBits = 0;

        // Row 8 (0-indexed), cols 1-8: bits 14..7
        for (let col = 1; col <= 8; col++) {
            formatInfoBits = this.copyBit(col, 8, formatInfoBits);
        }

        // Col 8 (0-indexed), rows 7..1: bits 6..0
        for (let row = 7; row >= 1; row--) {
            formatInfoBits = this.copyBit(8, row, formatInfoBits);
        }

        const formatInfo = MicroQRFormatInformation.decodeFormatInformation(formatInfoBits);
        if (formatInfo !== null) {
            this.parsedFormatInfo = formatInfo;
            this.parsedVersion = MicroQRVersion.getVersionForIndicator(formatInfo.getVersionIndicator());
            return formatInfo;
        }
        throw new FormatException();
    }

    private copyBit(x: number, y: number, bits: number): number {
        return this.bitMatrix.get(x, y) ? (bits << 1) | 1 : bits << 1;
    }

    /**
     * Read all codewords from the Micro QR BitMatrix.
     * Applies data mask before reading.
     *
     * For M1 (versionNumber=1) and M3 (versionNumber=3), the last DATA codeword
     * is only 4 bits (half-codeword). The bit stream layout is:
     *   [numDataCodewords-1 full 8-bit data CWs][4-bit half data CW][numECCodewords full 8-bit EC CWs]
     */
    public readCodewords(): Uint8Array {
        const formatInfo = this.readFormatInformation();
        const version = this.parsedVersion!;

        // Unmask the bit matrix
        const dataMask = MicroQRDataMask.forIndex(formatInfo.getDataMask());
        const dimension = this.bitMatrix.getHeight();
        dataMask.unmaskBitMatrix(this.bitMatrix, dimension);

        // Build function pattern (modules we skip during codeword extraction)
        const functionPattern = version.buildFunctionPattern();

        const numDataCodewords = version.getNumDataCodewords();
        const hasHalfCW = (version.getVersionNumber() === 1 || version.getVersionNumber() === 3);

        let readingUp = true;
        const result = new Uint8Array(version.getTotalCodewords());
        let resultOffset = 0;
        let currentByte = 0;
        let bitsRead = 0;

        // Traverse column pairs from right to left.
        // Micro QR timing is in col 0 and row 0; both are marked in functionPattern.
        for (let j = dimension - 1; j > 0; j -= 2) {
            for (let count = 0; count < dimension; count++) {
                const i = readingUp ? dimension - 1 - count : count;
                for (let col = 0; col < 2; col++) {
                    const x = j - col;
                    if (!functionPattern.get(x, i)) {
                        bitsRead++;
                        currentByte <<= 1;
                        if (this.bitMatrix.get(x, i)) {
                            currentByte |= 1;
                        }

                        // Determine how many bits complete the current codeword.
                        // The last data codeword for M1/M3 is only 4 bits (half-codeword).
                        const isLastDataCW = hasHalfCW && resultOffset === numDataCodewords - 1;
                        const cwBits = isLastDataCW ? 4 : 8;

                        if (bitsRead === cwBits) {
                            // For the 4-bit half-codeword, place the nibble in the high 4 bits.
                            result[resultOffset++] = isLastDataCW
                                ? (currentByte << 4) & 0xFF
                                : currentByte & 0xFF;
                            bitsRead = 0;
                            currentByte = 0;
                        }
                    }
                }
            }
            readingUp = !readingUp;
        }

        if (resultOffset !== version.getTotalCodewords()) {
            throw new FormatException();
        }
        return result;
    }
}
