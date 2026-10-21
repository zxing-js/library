/*
 * Copyright 2009 ZXing authors
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
import { BinaryBitmap } from '@zxing/library';
import { BitMatrix } from '@zxing/library';
import { ByQuadrantReader } from '@zxing/library';
import { ChecksumException } from '@zxing/library';
import { DecodeHintType } from '@zxing/library';
import { FormatException } from '@zxing/library';
import { GenericMultipleBarcodeReader } from '@zxing/library';
import { HybridBinarizer } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import { MultiFormatWriter } from '@zxing/library';
import { NotFoundException } from '@zxing/library';
import { QRCodeMultiReader } from '@zxing/library';
import { ResultMetadataType } from '@zxing/library';
import { Result } from '@zxing/library';
import { RGBLuminanceSource } from '@zxing/library';

import isReaderException from '../../../core/util/isReaderException';

interface Placement { matrix: BitMatrix; x: number; y: number; }

/** Paints one or more encoded symbols onto a shared white canvas. */
function compose(width: number, height: number, placements: Placement[]): BinaryBitmap {
    const luminances = new Uint8ClampedArray(width * height).fill(0xff);
    for (const { matrix, x: originX, y: originY } of placements) {
        for (let y = 0; y < matrix.getHeight(); y++) {
            for (let x = 0; x < matrix.getWidth(); x++) {
                if (matrix.get(x, y)) {
                    luminances[(y + originY) * width + (x + originX)] = 0x00;
                }
            }
        }
    }
    return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminances, width, height)));
}

function qr(text: string, size: number): BitMatrix {
    return new MultiFormatWriter().encode(text, BarcodeFormat.QR_CODE, size, size, null);
}

function code128(text: string, width: number, height: number): BitMatrix {
    return new MultiFormatWriter().encode(text, BarcodeFormat.CODE_128, width, height, null);
}

function texts(results: Result[]): string[] {
    return results.map(result => result.getText()).sort();
}

describe('isReaderException', () => {

    /*
     * The Java original has NotFoundException, FormatException and ChecksumException all extend
     * ReaderException, so `catch (ReaderException)` means "this region could not be read, move on".
     * In this port those four are siblings, so the multi readers need this predicate instead --
     * without it an undecodable region aborts the whole scan. These assertions pin that down.
     */

    it('covers every exception Java would catch as a ReaderException', () => {
        assert.strictEqual(isReaderException(NotFoundException.getNotFoundInstance()), true);
        assert.strictEqual(isReaderException(FormatException.getFormatInstance()), true);
        assert.strictEqual(isReaderException(ChecksumException.getChecksumInstance()), true);
    });

    it('does not swallow unrelated errors', () => {
        assert.strictEqual(isReaderException(new Error('boom')), false);
        assert.strictEqual(isReaderException(new TypeError('boom')), false);
    });

});

describe('QRCodeMultiReader', () => {

    it('decodes two QR codes side by side', () => {
        const image = compose(400, 200, [
            { matrix: qr('ALPHA', 120), x: 20, y: 40 },
            { matrix: qr('BETA', 120), x: 240, y: 40 },
        ]);

        assert.deepStrictEqual(texts(new QRCodeMultiReader().decodeMultiple(image, null)), ['ALPHA', 'BETA']);
    });

    it('decodes three QR codes in a triangle', () => {
        const image = compose(420, 420, [
            { matrix: qr('ONE', 120), x: 20, y: 20 },
            { matrix: qr('TWO', 120), x: 260, y: 20 },
            { matrix: qr('THREE', 120), x: 140, y: 260 },
        ]);

        assert.deepStrictEqual(texts(new QRCodeMultiReader().decodeMultiple(image, null)), ['ONE', 'THREE', 'TWO']);
    });

    it('still decodes a lone QR code', () => {
        const image = compose(300, 300, [{ matrix: qr('SOLO', 160), x: 70, y: 70 }]);

        const results = new QRCodeMultiReader().decodeMultiple(image, null);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].getText(), 'SOLO');
        assert.strictEqual(results[0].getBarcodeFormat(), BarcodeFormat.QR_CODE);
    });

    it('reports the error correction level of each result', () => {
        const image = compose(400, 200, [
            { matrix: qr('ALPHA', 120), x: 20, y: 40 },
            { matrix: qr('BETA', 120), x: 240, y: 40 },
        ]);

        for (const result of new QRCodeMultiReader().decodeMultiple(image, null)) {
            assert.notStrictEqual(
                result.getResultMetadata().get(ResultMetadataType.ERROR_CORRECTION_LEVEL),
                undefined
            );
        }
    });

    it('throws when the image holds no QR code', () => {
        const image = compose(300, 300, []);
        assert.throws(() => new QRCodeMultiReader().decodeMultiple(image, null), NotFoundException);
    });

});

