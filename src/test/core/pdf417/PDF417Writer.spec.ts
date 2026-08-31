/*
 * Copyright 2014 ZXing authors
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

import * as assert from 'assert';

import { BarcodeFormat } from '@zxing/library';
import { DecodeHintType } from '@zxing/library';
import { EncodeHintType } from '@zxing/library';
import { IllegalArgumentException } from '@zxing/library';
import { MultiFormatWriter } from '@zxing/library';
import { PDF417Compaction } from '@zxing/library';
import { PDF417Dimensions } from '@zxing/library';
import { PDF417Encoder } from '@zxing/library';
import { PDF417HighLevelEncoder } from '@zxing/library';
import { PDF417Reader } from '@zxing/library';
import { PDF417Writer } from '@zxing/library';
import { WriterException } from '@zxing/library';

import Charset from '../../../core/util/Charset';
import { toBinaryBitmap, toCodewords } from '../util/EncodeTestUtils';

const UTF8 = Charset.forName('UTF-8');

/** ECI_CHARSET (927) followed by the ECI value for UTF-8 (26). */
const UTF8_ECI_PREFIX = [927, 26];

function decode(contents: string, format: BarcodeFormat, width: number, height: number,
                hints: Map<EncodeHintType, any> = null): string {
    const matrix = new MultiFormatWriter().encode(contents, format, width, height, hints);
    const decodeHints = new Map<DecodeHintType, any>();
    decodeHints.set(DecodeHintType.TRY_HARDER, true);
    return new PDF417Reader().decode(toBinaryBitmap(matrix), decodeHints).getText();
}

describe('PDF417HighLevelEncoder', () => {

    /*
     * The expected codewords below are taken verbatim from the upstream Java
     * PDF417EncoderTestCase, so these assert against the reference implementation rather than
     * against this port's own output.
     */

    it('encodes ABCD in AUTO compaction', () => {
        // 4 characters is under the 5 needed for a text latch, so AUTO falls through to byte.
        const encoded = PDF417HighLevelEncoder.encodeHighLevel('ABCD', PDF417Compaction.AUTO, UTF8, false);
        assert.deepStrictEqual(toCodewords(encoded), [...UTF8_ECI_PREFIX, 901, 65, 66, 67, 68]);
    });

    it('encodes ABCD in TEXT compaction', () => {
        const encoded = PDF417HighLevelEncoder.encodeHighLevel('ABCD', PDF417Compaction.TEXT, UTF8, false);
        assert.deepStrictEqual(toCodewords(encoded), [...UTF8_ECI_PREFIX, 1, 63]);
    });

    it('encodes 1234 in NUMERIC compaction', () => {
        const encoded = PDF417HighLevelEncoder.encodeHighLevel('1234', PDF417Compaction.NUMERIC, UTF8, false);
        assert.deepStrictEqual(toCodewords(encoded), [...UTF8_ECI_PREFIX, 902, 12, 434]);
    });

    it('encodes abcd in BYTE compaction', () => {
        const encoded = PDF417HighLevelEncoder.encodeHighLevel('abcd', PDF417Compaction.BYTE, UTF8, false);
        assert.deepStrictEqual(toCodewords(encoded), [...UTF8_ECI_PREFIX, 901, 97, 98, 99, 100]);
    });

    it('emits every codeword in the 0..928 range', () => {
        const encoded = PDF417HighLevelEncoder.encodeHighLevel(
            'The quick brown fox jumps over the lazy dog 0123456789',
            PDF417Compaction.AUTO,
            null,
            false
        );
        for (const codeword of toCodewords(encoded)) {
            assert.strictEqual(codeword >= 0 && codeword <= 928, true, `codeword ${codeword} out of range`);
        }
    });

    it('rejects an empty message', () => {
        assert.throws(
            () => PDF417HighLevelEncoder.encodeHighLevel('', PDF417Compaction.AUTO, null, false),
            WriterException
        );
    });

    it('encodes special characters without throwing', () => {
        for (const input of ['1%§s ?aG$', '日本語', '₸ 5555', '€ 123,45']) {
            PDF417HighLevelEncoder.encodeHighLevel(input, PDF417Compaction.AUTO, UTF8, false);
        }
        PDF417HighLevelEncoder.encodeHighLevel('€ 123,45', PDF417Compaction.BYTE, UTF8, false);
        PDF417HighLevelEncoder.encodeHighLevel('123,45', PDF417Compaction.TEXT, UTF8, false);
        PDF417HighLevelEncoder.encodeHighLevel('asdfg§asd', PDF417Compaction.AUTO, Charset.forName('ISO-8859-1'), false);
    });

    it('explains why TEXT compaction rejects a non-text input', () => {
        assert.throws(
            () => PDF417HighLevelEncoder.encodeHighLevel('€ 123,45', PDF417Compaction.TEXT, UTF8, false),
            (err: Error) => err instanceof WriterException &&
                err.message.includes('8364') &&
                err.message.includes('Compaction.TEXT') &&
                err.message.includes('Compaction.AUTO')
        );
    });

    it('checkCharset accepts input under the limit and reports the offending char above it', () => {
        const errorMessage = 'a-unique-explanation';

        PDF417HighLevelEncoder.checkCharset('Hello!', 255, errorMessage);
        PDF417HighLevelEncoder.checkCharset('Hello!', 1255, errorMessage);
        PDF417HighLevelEncoder.checkCharset('Hello!', 111, errorMessage);

        // 'o' is 111, so a limit of 110 must reject it.
        assert.throws(
            () => PDF417HighLevelEncoder.checkCharset('Hello!', 110, errorMessage),
            (err: Error) => err instanceof WriterException &&
                err.message.includes('111') &&
                err.message.includes(errorMessage)
        );
    });

});

