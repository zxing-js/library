/*
 * Copyright 2009 ZXing authors
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

import { BarcodeFormat } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import AbstractBlackBoxSpec from '../common/AbstractBlackBox';

/**
 * Tests {@link PDF417Reader} against more sample images.
 */
class PDF417BlackBox3Spec extends AbstractBlackBoxSpec {

  public constructor() {
    super('src/test/resources/blackbox/pdf417-3', new MultiFormatReader(), BarcodeFormat.PDF_417);
    this.addTestWithMax(19, 19, 0, 0, 0.0);
    this.addTestWithMax(19, 19, 0, 0, 180.0);
  }

}

describe('PDF417BlackBox.3', () => {
  it('testBlackBox', async () => {
    const test = new PDF417BlackBox3Spec();
    await test.testBlackBox();
  });
});
