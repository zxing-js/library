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

import ChecksumException from '../../ChecksumException';
import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import DecodeHintType from '../../DecodeHintType';
import MicroQRBitMatrixParser from './MicroQRBitMatrixParser';
import MicroQRDecodedBitStreamParser from './MicroQRDecodedBitStreamParser';
import MicroQRVersion from './MicroQRVersion';

/**
 * Orchestrates Micro QR Code decoding:
 *   1. Parse format info and codewords from the bit matrix
 *   2. Reed-Solomon error correction (RS for M2-M4; skip for M1)
 *   3. Decode bit stream to text
 */
export default class MicroQRDecoder {

    private readonly rsDecoder: ReedSolomonDecoder;

    public constructor() {
        this.rsDecoder = new ReedSolomonDecoder(GenericGF.QR_CODE_FIELD_256);
    }

    public decodeBitMatrix(bits: BitMatrix, hints?: Map<DecodeHintType, any>): DecoderResult {
        const parser = new MicroQRBitMatrixParser(bits);
        const formatInfo = parser.readFormatInformation();
        const version = MicroQRVersion.getVersionForIndicator(formatInfo.getVersionIndicator());

        // Read raw codewords (format info parsed, data mask removed)
        const codewords = parser.readCodewords();

        const numDataCodewords = version.getNumDataCodewords();
        const numECCodewords = version.getNumECCodewords();

        if (version.getVersionNumber() === 1) {
            // M1: error detection only — no RS correction, just pass data through.
            // The 2 "EC" codewords are BCH-type detection codewords; we skip full correction.
            return MicroQRDecodedBitStreamParser.decode(
                codewords.subarray(0, numDataCodewords),
                version,
                hints ?? null
            );
        }

        // M2-M4: RS error correction using GF(256), same as QR code
        this.correctErrors(codewords, numDataCodewords);

        return MicroQRDecodedBitStreamParser.decode(
            codewords.subarray(0, numDataCodewords),
            version,
            hints ?? null
        );
    }

    private correctErrors(codewords: Uint8Array, numDataCodewords: number): void {
        const codewordsInts = new Int32Array(codewords);
        try {
            this.rsDecoder.decode(codewordsInts, codewords.length - numDataCodewords);
        } catch (e) {
            throw new ChecksumException();
        }
        // Write corrected bytes back
        for (let i = 0; i < numDataCodewords; i++) {
            codewords[i] = codewordsInts[i] & 0xFF;
        }
    }
}
