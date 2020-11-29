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
import UPCEANExtensionSupport from './UPCEANExtensionSupport';
import AbstractUPCEANReader from './AbstractUPCEANReader';
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
export default abstract class UPCEANReader extends AbstractUPCEANReader {

    public constructor() {
        super();
        this.decodeRowStringBuffer = '';

        UPCEANReader.L_AND_G_PATTERNS = UPCEANReader.L_PATTERNS.map(arr => Int32Array.from(arr));

        for (let i = 10; i < 20; i++) {
            let widths = UPCEANReader.L_PATTERNS[i - 10];
            let reversedWidths = new Int32Array(widths.length);
            for (let j = 0; j < widths.length; j++) {
                reversedWidths[j] = widths[widths.length - j - 1];
            }
            UPCEANReader.L_AND_G_PATTERNS[i] = reversedWidths;
        }
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

    static decodeEnd(row: BitArray, endStart: number): Int32Array {
        return UPCEANReader.findGuardPattern(row, endStart, false, UPCEANReader.START_END_PATTERN, new Int32Array(UPCEANReader.START_END_PATTERN.length).fill(0));
    }
}
