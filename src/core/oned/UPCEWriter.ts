/*
 * Copyright 2017 ZXing authors
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
import UPCEReader from './UPCEReader';

import { int } from '../../customTypings';

/**
 * This object renders a UPC-E code as a {@link BitMatrix}.
 *
 * @author 0979097955s@gmail.com (RX)
 */
export default class UPCEWriter extends UPCEANWriter {

    private static readonly CODE_WIDTH: int =
        3 + // start guard
        (7 * 6) + // bars
        6; // end guard

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.UPC_E];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {
        const length = contents.length;
        switch (length) {
            case 7: {
                // No check digit present, calculate it and add it
                let check: int;
                try {
                    check = AbstractUPCEANReader.getStandardUPCEANChecksum(UPCEReader.convertUPCEtoUPCA(contents));
                } catch (fe) {
                    throw new IllegalArgumentException(fe.message);
                }
                contents += check;
                break;
            }
            case 8: {
                try {
                    if (!AbstractUPCEANReader.checkStandardUPCEANChecksum(UPCEReader.convertUPCEtoUPCA(contents))) {
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

        UPCEWriter.checkNumeric(contents);

        const firstDigit = parseInt(contents.charAt(0), 10);
        if (firstDigit !== 0 && firstDigit !== 1) {
            throw new IllegalArgumentException('Number system must be 0 or 1');
        }

        const checkDigit = parseInt(contents.charAt(7), 10);
        const parities = UPCEReader.NUMSYS_AND_CHECK_DIGIT_PATTERNS[firstDigit][checkDigit];
        const result = new Array<boolean>(UPCEWriter.CODE_WIDTH).fill(false);

        let pos: int = UPCEWriter.appendPattern(result, 0, AbstractUPCEANReader.START_END_PATTERN, true);

        for (let i = 1; i <= 6; i++) {
            let digit = parseInt(contents.charAt(i), 10);
            if ((parities >> (6 - i) & 1) === 1) {
                digit += 10;
            }
            pos += UPCEWriter.appendPattern(result, pos, AbstractUPCEANReader.L_AND_G_PATTERNS[digit], false);
        }

        UPCEWriter.appendPattern(result, pos, AbstractUPCEANReader.END_PATTERN, false);

        return result;
    }

}
