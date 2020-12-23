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

import {
  BarcodeFormat,
  BinaryBitmap,
  HybridBinarizer,
  LuminanceSource,
  MultipleBarcodeReader,
  QRCodeMultiReader,
  Result,
  ResultMetadataType
} from '@zxing/library';
import * as path from 'path';
import Arrays from '../../../../core/util/Arrays';
import { Collection, List } from '../../../../customTypings';
import AbstractBlackBoxSpec from '../../common/AbstractBlackBox';
import SharpImageLuminanceSource from '../../SharpImageLuminanceSource';
import { assertArrayEquals, assertEquals, assertNotNull } from '../../util/AssertUtils';
import SharpImage from '../../util/SharpImage';

// package com.google.zxing.multi.qrcode;

// import javax.imageio.ImageIO;
// import java.awt.image.BufferedImage;
// import java.nio.file.Path;
// import java.util.Arrays;
// import java.util.Collection;
// import java.util.HashSet;
// import java.util.List;

// import com.google.zxing.BarcodeFormat;
// import com.google.zxing.BinaryBitmap;
// import com.google.zxing.BufferedImageLuminanceSource;
// import com.google.zxing.LuminanceSource;
// import com.google.zxing.Result;
// import com.google.zxing.ResultMetadataType;
// import com.google.zxing.ResultPoint;
// import com.google.zxing.common.AbstractBlackBoxTestCase;
// import com.google.zxing.common.HybridBinarizer;
// import com.google.zxing.multi.MultipleBarcodeReader;
// import org.junit.Assert;
// import org.junit.Test;

/**
 * Tests {@link QRCodeMultiReader}.
 */
describe('MultiQRCodeTestCase', () => {

  it('testMultiQRCodes', async () => {
    // Very basic test for now
    const testBase: string = AbstractBlackBoxSpec.buildTestBase('src/test/resources/blackbox/multi-qrcode-1');

    const testImage: string = path.resolve(testBase, '1.png');
    const image: SharpImage = await SharpImage.loadWithRotation(testImage, 0);
    const source: LuminanceSource = new SharpImageLuminanceSource(image);
    const bitmap: BinaryBitmap = new BinaryBitmap(new HybridBinarizer(source));

    const reader: MultipleBarcodeReader = new QRCodeMultiReader();
    const results: Result[] = reader.decodeMultiple(bitmap);
    assertNotNull(results);
    assertEquals(4, results.length);

    const barcodeContents: Collection<String> = [];
    for (const result of results) {
      barcodeContents.push(result.getText());
      assertEquals(BarcodeFormat.QR_CODE, result.getBarcodeFormat());
      assertNotNull(result.getResultMetadata());
    }
    const expectedContents: Collection<String> = [];
    // TYPESCRIPTPORT: following lines are in different order from Java because JavaScript's push works in a different way HashSet<>.add, but the results are actually the same
    expectedContents.push('You get to CREATE OUR JOURNAL PROMPT FOR THE DAY!  Yay!  Way to go!  ');
    expectedContents.push('You earned the class 5 EXTRA MINUTES OF RECESS!!  Fabulous!!  Way to go!!');
    expectedContents.push('You earned the class a 5 MINUTE DANCE PARTY!!  Awesome!  Way to go!  Let\'s boogie!');
    expectedContents.push('You get to SIT AT MRS. SIGMON\'S DESK FOR A DAY!!  Awesome!!  Way to go!! Guess I better clean up! :)');
    assertArrayEquals(expectedContents, barcodeContents);
  });

  it('testProcessStructuredAppend', () => {
    const sa1: Result = new Result('SA1', new Uint8Array(0), [], BarcodeFormat.QR_CODE);
    const sa2: Result = new Result('SA2', new Uint8Array(0), [], BarcodeFormat.QR_CODE);
    const sa3: Result = new Result('SA3', new Uint8Array(0), [], BarcodeFormat.QR_CODE);
    sa1.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE, 2);
    sa1.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, 'L');
    sa2.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE, (1 << 4) + 2);
    sa2.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, 'L');
    sa3.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE, (2 << 4) + 2);
    sa3.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, 'L');

    const nsa: Result = new Result('NotSA', new Uint8Array(0), [], BarcodeFormat.QR_CODE);
    nsa.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, 'L');

    const inputs: List<Result> = Arrays.asList(sa3, sa1, nsa, sa2);

    const results: List<Result> = QRCodeMultiReader.processStructuredAppend(inputs);
    assertNotNull(results);
    assertEquals(2, results.length);

    const barcodeContents: Collection<String> = [];
    for (const result of results) {
      barcodeContents.push(result.getText());
    }
    const expectedContents: Collection<String> = [];
    // TYPESCRIPTPORT: following lines are in different order from Java because JavaScript's push works in a different way HashSet<>.add, but the results are actually the same
    expectedContents.push('NotSA');
    expectedContents.push('SA1SA2SA3');
    assertArrayEquals(expectedContents, barcodeContents);
  });
});
