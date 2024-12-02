/*
 * Copyright (C) 2010 ZXing authors
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

/*
 * These authors would like to acknowledge the Spanish Ministry of Industry,
 * Tourism and Trade, for the support in the project TSI020301-2008-2
 * "PIRAmIDE: Personalizable Interactions with Resources on AmI-enabled
 * Mobile Dynamic Environments", led by Treelogic
 * ( http://www.treelogic.com/ ):
 *
 *   http://www.piramidepse.com/
 */

// package com.google.zxing.oned.rss.expanded;

import { describe } from 'mocha';
import * as path from 'path';

import { BinaryBitmap, FinderPattern, GlobalHistogramBinarizer, NotFoundException, RSSExpandedReader } from '@zxing/library';
import AbstractBlackBoxSpec from '../../../common/AbstractBlackBox';
import { assertEquals, assertNotNull } from '../../../util/AssertUtils';
import SharpImage from '../../../util/SharpImage';
import SharpImageLuminanceSource from '../../../SharpImageLuminanceSource';

/**
 * @author Pablo Orduña, University of Deusto (pablo.orduna@deusto.es)
 * @author Eduardo Castillejo, University of Deusto (eduardo.castillejo@deusto.es)
 */
class RSSExpandedInternalTestCase /* extends Assert */ {
  public async testFindFinderPatterns(): Promise<void> /* throws Exception */ {
    const image = await RSSExpandedInternalTestCase.readImage('2.png');
    const binaryMap = new BinaryBitmap(new GlobalHistogramBinarizer(new SharpImageLuminanceSource(image)));
    const rowNumber: /*int*/ number = Math.trunc(binaryMap.getHeight() / 2);
    const row = binaryMap.getBlackRow(rowNumber, null);
    const previousPairs: Array<any /* ExpandedPair */> = [];

    const rssExpandedReader = new RSSExpandedReader();
    const pair1 = rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
    previousPairs.push(pair1);
    let finderPattern = pair1.getFinderPattern();
    assertNotNull(finderPattern);
    assertEquals(0, finderPattern.getValue());

    const pair2 = rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
    previousPairs.push(pair2);
    finderPattern = pair2.getFinderPattern();
    assertNotNull(finderPattern);
    assertEquals(1, finderPattern.getValue());

    const pair3 = rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
    previousPairs.push(pair3);
    finderPattern = pair3.getFinderPattern();
    assertNotNull(finderPattern);
    assertEquals(1, finderPattern.getValue());

    try {
      rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
      //   the previous was the last pair
      throw new Error('NotFoundException expected');
    } catch (ex) {
      if (ex instanceof NotFoundException) {
        // ok
      } else {
        throw new Error('NotFoundException expected');
      }
    }
  }

  public async testRetrieveNextPairPatterns(): Promise<void> /* throws Exception */ {
    const image = await RSSExpandedInternalTestCase.readImage('3.png');
    const binaryMap = new BinaryBitmap(new GlobalHistogramBinarizer(new SharpImageLuminanceSource(image)));
    const rowNumber: /*int*/ number = Math.trunc(binaryMap.getHeight() / 2);
    const row = binaryMap.getBlackRow(rowNumber, null);
    const previousPairs: Array<any /* ExpandedPair */> = [];

    const rssExpandedReader = new RSSExpandedReader();
    const pair1 = rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
    previousPairs.push(pair1);
    let finderPattern = pair1.getFinderPattern();
    assertNotNull(finderPattern);
    assertEquals(0, finderPattern.getValue());

    const pair2 = rssExpandedReader.retrieveNextPair(row, previousPairs, rowNumber);
    previousPairs.push(pair2);
    finderPattern = pair2.getFinderPattern();
    assertNotNull(finderPattern);
    assertEquals(0, finderPattern.getValue());
  }

  public async testDecodeCheckCharacter(): Promise<void> /* throws Exception */ {
    const image = await RSSExpandedInternalTestCase.readImage('3.png');
    const binaryMap = new BinaryBitmap(new GlobalHistogramBinarizer(new SharpImageLuminanceSource(image)));
    const row = binaryMap.getBlackRow(/* int */ Math.trunc(binaryMap.getHeight() / 2), null);

    const startEnd: Array<number /* int */> = [145, 243]; // image pixels where the A1 pattern starts (at 124) and ends (at 214)
    const value: /*int*/ number = 0; // A
    const finderPatternA1 = new FinderPattern(value, startEnd, startEnd[0], startEnd[1], /* int */ Math.trunc(image.getHeight() / 2));
    //{1, 8, 4, 1, 1};
    const rssExpandedReader = new RSSExpandedReader();
    const dataCharacter = rssExpandedReader.decodeDataCharacter(row, finderPatternA1, true, true);

    assertEquals(98, dataCharacter.getValue());
  }

  public async testDecodeDataCharacter(): Promise<void> /* throws Exception */ {
    const image = await RSSExpandedInternalTestCase.readImage('3.png');
    const binaryMap = new BinaryBitmap(new GlobalHistogramBinarizer(new SharpImageLuminanceSource(image)));
    const row = binaryMap.getBlackRow(/* int */ Math.trunc(binaryMap.getHeight() / 2), null);

    const startEnd: Array<number /* Int */> = [145, 243]; // image pixels where the A1 pattern starts (at 124) and ends (at 214)
    const value: /*int*/ number = 0; // A
    const finderPatternA1 = new FinderPattern(value, startEnd, startEnd[0], startEnd[1], /* int */ Math.trunc(image.getHeight() / 2));
    //{1, 8, 4, 1, 1};
    const rssExpandedReader = new RSSExpandedReader();
    const dataCharacter = rssExpandedReader.decodeDataCharacter(row, finderPatternA1, true, false);

    assertEquals(19, dataCharacter.getValue());
    assertEquals(1007, dataCharacter.getChecksumPortion());
  }

  private static readImage(fileName: string): Promise<SharpImage> /* throws IOException */ {
    // Image loading adapted from `AbstractBlackBoxSpec.testBlackBoxCountingResults`.
    const basePath = AbstractBlackBoxSpec.buildTestBase("src/test/resources/blackbox/rssexpanded-1/");
    const imagePath = path.resolve(basePath, fileName);
    const rotatedImage = SharpImage.loadWithRotation(imagePath, 0);
    return rotatedImage;
  }

}

describe('RSSExpandedInternalTestCase', () => {
  it('testFindFinderPatterns', async () => {
    await new RSSExpandedInternalTestCase().testFindFinderPatterns();
  });

  it('testRetrieveNextPairPatterns', async () => {
    await new RSSExpandedInternalTestCase().testRetrieveNextPairPatterns();
  });

  it('testDecodeCheckCharacter', async () => {
    await new RSSExpandedInternalTestCase().testDecodeCheckCharacter();
  });

  it('testDecodeDataCharacter', async () => {
    await new RSSExpandedInternalTestCase().testDecodeDataCharacter();
  });
});