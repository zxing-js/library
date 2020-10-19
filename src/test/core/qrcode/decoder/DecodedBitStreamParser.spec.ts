/*
 * Copyright 2008 ZXing authors
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

/*package com.google.zxing.qrcode.decoder;*/

import * as assert from 'assert';
import { QRCodeDecodedBitStreamParser } from '@zxing/library';
import BitSourceBuilder from '../../../core/common/BitSourceBuilder';
import { QRCodeVersion } from '@zxing/library';
import Random from '../../../core/util/Random';
import { TextDecoder } from '@zxing/text-encoding';
import { ZXingStringEncoding } from '@zxing/library';

ZXingStringEncoding.customDecoder = (b, e) => new TextDecoder(e).decode(b);

/**
 * Tests {@link QRCodeDecodedBitStreamParser}.
 *
 * @author Sean Owen
 */
describe('QRCodeDecodedBitStreamParser', () => {

    it('testSimpleByteMode', () => {/*throws Exception*/
        const builder = new BitSourceBuilder();
        builder.write(0x04, 4); // Byte mode
        builder.write(0x03, 8); // 3 bytes
        builder.write(0xF1, 8);
        builder.write(0xF2, 8);
        builder.write(0xF3, 8);
        const result: string = QRCodeDecodedBitStreamParser.decode(builder.toByteArray(),
            QRCodeVersion.getVersionForNumber(1), null, null).getText();
        assert.strictEqual(result, '\u00f1\u00f2\u00f3');
    });

    it('testSimpleSJIS', () => {/*throws Exception*/
        const builder = new BitSourceBuilder();
        builder.write(0x04, 4); // Byte mode
        builder.write(0x04, 8); // 4 bytes
        builder.write(0xA1, 8);
        builder.write(0xA2, 8);
        builder.write(0xA3, 8);
        builder.write(0xD0, 8);
        const result: string = QRCodeDecodedBitStreamParser.decode(builder.toByteArray(),
            QRCodeVersion.getVersionForNumber(1), null, null).getText();
        assert.strictEqual(result, '\uff61\uff62\uff63\uff90');
    });

    // TYPESCRIPTPORT: CP437 not supported by TextEncoding. TODO: search for an alternative
    // See here for a possibility: https://github.com/SheetJS/js-codepage
    it.skip('testECI', () => {/*throws Exception*/
      const builder = new BitSourceBuilder();
      builder.write(0x07, 4); // ECI mode
      builder.write(0x02, 8); // ECI 2 = CP437 encoding
      builder.write(0x04, 4); // Byte mode
      builder.write(0x03, 8); // 3 bytes
      builder.write(0xA1, 8);
      builder.write(0xA2, 8);
      builder.write(0xA3, 8);
      const byteArray = builder.toByteArray();
      const result: string = QRCodeDecodedBitStreamParser.decode(byteArray,
          QRCodeVersion.getVersionForNumber(1), null, null).getText();
      assert.strictEqual(result, '\u00ed\u00f3\u00fa');
    });

    const eciTestData = [
        // label, eciBits, byte1, byte2, byte3, expected
        ['ISO8859_1', 0x03, 0xA1, 0xA2, 0xA3, '\u00A1\u00A2\u00A3'],
        ['ISO8859_2', 0x04, 0xA1, 0xA2, 0xA3, '\u0104\u02D8\u0141'],
        ['ISO8859_3', 0x05, 0xA1, 0xA2, 0xA3, '\u0126\u02D8\u00A3'],
        ['ISO8859_4', 0x06, 0xA1, 0xA2, 0xA3, '\u0104\u0138\u0156'],
        ['ISO8859_5', 0x07, 0xA1, 0xA2, 0xA3, '\u0401\u0402\u0403'],
        ['ISO8859_6', 0x08, 0xE1, 0xE2, 0xE3, '\u0641\u0642\u0643'],
        ['ISO8859_7', 0x09, 0xA1, 0xA2, 0xA3, '\u2018\u2019\u00A3'],
        ['ISO8859_8', 0x0A, 0xE1, 0xE2, 0xE3, '\u05D1\u05D2\u05D3'],
        ['ISO8859_9', 0x0B, 0xD0, 0xDD, 0xDE, '\u011E\u0130\u015E'],
        ['ISO8859_10', 0x0C, 0xA1, 0xA2, 0xA3, '\u0104\u0112\u0122'],
        ['ISO8859_11', 0x0D, 0xA1, 0xA2, 0xA3, '\u0E01\u0E02\u0E03'],
        ['ISO8859_13', 0x0F, 0xD1, 0xD2, 0xD3, '\u0143\u0145\u00D3'],
        ['ISO8859_14', 0x10, 0xA1, 0xA2, 0xA3, '\u1E02\u1E03\u00A3'],
        ['ISO8859_15', 0x11, 0xBC, 0xBD, 0xBE, '\u0152\u0153\u0178'],
        ['ISO8859_16', 0x12, 0xA1, 0xA2, 0xA3, '\u0104\u0105\u0141'],
        ['windows-1250', 0x15, 0xA1, 0xA2, 0xA3, '\u02C7\u02D8\u0141'],
        ['windows-1251', 0x16, 0xA1, 0xA2, 0xA3, '\u040E\u045E\u0408'],
        ['windows-1252', 0x17, 0x91, 0x92, 0x93, '\u2018\u2019\u201C'],
        ['windows-1256', 0x18, 0xE1, 0xE2, 0xE3, '\u0644\u00E2\u0645'],
    ];

    describe('testECIISOEach', () => {
        for (const d of eciTestData) {
            it('testECIISOEach ' + <string>d[0], () => {
                testEciOneEncoding(<string>d[0], <number>d[1], <number>d[2], <number>d[3], <number>d[4], <string>d[5]);
            });
        }
    });

    function testEciOneEncoding(encodingLabel: string, eciBits: number, b1: number, b2: number, b3: number, expected: string) {
        const builder = new BitSourceBuilder();
        builder.write(0x07, 4); // ECI mode
        builder.write(eciBits, 8); // ECI bits
        builder.write(0x04, 4); // Byte mode
        builder.write(0x03, 8); // 3 bytes
        builder.write(b1, 8);
        builder.write(b2, 8);
        builder.write(b3, 8);
        const byteArray = builder.toByteArray();
        const result: string = QRCodeDecodedBitStreamParser.decode(byteArray,
            QRCodeVersion.getVersionForNumber(1), null, null).getText();
        assert.strictEqual(result, expected, encodingLabel);
    }

    describe('testECIISOCombine', () => {
        const r = new Random('ECIISO');
        for (let i = 0; i !== 10; i++) {
            let id1 = r.next(eciTestData.length);
            let id2 = r.next(eciTestData.length);
            let d1 = eciTestData[id1];
            let d2 = eciTestData[id2];
            it('testECIISOCombine ' + <string>d1[0] + ' & ' + <string>d2[0], () => {
                testEciComboned(
                    <string>d1[0], <number>d1[1], <number>d1[2], <number>d1[3], <number>d1[4], <string>d1[5],
                    <string>d2[0], <number>d2[1], <number>d2[2], <number>d2[3], <number>d2[4], <string>d2[5]);
            });
        }
    });

    function testEciComboned(
        encodingLabel1: string, eciBits1: number, b1: number, b2: number, b3: number, expected1: string,
        encodingLabel2: string, eciBits2: number, b4: number, b5: number, b6: number, expected2: string) {
        const builder = new BitSourceBuilder();
        builder.write(0x07, 4); // ECI mode
        builder.write(eciBits1, 8); // ECI bits
        builder.write(0x04, 4); // Byte mode
        builder.write(0x03, 8); // 3 bytes
        builder.write(b1, 8);
        builder.write(b2, 8);
        builder.write(b3, 8);
        builder.write(0x07, 4); // ECI mode
        builder.write(eciBits2, 8); // ECI bits
        builder.write(0x04, 4); // Byte mode
        builder.write(0x03, 8); // 3 bytes
        builder.write(b4, 8);
        builder.write(b5, 8);
        builder.write(b6, 8);
        const byteArray = builder.toByteArray();
        const result: string = QRCodeDecodedBitStreamParser.decode(byteArray,
            QRCodeVersion.getVersionForNumber(1), null, null).getText();
        assert.strictEqual(result, expected1 + expected2, encodingLabel1 + ' & ' + encodingLabel2);
    }

    it('testHanzi', () => {/*throws Exception*/
        const builder = new BitSourceBuilder();
        builder.write(0x0D, 4); // Hanzi mode
        builder.write(0x01, 4); // Subset 1 = GB2312 encoding
        builder.write(0x01, 8); // 1 characters
        builder.write(0x03C1, 13);
        const result: string = QRCodeDecodedBitStreamParser.decode(builder.toByteArray(),
            QRCodeVersion.getVersionForNumber(1), null, null).getText();
        assert.strictEqual(result, '\u963f');
    });

    // TODO definitely need more tests here

});
