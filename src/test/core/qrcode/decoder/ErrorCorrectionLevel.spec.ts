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

/*package com.google.zxing.qrcode.decoder;*/

import * as assert from 'assert';

import { QRCodeDecoderErrorCorrectionLevel } from '@zxing/library';

/**
 * @author Sean Owen
 */
describe('QRCodeDecoderErrorCorrectionLevel', () => {

    it('testForBits', () => {
        assert.strictEqual(QRCodeDecoderErrorCorrectionLevel.M.equals(QRCodeDecoderErrorCorrectionLevel.forBits(0)), true);
        assert.strictEqual(QRCodeDecoderErrorCorrectionLevel.L.equals(QRCodeDecoderErrorCorrectionLevel.forBits(1)), true);
        assert.strictEqual(QRCodeDecoderErrorCorrectionLevel.H.equals(QRCodeDecoderErrorCorrectionLevel.forBits(2)), true);
        assert.strictEqual(QRCodeDecoderErrorCorrectionLevel.Q.equals(QRCodeDecoderErrorCorrectionLevel.forBits(3)), true);
        try {
            QRCodeDecoderErrorCorrectionLevel.forBits(4);
            assert.ok(false, 'Should have thrown an exception');
        } catch (ex) {
            // good for IllegalArgumentException
        }
    });


});
