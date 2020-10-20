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

import { QRCodeVersion } from '@zxing/library';
import { QRCodeMode } from '@zxing/library';

/**
 * @author Sean Owen
 */
describe('Mode', () => {

    it('testForBits', () => {
        assert.strictEqual(QRCodeMode.TERMINATOR.equals(QRCodeMode.forBits(0x00)), true);
        assert.strictEqual(QRCodeMode.NUMERIC.equals(QRCodeMode.forBits(0x01)), true);
        assert.strictEqual(QRCodeMode.ALPHANUMERIC.equals(QRCodeMode.forBits(0x02)), true);
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeMode.forBits(0x04)), true);
        assert.strictEqual(QRCodeMode.KANJI.equals(QRCodeMode.forBits(0x08)), true);
        try {
            QRCodeMode.forBits(0x10);
            assert.ok(false, 'Should have thrown an exception');
        } catch (ex) {
            // good for InvalidArgumentException
        }
    });

    it('testCharacterCount', () => {
        // Spot check a few values
        assert.strictEqual(QRCodeMode.NUMERIC.getCharacterCountBits(QRCodeVersion.getVersionForNumber(5)), 10);
        assert.strictEqual(QRCodeMode.NUMERIC.getCharacterCountBits(QRCodeVersion.getVersionForNumber(26)), 12);
        assert.strictEqual(QRCodeMode.NUMERIC.getCharacterCountBits(QRCodeVersion.getVersionForNumber(40)), 14);
        assert.strictEqual(QRCodeMode.ALPHANUMERIC.getCharacterCountBits(QRCodeVersion.getVersionForNumber(6)), 9);
        assert.strictEqual(QRCodeMode.BYTE.getCharacterCountBits(QRCodeVersion.getVersionForNumber(7)), 8);
        assert.strictEqual(QRCodeMode.KANJI.getCharacterCountBits(QRCodeVersion.getVersionForNumber(8)), 8);
    });

});
