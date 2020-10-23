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

/*package com.google.zxing.qrcode;*/

import * as assert from 'assert';

import { BarcodeFormat } from '@zxing/library';
import { EncodeHintType } from '@zxing/library';
import { Writer } from '@zxing/library';
import { BitMatrix } from '@zxing/library';
import { QRCodeDecoderErrorCorrectionLevel } from '@zxing/library';
import SharpImage from '../util/SharpImage';
import { QRCodeWriter } from '@zxing/library';
import { ZXingStringEncoding } from '@zxing/library';
import { createCustomEncoder } from '../util/textEncodingFactory';

const path = require('path');

/*import javax.imageio.ImageIO;*/
/*import java.awt.image.BufferedImage;*/
/*import java.io.IOException;*/
/*import java.nio.file.Files;*/
/*import java.nio.file.Path;*/
/*import java.nio.file.Paths;*/
/*import java.util.EnumMap;*/
/*import java.util.Map;*/

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported and expanded from C++
 */
describe('QRCodeWriter', () => {
    ZXingStringEncoding.customEncoder = (b, e) => createCustomEncoder(e).encode(b);

    const BASE_IMAGE_PATH = 'src/test/resources/golden/qrcode/';

    it('testQRCodeWriter', () => {
        // The QR should be multiplied up to fit, with extra padding if necessary
        const bigEnough: number /*int*/ = 256;
        const writer: Writer = new QRCodeWriter();
        let matrix: BitMatrix = writer.encode(
            'http://www.google.com/',
            BarcodeFormat.QR_CODE,
            bigEnough,
            bigEnough,
            null
        );
        assert.strictEqual(matrix !== null, true);
        assert.strictEqual(matrix.getWidth(), bigEnough);
        assert.strictEqual(matrix.getHeight(), bigEnough);

        // The QR will not fit in this size, so the matrix should come back bigger
        const tooSmall: number /* int */ = 20;
        matrix = writer.encode(
            'http://www.google.com/',
            BarcodeFormat.QR_CODE,
            tooSmall,
            tooSmall,
            null
        );
        assert.strictEqual(matrix !== null, true);
        assert.strictEqual(tooSmall < matrix.getWidth(), true);
        assert.strictEqual(tooSmall < matrix.getHeight(), true);

        // We should also be able to handle non-square requests by padding them
        const strangeWidth: number /*int*/ = 500;
        const strangeHeight: number /*int*/ = 100;
        matrix = writer.encode(
            'http://www.google.com/',
            BarcodeFormat.QR_CODE,
            strangeWidth,
            strangeHeight,
            null
        );
        assert.strictEqual(matrix !== null, true);
        assert.strictEqual(matrix.getWidth(), strangeWidth);
        assert.strictEqual(matrix.getHeight(), strangeHeight);
    });

    async function compareToGoldenFile(
        contents: string,
        ecLevel: QRCodeDecoderErrorCorrectionLevel,
        resolution: number /*int*/,
        fileName: string
    ): Promise<void> {

        const filePath = path.resolve(BASE_IMAGE_PATH, fileName);

        let goldenResult: BitMatrix;

        try {
            goldenResult = await SharpImage.loadAsBitMatrix(filePath);
        } catch (err) {
            assert.ok(false, err);
        }

        const hints = new Map<EncodeHintType, QRCodeDecoderErrorCorrectionLevel>();
        hints.set(EncodeHintType.ERROR_CORRECTION, ecLevel);
        const writer: Writer = new QRCodeWriter();
        const generatedResult: BitMatrix = writer.encode(
            contents,
            BarcodeFormat.QR_CODE,
            resolution,
            resolution,
            hints
        );

        assert.strictEqual(generatedResult.getWidth(), resolution);
        assert.strictEqual(generatedResult.getHeight(), resolution);
        assert.strictEqual(generatedResult.equals(goldenResult), true);
    }

    // Golden images are generated with "qrcode_sample.cc". The images are checked with both eye balls
    // and cell phones. We expect pixel-perfect results, because the error correction level is known,
    // and the pixel dimensions matches exactly.
    it('testRegressionTest', () => {
        compareToGoldenFile(
            'http://www.google.com/',
            QRCodeDecoderErrorCorrectionLevel.M,
            99,
            'renderer-test-01.png'
        );
    });

});
