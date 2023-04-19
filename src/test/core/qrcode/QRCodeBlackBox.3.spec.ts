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
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class QRCodeBlackBox3Spec extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/qrcode-3', new MultiFormatReader(), BarcodeFormat.QR_CODE);
        // this.addTest(38, 38, 0.0);
        // this.addTest(38, 38, 90.0);
        // this.addTest(36, 36, 180.0);
        // this.addTest(39, 39, 270.0);
    }

}

// describe('QRCodeBlackBox.3', () => {
//     it('testBlackBox', async () => {
//         const test = new QRCodeBlackBox3Spec();
//         await test.testBlackBox();
//     });
// });
