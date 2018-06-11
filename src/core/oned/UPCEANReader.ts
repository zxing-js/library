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
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import OneDReader from './OneDReader';
import UPCEANExtensionSupport from './UPCEANExtensionSupport';
import NotFoundException from '../NotFoundException';
import FormatException from '../FormatException';
import ChecksumException from '../ChecksumException';

/**
 * <p>Encapsulates functionality and implementation that is common to UPC and EAN families
 * of one-dimensional barcodes.</p>
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author alasdair@google.com (Alasdair Mackintosh)
 */
export default abstract class UPCEANReader extends OneDReader {
    // These two values are critical for determining how permissive the decoding will be.
    // We've arrived at these values through a lot of trial and error. Setting them any higher
    // lets false positives creep in quickly.
    private static MAX_AVG_VARIANCE = 0.48;
    private static MAX_INDIVIDUAL_VARIANCE = 0.7;

    /**
     * Start/end guard pattern.
     */
    public static START_END_PATTERN: number[] = [1, 1, 1];

    /**
     * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
     */
    public static MIDDLE_PATTERN: number[] = [1, 1, 1, 1, 1];
    /**
     * end guard pattern.
     */
    public static END_PATTERN: number[] = [1, 1, 1, 1, 1, 1];
    /**
     * "Odd", or "L" patterns used to encode UPC/EAN digits.
     */
    public static L_PATTERNS: number[][] = [
        [3, 2, 1, 1], // 0
        [2, 2, 2, 1], // 1
        [2, 1, 2, 2], // 2
        [1, 4, 1, 1], // 3
        [1, 1, 3, 2], // 4
        [1, 2, 3, 1], // 5
        [1, 1, 1, 4], // 6
        [1, 3, 1, 2], // 7
        [1, 2, 1, 3], // 8
        [3, 1, 1, 2], // 9
    ];

    /**
     * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
     */
    public static L_AND_G_PATTERNS: number[][];

    private decodeRowStringBuffer = '';
    // private final UPCEANExtensionSupport extensionReader;
    // private final EANManufacturerOrgSupport eanManSupport;

    public constructor() {
        super();
        this.decodeRowStringBuffer = '';

        UPCEANReader.L_AND_G_PATTERNS = UPCEANReader.L_PATTERNS.map(function(arr) {
            return arr.slice();
        });

        for (let i = 10; i < 20; i++) {
            let widths = UPCEANReader.L_PATTERNS[i - 10];
            let reversedWidths = new Array(widths.length);
            for (let j = 0; j < widths.length; j++) {
                reversedWidths[j] = widths[widths.length - j - 1];
            }
            UPCEANReader.L_AND_G_PATTERNS[i] = reversedWidths;
        }
    }

    /*
    protected UPCEANReader() {
        decodeRowStringBuffer = new StringBuilder(20);
        extensionReader = new UPCEANExtensionSupport();
        eanManSupport = new EANManufacturerOrgSupport();
    }
    */

    static findStartGuardPattern(row: BitArray): number[] {
        let foundStart = false;
        let startRange: number[] = null;
        let nextStart = 0;
        let counters = [0, 0, 0];
        while (!foundStart) {
            counters = [0, 0, 0];
            startRange = UPCEANReader.findGuardPattern(row, nextStart, false, this.START_END_PATTERN, counters);
            let start = startRange[0];
            nextStart = startRange[1];
            let quietStart = start - (nextStart - start);
            if (quietStart >= 0) {
                foundStart = row.isRange(quietStart, start, false);
            }
        }
        return startRange;
    }

    public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {
        let startGuardRange = UPCEANReader.findStartGuardPattern(row);
        let resultPointCallback = hints == null ? null : hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);

        if (resultPointCallback != null) {
            const resultPoint = new ResultPoint((startGuardRange[0] + startGuardRange[1]) / 2.0, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint);
        }

        let budello = this.decodeMiddle(row, startGuardRange, this.decodeRowStringBuffer);
        let endStart = budello.rowOffset;
        let result = budello.resultString;

        if (resultPointCallback != null) {
            const resultPoint = new ResultPoint(endStart, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint);
        }

        let endRange = UPCEANReader.decodeEnd(row, endStart);

        if (resultPointCallback != null) {
            const resultPoint = new ResultPoint((endRange[0] + endRange[1]) / 2.0, rowNumber);
            resultPointCallback.foundPossibleResultPoint(resultPoint);
        }

        // Make sure there is a quiet zone at least as big as the end pattern after the barcode. The
        // spec might want more whitespace, but in practice this is the maximum we can count on.
        let end = endRange[1];
        let quietEnd = end + (end - endRange[0]);

        if (quietEnd >= row.getSize() || !row.isRange(end, quietEnd, false)) {
            throw new NotFoundException();
        }

        let resultString = result.toString();
        // UPC/EAN should never be less than 8 chars anyway
        if (resultString.length < 8) {
            throw new FormatException();
        }
        if (!UPCEANReader.checkChecksum(resultString)) {
            throw new ChecksumException();
        }

