/*
 * Copyright 2021 ZXing authors
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
import { DecodeHintType } from '@zxing/library';
import { HybridBinarizer } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import { MultiFormatWriter } from '@zxing/library';
import { NotFoundException } from '@zxing/library';
import { RGBLuminanceSource } from '@zxing/library';

/**
 * Renders an encoded symbol with a quiet zone. When `inverted` is set the whole canvas is
 * negated, producing a light-on-dark symbol of the kind ALSO_INVERTED exists to handle.
 */
function render(matrix: BitMatrix, inverted: boolean, quietZone: number = 20): BinaryBitmap {
    const matrixWidth = matrix.getWidth();
    const matrixHeight = matrix.getHeight();
    const width = matrixWidth + quietZone * 2;
    const height = matrixHeight + quietZone * 2;

    const background = inverted ? 0x00 : 0xff;
    const foreground = inverted ? 0xff : 0x00;

    const luminances = new Uint8ClampedArray(width * height).fill(background);
    for (let y = 0; y < matrixHeight; y++) {
        for (let x = 0; x < matrixWidth; x++) {
            if (matrix.get(x, y)) {
                luminances[(y + quietZone) * width + (x + quietZone)] = foreground;
            }
        }
    }

    return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminances, width, height)));
}

function hints(format: BarcodeFormat, alsoInverted: boolean): Map<DecodeHintType, any> {
    const map = new Map<DecodeHintType, any>();
    map.set(DecodeHintType.POSSIBLE_FORMATS, [format]);
    map.set(DecodeHintType.TRY_HARDER, true);
    if (alsoInverted) {
        map.set(DecodeHintType.ALSO_INVERTED, true);
    }
    return map;
}

describe('BitMatrix.flip', () => {

    it('flips a single bit when given coordinates', () => {
        const matrix = new BitMatrix(8, 8);
        assert.strictEqual(matrix.get(3, 4), false);
        matrix.flip(3, 4);
        assert.strictEqual(matrix.get(3, 4), true);
        matrix.flip(3, 4);
        assert.strictEqual(matrix.get(3, 4), false);
    });

    it('flips every bit when given no arguments', () => {
        const matrix = new BitMatrix(8, 8);
        matrix.set(1, 1);

        matrix.flip();

        assert.strictEqual(matrix.get(1, 1), false);
        assert.strictEqual(matrix.get(0, 0), true);
        assert.strictEqual(matrix.get(7, 7), true);
    });

    it('restores the original when flipped twice', () => {
        const matrix = new BitMatrix(37, 21);
        for (const [x, y] of [[0, 0], [5, 9], [36, 20], [17, 3]]) {
            matrix.set(x, y);
        }
        const before = matrix.toString();

        matrix.flip();
        assert.notStrictEqual(matrix.toString(), before);

        matrix.flip();
        assert.strictEqual(matrix.toString(), before);
    });

});

describe('DecodeHintType.ALSO_INVERTED', () => {

    const formats: Array<[BarcodeFormat, string, number, number]> = [
        [BarcodeFormat.QR_CODE, 'INVERTED-QR', 300, 300],
        [BarcodeFormat.DATA_MATRIX, 'INVERTED-DM', 300, 300],
        [BarcodeFormat.AZTEC, 'INVERTED-AZ', 300, 300],
        [BarcodeFormat.CODE_128, 'INVERTED-128', 0, 60],
        [BarcodeFormat.CODE_39, 'INVERTED39', 0, 60],
        [BarcodeFormat.EAN_13, '9780201310054', 0, 60],
    ];

    for (const [format, contents, width, height] of formats) {
        const label = BarcodeFormat[format];

        it(`decodes a normal ${label} whether or not the hint is set`, () => {
            const matrix = new MultiFormatWriter().encode(contents, format, width, height, null);

            assert.strictEqual(
                new MultiFormatReader().decode(render(matrix, false), hints(format, false)).getText(),
                contents
            );
            assert.strictEqual(
                new MultiFormatReader().decode(render(matrix, false), hints(format, true)).getText(),
                contents
            );
        });

        it(`decodes an inverted ${label} only when the hint is set`, () => {
            const matrix = new MultiFormatWriter().encode(contents, format, width, height, null);

            assert.throws(
                () => new MultiFormatReader().decode(render(matrix, true), hints(format, false)),
                NotFoundException,
                'an inverted symbol should not decode without the hint'
            );

            assert.strictEqual(
                new MultiFormatReader().decode(render(matrix, true), hints(format, true)).getText(),
                contents
            );
        });
    }

    it('leaves the caller\'s bitmap unchanged after an inverted decode', () => {
        const matrix = new MultiFormatWriter().encode('ROUND-TRIP', BarcodeFormat.QR_CODE, 300, 300, null);
        const image = render(matrix, true);

        const before = image.getBlackMatrix().toString();
        new MultiFormatReader().decode(image, hints(BarcodeFormat.QR_CODE, true));

        assert.strictEqual(image.getBlackMatrix().toString(), before);
    });

    it('leaves the caller\'s bitmap unchanged when the inverted pass also fails', () => {
        // A blank canvas, so both passes fail and the hint takes its longest path.
        const image = new BinaryBitmap(
            new HybridBinarizer(new RGBLuminanceSource(new Uint8ClampedArray(200 * 200).fill(0xff), 200, 200))
        );

        const before = image.getBlackMatrix().toString();
        assert.throws(
            () => new MultiFormatReader().decode(image, hints(BarcodeFormat.QR_CODE, true)),
            NotFoundException
        );

        assert.strictEqual(image.getBlackMatrix().toString(), before);
    });

});