describe('PDF417 dimensions', () => {

    // Cases from the upstream Java PDF417EncoderTestCase (zxing issue #1831).
    const cases: PDF417Dimensions[] = [
        new PDF417Dimensions(1, 30, 7, 10),
        new PDF417Dimensions(1, 40, 1, 7),
        new PDF417Dimensions(10, 30, 1, 5),
        new PDF417Dimensions(1, 3, 1, 15),
        new PDF417Dimensions(5, 30, 7, 7),
        new PDF417Dimensions(12, 12, 1, 17),
        new PDF417Dimensions(1, 30, 7, 7),
    ];

    const input = '0000000001000000022200000003330444400888888881010101010';

    for (const dimensions of cases) {
        const label = `${dimensions.getMinCols()}-${dimensions.getMaxCols()} cols, ` +
            `${dimensions.getMinRows()}-${dimensions.getMaxRows()} rows`;

        it(`stays within ${label}`, () => {
            const calculated = PDF417Encoder.determineDimensions(
                dimensions.getMinCols(), dimensions.getMaxCols(),
                dimensions.getMinRows(), dimensions.getMaxRows(),
                20, 8
            );

            assert.strictEqual(calculated.length, 2);
            assert.strictEqual(dimensions.getMinCols() <= calculated[0], true, `cols ${calculated[0]} below min`);
            assert.strictEqual(dimensions.getMaxCols() >= calculated[0], true, `cols ${calculated[0]} above max`);
            assert.strictEqual(dimensions.getMinRows() <= calculated[1], true, `rows ${calculated[1]} below min`);
            assert.strictEqual(dimensions.getMaxRows() >= calculated[1], true, `rows ${calculated[1]} above max`);

            const hints = new Map<EncodeHintType, any>();
            hints.set(EncodeHintType.MARGIN, 0);
            hints.set(EncodeHintType.PDF417_DIMENSIONS, dimensions);
            assert.notStrictEqual(
                new PDF417Writer().encode(input, BarcodeFormat.PDF_417, 371, 92, hints),
                null
            );
        });
    }

});

