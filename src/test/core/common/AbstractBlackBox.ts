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

/* package com.google.zxing.common; */

import * as path from 'path';
import * as fs from 'fs';
import * as log from 'loglevel';
import { assertEquals, assertGreaterThanEquals, assertLessThanEquals } from '../util/AssertUtils';
import SharpImage from '../util/SharpImage';
import SharpImageLuminanceSource from '../SharpImageLuminanceSource';
import { BarcodeFormat } from '@zxing/library';
import { BinaryBitmap } from '@zxing/library';
import { DecodeHintType } from '@zxing/library';
import { LuminanceSource } from '@zxing/library';
import { Reader } from '@zxing/library';
import { Result } from '@zxing/library';
import { ResultMetadataType } from '@zxing/library';
import TestResult from '../common/TestResult';
import { HybridBinarizer } from '@zxing/library';
import { ZXingStringEncoding } from '@zxing/library';


/* import javax.imageio.ImageIO; */
/* import java.awt.Graphics; */
/* import java.awt.geom.AffineTransform; */
/* import java.awt.geom.RectangularShape; */
/* import java.awt.image.AffineTransformOp; */
/* import java.awt.image.BufferedImage; */
/* import java.awt.image.BufferedImageOp; */
/* import java.io.BufferedReader; */
/* import java.io.IOException; */
/* import java.nio.charset.ZXingCharset; */
/* import java.nio.charset.ZXingStandardCharsets; */
/* import java.nio.file.DirectoryStream; */
/* import java.nio.file.Files; */
/* import java.nio.file.Path; */
/* import java.nio.file.Paths; */
/* import java.util.ArrayList; */
/* import java.util.EnumMap; */
/* import java.util.List; */
/* import java.util.Map; */
/* import java.util.Properties; */
/* import java.util.logging.Logger; */

