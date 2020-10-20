/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing.common;*/

import * as assert from 'assert';

import { StringUtils } from '@zxing/library';
import { CharacterSetECI } from '@zxing/library';

/*import java.nio.charset.ZXingCharset;*/

describe('StringUtils', () => {

    it('testShortShiftJIS_1', () => {
        // ÈáëÈ≠ö
        doTest(Uint8Array.from([/*(byte)*/ 0x8b, /*(byte)*/ 0xe0, /*(byte)*/ 0x8b, /*(byte)*/ 0x9b]), CharacterSetECI.SJIS.getName()/*"SJIS"*/);
    });

    it('testShortISO88591_1', () => {
        // b√•d
        doTest(Uint8Array.from([/*(byte)*/ 0x62, /*(byte)*/ 0xe5, /*(byte)*/ 0x64]), CharacterSetECI.ISO8859_1.getName()/*"ISO-8859-1"*/);
    });

    it('testMixedShiftJIS_1', () => {
        // Hello Èáë!
        doTest(Uint8Array.from([/*(byte)*/ 0x48, /*(byte)*/ 0x65, /*(byte)*/ 0x6c, /*(byte)*/ 0x6c, /*(byte)*/ 0x6f,
                        /*(byte)*/ 0x20, /*(byte)*/ 0x8b, /*(byte)*/ 0xe0, /*(byte)*/ 0x21]),
            'SJIS');
    });

    function doTest(bytes: Uint8Array, charsetName: string): void {
        // const charset: ZXingCharset = ZXingCharset.forName(charsetName);
        const guessedName: string = StringUtils.guessEncoding(bytes, null);
        // const guessedEncoding: ZXingCharset = ZXingCharset.forName(guessedName);
        // assert.strictEqual(guessedEncoding, charset)
        assert.strictEqual(guessedName, charsetName);
    }

    /**
     * Utility for printing out a string in given encoding as a Java statement, since it's better
     * to write that into the Java source file rather than risk character encoding issues in the
     * source file itself.
     *
     * @param args command line arguments
     */
    // funtion main(String[] args): void {
    //   const text: string = args[0]
    //   const charset: ZXingCharset = ZXingCharset.forName(args[1]);
    //   const declaration = new ZXingStringBuilder()
    //   declaration.append("Uint8Array.from([")
    //   for (byte b : text.getBytes(charset)) {
    //     declaration.append("/*(byte)*/ 0x")
    //     declaration.append(Integer.toHexString(b & 0xFF))
    //     declaration.append(", ")
    //   }
    //   declaration.append('}')
    //   System.out.println(declaration)
    // }

});
