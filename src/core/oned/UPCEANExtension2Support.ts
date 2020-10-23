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

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';

import AbstractUPCEANReader from './AbstractUPCEANReader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
import ResultMetadataType from '../ResultMetadataType';
import NotFoundException from '../NotFoundException';

/**
 * @see UPCEANExtension5Support
 */
export default class UPCEANExtension2Support {
    private decodeMiddleCounters = Int32Array.from([0, 0, 0, 0]);
    private decodeRowStringBuffer = '';


    public decodeRow(rowNumber: number, row: BitArray, extensionStartRange: Int32Array) {
        let result = this.decodeRowStringBuffer;
        let end = this.decodeMiddle(row, extensionStartRange, result);

        let resultString = result.toString();
        let extensionData = UPCEANExtension2Support.parseExtensionString(resultString);

        let resultPoints = [
            new ResultPoint((extensionStartRange[0] + extensionStartRange[1]) / 2.0, rowNumber),
            new ResultPoint(end, rowNumber)
        ];

        let extensionResult = new Result(resultString, null, 0, resultPoints, BarcodeFormat.UPC_EAN_EXTENSION, new Date().getTime());

        if (extensionData != null) {
            extensionResult.putAllMetadata(extensionData);
        }

        return extensionResult;
    }

    public decodeMiddle(row: BitArray, startRange: Int32Array, resultString: string) {
        let counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        let end = row.getSize();
        let rowOffset = startRange[1];

        let checkParity = 0;

        for (let x = 0; x < 2 && rowOffset < end; x++) {
            let bestMatch = AbstractUPCEANReader.decodeDigit(row, counters, rowOffset, AbstractUPCEANReader.L_AND_G_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
            for (let counter of counters) {
                rowOffset += counter;
            }
            if (bestMatch >= 10) {
                checkParity |= 1 << (1 - x);
            }
            if (x !== 1) {
                // Read off separator if not last
                rowOffset = row.getNextSet(rowOffset);
                rowOffset = row.getNextUnset(rowOffset);
            }
        }

        if (resultString.length !== 2) {
            throw new NotFoundException();
        }

        if (parseInt(resultString.toString()) % 4 !== checkParity) {
            throw new NotFoundException();
        }

        return rowOffset;
    }

    static parseExtensionString(raw: string) {
        if (raw.length !== 2) {
            return null;
        }

        return new Map([[ResultMetadataType.ISSUE_NUMBER, parseInt(raw)]]);
    }
}