describe('QRCodeMultiReader.processStructuredAppend', () => {

    function structuredAppendResult(text: string, sequence: number, bytes: number[]): Result {
        const result = new Result(text, Uint8Array.from(bytes), undefined, [], BarcodeFormat.QR_CODE, undefined);
        result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE, sequence);
        result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, [Uint8Array.from(bytes)]);
        return result;
    }

    it('joins the parts back together in sequence order', () => {
        const merged = QRCodeMultiReader.processStructuredAppend([
            structuredAppendResult('WORLD', 1, [3, 4]),
            structuredAppendResult('HELLO ', 0, [1, 2]),
        ]);

        assert.strictEqual(merged.length, 1);
        assert.strictEqual(merged[0].getText(), 'HELLO WORLD');
        assert.deepStrictEqual(Array.from(merged[0].getRawBytes()), [1, 2, 3, 4]);

        const byteSegments = merged[0].getResultMetadata().get(ResultMetadataType.BYTE_SEGMENTS) as Uint8Array[];
        assert.strictEqual(byteSegments.length, 1);
        assert.deepStrictEqual(Array.from(byteSegments[0]), [1, 2, 3, 4]);
    });

    it('keeps unrelated results alongside the merged one', () => {
        const plain = new Result('STANDALONE', Uint8Array.from([9]), undefined, [], BarcodeFormat.QR_CODE, undefined);
        const merged = QRCodeMultiReader.processStructuredAppend([
            plain,
            structuredAppendResult('A', 0, [1]),
            structuredAppendResult('B', 1, [2]),
        ]);

        assert.deepStrictEqual(texts(merged), ['AB', 'STANDALONE']);
    });

    it('leaves a list with no structured append parts untouched', () => {
        const results = [new Result('PLAIN', Uint8Array.from([1]), undefined, [], BarcodeFormat.QR_CODE, undefined)];
        assert.strictEqual(QRCodeMultiReader.processStructuredAppend(results), results);
    });

});

describe('ByQuadrantReader', () => {

    /*
     * Pinned to QR_CODE. Left open, MultiFormatReader will also run the 1D readers over each crop,
     * and a partial QR sliced by a quadrant boundary is permissive enough to yield a false 1D
     * read -- which would mask whether the quadrant logic itself works.
     */
    function qrOnlyHints(): Map<DecodeHintType, any> {
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        return hints;
    }

    const quadrants: Array<[string, number, number]> = [
        ['top left', 20, 20],
        ['top right', 260, 20],
        ['bottom left', 20, 260],
        ['bottom right', 260, 260],
    ];

    for (const [label, x, y] of quadrants) {
        it(`finds a QR code in the ${label} quadrant`, () => {
            const image = compose(480, 480, [{ matrix: qr('Q-' + label, 120), x, y }]);
            const result = new ByQuadrantReader(new MultiFormatReader()).decode(image, qrOnlyHints());
            assert.strictEqual(result.getText(), 'Q-' + label);
        });
    }

    it('falls back to the centre region', () => {
        // Straddles all four quadrant boundaries, so only the centre crop contains it whole.
        const image = compose(480, 480, [{ matrix: qr('CENTRE', 140), x: 170, y: 170 }]);
        const result = new ByQuadrantReader(new MultiFormatReader()).decode(image, qrOnlyHints());
        assert.strictEqual(result.getText(), 'CENTRE');
    });

    it('reports result points in whole-image coordinates', () => {
        const image = compose(480, 480, [{ matrix: qr('BOTTOM-RIGHT', 120), x: 260, y: 260 }]);
        const result = new ByQuadrantReader(new MultiFormatReader()).decode(image, qrOnlyHints());

        for (const point of result.getResultPoints()) {
            assert.strictEqual(point.getX() > 240, true, `x ${point.getX()} not in the right half`);
            assert.strictEqual(point.getY() > 240, true, `y ${point.getY()} not in the bottom half`);
        }
    });

    it('throws when no quadrant holds a barcode', () => {
        const image = compose(400, 400, []);
        assert.throws(
            () => new ByQuadrantReader(new MultiFormatReader()).decode(image, qrOnlyHints()),
            NotFoundException
        );
    });

});

describe('GenericMultipleBarcodeReader', () => {

    it('finds two 1D barcodes stacked vertically', () => {
        const image = compose(400, 500, [
            { matrix: code128('CODE-A', 300, 80), x: 50, y: 30 },
            { matrix: code128('CODE-B', 300, 80), x: 50, y: 380 },
        ]);

        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new GenericMultipleBarcodeReader(new MultiFormatReader());
        assert.deepStrictEqual(texts(reader.decodeMultiple(image, hints)), ['CODE-A', 'CODE-B']);
    });

    it('finds two QR codes when paired with ByQuadrantReader', () => {
        const image = compose(500, 500, [
            { matrix: qr('GEN-1', 140), x: 30, y: 30 },
            { matrix: qr('GEN-2', 140), x: 320, y: 320 },
        ]);

        const reader = new GenericMultipleBarcodeReader(new ByQuadrantReader(new MultiFormatReader()));
        assert.deepStrictEqual(texts(reader.decodeMultiple(image, null)), ['GEN-1', 'GEN-2']);
    });

    it('reports a repeated payload only once', () => {
        const image = compose(400, 500, [
            { matrix: code128('SAME', 300, 80), x: 50, y: 30 },
            { matrix: code128('SAME', 300, 80), x: 50, y: 380 },
        ]);

        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new GenericMultipleBarcodeReader(new MultiFormatReader());
        assert.deepStrictEqual(texts(reader.decodeMultiple(image, hints)), ['SAME']);
    });

    it('throws when the image holds no barcode', () => {
        const image = compose(400, 400, []);
        const reader = new GenericMultipleBarcodeReader(new MultiFormatReader());
        assert.throws(() => reader.decodeMultiple(image, null), NotFoundException);
    });

});
