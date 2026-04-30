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
 * Tests of various QR Codes from t-shirts, which are notoriously not flat.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class QRCodeBlackBox4Spec extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/qrcode-4', new MultiFormatReader(), BarcodeFormat.QR_CODE);
        // this.addTest(36, 36, 0.0);
        // this.addTest(35, 35, 90.0);
        // this.addTest(35, 35, 180.0);
        // this.addTest(35, 35, 270.0);
    }

}

// describe('QRCodeBlackBox.4', () => {
//     it('testBlackBox', async () => {
//         const test = new QRCodeBlackBox4Spec();
//         await test.testBlackBox();
//     });
// });