/**
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
abstract class AbstractBlackBoxSpec {

  private testBase: string;
  private testResults: Array<TestResult>;

  public static buildTestBase(testBasePathSuffix: string): string {
    let testBase = path.resolve(testBasePathSuffix);
    // TYPESCRIPTPORT: not applicable
    // if (!fs.existsSync(testBase)) {
    //   // try starting with 'core' since the test base is often given as the project root
    //   testBase = path.resolve("core", testBasePathSuffix)
    // }
    return testBase;
  }

  protected constructor(
    testBasePathSuffix: string,
    private barcodeReader: Reader,
    private expectedFormat: BarcodeFormat
  ) {
    this.testBase = AbstractBlackBoxSpec.buildTestBase(testBasePathSuffix);
    this.testResults = new Array<TestResult>();
  }

  protected getTestBase(): string {
    return this.testBase;
  }

  protected addTest(
    mustPassCount: number /* int */,
    tryHarderCount: number /* int */,
    rotation: number /* float */
  ): void {
    this.addTestWithMax(mustPassCount, tryHarderCount, 0, 0, rotation);
  }
  /**
   * Adds a new test for the current directory of images.
   *
   * @param mustPassCount The number of images which must decode for the test to pass.
   * @param tryHarderCount The number of images which must pass using the try harder flag.
   * @param maxMisreads Maximum number of images which can fail due to successfully reading the wrong contents
   * @param maxTryHarderMisreads Maximum number of images which can fail due to successfully
   *                             reading the wrong contents using the try harder flag
   * @param rotation The rotation in degrees clockwise to use for this test.
 */
  protected addTestWithMax(
    mustPassCount: number /* int */,
    tryHarderCount: number /* int */,
    maxMisreads: number /* int */ = 0,
    maxTryHarderMisreads: number /* int */ = 0,
    rotation: number/* float */
  ): void {
    this.testResults.push(new TestResult(mustPassCount, tryHarderCount, maxMisreads, maxTryHarderMisreads, rotation));
  }

  private walkDirectory(dirPath: string) {
    let results = new Array<string>();
    const dir = path.resolve(this.testBase, dirPath);
    const list = fs.readdirSync(dir);
    for (let file of list) {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.walkDirectory(file));
      } else {
        if (['.jpg', '.jpeg', '.gif', '.png'].indexOf(path.extname(file)) !== -1) {
          results.push(file);
        }
      }
    }

    if (results.length === 0) {
      log.info(`No files in folder ${dir}`);
    }

    return results;
  }

  /**
   * @throws IOException
 */
  protected getImageFiles(): Array<string> {
    assertEquals(fs.existsSync(this.testBase), true, 'Please download and install test images, and run from the \'core\' directory');
    return this.walkDirectory(this.testBase);
  }

  protected getReader(): Reader {
    return this.barcodeReader;
  }

  /**
   * This workaround is used because AbstractNegativeBlackBoxTestCase
   * overrides this method but does not return SummaryResults.
   *
   * @param done
   *
   * @throws IOException
 */
  public async testBlackBox(): Promise<void> {
    await this.testBlackBoxCountingResults(true);
    log.info('testBlackBox finished.');
  }

  /**
   * @throws IOException
 */
  private async testBlackBoxCountingResults(assertOnFailure: boolean): Promise<void> {
    assertEquals(this.testResults.length > 0, true);

    const imageFiles: Array<string> = this.getImageFiles();
    const testCount: number /* int */ = this.testResults.length;

    const passedCounts = new Int32Array(testCount);
    const misreadCounts = new Int32Array(testCount);
    const tryHarderCounts = new Int32Array(testCount);
    const tryHarderMisreadCounts = new Int32Array(testCount);

    const testImageIterations: Promise<void>[] = [];

    for (const testImage of imageFiles) {

      // we run this in a separated scope so we can iterate faster
      // and run tests in parallel
      testImageIterations.push(new Promise(async resolve => {

        const fileBaseName: string = path.basename(testImage, path.extname(testImage));
        let expectedTextFile: string = path.resolve(this.testBase, fileBaseName + '.txt');
        let expectedText: string;
        // Next line can be found in line 155 of the original file.
        if (fs.existsSync(expectedTextFile)) {
          expectedText = AbstractBlackBoxSpec.readTextFileAsString(expectedTextFile);
        } else {
          expectedTextFile = path.resolve(this.testBase, fileBaseName + '.bin');
          assertEquals(fs.existsSync(expectedTextFile), true, 'result bin/text file should exists');
          expectedText = AbstractBlackBoxSpec.readBinFileAsString(expectedTextFile);
        }
        const truncated = AbstractBlackBoxSpec.truncate(expectedText, 32);

        const expectedMetadataFile: string = path.resolve(fileBaseName + '.metadata.txt');
        let expectedMetadata = null;
        if (fs.existsSync(expectedMetadataFile)) {
          expectedMetadata = AbstractBlackBoxSpec.readTextFileAsMetadata(expectedMetadataFile);
        }

        const decodeIterations: Promise<{success: boolean; message: string}>[] = [];

        for (let x: number /* int */ = 0; x < testCount; x++) {

          // we run this in a separated scope so we can iterate faster
          // and run tests in parallel
          decodeIterations.push(new Promise(async resolve => {
            const rotation: number /* float */ = this.testResults[x].getRotation();
            const rotatedImage = await SharpImage.loadWithRotation(testImage, rotation);
            const source: LuminanceSource = new SharpImageLuminanceSource(rotatedImage);
            const bitmap = new BinaryBitmap(new HybridBinarizer(source));

            let message  = `      ${rotation.toString().padStart(3, ' ')}: `;
            let success = false;
            let misread = false;
            try {
              let { decoded, error } = this.decode(bitmap, rotation, expectedText, expectedMetadata, false);
              if (decoded) {
                message += 'successfully decoded';
                passedCounts[x]++;
                success = true;
              } else {
                message += `misread with error ${error}`;
                misread = true;
                misreadCounts[x]++;
              }
            } catch (e) {
              message += `failed with error [${e.constructor.name}]`;
            }
            try {
              let { decoded, error } = this.decode(bitmap, rotation, expectedText, expectedMetadata, true);
              if (decoded) {
                message += `${!success || misread ? ', but' : ' and'} try harder successfully decoded`;
                tryHarderCounts[x]++;
                success = true;
              } else {
                message += `${success || !misread ? ', but' : ' and'} try harder misread with error ${error}`;
                tryHarderMisreadCounts[x]++;
                misread = true;
              }
            } catch (e) {
              message += `${success || misread ? ', but' : ' and'} try harder failed with error [${e.constructor.name}]`;
            }
            resolve({success, message});
          }));
        }

        const results = await Promise.all(decodeIterations);
        log.info(`    Decoding ${path.relative(process.cwd(), testImage)} expecting '${truncated}' with rotations`);
        results.forEach(({success, message}) => {
          if (!success) log.warn(message);
          else log.debug(message);
        });

        resolve();
      }));
    }

    await Promise.all(testImageIterations);

    // Original reference: 197.
    // Print the results of all tests first
    let totalFound /* int */ = 0;
    let totalMustPass /* int */ = 0;
    let totalMisread /* int */ = 0;
    let totalMaxMisread /* int */ = 0;

    for (let x: number /* int */ = 0, length = this.testResults.length; x < length; x++) {
      const testResult: TestResult = this.testResults[x];
      log.info(`    Rotation ${testResult.getRotation()} degrees:`);
      log.info(`      ${passedCounts[x]} of ${imageFiles.length} images passed (${testResult.getMustPassCount()} required)`);
      let failed: number /* int */ = imageFiles.length - passedCounts[x];
      log.info(`      ${misreadCounts[x]} failed due to misreads, ${failed - misreadCounts[x]} not detected`);
      log.info(`      ${tryHarderCounts[x]} of ${imageFiles.length} images passed with try harder (${testResult.getTryHarderCount()} required)`);
      failed = imageFiles.length - tryHarderCounts[x];
      log.info(`      ${tryHarderMisreadCounts[x]} failed due to misreads, ${failed - tryHarderMisreadCounts[x]} not detected\n`);
      totalFound += passedCounts[x] + tryHarderCounts[x];
      totalMustPass += testResult.getMustPassCount() + testResult.getTryHarderCount();
      totalMisread += misreadCounts[x] + tryHarderMisreadCounts[x];
      totalMaxMisread += testResult.getMaxMisreads() + testResult.getMaxTryHarderMisreads();
    }

    const totalTests: number /* int */ = imageFiles.length * testCount * 2;

    log.info(`    Decoded ${totalFound} images out of ${totalTests} (${totalFound * 100 / totalTests}%, ${totalMustPass} required)`);

    if (totalFound > totalMustPass) {
      log.warn(`      +++ Test too lax by ${Math.abs(totalFound - totalMustPass)} images`);
    } else if (totalFound < totalMustPass) {
      log.error(`      --- Test failed by ${Math.abs(totalMustPass - totalFound)} images`);
    }

    if (totalMisread < totalMaxMisread) {
      log.warn(`      +++ Test expects too many misreads by ${Math.abs(totalMaxMisread - totalMisread)} images`);
    } else if (totalMisread > totalMaxMisread) {
      log.error(`      --- Test had too many misreads by ${Math.abs(totalMisread - totalMaxMisread)} images`);
    }

    // Then run through again and assert if any failed.
    if (assertOnFailure) {
      for (let x: number /* int */ = 0; x < testCount; x++) {

        const testResult = this.testResults[x];
        const label = `Rotation ${testResult.getRotation()} degrees`;

        assertGreaterThanEquals(
          passedCounts[x],
          testResult.getMustPassCount(),
          `${label} - ${Math.abs(testResult.getMustPassCount() - passedCounts[x])} too many images failed.`
        );
        assertGreaterThanEquals(
          tryHarderCounts[x],
          testResult.getTryHarderCount(),
          `${label} (try harder) - ${Math.abs(testResult.getTryHarderCount() - tryHarderCounts[x])} too many images failed.`
        );
        assertLessThanEquals(
          misreadCounts[x],
          testResult.getMaxMisreads(),
          `${label} - ${misreadCounts[x] - testResult.getMaxMisreads()} too many images were misread.`
        );
        assertLessThanEquals(
          tryHarderMisreadCounts[x],
          testResult.getMaxTryHarderMisreads(),
          `${label} (try harder) - ${tryHarderMisreadCounts[x] - testResult.getMaxTryHarderMisreads()} too many images were misread.`
        );
      }
    }
  }

  /**
   * @throws ReaderException
 */
  private decode(
    source: BinaryBitmap,
    rotation: number/* float */,
    expectedText: string,
    expectedMetadata: Map<string, string>,
    tryHarder: boolean
  ): { decoded: boolean; error?: string } {
    const hints = new Map<DecodeHintType, any>();
    if (tryHarder) {
      hints.set(DecodeHintType.TRY_HARDER, true);
    }

    // Try in 'pure' mode mostly to exercise PURE_BARCODE code paths for exceptions;
    // not expected to pass, generally
    let result: Result = null;
    try {
      const pureHints = new Map<DecodeHintType, any>(hints);
      pureHints.set(DecodeHintType.PURE_BARCODE, true);
      result = this.barcodeReader.decode(source, pureHints);
    } catch (re/* ReaderException */) {
      // continue
    }

    if (result === null) {
      result = this.barcodeReader.decode(source, hints);
    }

    const resultFormat = result.getBarcodeFormat();

    if (this.expectedFormat !== resultFormat) {
      return {
        decoded: false,
        error: `[Format Mismatch]: expected '${this.expectedFormat}', actual '${resultFormat}'`,
      };
    }

    const resultText: string = result.getText();
    // WORKAROUND: ignore new line differences between systems
    // TODO: check if a real problem or only because test result is stored in a file with modified new line chars
    const expectedTextR = expectedText.replace(/\r\n/g, '\n');
    const resultTextR = resultText.replace(/\r\n/g, '\n');
    if (expectedTextR !== resultTextR) {
      const expectedTextHexCodes = AbstractBlackBoxSpec.toDebugHexStringCodes(expectedTextR);
      const resultTextHexCodes = AbstractBlackBoxSpec.toDebugHexStringCodes(resultTextR);
      return {
        decoded: false,
        error: `[Content Mismatch]: expected '${expectedTextR}' (${expectedTextHexCodes}), actual '${resultTextR}' (${resultTextHexCodes})`,
      };
    }

    const resultMetadata: Map<ResultMetadataType, any> = result.getResultMetadata();
    if (null !== expectedMetadata && undefined !== expectedMetadata) {
      for (let key in expectedMetadata.keys()) {
        // const key: ResultMetadataType = ResultMetadataType.valueOf(metadatum.)
        const expectedValue: Object = expectedMetadata.get(key);
        const keyType: ResultMetadataType = AbstractBlackBoxSpec.valueOfResultMetadataTypeFromString(key);
        const actualValue: Object = resultMetadata === null ? undefined : resultMetadata.get(keyType);
        if (expectedValue !== actualValue) {
          return {
            decoded: false,
            error: `[Metadata Mismatch]: key '${key}', expected '${expectedValue}', actual '${actualValue}'`,
          };
        }
      }
    }

    return { decoded: true };
  }

  private static truncate(text: string, n: number){
    text = text.replace(/(?:\r\n|\r|\n)/g, ' ');
    return (text.length > n) ? text.substr(0, n-1) + '\u2026' : text;
  };

  private static toDebugHexStringCodes(text: string): string {
    let r = '';
    for (let i = 0, length = text.length; i !== length; i++) {
      if (i > 0) r += ', ';
      r += '0x' + text.charCodeAt(i).toString(16).toUpperCase();
    }
    return r;
  }

  private static valueOfResultMetadataTypeFromString(value: string) {
    switch (value) {
      case 'OTHER': return ResultMetadataType.OTHER;
      case 'ORIENTATION': return ResultMetadataType.ORIENTATION;
      case 'BYTE_SEGMENTS': return ResultMetadataType.BYTE_SEGMENTS;
      case 'ERROR_CORRECTION_LEVEL': return ResultMetadataType.ERROR_CORRECTION_LEVEL;
      case 'ISSUE_NUMBER': return ResultMetadataType.ISSUE_NUMBER;
      case 'SUGGESTED_PRICE': return ResultMetadataType.SUGGESTED_PRICE;
      case 'POSSIBLE_COUNTRY': return ResultMetadataType.POSSIBLE_COUNTRY;
      case 'UPC_EAN_EXTENSION': return ResultMetadataType.UPC_EAN_EXTENSION;
      case 'PDF417_EXTRA_METADATA': return ResultMetadataType.PDF417_EXTRA_METADATA;
      case 'STRUCTURED_APPEND_SEQUENCE': return ResultMetadataType.STRUCTURED_APPEND_SEQUENCE;
      case 'STRUCTURED_APPEND_PARITY': return ResultMetadataType.STRUCTURED_APPEND_PARITY;
      default: throw value + ' not a ResultMetadataType';
    }
  }

  /**
   * @throws IOException
 */
  protected static readTextFileAsString(file: string): string {
    const stringContents: string = fs.readFileSync(file, { encoding: 'utf8' });
    if (stringContents.endsWith('\n')) {
      log.warn('contents: string of file ' + file + ' end with a newline. ' +
        'This may not be intended and cause a test failure');
    }
    return stringContents;
  }

  /**
   * @throws IOException
 */
  protected static readBinFileAsString(file: string): string {
    const bufferContents: Buffer = fs.readFileSync(file);
    const stringContents = ZXingStringEncoding.decode(new Uint8Array(bufferContents), 'iso-8859-1');
    if (stringContents.endsWith('\n')) {
      log.warn('contents: string of file ' + file + ' end with a newline. ' +
        'This may not be intended and cause a test failure');
    }
    return stringContents;
  }

  /**
   * @throws IOException
 */
  protected static readTextFileAsMetadata(file: string): Map<string, string> {
    // TODO: read text-file as metadata.
    return null;
  }

}

export default AbstractBlackBoxSpec;
