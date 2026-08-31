/*
 * Copyright 2011 ZXing authors
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
import OneDimensionalCodeWriter from './OneDimensionalCodeWriter';

import { int } from '../../customTypings';

/**
 * This object renders a CodaBar code as a {@link BitMatrix}.
 *
 * @author dsbnatut@gmail.com (Kazuki Nishiura)
 */
export default class CodaBarWriter extends OneDimensionalCodeWriter {

    private static readonly START_END_CHARS = ['A', 'B', 'C', 'D'];
    private static readonly ALT_START_END_CHARS = ['T', 'N', '*', 'E'];
    private static readonly CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED = ['/', ':', '+', '.'];
    private static readonly DEFAULT_GUARD = CodaBarWriter.START_END_CHARS[0];

    /**
     * The TypeScript CodaBarReader is not a port of the Java one and exposes no encoding tables,
     * so the Java CodaBarReader.ALPHABET / CHARACTER_ENCODINGS are reproduced here.
     */
    private static readonly ALPHABET = '0123456789-$:/.+ABCD'.split('');

    /**
     * These represent the encodings of characters, as patterns of wide and narrow bars. The 7
     * least-significant bits of each int correspond to the pattern of wide and narrow, with 1s
     * representing "wide" and 0s representing narrow.
     */
    private static readonly CHARACTER_ENCODINGS: number[] = [
        0x003, 0x006, 0x009, 0x060, 0x012, 0x042, 0x021, 0x024, 0x030, 0x048, // 0-9
        0x00c, 0x018, 0x045, 0x051, 0x054, 0x015, 0x01A, 0x029, 0x00B, 0x00E, // -$:/.+ABCD
    ];

    private static arrayContains(array: string[], key: string): boolean {
        return array.includes(key);
    }

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.CODABAR];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {

        if (contents.length < 2) {
            // Can't have a start/end guard, so tentatively add default guards
            contents = CodaBarWriter.DEFAULT_GUARD + contents + CodaBarWriter.DEFAULT_GUARD;
        } else {
            // Verify input and calculate decoded length.
            const firstChar = contents.charAt(0).toUpperCase();
            const lastChar = contents.charAt(contents.length - 1).toUpperCase();
            const startsNormal = CodaBarWriter.arrayContains(CodaBarWriter.START_END_CHARS, firstChar);
            const endsNormal = CodaBarWriter.arrayContains(CodaBarWriter.START_END_CHARS, lastChar);
            const startsAlt = CodaBarWriter.arrayContains(CodaBarWriter.ALT_START_END_CHARS, firstChar);
            const endsAlt = CodaBarWriter.arrayContains(CodaBarWriter.ALT_START_END_CHARS, lastChar);
            if (startsNormal) {
                if (!endsNormal) {
                    throw new IllegalArgumentException('Invalid start/end guards: ' + contents);
                }
                // else already has valid start/end
            } else if (startsAlt) {
                if (!endsAlt) {
                    throw new IllegalArgumentException('Invalid start/end guards: ' + contents);
                }
                // else already has valid start/end
            } else {
                // Doesn't start with a guard
                if (endsNormal || endsAlt) {
                    throw new IllegalArgumentException('Invalid start/end guards: ' + contents);
                }
                // else doesn't end with guard either, so add a default
                contents = CodaBarWriter.DEFAULT_GUARD + contents + CodaBarWriter.DEFAULT_GUARD;
            }
        }

        // The start character and the end character are decoded to 10 length each.
        let resultLength = 20;
        for (let i = 1; i < contents.length - 1; i++) {
            const c = contents.charAt(i);
            if ((c >= '0' && c <= '9') || c === '-' || c === '$') {
                resultLength += 9;
            } else if (CodaBarWriter.arrayContains(CodaBarWriter.CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED, c)) {
                resultLength += 10;
            } else {
                throw new IllegalArgumentException('Cannot encode : \'' + c + '\'');
            }
        }
        // A blank is placed between each character.
        resultLength += contents.length - 1;

        const result = new Array<boolean>(resultLength).fill(false);
        let position = 0;
        for (let index = 0; index < contents.length; index++) {
            let c = contents.charAt(index).toUpperCase();
            if (index === 0 || index === contents.length - 1) {
                // The start/end chars are not in the CodaBar ALPHABET.
                switch (c) {
                    case 'T':
                        c = 'A';
                        break;
                    case 'N':
                        c = 'B';
                        break;
                    case '*':
                        c = 'C';
                        break;
                    case 'E':
                        c = 'D';
                        break;
                }
            }
            let code: int = 0;
            for (let i = 0; i < CodaBarWriter.ALPHABET.length; i++) {
                // Found any, because I checked above.
                if (c === CodaBarWriter.ALPHABET[i]) {
                    code = CodaBarWriter.CHARACTER_ENCODINGS[i];
                    break;
                }
            }
            let color = true;
            let counter = 0;
            let bit = 0;
            while (bit < 7) { // A character consists of 7 digit.
                result[position] = color;
                position++;
                if (((code >> (6 - bit)) & 1) === 0 || counter === 1) {
                    color = !color; // Flip the color.
                    bit++;
                    counter = 0;
                } else {
                    counter++;
                }
            }
            if (index < contents.length - 1) {
                result[position] = false;
                position++;
            }
        }
        return result;
    }

}
