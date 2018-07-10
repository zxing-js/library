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

import ErrorCorrectionLevel from '../../../../core/qrcode/decoder/ErrorCorrectionLevel';
import Version from '../../../../core/qrcode/decoder/Version';

/**
 * @author Sean Owen
 */
describe('Version', () => {

    it('testVersionForNumber', () => {
        try {
            Version.getVersionForNumber(0);
            assert.ok(false, 'Should have thrown an exception');
        } catch (ex) {
            // good for IllegalArgumentException
        }
        for (let i: number /*int*/ = 1; i <= 40; i++) {
            checkVersion(Version.getVersionForNumber(i), i, 4 * i + 17);
        }
    });

    function checkVersion(version: Version, versionNumber: number /*int*/, dimension: number /*int*/): void {

        assert.strictEqual(null !== version, true);
        assert.strictEqual(version.getVersionNumber(), versionNumber);
        assert.strictEqual(null !== version.getAlignmentPatternCenters(), true);

        if (versionNumber > 1) {
            assert.strictEqual(version.getAlignmentPatternCenters().length > 0, true);
        }

        assert.strictEqual(version.getDimensionForVersion(), dimension);
        assert.strictEqual(null !== version.getECBlocksForLevel(ErrorCorrectionLevel.H), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(ErrorCorrectionLevel.L), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(ErrorCorrectionLevel.M), true);
        assert.strictEqual(null !== version.getECBlocksForLevel(ErrorCorrectionLevel.Q), true);
        assert.strictEqual(null !== version.buildFunctionPattern(), true);
    }

    it('testGetProvisionalVersionForDimension', () => {
        for (let i: number /*int*/ = 1; i <= 40; i++) {
            assert.strictEqual(Version.getProvisionalVersionForDimension(4 * i + 17).getVersionNumber(), i);
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
        const version: Version = Version.decodeVersionInformation(mask);
        assert.strictEqual(null !== version, true);
        assert.strictEqual(version.getVersionNumber(), expectedVersion);
    }

});