        let left = (startGuardRange[1] + startGuardRange[0]) / 2.0;
        let right = (endRange[1] + endRange[0]) / 2.0;
        let format = this.getBarcodeFormat();
        let resultPoint = [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)];
        let decodeResult = new Result(resultString, null, 0, resultPoint, format, new Date().getTime());

        let extensionLength = 0;

        try {
            let extensionResult = UPCEANExtensionSupport.decodeRow(rowNumber, row, endRange[1]);
            decodeResult.putMetadata(ResultMetadataType.UPC_EAN_EXTENSION, extensionResult.getText());
            decodeResult.putAllMetadata(extensionResult.getResultMetadata());
            decodeResult.addResultPoints(extensionResult.getResultPoints());
            extensionLength = extensionResult.getText().length;
        } catch (err) {
        }

        let allowedExtensions = hints == null ? null : hints.get(DecodeHintType.ALLOWED_EAN_EXTENSIONS);
        if (allowedExtensions != null) {
            let valid = false;
            for (let length in allowedExtensions) {
                if (extensionLength.toString() === length) {  // check me
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                throw new NotFoundException();
            }
        }

        if (format === BarcodeFormat.EAN_13 || format === BarcodeFormat.UPC_A) {
            // let countryID = eanManSupport.lookupContryIdentifier(resultString); todo
            // if (countryID != null) {
            //     decodeResult.putMetadata(ResultMetadataType.POSSIBLE_COUNTRY, countryID);
            // }
        }

        return decodeResult;
    }

    static checkChecksum(s: string): boolean {
        return UPCEANReader.checkStandardUPCEANChecksum(s);
    }

    static checkStandardUPCEANChecksum(s: string): boolean {
        let length = s.length;
        if (length === 0) return false;

        let check = parseInt(s.charAt(length - 1), 10);
        return UPCEANReader.getStandardUPCEANChecksum(s.substring(0, length - 1)) === check;
    }

    static getStandardUPCEANChecksum(s: string): number {
        let length = s.length;
        let sum = 0;
        for (let i = length - 1; i >= 0; i -= 2) {
            let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        sum *= 3;
        for (let i = length - 2; i >= 0; i -= 2) {
            let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            if (digit < 0 || digit > 9) {
                throw new FormatException();
            }
            sum += digit;
        }
        return (1000 - sum) % 10;
    }

    static decodeEnd(row: BitArray, endStart: number): number[] {
        return UPCEANReader.findGuardPattern(row, endStart, false, UPCEANReader.START_END_PATTERN, new Array(UPCEANReader.START_END_PATTERN.length).fill(0));
    }

    static findGuardPattern(row: BitArray, rowOffset: number, whiteFirst: boolean, pattern: number[], counters: number[]) {
        let width = row.getSize();
        rowOffset = whiteFirst ? row.getNextUnset(rowOffset) : row.getNextSet(rowOffset);
        let counterPosition = 0;
        let patternStart = rowOffset;
        let patternLength = pattern.length;
        let isWhite = whiteFirst;
        for (let x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            } else {
                if (counterPosition === patternLength - 1) {
                    if (OneDReader.patternMatchVariance(counters, pattern, UPCEANReader.MAX_INDIVIDUAL_VARIANCE) < UPCEANReader.MAX_AVG_VARIANCE) {
                        return [patternStart, x];
                    }
                    patternStart += counters[0] + counters[1];

                    let slice = counters.slice(2, counters.length);
                    for (let i = 0; i < counterPosition - 1; i++) {
                        counters[i] = slice[i];
                    }

                    counters[counterPosition - 1] = 0;
                    counters[counterPosition] = 0;
                    counterPosition--;
                } else {
                    counterPosition++;
                }
                counters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException();
    }

    static decodeDigit(row: BitArray, counters: number[], rowOffset: number, patterns: number[][]) {
        this.recordPattern(row, rowOffset, counters);
        let bestVariance = this.MAX_AVG_VARIANCE;
        let bestMatch = -1;
        let max = patterns.length;
        for (let i = 0; i < max; i++) {
            let pattern = patterns[i];
            let variance = OneDReader.patternMatchVariance(counters, pattern, UPCEANReader.MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
                bestVariance = variance;
                bestMatch = i;
            }
        }
        if (bestMatch >= 0) {
            return bestMatch;
        } else {
            throw new NotFoundException();
        }
    }

    /**
     * Get the format of this decoder.
     *
     * @return The 1D format.
     */
    public abstract getBarcodeFormat();

    /**
     * Subclasses override this to decode the portion of a barcode between the start
     * and end guard patterns.
     *
     * @param row row of black/white values to search
     * @param startRange start/end offset of start guard pattern
     * @param resultString {@link StringBuilder} to append decoded chars to
     * @return horizontal offset of first pixel after the "middle" that was decoded
     * @throws NotFoundException if decoding could not complete successfully
     */
    public abstract decodeMiddle(row: BitArray, startRange: number[], resultString: string);
}
