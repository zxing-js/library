/*
 * Copyright 2011 ZXing authors
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

// package com.google.zxing.aztec;

// import com.google.zxing.BarcodeFormat;
import BarcodeFormat from '../../../core/BarcodeFormat';
// import com.google.zxing.common.AbstractBlackBoxTestCase;
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';

import AztecReader from '../../../core/aztec/AztecReader';

/**
 * A test of Aztec barcodes under real world lighting conditions, taken with a mobile phone.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
export /*public final*/ class AztecBlackBox2TestCase extends AbstractBlackBoxSpec {

  public constructor() {
    super('src/test/resources/blackbox/aztec-2', new AztecReader(), BarcodeFormat.AZTEC);
    this.addTest(5, 5, 0.0);
    this.addTest(4, 4, 90.0);
    this.addTest(6, 6, 180.0);
    this.addTest(3, 3, 270.0);
  }

}

describe('AztecBlackBox.2', () => {
    it('testBlackBox', done => {
        const test = new AztecBlackBox2TestCase();
        return test.testBlackBox(done);
    });
});
