/*
 * Copyright 2009 ZXing authors
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

// package com.google.zxing.oned;

import BarcodeFormat from '../BarcodeFormat';
import IllegalArgumentException from '../IllegalArgumentException';
import AbstractUPCEANReader from './AbstractUPCEANReader';
import EAN13Reader from './EAN13Reader';
import UPCEANWriter from './UPCEANWriter';

import { int } from '../../customTypings';

/**
 * This object renders an EAN13 code as a {@link BitMatrix}.
 *
 * @author aripollak@gmail.com (Ari Pollak)
 */
export default class EAN13Writer extends UPCEANWriter {

    private static readonly CODE_WIDTH: int =
        3 + // start guard
        (7 * 6) + // left bars
        5 + // middle guard
        (7 * 6) + // right bars
        3; // end guard

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.EAN_13];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {
        const length = contents.length;
        switch (length) {
            case 12: {
                // No check digit present, calculate it and add it
                let check: int;
                try {
                    check = AbstractUPCEANReader.getStandardUPCEANChecksum(contents);
                } catch (fe) {
                    throw new IllegalArgumentException(fe.message);
                }
                contents += check;
                break;
            }
            case 13: {
                try {
                    if (!AbstractUPCEANReader.checkStandardUPCEANChecksum(contents)) {
                        throw new IllegalArgumentException('Contents do not pass checksum');
                    }
                } catch (ignored) {
                    if (ignored instanceof IllegalArgumentException) {
                        throw ignored;
                    }
                    throw new IllegalArgumentException('Illegal contents');
                }
                break;
            }
            default:
                throw new IllegalArgumentException(
                    'Requested contents should be 12 or 13 digits long, but got ' + length
                );
        }

        EAN13Writer.checkNumeric(contents);

        const firstDigit = parseInt(contents.charAt(0), 10);
        const parities = EAN13Reader.FIRST_DIGIT_ENCODINGS[firstDigit];
        const result = new Array<boolean>(EAN13Writer.CODE_WIDTH).fill(false);
        let pos = 0;

        pos += EAN13Writer.appendPattern(result, pos, AbstractUPCEANReader.START_END_PATTERN, true);

        // See EAN13Reader for a description of how the first digit & left bars are encoded
        for (let i = 1; i <= 6; i++) {
            let digit = parseInt(contents.charAt(i), 10);
            if ((parities >> (6 - i) & 1) === 1) {
                digit += 10;
            }
            pos += EAN13Writer.appendPattern(result, pos, AbstractUPCEANReader.L_AND_G_PATTERNS[digit], false);
        }

        pos += EAN13Writer.appendPattern(result, pos, AbstractUPCEANReader.MIDDLE_PATTERN, false);

        for (let i = 7; i <= 12; i++) {
            const digit = parseInt(contents.charAt(i), 10);
            pos += EAN13Writer.appendPattern(result, pos, AbstractUPCEANReader.L_PATTERNS[digit], true);
        }
        EAN13Writer.appendPattern(result, pos, AbstractUPCEANReader.START_END_PATTERN, true);

        return result;
    }

}
