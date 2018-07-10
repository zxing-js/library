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

/**
 * @author Sean Owen
 */
describe('ErrorCorrectionLevel', () => {

    it('testForBits', () => {
        assert.strictEqual(ErrorCorrectionLevel.M.equals(ErrorCorrectionLevel.forBits(0)), true);
        assert.strictEqual(ErrorCorrectionLevel.L.equals(ErrorCorrectionLevel.forBits(1)), true);
        assert.strictEqual(ErrorCorrectionLevel.H.equals(ErrorCorrectionLevel.forBits(2)), true);
        assert.strictEqual(ErrorCorrectionLevel.Q.equals(ErrorCorrectionLevel.forBits(3)), true);
        try {
            ErrorCorrectionLevel.forBits(4);
            assert.ok(false, 'Should have thrown an exception');
        } catch (ex) {
            // good for IllegalArgumentException
        }
    });


});
