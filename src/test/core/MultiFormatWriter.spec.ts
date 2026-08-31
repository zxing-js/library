/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing;*/

import * as assert from 'assert';

import { BarcodeFormat } from '@zxing/library';
import { BitMatrix } from '@zxing/library';
import { DecodeHintType } from '@zxing/library';
import { EncodeHintType } from '@zxing/library';
import { IllegalArgumentException } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import { MultiFormatWriter } from '@zxing/library';

import { toBinaryBitmap } from './util/EncodeTestUtils';

describe('MultiFormatWriter', () => {

    const CONTENTS = 'http://www.google.com/';

    it('encodes QR_CODE', () => {
        const writer = new MultiFormatWriter();
        const matrix: BitMatrix = writer.encode(CONTENTS, BarcodeFormat.QR_CODE, 256, 256, null);
        assert.strictEqual(matrix.getWidth(), 256);
        assert.strictEqual(matrix.getHeight(), 256);
    });

    it('encodes DATA_MATRIX', () => {
        const writer = new MultiFormatWriter();
        const matrix: BitMatrix = writer.encode(CONTENTS, BarcodeFormat.DATA_MATRIX, 256, 256, null);
        assert.strictEqual(matrix.getWidth(), 256);
        assert.strictEqual(matrix.getHeight(), 256);
    });

    it('encodes AZTEC', () => {
        const writer = new MultiFormatWriter();
        const matrix: BitMatrix = writer.encode(CONTENTS, BarcodeFormat.AZTEC, 256, 256, null);
        assert.strictEqual(matrix.getWidth(), 256);
        assert.strictEqual(matrix.getHeight(), 256);
    });

    /**
     * AztecWriter used to expose its hints-aware overload as encodeWithHints(), which meant a
     * caller going through the Writer interface (as MultiFormatWriter does) silently dropped them.
     */
    it('passes hints through to the AZTEC writer', () => {
        const writer = new MultiFormatWriter();

        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.AZTEC_LAYERS, 10);

        // width/height of 0 renders the symbol at its natural module size, so the matrix
        // dimensions reflect the requested layer count rather than the scaling.
        const dflt: BitMatrix = writer.encode(CONTENTS, BarcodeFormat.AZTEC, 0, 0, null);
        const layered: BitMatrix = writer.encode(CONTENTS, BarcodeFormat.AZTEC, 0, 0, hints);

        assert.strictEqual(layered.getWidth() > dflt.getWidth(), true);
    });

    for (const format of [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC]) {
        it(`round-trips ${BarcodeFormat[format]} back through MultiFormatReader`, () => {
            const matrix = new MultiFormatWriter().encode(CONTENTS, format, 300, 300, null);

            const hints = new Map<DecodeHintType, any>();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [format]);

            const result = new MultiFormatReader().decode(toBinaryBitmap(matrix), hints);

            assert.strictEqual(result.getText(), CONTENTS);
            assert.strictEqual(result.getBarcodeFormat(), format);
        });
    }

    it('throws for a format with no registered encoder', () => {
        const writer = new MultiFormatWriter();
        // MaxiCode is decode-only in this library, as it is upstream.
        assert.throws(
            () => writer.encode(CONTENTS, BarcodeFormat.MAXICODE, 256, 256, null),
            IllegalArgumentException
        );
    });

});
