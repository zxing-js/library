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

import Integer from '../../util/Integer';

/**
 * Micro QR Code format information decoder.
 *
 * ISO 18004:2006 Annex E.4.4.
 *
 * The format information is 15 bits:
 *   - 5 data bits [4:2]: combined version+EC indicator (versionIndicator, 0-7)
 *   - 5 data bits [1:0]: data mask pattern (0-3)
 *   - 10 BCH parity bits (generator polynomial x^10+x^8+x^5+x^4+x^2+x+1 = 0x537)
 *
 * The stored value is XOR-masked with 0x4445.
 *
 * versionIndicator mapping:
 *   0=M1(noEC), 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
 */
export default class MicroQRFormatInformation {

    private static readonly FORMAT_INFO_MASK_MICRO_QR = 0x4445;

    /**
     * BCH generator polynomial for Micro QR format info:
     * x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537
     */
    private static readonly BCH_GENERATOR = 0x537;

    /**
     * Pre-computed lookup table: 32 entries, index = 5-bit data, value = masked 15-bit format word.
     * Built at class load time.
     */
    private static readonly FORMAT_INFO_DECODE_LOOKUP: ReadonlyArray<[number, number]> =
        MicroQRFormatInformation.buildLookupTable();

    private readonly versionIndicator: number; // 0-7 (combined version+EC)
    private readonly dataMask: number;          // 0-3

    private constructor(data5: number) {
        this.versionIndicator = (data5 >> 2) & 0x07;
        this.dataMask = data5 & 0x03;
    }

    /**
     * Compute BCH(15,5) parity and return the full 15-bit format word (before XOR mask).
     */
    private static computeBCHFormatWord(data5: number): number {
        let d = data5 << 10;
        for (let i = 4; i >= 0; i--) {
            if ((d >> (i + 10)) & 1) {
                d ^= (MicroQRFormatInformation.BCH_GENERATOR << i);
            }
        }
        return ((data5 << 10) | (d & 0x3FF));
    }

    /**
     * Build the 32-entry lookup table: [maskedFormatWord, data5] pairs.
     */
    private static buildLookupTable(): ReadonlyArray<[number, number]> {
        const table: [number, number][] = [];
        for (let data5 = 0; data5 < 32; data5++) {
            const formatWord = MicroQRFormatInformation.computeBCHFormatWord(data5);
            const masked = formatWord ^ MicroQRFormatInformation.FORMAT_INFO_MASK_MICRO_QR;
            table.push([masked, data5]);
        }
        return table;
    }

    public static numBitsDiffering(a: number, b: number): number {
        return Integer.bitCount(a ^ b);
    }

    /**
     * Decode 15 format info bits (as read from the symbol, still masked).
     *
     * @param maskedFormatInfo 15 bits read directly from the symbol (XOR mask not yet removed)
     * @return MicroQRFormatInformation, or null if no match within Hamming distance 3
     */
    public static decodeFormatInformation(maskedFormatInfo: number): MicroQRFormatInformation | null {
        // Try exact match first
        for (const [tableEntry, data5] of MicroQRFormatInformation.FORMAT_INFO_DECODE_LOOKUP) {
            if (tableEntry === maskedFormatInfo) {
                return new MicroQRFormatInformation(data5);
            }
        }

        // Find closest match within Hamming distance 3
        let bestDifference = Number.MAX_SAFE_INTEGER;
        let bestData5 = 0;
        for (const [tableEntry, data5] of MicroQRFormatInformation.FORMAT_INFO_DECODE_LOOKUP) {
            const bitsDiff = MicroQRFormatInformation.numBitsDiffering(maskedFormatInfo, tableEntry);
            if (bitsDiff < bestDifference) {
                bestDifference = bitsDiff;
                bestData5 = data5;
            }
        }

        if (bestDifference <= 3) {
            return new MicroQRFormatInformation(bestData5);
        }
        return null;
    }

    /**
     * Combined version+EC indicator (0-7):
     *   0=M1, 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
     */
    public getVersionIndicator(): number {
        return this.versionIndicator;
    }

    /**
     * Data mask pattern index (0-3).
     */
    public getDataMask(): number {
        return this.dataMask;
    }

    /**
     * Actual version number: 1=M1, 2=M2, 3=M3, 4=M4.
     */
    public getMicroQRVersionNumber(): number {
        // versionIndicator 0→M1, 1-2→M2, 3-4→M3, 5-7→M4
        if (this.versionIndicator === 0) return 1;
        if (this.versionIndicator <= 2) return 2;
        if (this.versionIndicator <= 4) return 3;
        return 4;
    }

    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    public getECLevelLabel(): string | null {
        switch (this.versionIndicator) {
            case 0: return null; // M1, detection only
            case 1: case 3: case 5: return 'L';
            case 2: case 4: case 6: return 'M';
            case 7: return 'Q';
            default: return null;
        }
    }
}
