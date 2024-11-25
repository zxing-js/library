/*
 * Copyright (C) 2012 ZXing authors
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
import { NotFoundException, RSSExpandedReader } from '@zxing/library';
import TestCaseUtil from '../../../oned/rss/expanded/TestCaseUtil';
import { assertEquals } from '../../../util/AssertUtils';

/**
 * Tests {@link RSSExpandedReader} handling of stacked RSS barcodes.
 */
class RSSExpandedStackedInternalTestCase /* extends Assert */ {
  public async testDecodingRowByRow(): Promise<void> /* throws Exception */ {
    const rssExpandedReader = new RSSExpandedReader();

    const binaryMap = await TestCaseUtil.getBinaryBitmap('src/test/resources/blackbox/rssexpandedstacked-2/1000.png');

    const firstRowNumber /* int */ = Math.trunc(binaryMap.getHeight() / 3);
    const firstRow = binaryMap.getBlackRow(firstRowNumber, null);
    try {
      rssExpandedReader.decodeRow2pairs(firstRowNumber, firstRow);
      throw new Error('NotFoundException expected');
    } catch (ex) {
      if (ex instanceof NotFoundException) {
        // ok
      } else {
        throw new Error('NotFoundException expected');
      }
    }

    assertEquals(1, rssExpandedReader.getRows().length);
    const firstExpandedRow = rssExpandedReader.getRows()[0];
    assertEquals(firstRowNumber, firstExpandedRow.getRowNumber());

    assertEquals(2, firstExpandedRow.getPairs().length);

    firstExpandedRow.getPairs()[1].getFinderPattern().getStartEnd()[1] = 0;

    const secondRowNumber /* int */ = Math.trunc(2 * binaryMap.getHeight() / 3);
    const secondRow = binaryMap.getBlackRow(secondRowNumber, null);
    secondRow.reverse();

    const totalPairs: Array<any> = rssExpandedReader.decodeRow2pairs(secondRowNumber, secondRow);

    const result = RSSExpandedReader.constructResult(totalPairs);
    assertEquals('(01)98898765432106(3202)012345(15)991231', result.getText());
  }

  public async testCompleteDecode(): Promise<void> /* throws Exception */ {
    const rssExpandedReader = new RSSExpandedReader();

    const binaryMap = await TestCaseUtil.getBinaryBitmap('src/test/resources/blackbox/rssexpandedstacked-2/1000.png');

    const result = rssExpandedReader.decode(binaryMap);
    assertEquals('(01)98898765432106(3202)012345(15)991231', result.getText());
  }
}

describe('RSSExpandedStackedInternalTestCase', () => {
  it('testDecodingRowByRow', async () => {
    await new RSSExpandedStackedInternalTestCase().testDecodingRowByRow();
  });

  it('testCompleteDecode', async () => {
    await new RSSExpandedStackedInternalTestCase().testCompleteDecode();
  });
});
