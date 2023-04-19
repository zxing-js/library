/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, QRCodeVersion 2.0 (the "License")
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

/*package com.google.zxing.qrcode.encoder;*/

import * as assert from 'assert';
import { BitArray } from '@zxing/library';
import { QRCodeByteMatrix } from '@zxing/library';
import { QRCodeMatrixUtil } from '@zxing/library';
import { QRCodeDecoderErrorCorrectionLevel } from '@zxing/library';
import { QRCodeVersion } from '@zxing/library';

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author mysen@google.com (Chris Mysen) - ported from C++
 */
describe('QRCodeMatrixUtil', () => {

    it('testToString', () => {
        const array = new QRCodeByteMatrix(3, 3);
        array.setNumber(0, 0, 0);
        array.setNumber(1, 0, 1);
        array.setNumber(2, 0, 0);
        array.setNumber(0, 1, 1);
        array.setNumber(1, 1, 0);
        array.setNumber(2, 1, 1);
        array.setNumber(0, 2, -1);
        array.setNumber(1, 2, -1);
        array.setNumber(2, 2, -1);
        const expected: string = ' 0 1 0\n' + ' 1 0 1\n' + '      \n';
        assert.strictEqual(array.toString(), expected);
    });

    it('testClearMatrix', () => {
        const matrix = new QRCodeByteMatrix(2, 2);
        QRCodeMatrixUtil.clearMatrix(matrix);
        // TYPESCRIPTPORT: we use UintArray se changed here from -1 to 255
        assert.strictEqual(matrix.get(0, 0), 255);
        assert.strictEqual(matrix.get(1, 0), 255);
        assert.strictEqual(matrix.get(0, 1), 255);
        assert.strictEqual(matrix.get(1, 1), 255);
    });

    it('testEmbedBasicPatterns1', () => {
        // QRCodeVersion 1.
        const matrix = new QRCodeByteMatrix(21, 21);
        QRCodeMatrixUtil.clearMatrix(matrix);
        QRCodeMatrixUtil.embedBasicPatterns(QRCodeVersion.getVersionForNumber(1), matrix);
        const expected: string =
            ' 1 1 1 1 1 1 1 0           0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0           0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0           0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0           0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0           0 0 0 0 0 0 0 0\n' +
            '             1                            \n' +
            '             0                            \n' +
            '             1                            \n' +
            '             0                            \n' +
            '             1                            \n' +
            ' 0 0 0 0 0 0 0 0 1                        \n' +
            ' 1 1 1 1 1 1 1 0                          \n' +
            ' 1 0 0 0 0 0 1 0                          \n' +
            ' 1 0 1 1 1 0 1 0                          \n' +
            ' 1 0 1 1 1 0 1 0                          \n' +
            ' 1 0 1 1 1 0 1 0                          \n' +
            ' 1 0 0 0 0 0 1 0                          \n' +
            ' 1 1 1 1 1 1 1 0                          \n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testEmbedBasicPatterns2', () => {
        // QRCodeVersion 2.  Position adjustment pattern should apppear at right
        // bottom corner.
        const matrix = new QRCodeByteMatrix(25, 25);
        QRCodeMatrixUtil.clearMatrix(matrix);
        QRCodeMatrixUtil.embedBasicPatterns(QRCodeVersion.getVersionForNumber(2), matrix);
        const expected: string =
            ' 1 1 1 1 1 1 1 0                   0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0                   0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0                   0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0                   0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0                   0 0 0 0 0 0 0 0\n' +
            '             1                                    \n' +
            '             0                                    \n' +
            '             1                                    \n' +
            '             0                                    \n' +
            '             1                                    \n' +
            '             0                                    \n' +
            '             1                                    \n' +
            '             0                                    \n' +
            '             1                   1 1 1 1 1        \n' +
            ' 0 0 0 0 0 0 0 0 1               1 0 0 0 1        \n' +
            ' 1 1 1 1 1 1 1 0                 1 0 1 0 1        \n' +
            ' 1 0 0 0 0 0 1 0                 1 0 0 0 1        \n' +
            ' 1 0 1 1 1 0 1 0                 1 1 1 1 1        \n' +
            ' 1 0 1 1 1 0 1 0                                  \n' +
            ' 1 0 1 1 1 0 1 0                                  \n' +
            ' 1 0 0 0 0 0 1 0                                  \n' +
            ' 1 1 1 1 1 1 1 0                                  \n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testEmbedTypeInfo', () => {
        // Type info bits = 100000011001110.
        const matrix = new QRCodeByteMatrix(21, 21);
        QRCodeMatrixUtil.clearMatrix(matrix);
        QRCodeMatrixUtil.embedTypeInfo(QRCodeDecoderErrorCorrectionLevel.M, 5, matrix);
        const expected: string =
            '                 0                        \n' +
            '                 1                        \n' +
            '                 1                        \n' +
            '                 1                        \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                                          \n' +
            '                 1                        \n' +
            ' 1 0 0 0 0 0   0 1         1 1 0 0 1 1 1 0\n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                 0                        \n' +
            '                 1                        \n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testEmbedVersionInfo', () => {
        // QRCodeVersion info bits = 000111 110010 010100
        // Actually, version 7 QR Code has 45x45 matrix but we use 21x21 here
        // since 45x45 matrix is too big to depict.
        const matrix = new QRCodeByteMatrix(21, 21);
        QRCodeMatrixUtil.clearMatrix(matrix);
        QRCodeMatrixUtil.maybeEmbedVersionInfo(QRCodeVersion.getVersionForNumber(7), matrix);
        const expected: string =
            '                     0 0 1                \n' +
            '                     0 1 0                \n' +
            '                     0 1 0                \n' +
            '                     0 1 1                \n' +
            '                     1 1 1                \n' +
            '                     0 0 0                \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            ' 0 0 0 0 1 0                              \n' +
            ' 0 1 1 1 1 0                              \n' +
            ' 1 0 0 1 1 0                              \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n' +
            '                                          \n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testEmbedDataBits', () => {
        // Cells other than basic patterns should be filled with zero.
        const matrix = new QRCodeByteMatrix(21, 21);
        QRCodeMatrixUtil.clearMatrix(matrix);
        QRCodeMatrixUtil.embedBasicPatterns(QRCodeVersion.getVersionForNumber(1), matrix);
        const bits = new BitArray();
        QRCodeMatrixUtil.embedDataBits(bits, 255, matrix);
        const expected: string =
            ' 1 1 1 1 1 1 1 0 0 0 0 0 0 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testBuildMatrix', () => {
        // From http://www.swetake.com/qr/qr7.html
        const bytes = Uint16Array.from([32, 65, 205, 69, 41, 220, 46, 128, 236,
            42, 159, 74, 221, 244, 169, 239, 150, 138,
            70, 237, 85, 224, 96, 74, 219, 61]);
        const bits = new BitArray();
        for (let i = 0, length = bytes.length; i !== length; i++) {
            const c = bytes[i];
            bits.appendBits(c, 8);
        }
        const matrix = new QRCodeByteMatrix(21, 21);
        QRCodeMatrixUtil.buildMatrix(bits,
            QRCodeDecoderErrorCorrectionLevel.H,
            QRCodeVersion.getVersionForNumber(1),  // QRCodeVersion 1
            3,  // Mask pattern 3
            matrix);
        const expected: string =
            ' 1 1 1 1 1 1 1 0 0 1 1 0 0 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 1 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 1 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 1 0 0 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 1 1 1 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 1 1 0 1 1 0 0 0 0 0 0 0 0\n' +
            ' 0 0 1 1 0 0 1 1 1 0 0 1 1 1 1 0 1 0 0 0 0\n' +
            ' 1 0 1 0 1 0 0 0 0 0 1 1 1 0 0 1 0 1 1 1 0\n' +
            ' 1 1 1 1 0 1 1 0 1 0 1 1 1 0 0 1 1 1 0 1 0\n' +
            ' 1 0 1 0 1 1 0 1 1 1 0 0 1 1 1 0 0 1 0 1 0\n' +
            ' 0 0 1 0 0 1 1 1 0 0 0 0 0 0 1 0 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 1 1 0 1 0 0 0 0 0 1 0 1 1\n' +
            ' 1 1 1 1 1 1 1 0 1 1 1 1 0 0 0 0 1 0 1 1 0\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 1 0 1 1 1 0 0 0 0 0\n' +
            ' 1 0 1 1 1 0 1 0 0 1 0 0 1 1 0 0 1 0 0 1 1\n' +
            ' 1 0 1 1 1 0 1 0 1 1 0 1 0 0 0 0 0 1 1 1 0\n' +
            ' 1 0 1 1 1 0 1 0 1 1 1 1 0 0 0 0 1 1 1 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 0\n' +
            ' 1 1 1 1 1 1 1 0 0 0 1 1 1 1 1 0 1 0 0 1 0\n';
        assert.strictEqual(matrix.toString(), expected);
    });

    it('testFindMSBSet', () => {
        assert.strictEqual(QRCodeMatrixUtil.findMSBSet(0), 0);
        assert.strictEqual(QRCodeMatrixUtil.findMSBSet(1), 1);
        assert.strictEqual(QRCodeMatrixUtil.findMSBSet(0x80), 8);
        assert.strictEqual(QRCodeMatrixUtil.findMSBSet(0x80000000), 32);
    });

    it('testCalculateBCHCode', () => {
        // Encoding of type information.
        // From Appendix C in JISX0510:2004 (p 65)
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(5, 0x537), 0xdc);
        // From http://www.swetake.com/qr/qr6.html
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(0x13, 0x537), 0x1c2);
        // From http://www.swetake.com/qr/qr11.html
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(0x1b, 0x537), 0x214);

        // Encoding of version information.
        // From Appendix D in JISX0510:2004 (p 68)
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(7, 0x1f25), 0xc94);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(8, 0x1f25), 0x5bc);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(9, 0x1f25), 0xa99);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(10, 0x1f25), 0x4d3);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(20, 0x1f25), 0x9a6);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(30, 0x1f25), 0xd75);
        assert.strictEqual(QRCodeMatrixUtil.calculateBCHCode(40, 0x1f25), 0xc69);
    });

    // We don't test a lot of cases in this function since we've already
    // tested them in TEST(calculateBCHCode).
    it('testMakeVersionInfoBits', () => {
        // From Appendix D in JISX0510:2004 (p 68)
        const bits = new BitArray();
        QRCodeMatrixUtil.makeVersionInfoBits(QRCodeVersion.getVersionForNumber(7), bits);
        assert.strictEqual(bits.toString(), ' ...XXXXX ..X..X.X ..');
    });

    // We don't test a lot of cases in this function since we've already
    // tested them in TEST(calculateBCHCode).
    it('testMakeTypeInfoInfoBits', () => {
        // From Appendix C in JISX0510:2004 (p 65)
        const bits = new BitArray();
        QRCodeMatrixUtil.makeTypeInfoBits(QRCodeDecoderErrorCorrectionLevel.M, 5, bits);
        assert.strictEqual(bits.toString(), ' X......X X..XXX.');
    });

});
