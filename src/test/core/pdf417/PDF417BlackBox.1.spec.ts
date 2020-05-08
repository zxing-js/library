/*
 * Copyright 2008 ZXing authors
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

// package com.google.zxing.pdf417;

import BarcodeFormat from '../../../core/BarcodeFormat';
import MultiFormatReader from '../../../core/MultiFormatReader';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';
import StringEncoding from '../../../core/util/StringEncoding';
import { TextDecoder } from '@sinonjs/text-encoding';

StringEncoding.customDecoder = (b, e) => new TextDecoder(e, { NONSTANDARD_allowLegacyEncoding: true }).decode(b);

/**
 * This test consists of perfect, computer-generated images. We should have 100% passing.
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 */
class PDF417BlackBox1Spec extends AbstractBlackBoxSpec {

  public constructor() {
    super('src/test/resources/blackbox/pdf417-1', new MultiFormatReader(), BarcodeFormat.PDF_417);
    this.addTest(10, 10, 0.0);
    this.addTest(10, 10, 180.0);
  }

}

describe('PDF417BlackBox.1', () => {
  it('testBlackBox', async () => {
    const test = new PDF417BlackBox1Spec();
    return await test.testBlackBox();
  });
});
