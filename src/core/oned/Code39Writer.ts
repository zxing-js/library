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
import Code39Reader from './Code39Reader';
import OneDimensionalCodeWriter from './OneDimensionalCodeWriter';

import { int } from '../../customTypings';

/**
 * This object renders a CODE39 code as a {@link BitMatrix}.
 *
 * @author erik.barbara@gmail.com (Erik Barbara)
 */
export default class Code39Writer extends OneDimensionalCodeWriter {

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.CODE_39];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {
        let length = contents.length;
        if (length > 80) {
            throw new IllegalArgumentException(
                'Requested contents should be less than 80 digits long, but got ' + length
            );
        }

        for (let i = 0; i < length; i++) {
            const indexInString = Code39Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
            if (indexInString < 0) {
                contents = Code39Writer.tryToConvertToExtendedMode(contents);
                length = contents.length;
                if (length > 80) {
                    throw new IllegalArgumentException(
                        'Requested contents should be less than 80 digits long, but got ' +
                        length + ' (extended full ASCII mode)'
                    );
                }
                break;
            }
        }

        const widths = new Int32Array(9);
        const codeWidth = 24 + 1 + (13 * length);
        const result = new Array<boolean>(codeWidth).fill(false);
        Code39Writer.toIntArray(Code39Reader.ASTERISK_ENCODING, widths);
        let pos: int = Code39Writer.appendPattern(result, 0, widths, true);
        const narrowWhite = Int32Array.from([1]);
        pos += Code39Writer.appendPattern(result, pos, narrowWhite, false);
        // append next character to byte matrix
        for (let i = 0; i < length; i++) {
            const indexInString = Code39Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
            Code39Writer.toIntArray(Code39Reader.CHARACTER_ENCODINGS[indexInString], widths);
            pos += Code39Writer.appendPattern(result, pos, widths, true);
            pos += Code39Writer.appendPattern(result, pos, narrowWhite, false);
        }
        Code39Writer.toIntArray(Code39Reader.ASTERISK_ENCODING, widths);
        Code39Writer.appendPattern(result, pos, widths, true);
        return result;
    }

    private static toIntArray(a: int, toReturn: Int32Array): void {
        for (let i = 0; i < 9; i++) {
            const temp = a & (1 << (8 - i));
            toReturn[i] = temp === 0 ? 1 : 2;
        }
    }

    private static tryToConvertToExtendedMode(contents: string): string {
        const length = contents.length;
        const extendedContent = new StringBuilder();
        for (let i = 0; i < length; i++) {
            const character = contents.charAt(i);
            const code = contents.charCodeAt(i);
            switch (character) {
                case '\u0000':
                    extendedContent.append('%U');
                    break;
                case ' ':
                case '-':
                case '.':
                    extendedContent.append(character);
                    break;
                case '@':
                    extendedContent.append('%V');
                    break;
                case '`':
                    extendedContent.append('%W');
                    break;
                default:
                    if (code <= 26) {
                        extendedContent.append('$');
                        extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + (code - 1)));
                    } else if (code < ' '.charCodeAt(0)) {
                        extendedContent.append('%');
                        extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + (code - 27)));
                    } else if (code <= ','.charCodeAt(0) || character === '/' || character === ':') {
                        extendedContent.append('/');
                        extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + (code - 33)));
                    } else if (code <= '9'.charCodeAt(0)) {
                        extendedContent.append(String.fromCharCode('0'.charCodeAt(0) + (code - 48)));
                    } else if (code <= '?'.charCodeAt(0)) {
                        extendedContent.append('%');
                        extendedContent.append(String.fromCharCode('F'.charCodeAt(0) + (code - 59)));
                    } else if (code <= 'Z'.charCodeAt(0)) {
                        extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + (code - 65)));
                    } else if (code <= '_'.charCodeAt(0)) {
                        extendedContent.append('%');
                        extendedContent.append(String.fromCharCode('K'.charCodeAt(0) + (code - 91)));
                    } else if (code <= 'z'.charCodeAt(0)) {
                        extendedContent.append('+');
                        extendedContent.append(String.fromCharCode('A'.charCodeAt(0) + (code - 97)));
                    } else if (code <= 127) {
                        extendedContent.append('%');
                        extendedContent.append(String.fromCharCode('P'.charCodeAt(0) + (code - 123)));
                    } else {
                        throw new IllegalArgumentException(
                            'Requested content contains a non-encodable character: \'' + character + '\''
                        );
                    }
                    break;
            }
        }

        return extendedContent.toString();
    }

}
