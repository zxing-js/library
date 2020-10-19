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

import { BarcodeFormat } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';

/**
 * @author Sean Owen
 */
class QRCodeBlackBox1Spec extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/qrcode-1', new MultiFormatReader(), BarcodeFormat.QR_CODE);
        this.addTest(17, 17, 0.0);
        this.addTest(14, 14, 90.0);
        this.addTest(17, 17, 180.0);
        this.addTest(14, 14, 270.0);
    }

}

describe('QRCodeBlackBox.1', () => {
    it('testBlackBox', async () => {
        const test = new QRCodeBlackBox1Spec();
        await test.testBlackBox();
    });
});
