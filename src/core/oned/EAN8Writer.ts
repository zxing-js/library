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
import UPCEANWriter from './UPCEANWriter';

import { int } from '../../customTypings';

/**
 * This object renders an EAN8 code as a {@link BitMatrix}.
 *
 * @author aripollak@gmail.com (Ari Pollak)
 */
export default class EAN8Writer extends UPCEANWriter {

    private static readonly CODE_WIDTH: int =
        3 + // start guard
        (7 * 4) + // left bars
        5 + // middle guard
        (7 * 4) + // right bars
        3; // end guard

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.EAN_8];
    }

    /**
     * @return a byte array of horizontal pixels (false = white, true = black)
     */
    // @Override
    public encodeContents(contents: string): boolean[] {
        const length = contents.length;
        switch (length) {
            case 7: {
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
            case 8: {
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
                    'Requested contents should be 7 or 8 digits long, but got ' + length
                );
        }

        EAN8Writer.checkNumeric(contents);

        const result = new Array<boolean>(EAN8Writer.CODE_WIDTH).fill(false);
        let pos = 0;

        pos += EAN8Writer.appendPattern(result, pos, AbstractUPCEANReader.START_END_PATTERN, true);

        for (let i = 0; i <= 3; i++) {
            const digit = parseInt(contents.charAt(i), 10);
            pos += EAN8Writer.appendPattern(result, pos, AbstractUPCEANReader.L_PATTERNS[digit], false);
        }

        pos += EAN8Writer.appendPattern(result, pos, AbstractUPCEANReader.MIDDLE_PATTERN, false);

        for (let i = 4; i <= 7; i++) {
            const digit = parseInt(contents.charAt(i), 10);
            pos += EAN8Writer.appendPattern(result, pos, AbstractUPCEANReader.L_PATTERNS[digit], true);
        }
        EAN8Writer.appendPattern(result, pos, AbstractUPCEANReader.START_END_PATTERN, true);

        return result;
    }

}
