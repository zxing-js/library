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

/*package com.google.zxing.qrcode;*/

import { BarcodeFormat } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';

/**
 * These tests are supplied by Tim Gernat and test finder pattern detection at small size and under
 * rotation, which was a weak spot.
 */
export default class QRCodeBlackBox6Spec extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/qrcode-6', new MultiFormatReader(), BarcodeFormat.QR_CODE);
        this.addTest(15, 15, 0.0);
        this.addTest(14, 14, 90.0);
        this.addTest(12, 13, 180.0);
        this.addTest(14, 14, 270.0);
    }

}

describe('QRCodeBlackBox.6', () => {
    it('testBlackBox', async () => {
        const test = new QRCodeBlackBox6Spec();
        await test.testBlackBox();
    });
});
