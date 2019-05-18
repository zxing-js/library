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
import DecodeHintType from '../DecodeHintType';

import Result from '../Result';
import OneDReader from './OneDReader';
import UPCEANReader from './UPCEANReader';
import EAN13Reader from './EAN13Reader';
import EAN8Reader from './EAN8Reader';
import NotFoundException from '../NotFoundException';

/**
 * <p>A reader that can read all available UPC/EAN formats. If a caller wants to try to
 * read all such formats, it is most efficient to use this implementation rather than invoke
 * individual readers.</p>
 *
 * @author Sean Owen
 */
export default class MultiFormatUPCEANReader extends OneDReader {
    private readers: UPCEANReader[];

    public constructor(hints?: Map<DecodeHintType, any>) {
        super();
        let possibleFormats = hints == null ? null : <BarcodeFormat[]>hints.get(DecodeHintType.POSSIBLE_FORMATS);
        let readers: UPCEANReader[] = [];
        if (possibleFormats != null) {
            if (possibleFormats.indexOf(BarcodeFormat.EAN_13) > -1) {
                readers.push(new EAN13Reader());
            }

            if (possibleFormats.indexOf(BarcodeFormat.EAN_8) > -1) {
                readers.push(new EAN8Reader());
            }
            // todo add UPC_A, UPC_E
        }

        if (readers.length === 0) {
            readers.push(new EAN13Reader());
            readers.push(new EAN8Reader());
            // todo add UPC_A, UPC_E
        }

        this.readers = readers;
    }

    public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {
        for (let reader of this.readers) {
            try {
                return reader.decodeRow(rowNumber, row, hints);
                // TODO ean13MayBeUPCA
            } catch (err) {
                // continue;
            }
        }
        throw new NotFoundException();
    }

    public reset() {
        for (let reader of this.readers) {
            reader.reset();
        }
    }
}
