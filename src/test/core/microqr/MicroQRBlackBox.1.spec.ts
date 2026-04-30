/*
 * Copyright 2026 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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

import { BarcodeFormat } from '@zxing/library';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';
import { MicroQRCodeReader } from '@zxing/library';

/**
 * Black-box test for Micro QR Code decoding.
 */
export class MicroQRBlackBox1TestCase extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/microqr-1', new MicroQRCodeReader(), BarcodeFormat.MICRO_QR_CODE);
        this.addTest(3, 3, 0.0);
        this.addTest(3, 3, 90.0);
        this.addTest(3, 3, 180.0);
        this.addTest(3, 3, 270.0);
    }

}

describe('MicroQRBlackBox.1', () => {
    it('testBlackBox', async () => {
        const test = new MicroQRBlackBox1TestCase();
        await test.testBlackBox();
    });
});