describe('PDF417Writer', () => {

    const payloads: Array<[string, string]> = [
        ['short text', 'ABCD'],
        ['text and digits', 'Hello World 123'],
        ['digits only', '1234567890123456789'],
        ['a full sentence', 'The quick brown fox jumps over the lazy dog 0123456789'],
        ['punctuation', 'a-b_c.d:e;f/g+h*i=j'],
    ];

    for (const [label, contents] of payloads) {
        it(`round-trips ${label}`, () => {
            // 0x0 asks the writer for its natural size; the other two force upscaling.
            for (const [width, height] of [[0, 0], [400, 200], [600, 300]]) {
                assert.strictEqual(decode(contents, BarcodeFormat.PDF_417, width, height), contents, `at ${width}x${height}`);
            }
        });
    }

    for (const compaction of ['TEXT', 'BYTE', 'NUMERIC', 'AUTO']) {
        it(`round-trips through ${compaction} compaction given as a string`, () => {
            const contents = compaction === 'NUMERIC' ? '1234567890' : 'Hello123';
            const hints = new Map<EncodeHintType, any>();
            hints.set(EncodeHintType.PDF417_COMPACTION, compaction);
            assert.strictEqual(decode(contents, BarcodeFormat.PDF_417, 0, 0, hints), contents);
        });
    }

    it('accepts a Compaction enum value as well as its name', () => {
        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.PDF417_COMPACTION, PDF417Compaction.BYTE);
        assert.strictEqual(decode('Hello123', BarcodeFormat.PDF_417, 0, 0, hints), 'Hello123');
    });

    for (const errorCorrectionLevel of [0, 1, 2, 5, 8]) {
        it(`round-trips at error correction level ${errorCorrectionLevel}`, () => {
            const hints = new Map<EncodeHintType, any>();
            hints.set(EncodeHintType.ERROR_CORRECTION, errorCorrectionLevel);
            assert.strictEqual(decode('Hello World 123', BarcodeFormat.PDF_417, 0, 0, hints), 'Hello World 123');
        });
    }

    it('grows the symbol as the error correction level rises', () => {
        const sizes = [0, 4, 8].map(level => {
            const hints = new Map<EncodeHintType, any>();
            hints.set(EncodeHintType.ERROR_CORRECTION, level);
            const matrix = new PDF417Writer().encode('Hello World 123', BarcodeFormat.PDF_417, 0, 0, hints);
            return matrix.getWidth() * matrix.getHeight();
        });

        assert.strictEqual(sizes[0] < sizes[1], true, 'level 4 should be larger than level 0');
        assert.strictEqual(sizes[1] < sizes[2], true, 'level 8 should be larger than level 4');
    });

    it('round-trips a compact symbol', () => {
        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.PDF417_COMPACT, true);
        assert.strictEqual(decode('Hello World 123', BarcodeFormat.PDF_417, 0, 0, hints), 'Hello World 123');
    });

    it('honours the MARGIN hint', () => {
        const narrow = new Map<EncodeHintType, any>();
        narrow.set(EncodeHintType.MARGIN, 5);
        const wide = new Map<EncodeHintType, any>();
        wide.set(EncodeHintType.MARGIN, 25);

        const narrowMatrix = new PDF417Writer().encode('Hello World 123', BarcodeFormat.PDF_417, 0, 0, narrow);
        const wideMatrix = new PDF417Writer().encode('Hello World 123', BarcodeFormat.PDF_417, 0, 0, wide);

        assert.strictEqual(wideMatrix.getWidth() - narrowMatrix.getWidth(), 40);
        assert.strictEqual(wideMatrix.getHeight() - narrowMatrix.getHeight(), 40);
    });

    it('rejects a format other than PDF_417', () => {
        assert.throws(
            () => new PDF417Writer().encode('ABCD', BarcodeFormat.QR_CODE, 0, 0, null),
            IllegalArgumentException
        );
    });

    it('rejects an error correction level outside 0..8', () => {
        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.ERROR_CORRECTION, 9);
        assert.throws(
            () => new PDF417Writer().encode('ABCD', BarcodeFormat.PDF_417, 0, 0, hints),
            IllegalArgumentException
        );
    });

    it('rejects a message that cannot be encoded in ISO-8859-1 without an ECI', () => {
        assert.throws(
            () => new PDF417Writer().encode('АБВ', BarcodeFormat.PDF_417, 0, 0, null),
            WriterException
        );
    });

    it('rejects a message too big for the symbol', () => {
        assert.throws(
            () => new PDF417Writer().encode('1'.repeat(6000), BarcodeFormat.PDF_417, 0, 0, null),
            WriterException
        );
    });

    it('is reachable through MultiFormatWriter', () => {
        const viaFactory = new MultiFormatWriter().encode('ABCD', BarcodeFormat.PDF_417, 0, 0, null);
        const direct = new PDF417Writer().encode('ABCD', BarcodeFormat.PDF_417, 0, 0, null);

        assert.strictEqual(viaFactory.getWidth(), direct.getWidth());
        assert.strictEqual(viaFactory.getHeight(), direct.getHeight());
        assert.strictEqual(viaFactory.toString(), direct.toString());
    });

});
