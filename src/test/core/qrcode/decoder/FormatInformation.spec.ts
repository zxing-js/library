/*
 * Copyright 2007 ZXing authors
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

/*package com.google.zxing.qrcode.decoder;*/

import * as assert from 'assert';

import { QRCodeDecoderErrorCorrectionLevel } from '@zxing/library';
import { QRCodeDecoderFormatInformation } from '@zxing/library';

/**
 * @author Sean Owen
 */
describe('QRCodeDecoderFormatInformation', () => {

    const MASKED_TEST_FORMAT_INFO: number /*int*/ = 0x2BED;
    const UNMASKED_TEST_FORMAT_INFO: number /*int*/ = MASKED_TEST_FORMAT_INFO ^ 0x5412;

    it('testBitsDiffering', () => {
        assert.strictEqual(QRCodeDecoderFormatInformation.numBitsDiffering(1, 1), 0);
        assert.strictEqual(QRCodeDecoderFormatInformation.numBitsDiffering(0, 2), 1);
        assert.strictEqual(QRCodeDecoderFormatInformation.numBitsDiffering(1, 2), 2);
        assert.strictEqual(QRCodeDecoderFormatInformation.numBitsDiffering(-1, 0), 32);
    });

    it('testDecode', () => {
        // Normal case
        const expected =
            QRCodeDecoderFormatInformation.decodeFormatInformation(MASKED_TEST_FORMAT_INFO, MASKED_TEST_FORMAT_INFO);
        assert.strictEqual(null !== expected, true);
        assert.strictEqual(expected.getDataMask(), /*(byte)*/ 0x07);
        assert.strictEqual(QRCodeDecoderErrorCorrectionLevel.Q.equals(expected.getErrorCorrectionLevel()), true);
        // where the code forgot the mask!
        assert.strictEqual(QRCodeDecoderFormatInformation.decodeFormatInformation(UNMASKED_TEST_FORMAT_INFO, MASKED_TEST_FORMAT_INFO).equals(expected), true);
    });

    it('testDecodeWithBitDifference', () => {
        const expected =
            QRCodeDecoderFormatInformation.decodeFormatInformation(MASKED_TEST_FORMAT_INFO, MASKED_TEST_FORMAT_INFO);
        // 1,2,3,4 bits difference
        assert.strictEqual(QRCodeDecoderFormatInformation.decodeFormatInformation(
            MASKED_TEST_FORMAT_INFO ^ 0x01, MASKED_TEST_FORMAT_INFO ^ 0x01).equals(expected), true);
        assert.strictEqual(QRCodeDecoderFormatInformation.decodeFormatInformation(
            MASKED_TEST_FORMAT_INFO ^ 0x03, MASKED_TEST_FORMAT_INFO ^ 0x03).equals(expected), true);
        assert.strictEqual(QRCodeDecoderFormatInformation.decodeFormatInformation(
            MASKED_TEST_FORMAT_INFO ^ 0x07, MASKED_TEST_FORMAT_INFO ^ 0x07).equals(expected), true);
        assert.strictEqual(null === QRCodeDecoderFormatInformation.decodeFormatInformation(
            MASKED_TEST_FORMAT_INFO ^ 0x0F, MASKED_TEST_FORMAT_INFO ^ 0x0F), true);
    });

    it('testDecodeWithMisread', () => {
        const expected =
            QRCodeDecoderFormatInformation.decodeFormatInformation(MASKED_TEST_FORMAT_INFO, MASKED_TEST_FORMAT_INFO);
        assert.strictEqual(QRCodeDecoderFormatInformation.decodeFormatInformation(
            MASKED_TEST_FORMAT_INFO ^ 0x03, MASKED_TEST_FORMAT_INFO ^ 0x0F).equals(expected), true);
    });

});
