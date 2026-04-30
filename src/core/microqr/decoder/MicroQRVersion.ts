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
import ECBlocks from '../../qrcode/decoder/ECBlocks';
import ECB from '../../qrcode/decoder/ECB';
import FormatException from '../../FormatException';

/**
 * Micro QR Code version data.
 *
 * ISO 18004:2006 Annex E.
 * Versions M1–M4: dimensions 11, 13, 15, 17.
 *
 * The versionIndicator (3 bits) encodes both symbol version and EC level:
 *   0 → M1 (no EC / detection only)
 *   1 → M2-L
 *   2 → M2-M
 *   3 → M3-L
 *   4 → M3-M
 *   5 → M4-L
 *   6 → M4-M
 *   7 → M4-Q
 */
export default class MicroQRVersion {

    /** Maps versionIndicator (0-7) to [versionNumber, ecLevelLabel] */
    private static readonly VERSION_INFO: ReadonlyArray<[number, string | null]> = [
        [1, null],   // 0: M1, no EC
        [2, 'L'],    // 1: M2-L
        [2, 'M'],    // 2: M2-M
        [3, 'L'],    // 3: M3-L
        [3, 'M'],    // 4: M3-M
        [4, 'L'],    // 5: M4-L
        [4, 'M'],    // 6: M4-M
        [4, 'Q'],    // 7: M4-Q
    ];

    /**
     * ECBlocks indexed by versionIndicator (0-7).
     * ECBlocks(ecCodewordsPerBlock, ECB(count, dataCodewords))
     * Total codewords = ecCodewordsPerBlock*count + count*dataCodewords
     *
     * From ISO 18004:2006, Table E.1:
     *   M1:   3 data + 2 EC = 5 total
     *   M2-L: 5 data + 5 EC = 10 total
     *   M2-M: 4 data + 6 EC = 10 total
     *   M3-L: 11 data + 6 EC = 17 total
     *   M3-M: 9 data + 8 EC = 17 total
     *   M4-L: 16 data + 8 EC = 24 total
     *   M4-M: 14 data + 10 EC = 24 total
     *   M4-Q: 10 data + 14 EC = 24 total
     */
    private static readonly EC_BLOCKS: ReadonlyArray<ECBlocks> = [
        new ECBlocks(2, new ECB(1, 3)),   // 0: M1
        new ECBlocks(5, new ECB(1, 5)),   // 1: M2-L
        new ECBlocks(6, new ECB(1, 4)),   // 2: M2-M
        new ECBlocks(6, new ECB(1, 11)),  // 3: M3-L
        new ECBlocks(8, new ECB(1, 9)),   // 4: M3-M
        new ECBlocks(8, new ECB(1, 16)),  // 5: M4-L
        new ECBlocks(10, new ECB(1, 14)), // 6: M4-M
        new ECBlocks(14, new ECB(1, 10)), // 7: M4-Q
    ];

    /**
     * Number of mode indicator bits for versions M1-M4.
     * M1: 0 (only Numeric), M2: 1, M3: 2, M4: 3.
     */
    private static readonly MODE_INDICATOR_BITS: ReadonlyArray<number> = [0, 1, 2, 3];

    private readonly totalCodewords: number;

    private constructor(
        private readonly versionNumber: number,   // 1-4
        private readonly versionIndicator: number, // 0-7
        private readonly ecBlocks: ECBlocks
    ) {
        const ec = ecBlocks;
        const ecb = ec.getECBlocks()[0];
        this.totalCodewords = ecb.getCount() * (ecb.getDataCodewords() + ec.getECCodewordsPerBlock());
    }

    public getVersionNumber(): number {
        return this.versionNumber;
    }

    /** Combined version+EC indicator (0-7). */
    public getVersionIndicator(): number {
        return this.versionIndicator;
    }

    /** Dimension of the symbol: 9 + 2*versionNumber. */
    public getDimensionForVersion(): number {
        return 9 + 2 * this.versionNumber;
    }

    public getTotalCodewords(): number {
        return this.totalCodewords;
    }

    public getNumDataCodewords(): number {
        return this.ecBlocks.getECBlocks()[0].getDataCodewords();
    }

    public getNumECCodewords(): number {
        return this.totalCodewords - this.getNumDataCodewords();
    }

    public getECBlocks(): ECBlocks {
        return this.ecBlocks;
    }

    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    public getECLevelLabel(): string | null {
        return MicroQRVersion.VERSION_INFO[this.versionIndicator][1];
    }

    /** Number of mode indicator bits (0 for M1, 1 for M2, 2 for M3, 3 for M4). */
    public getModeIndicatorBits(): number {
        return MicroQRVersion.MODE_INDICATOR_BITS[this.versionNumber - 1];
    }

    /**
     * Build the function pattern BitMatrix for this version.
     * Marks: 9×9 upper-left area (finder + separator + format info),
     * and timing strips on row 0 (cols 9+) and col 0 (rows 9+).
     */
    public buildFunctionPattern(): BitMatrix {
        const dimension = this.getDimensionForVersion();
        const bitMatrix = new BitMatrix(dimension);

        // Upper-left 9×9: finder (7×7) + separator + format info area + dark module
        bitMatrix.setRegion(0, 0, 9, 9);

        // Timing strip: row 0, cols 9 to dim-1
        if (dimension > 9) {
            bitMatrix.setRegion(9, 0, dimension - 9, 1);
            // Timing strip: col 0, rows 9 to dim-1
            bitMatrix.setRegion(0, 9, 1, dimension - 9);
        }

        return bitMatrix;
    }

    /**
     * Get a MicroQRVersion by its version indicator (0-7).
     */
    public static getVersionForIndicator(versionIndicator: number): MicroQRVersion {
        if (versionIndicator < 0 || versionIndicator > 7) {
            throw new FormatException();
        }
        const [versionNumber] = MicroQRVersion.VERSION_INFO[versionIndicator];
        return new MicroQRVersion(versionNumber, versionIndicator, MicroQRVersion.EC_BLOCKS[versionIndicator]);
    }

    /**
     * Get a MicroQRVersion from the symbol dimension (11, 13, 15, or 17).
     * Returns version M1-M4; EC level unknown (use version indicator 0 for each).
     */
    public static getVersionForDimension(dimension: number): MicroQRVersion {
        switch (dimension) {
            case 11: return MicroQRVersion.getVersionForIndicator(0); // M1
            case 13: return MicroQRVersion.getVersionForIndicator(1); // M2-L (placeholder)
            case 15: return MicroQRVersion.getVersionForIndicator(3); // M3-L (placeholder)
            case 17: return MicroQRVersion.getVersionForIndicator(5); // M4-L (placeholder)
            default: throw new FormatException();
        }
    }

    public toString(): string {
        return 'M' + this.versionNumber;
    }
}
