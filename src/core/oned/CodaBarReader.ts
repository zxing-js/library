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

type CodaBarWidthSplit = {
    threshold: number;
    fit: number;
};

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
        nnwnwnw: '+',
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
        if (result.length < 23 || result.length % 8 !== 7)
            return null;
        return { row: result, left: startIndex, right: lastIndex };
    }

    /**
     * decode codabar code
     * @param row alternating bar and space widths, starting with a bar
     */
    private codaBarDecodeRow(row: Array<number>): string {
        // Each start or stop pattern has three narrow bars and one narrow space.
        const barFits = new Map(this.getWidthSplits(row, 0, 3).map(split => [split.threshold, split.fit]));
        const spaceSplits = this.getWidthSplits(row, 1, 1);
        let bestCode = null;
        let bestFit = -Infinity;
        let bestHasStandardPayload = false;

        for (const spaces of spaceSplits) {
            const decoded = this.decodeWithSpaceThreshold(row, spaces.threshold);
            if (!decoded) continue;
            const barFit = barFits.get(decoded.barThreshold);
            if (barFit === undefined) continue;

            const { text } = decoded;
            // Prefer a payload without start/stop characters when the widths admit both.
            const hasStandardPayload = !/[A-D]/.test(text.slice(1, -1));
            if (bestHasStandardPayload && !hasStandardPayload) continue;

            const fit = barFit + spaces.fit;
            if ((hasStandardPayload && !bestHasStandardPayload) || fit > bestFit) {
                bestCode = text;
                bestFit = fit;
                bestHasStandardPayload = hasStandardPayload;
            } else if (fit === bestFit) {
                bestCode = null;
            }
        }
        return bestCode;
    }

    private getWidthSplits(row: number[], color: number, narrowGuardCount: number): CodaBarWidthSplit[] {
        let longestNarrow = 0;
        let shortestWide = Infinity;
        for (const start of [0, row.length - 7]) {
            const guardWidths = [];
            for (let i = color; i < 7; i += 2) guardWidths.push(row[start + i]);
            guardWidths.sort((left, right) => left - right);
            longestNarrow = Math.max(longestNarrow, guardWidths[narrowGuardCount - 1]);
            shortestWide = Math.min(shortestWide, guardWidths[narrowGuardCount]);
        }
        if (longestNarrow >= shortestWide) return [];

        const widths = [];
        for (let i = color; i < row.length; i += 2) {
            if (i % 8 !== 7) widths.push(row[i]); // Skip the inter-character gaps.
        }
        widths.sort((left, right) => left - right);

        const splits: CodaBarWidthSplit[] = [];
        const total = widths.reduce((sum, width) => sum + width, 0);
        let narrowTotal = 0;
        for (let i = 1; i < widths.length; i++) {
            narrowTotal += widths[i - 1];
            const threshold = widths[i];
            if (threshold === widths[i - 1] || threshold <= longestNarrow || threshold > shortestWide) continue;
            const wideTotal = total - narrowTotal;
            // Maximizing this score minimizes squared deviations from each class mean.
            const fit = narrowTotal ** 2 / i + wideTotal ** 2 / (widths.length - i);
            splits.push({ threshold, fit });
        }
        return splits;
    }

    private decodeWithSpaceThreshold(row: number[], spaceThreshold: number): { text: string; barThreshold: number } {
        let longestNarrowBar = 0;
        let shortestWideBar = Infinity;
        const code = [];
        for (let start = 0; start < row.length; start += 8) {
            // The four patterns with no wide spaces have three wide bars.
            // Every other pattern has one wide bar.
            const allSpacesNarrow = row[start + 1] < spaceThreshold &&
                row[start + 3] < spaceThreshold && row[start + 5] < spaceThreshold;
            const narrowBarCount = allSpacesNarrow ? 1 : 3;
            const bars = [row[start], row[start + 2], row[start + 4], row[start + 6]]
                .sort((left, right) => left - right);
            const barThreshold = bars[narrowBarCount];
            longestNarrowBar = Math.max(longestNarrowBar, bars[narrowBarCount - 1]);
            shortestWideBar = Math.min(shortestWideBar, barThreshold);
            if (longestNarrowBar >= shortestWideBar) return null;

            const thresholds = [barThreshold, spaceThreshold];
            const key = row.slice(start, start + 7)
                .map((width, index) => (width >= thresholds[index % 2] ? 'w' : 'n'))
                .join('');
            const character = this.CODA_BAR_CHAR_SET[key];
            if (character === undefined) return null;
            code.push(character);
        }
        const text = code.join('');
        return this.validCodaBarString(text) ? { text, barThreshold: shortestWideBar } : null;
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
