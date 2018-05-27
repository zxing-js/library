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

/*namespace com.google.zxing.oned {*/

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Exception from '../Exception';
import Result from '../Result';
import OneDReader from './OneDReader';
import UPCEANReader from './UPCEANReader';
import EAN13Reader from './EAN13Reader';

/**
 * <p>Decodes Code 128 barcodes.</p>
 *
 * @author Sean Owen
 */
export default class MultiFormatUPCEANReader extends OneDReader {
    private readers: UPCEANReader[];

    public constructor(hints?: Map<DecodeHintType, any>) {
        super();
        let possibleFormats = hints == null ? null : hints.get(DecodeHintType.POSSIBLE_FORMATS);
        let readers: UPCEANReader[] = [];
        if (possibleFormats != null) {
            if (possibleFormats.indexOf(BarcodeFormat.EAN_13) > -1) {
                readers.push(new EAN13Reader());
            }

            // todo add UPC_A, EAN_8, UPC_E
        }

        if (readers.length === 0) {
            readers.push(new EAN13Reader());
            // todo add UPC_A, EAN_8, UPC_E
        }

        this.readers = readers;
        // this.readers = readers.toArray(new UPCEANReader[readers.size()]); fixme
    }

    public decodeRow(rowNumber: number, row: BitArray, startGuardRange: number[], hints?: Map<DecodeHintType, any>): Result {
        let startGuardPattern = UPCEANReader.findStartGuardPattern(row);
        for (let reader of this.readers) {
            try {
                let result = reader.decodeRow(rowNumber, row, startGuardPattern, hints);
                // TODO ean13MayBeUPCA
            } catch (err) {
                console.log(err);
                // continue;
            }
        }
        throw new Exception(Exception.NotFoundException);
    }

    public reset() {
        for (let reader of this.readers) {
            reader.reset();
        }
    }
}