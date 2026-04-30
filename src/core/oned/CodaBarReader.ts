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
import NotFoundException from '../NotFoundException';
import OneDReader from './OneDReader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';

/**
 * <p>Decodes CodaBar barcodes. </p>
 *
 * @author Evan @dodobelieve
 * @see CodaBarReader
 */
export default class CodaBarReader extends OneDReader {

    private readonly CODA_BAR_CHAR_SET = {
        nnnnnww: '0',
        nnnnwwn: '1',
        nnnwnnw: '2',
        wwnnnnn: '3',
        nnwnnwn: '4',
        wnnnnwn: '5',
        nwnnnnw: '6',
        nwnnwnn: '7',
        nwwnnnn: '8',
        wnnwnnn: '9',
        nnnwwnn: '-',
        nnwwnnn: '$',
        wnnnwnw: ':',
        wnwnnnw: '/',
        wnwnwnn: '.',
        nnwwwww: '+',
        nnwwnwn: 'A',
        nwnwnnw: 'B',
        nnnwnww: 'C',
        nnnwwwn: 'D'
    };

    public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {
        let validRowData = this.getValidRowData(row);
        if (!validRowData) throw new NotFoundException();

        let retStr = this.codaBarDecodeRow(validRowData.row);
        if (!retStr) throw new NotFoundException();
        return new Result(
            retStr,
            null,
            0,
            [new ResultPoint(validRowData.left, rowNumber), new ResultPoint(validRowData.right, rowNumber)],
            BarcodeFormat.CODABAR,
            new Date().getTime());
    }

    /**
     * converts bit array to valid data array(lengths of black bits and white bits)
     * @param row bit array to convert
     */
    private getValidRowData(row: BitArray): any {
        let booleanArr = row.toArray();
        let startIndex = booleanArr.indexOf(true);
        if (startIndex === -1) return null;
        let lastIndex = booleanArr.lastIndexOf(true);
        if (lastIndex <= startIndex) return null;
        booleanArr = booleanArr.slice(startIndex, lastIndex + 1);

        let result = [];
        let lastBit = booleanArr[0];
        let bitLength: number = 1;
        for (let i = 1; i < booleanArr.length; i++) {
            if (booleanArr[i] === lastBit) {
                bitLength++;
            } else {
                lastBit = booleanArr[i];
                result.push(bitLength);
                bitLength = 1;
            }
        }
        result.push(bitLength);
        // CodaBar code data valid
        if (result.length < 23 && (result.length + 1) % 8 !== 0)
            return null;
        return { row: result, left: startIndex, right: lastIndex };
    }

    /**
     * decode codabar code
     * @param row row to cecode
     */
    private codaBarDecodeRow(row: Array<number>): string {
        const code = [];
        const barThreshold = Math.ceil(
            row.reduce((pre, item) => (pre + item) / 2, 0)
        );
        // Read one encoded character at a time.
        while (row.length > 0) {
            const seg = row.splice(0, 8).splice(0, 7);
            const key = seg.map(len => (len < barThreshold ? 'n' : 'w')).join('');
            if (this.CODA_BAR_CHAR_SET[key] === undefined) return null;
            code.push(this.CODA_BAR_CHAR_SET[key]);
        }
        let strCode = code.join('');
        if (this.validCodaBarString(strCode)) return strCode;
        return null;
    }

    /**
     * check if the string is a CodaBar string
     * @param src string to determine
     */
    private validCodaBarString(src: string): boolean {
        let reg = /^[A-D].{1,}[A-D]$/;
        return reg.test(src);
    }
}
