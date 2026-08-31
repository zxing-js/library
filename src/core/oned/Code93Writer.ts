/*
 * Copyright 2010 ZXing authors
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
import StringBuilder from '../util/StringBuilder';
import Code93Reader from './Code93Reader';
import OneDimensionalCodeWriter from './OneDimensionalCodeWriter';

import { int } from '../../customTypings';

/**
 * This object renders a CODE93 code as a BitMatrix.
 */
export default class Code93Writer extends OneDimensionalCodeWriter {

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.CODE_93];
    }

    /**
     * @param contents barcode contents to encode. It should not be encoded for extended characters.
     * @return a `boolean[]` of horizontal pixels (false = white, true = black)
     */
    // @Override
    public encodeContents(contents: string): boolean[] {
        contents = Code93Writer.convertToExtended(contents);
        const length = contents.length;
        if (length > 80) {
            throw new IllegalArgumentException(
                'Requested contents should be less than 80 digits long after ' +
                'converting to extended encoding, but got ' + length
            );
        }

        // length of code + 2 start/stop characters + 2 checksums, each of 9 bits, plus a termination bar
        const codeWidth = (contents.length + 2 + 2) * 9 + 1;

        const result = new Array<boolean>(codeWidth).fill(false);

        // start character (*)
        let pos: int = Code93Writer.appendPattern9Bit(result, 0, Code93Reader.ASTERISK_ENCODING);

        for (let i = 0; i < length; i++) {
            const indexInString = Code93Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
            pos += Code93Writer.appendPattern9Bit(result, pos, Code93Reader.CHARACTER_ENCODINGS[indexInString]);
        }

        // add two checksums
        const check1 = Code93Writer.computeChecksumIndex(contents, 20);
        pos += Code93Writer.appendPattern9Bit(result, pos, Code93Reader.CHARACTER_ENCODINGS[check1]);

        // append the contents to reflect the first checksum added
        contents += Code93Reader.ALPHABET_STRING.charAt(check1);

        const check2 = Code93Writer.computeChecksumIndex(contents, 15);
        pos += Code93Writer.appendPattern9Bit(result, pos, Code93Reader.CHARACTER_ENCODINGS[check2]);

        // end character (*)
        pos += Code93Writer.appendPattern9Bit(result, pos, Code93Reader.ASTERISK_ENCODING);

        // termination bar (single black bar)
        result[pos] = true;

        return result;
    }

    /**
     * Code93 packs each character into 9 bits of a single int rather than a run-length pattern, so
     * it does not use the inherited {@link OneDimensionalCodeWriter.appendPattern}.
     *
     * (Java: `private static int appendPattern(boolean[] target, int pos, int a)`)
     *
     * @return 9
     */
    private static appendPattern9Bit(target: boolean[], pos: int, a: int): int {
        for (let i = 0; i < 9; i++) {
            const temp = a & (1 << (8 - i));
            target[pos + i] = temp !== 0;
        }
        return 9;
    }

    private static computeChecksumIndex(contents: string, maxWeight: int): int {
        let weight = 1;
        let total = 0;

        for (let i = contents.length - 1; i >= 0; i--) {
            const indexInString = Code93Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
            total += indexInString * weight;
            if (++weight > maxWeight) {
                weight = 1;
            }
        }
        return total % 47;
    }

    static convertToExtended(contents: string): string {
        const length = contents.length;
        const extendedContent = new StringBuilder();
        for (let i = 0; i < length; i++) {
            const character = contents.charCodeAt(i);
            // ($)=a, (%)=b, (/)=c, (+)=d. see Code93Reader.ALPHABET_STRING
            if (character === 0) {
                // NUL: (%)U
                extendedContent.append('bU');
            } else if (character <= 26) {
                // SOH - SUB: ($)A - ($)Z
                extendedContent.append('a');
                extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + character - 1));
            } else if (character <= 31) {
                // ESC - US: (%)A - (%)E
                extendedContent.append('b');
                extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + character - 27));
            } else if (character === ' '.charCodeAt(0) || character === '$'.charCodeAt(0) ||
                       character === '%'.charCodeAt(0) || character === '+'.charCodeAt(0)) {
                // space $ % +
                extendedContent.append(String.fromCharCode(character));
            } else if (character <= ','.charCodeAt(0)) {
                // ! " # & ' ( ) * ,: (/)A - (/)L
                extendedContent.append('c');
                extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + character - '!'.charCodeAt(0)));
            } else if (character <= '9'.charCodeAt(0)) {
                extendedContent.append(String.fromCharCode(character));
            } else if (character === ':'.charCodeAt(0)) {
                // :: (/)Z
                extendedContent.append('cZ');
            } else if (character <= '?'.charCodeAt(0)) {
                // ; - ?: (%)F - (%)J
                extendedContent.append('b');
                extendedContent.append(String.fromCharCode('F'.charCodeAt(0) + character - ';'.charCodeAt(0)));
            } else if (character === '@'.charCodeAt(0)) {
                // @: (%)V
                extendedContent.append('bV');
            } else if (character <= 'Z'.charCodeAt(0)) {
                // A - Z
                extendedContent.append(String.fromCharCode(character));
            } else if (character <= '_'.charCodeAt(0)) {
                // [ - _: (%)K - (%)O
                extendedContent.append('b');
                extendedContent.append(String.fromCharCode('K'.charCodeAt(0) + character - '['.charCodeAt(0)));
            } else if (character === '`'.charCodeAt(0)) {
                // `: (%)W
                extendedContent.append('bW');
            } else if (character <= 'z'.charCodeAt(0)) {
                // a - z: (*)A - (*)Z
                extendedContent.append('d');
                extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + character - 'a'.charCodeAt(0)));
            } else if (character <= 127) {
                // { - DEL: (%)P - (%)T
                extendedContent.append('b');
                extendedContent.append(String.fromCharCode('P'.charCodeAt(0) + character - '{'.charCodeAt(0)));
            } else {
                throw new IllegalArgumentException(
                    'Requested content contains a non-encodable character: \'' + contents.charAt(i) + '\''
                );
            }
        }
        return extendedContent.toString();
    }

}
