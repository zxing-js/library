/*
 * Copyright 2016 ZXing authors
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
import { MultiFormatReader } from '@zxing/library';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';

/**
 * Tests {@link MaxiCodeReader} against a fixed set of test images.
 */
class MaxiCodeBlackBox1Spec extends AbstractBlackBoxSpec {

    public constructor() {
        super('src/test/resources/blackbox/maxicode-1', new MultiFormatReader(), BarcodeFormat.MAXICODE);
        this.addTest(9, 9, 0.0);
    }

}

describe('MaxiCodeBlackBox.1', () => {
    it('testBlackBox', async () => {
        const test = new MaxiCodeBlackBox1Spec();
        await test.testBlackBox();
    });
});
