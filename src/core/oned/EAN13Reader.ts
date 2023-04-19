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

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';

import UPCEANReader from './UPCEANReader';
import NotFoundException from '../NotFoundException';

/**
 * <p>Implements decoding of the EAN-13 format.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default class EAN13Reader extends UPCEANReader {
    private static FIRST_DIGIT_ENCODINGS: number[] = [0x00, 0x0B, 0x0D, 0xE, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A];

  private decodeMiddleCounters: Int32Array;

    public constructor() {
        super();
      this.decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
    }

  public decodeMiddle(row: BitArray, startRange: Int32Array, resultString: string) {
        let counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        let end = row.getSize();
        let rowOffset = startRange[1];

        let lgPatternFound = 0;

        for (let x = 0; x < 6 && rowOffset < end; x++) {
            let bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
            for (let counter of counters) {
                rowOffset += counter;
            }
            if (bestMatch >= 10) {
                lgPatternFound |= 1 << (5 - x);
            }
        }

        resultString = EAN13Reader.determineFirstDigit(resultString, lgPatternFound);

        let middleRange = UPCEANReader.findGuardPattern(row, rowOffset, true, UPCEANReader.MIDDLE_PATTERN, new Int32Array(UPCEANReader.MIDDLE_PATTERN.length).fill(0));
        rowOffset = middleRange[1];

        for (let x = 0; x < 6 && rowOffset < end; x++) {
            let bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch));
            for (let counter of counters) {
                rowOffset += counter;
            }
        }

        return {rowOffset, resultString};
    }

    public getBarcodeFormat(): BarcodeFormat {
        return BarcodeFormat.EAN_13;
    }

    static determineFirstDigit(resultString: string, lgPatternFound: number) {
        for (let d = 0; d < 10; d++) {
            if (lgPatternFound === this.FIRST_DIGIT_ENCODINGS[d]) {
                resultString = String.fromCharCode(('0'.charCodeAt(0) + d)) + resultString;
                return resultString;
            }
        }
        throw new NotFoundException();
    }
}
