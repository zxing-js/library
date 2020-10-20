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
import { QRCodeVersion } from '@zxing/library';

/**
 * @author Sean Owen
 */
describe('Version', () => {

    it('testVersionForNumber', () => {
        try {
            QRCodeVersion.getVersionForNumber(0);
            assert.ok(false, 'Should have thrown an exception');
        } catch (ex) {
            // good for IllegalArgumentException
        }
        for (let i: number /*int*/ = 1; i <= 40; i++) {
            checkVersion(QRCodeVersion.getVersionForNumber(i), i, 4 * i + 17);
        }
    });

    function checkVersion(version: QRCodeVersion, versionNumber: number /*int*/, dimension: number /*int*/): void {

        assert.strictEqual(null !== version, true);
        assert.strictEqual(version.getVersionNumber(), versionNumber);
        assert.strictEqual(null !== version.getAlignmentPatternCenters(), true);

        if (versionNumber > 1) {
            assert.strictEqual(version.getAlignmentPatternCenters().length > 0, true);
        }

        assert.strictEqual(version.getDimensionForVersion(), dimension);
        assert.strictEqual(null !== version.getECBlocksForLevel(QRCodeDecoderErrorCorrectionLevel.H), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(QRCodeDecoderErrorCorrectionLevel.L), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(QRCodeDecoderErrorCorrectionLevel.M), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(QRCodeDecoderErrorCorrectionLevel.Q), true);
        assert.strictEqual(null !== version.buildFunctionPattern(), true);
    }

    it('testGetProvisionalVersionForDimension', () => {
        for (let i: number /*int*/ = 1; i <= 40; i++) {
            assert.strictEqual(QRCodeVersion.getProvisionalVersionForDimension(4 * i + 17).getVersionNumber(), i);
        }
    });

    it('testDecodeVersionInformation', () => {
        // Spot check
        doTestVersion(7, 0x07C94);
        doTestVersion(12, 0x0C762);
        doTestVersion(17, 0x1145D);
        doTestVersion(22, 0x168C9);
        doTestVersion(27, 0x1B08E);
        doTestVersion(32, 0x209D5);
    });

    function doTestVersion(expectedVersion: number /*int*/, mask: number /*int*/): void {
        const version: QRCodeVersion = QRCodeVersion.decodeVersionInformation(mask);
        assert.strictEqual(null !== version, true);
        assert.strictEqual(version.getVersionNumber(), expectedVersion);
    }

});
