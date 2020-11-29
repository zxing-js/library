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

/*package com.google.zxing.qrcode.encoder;*/

import * as assert from 'assert';

import { QRCodeEncoder } from '@zxing/library';
import { EncodeHintType } from '@zxing/library';
import { CharacterSetECI } from '@zxing/library';
import { BitArray } from '@zxing/library';
import { QRCodeDecoderErrorCorrectionLevel } from '@zxing/library';
import { QRCodeMode } from '@zxing/library';
import { QRCodeVersion } from '@zxing/library';
import { QRCodeEncoderQRCode } from '@zxing/library';
import { ZXingStringBuilder } from '@zxing/library';
import { ZXingStringEncoding } from '@zxing/library';
import { WriterException } from '@zxing/library';
import { createCustomEncoder, createCustomDecoder } from '../../util/textEncodingFactory';

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author mysen@google.com (Chris Mysen) - ported from C++
 */
describe('QRCodeEncoder', () => {

    it('testGetAlphanumericCode', () => {
        // The first ten code points are numbers.
        for (let i: number /*int*/ = 0; i < 10; ++i) {
            assert.strictEqual(QRCodeEncoder.getAlphanumericCode('0'.charCodeAt(0) + i), i);
        }

        // The next 26 code points are capital alphabet letters.
        for (let i: number /*int*/ = 10; i < 36; ++i) {
            assert.strictEqual(QRCodeEncoder.getAlphanumericCode('A'.charCodeAt(0) + i - 10), i);
        }

        // Others are symbol letters
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode(' '.charCodeAt(0)), 36);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('$'.charCodeAt(0)), 37);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('%'.charCodeAt(0)), 38);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('*'.charCodeAt(0)), 39);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('+'.charCodeAt(0)), 40);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('-'.charCodeAt(0)), 41);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('.'.charCodeAt(0)), 42);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('/'.charCodeAt(0)), 43);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode(':'.charCodeAt(0)), 44);

        // Should return -1 for other letters;
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('a'.charCodeAt(0)), -1);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('#'.charCodeAt(0)), -1);
        assert.strictEqual(QRCodeEncoder.getAlphanumericCode('\0'.charCodeAt(0)), -1);
    });

    it('testChooseMode', () => {

        ZXingStringEncoding.customDecoder = (b, e) => createCustomDecoder(e).decode(b);

        // Numeric mode.
        assert.strictEqual(QRCodeMode.NUMERIC.equals(QRCodeEncoder.chooseMode('0')), true);
        assert.strictEqual(QRCodeMode.NUMERIC.equals(QRCodeEncoder.chooseMode('0123456789')), true);
        // Alphanumeric mode.
        assert.strictEqual(QRCodeMode.ALPHANUMERIC.equals(QRCodeEncoder.chooseMode('A')), true);
        assert.strictEqual(QRCodeMode.ALPHANUMERIC.equals(QRCodeEncoder.chooseMode('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:')), true);
        // 8-bit byte mode.
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode('a')), true);
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode('#')), true);
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode('')), true);
        // Kanji mode.  We used to use MODE_KANJI for these, but we stopped
        // doing that as we cannot distinguish Shift_JIS from other encodings
        // from data bytes alone.  See also comments in qrcode_encoder.h.

        // AIUE in Hiragana in Shift_JIS
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode(shiftJISString(Uint8Array.from([0x8, 0xa, 0x8, 0xa, 0x8, 0xa, 0x8, 0xa6])))), true);

        // Nihon in Kanji in Shift_JIS.
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode(shiftJISString(Uint8Array.from([0x9, 0xf, 0x9, 0x7b])))), true);

        // Sou-Utsu-Byou in Kanji in Shift_JIS.
        assert.strictEqual(QRCodeMode.BYTE.equals(QRCodeEncoder.chooseMode(shiftJISString(Uint8Array.from([0xe, 0x4, 0x9, 0x5, 0x9, 0x61])))), true);

        ZXingStringEncoding.customDecoder = undefined;
    });

    it('testEncode', () => {
        const qrCode: QRCodeEncoderQRCode = QRCodeEncoder.encode('ABCDEF', QRCodeDecoderErrorCorrectionLevel.H);
        const expected: string =
            '<<\n' +
            ' mode: ALPHANUMERIC\n' +
            ' ecLevel: H\n' +
            ' version: 1\n' +
            ' maskPattern: 4\n' +
            ' matrix:\n' +
            ' 1 1 1 1 1 1 1 0 0 1 0 1 0 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 1 0 1 0 1 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 0 0 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 0 1 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 1 0 0 1 1 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 0 1 1 1 1 0 1 1 0 1 0 1 1 0 0 0 1 0\n' +
            ' 0 0 0 0 1 1 0 1 1 1 0 0 1 1 1 1 0 1 1 0 1\n' +
            ' 1 0 0 0 0 1 1 0 0 1 0 1 0 0 0 1 1 1 0 1 1\n' +
            ' 1 0 0 1 1 1 0 0 1 1 1 1 0 0 0 0 1 0 0 0 0\n' +
            ' 0 1 1 1 1 1 1 0 1 0 1 0 1 1 1 0 0 1 1 0 0\n' +
            ' 0 0 0 0 0 0 0 0 1 1 0 0 0 1 1 0 0 0 1 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 1 1 1 0 0 0 0 0 1 1 0 0\n' +
            ' 1 0 0 0 0 0 1 0 1 1 0 1 0 0 0 1 0 1 1 1 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 1 0 0 0 1 1 0 0 1 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 1 1 0 1 0 0 0 0 1 1 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 0 1 0 0 0 1 1 0 0 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 1 0 0 1 0 0 1 1 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 0 0 1 0 0 1 0 0 0 0 1 1 1\n' +
            '>>\n';
        assert.strictEqual(qrCode.toString(), expected);
    });

    it('testEncodeWithVersion', () => {
        const hints = new Map<EncodeHintType, any>(); // EncodeHintType.class)
        hints.set(EncodeHintType.QR_VERSION, 7);
        const qrCode: QRCodeEncoderQRCode = QRCodeEncoder.encode('ABCDEF', QRCodeDecoderErrorCorrectionLevel.H, hints);
        assert.strictEqual(qrCode.toString().indexOf(' version: 7\n') !== -1, true);
    });

    // @Test(expected = WriterException.class)
    it('testEncodeWithVersionTooSmall', () => {
        assert.throws(
            () => {
                const hints = new Map<EncodeHintType, any>(); // EncodeHintType.class)
                hints.set(EncodeHintType.QR_VERSION, 3);
                QRCodeEncoder.encode('THISMESSAGEISTOOLONGFORAQRCODEVERSION3', QRCodeDecoderErrorCorrectionLevel.H, hints);
            },
            WriterException,
            'unexpected exception thrown'
        );
    });

    it('testSimpleUTF8ECI', () => {
        const hints = new Map<EncodeHintType, any>(); // EncodeHintType.class)
        hints.set(EncodeHintType.CHARACTER_SET, 'UTF8');
        const qrCode: QRCodeEncoderQRCode = QRCodeEncoder.encode('hello', QRCodeDecoderErrorCorrectionLevel.H, hints);
        const expected: string =
            '<<\n' +
            ' mode: BYTE\n' +
            ' ecLevel: H\n' +
            ' version: 1\n' +
            ' maskPattern: 6\n' +
            ' matrix:\n' +
            ' 1 1 1 1 1 1 1 0 0 0 1 1 0 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 1 1 0 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 1 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 0 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 1 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0 0 0 0\n' +
            ' 0 0 0 1 1 0 1 1 0 0 0 0 1 0 0 0 0 1 1 0 0\n' +
            ' 0 0 0 0 0 0 0 0 1 1 0 1 0 0 1 0 1 1 1 1 1\n' +
            ' 1 1 0 0 0 1 1 1 0 0 0 1 1 0 0 1 0 1 0 1 1\n' +
            ' 0 0 0 0 1 1 0 0 1 0 0 0 0 0 1 0 1 1 0 0 0\n' +
            ' 0 1 1 0 0 1 1 0 0 1 1 1 0 1 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 1 1 1 0 1 1 1 1 1 1 1 1 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 0 0 1 0 0 0 0 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 1 0 0 0 1 0 0 0 1 1 0 0\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 0 1 0 1 0 0 0 1 0 0\n' +
            ' 1 0 1 1 1 0 1 0 1 1 1 1 0 1 0 0 1 0 1 1 0\n' +
            ' 1 0 1 1 1 0 1 0 0 1 1 1 0 0 1 0 0 1 0 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 0 0 1 1 0 1 1 0 0 0\n' +
            ' 1 1 1 1 1 1 1 0 0 0 0 1 0 1 0 0 1 0 1 0 0\n' +
            '>>\n';
        assert.strictEqual(qrCode.toString(), expected);
    });

    it('testEncodeKanjiMode', () => {

        ZXingStringEncoding.customEncoder = (b, e) => createCustomEncoder(e).encode(b);

        const hints = new Map<EncodeHintType, any>(); // EncodeHintType.class)
        hints.set(EncodeHintType.CHARACTER_SET, CharacterSetECI.SJIS.getName());
        // Nihon in Kanji
        const qrCode: QRCodeEncoderQRCode = QRCodeEncoder.encode('\u65e5\u672c', QRCodeDecoderErrorCorrectionLevel.M, hints);
        const expected: string =
            '<<\n' +
            ' mode: KANJI\n' +
            ' ecLevel: M\n' +
            ' version: 1\n' +
            ' maskPattern: 0\n' +
            ' matrix:\n' +
            ' 1 1 1 1 1 1 1 0 0 1 0 1 0 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 1 1 0 0 0 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 1 1 1 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 0 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 1 1 1 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 0 1 1 1 0 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0\n' +
            ' 1 0 1 0 1 0 1 0 0 0 1 0 1 0 0 0 1 0 0 1 0\n' +
            ' 1 1 0 1 0 0 0 1 0 1 1 1 0 1 0 1 0 1 0 0 0\n' +
            ' 0 1 0 0 0 0 1 1 1 1 1 1 0 1 1 1 0 1 0 1 0\n' +
            ' 1 1 1 0 0 1 0 1 0 0 0 1 1 1 0 1 1 0 1 0 0\n' +
            ' 0 1 1 0 0 1 1 0 1 1 0 1 0 1 1 1 0 1 0 0 1\n' +
            ' 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1 0 0 0 1 0 1\n' +
            ' 1 1 1 1 1 1 1 0 0 0 0 0 1 0 0 0 1 0 0 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0 0 0 1 1 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 0 1 0 1 0 1 0 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 0 0 0 1 0 1 0 1 0 1 0 1 0\n' +
            ' 1 0 1 1 1 0 1 0 1 0 1 1 0 1 1 1 0 0 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 0 0 0 1 1 1 0 1 1 1 0 1 0\n' +
            ' 1 1 1 1 1 1 1 0 1 1 0 1 0 1 1 1 0 0 1 0 0\n' +
            '>>\n';
        assert.strictEqual(qrCode.toString(), expected);

        ZXingStringEncoding.customEncoder = undefined;
    });

    it('testEncodeShiftjisNumeric', () => {
        const hints = new Map<EncodeHintType, any>(); // EncodeHintType.class)
        hints.set(EncodeHintType.CHARACTER_SET, CharacterSetECI.SJIS.getName());
        const qrCode: QRCodeEncoderQRCode = QRCodeEncoder.encode('0123', QRCodeDecoderErrorCorrectionLevel.M, hints);
        const expected: string =
            '<<\n' +
            ' mode: NUMERIC\n' +
            ' ecLevel: M\n' +
            ' version: 1\n' +
            ' maskPattern: 2\n' +
            ' matrix:\n' +
            ' 1 1 1 1 1 1 1 0 0 1 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 1 0 0 0 0 0 1 0 0 1 0 0 1 0 1 0 0 0 0 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 0 0 0 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 0 1 1 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 1 1 1 0 1 0 1 1 0 1 1 0 1 0 1 1 1 0 1\n' +
            ' 1 0 0 0 0 0 1 0 1 1 0 0 1 0 1 0 0 0 0 0 1\n' +
            ' 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 1 1 1\n' +
            ' 0 0 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0 0 0 0\n' +
            ' 1 0 1 1 1 1 1 0 0 1 1 0 1 0 1 1 1 1 1 0 0\n' +
            ' 1 1 0 0 0 1 0 0 1 0 1 0 1 0 0 1 0 0 1 0 0\n' +
            ' 0 1 1 0 1 1 1 1 0 1 1 1 0 1 0 0 1 1 0 1 1\n' +
            ' 1 0 1 1 0 1 0 1 0 0 1 0 0 0 0 1 1 0 1 0 0\n' +
            ' 0 0 1 0 0 1 1 1 0 0 0 1 0 1 0 0 1 0 1 0 0\n' +
            ' 0 0 0 0 0 0 0 0 1 1 0 1 1 1 1 0 0 1 0 0 0\n' +
            ' 1 1 1 1 1 1 1 0 0 0 1 0 1 0 1 1 0 0 0 0 0\n' +
            ' 1 0 0 0 0 0 1 0 1 1 0 1 1 1 1 0 0 1 0 1 0\n' +
            ' 1 0 1 1 1 0 1 0 1 0 1 0 1 0 0 1 0 0 1 0 0\n' +
            ' 1 0 1 1 1 0 1 0 1 1 1 0 1 0 0 1 0 0 1 0 0\n' +
            ' 1 0 1 1 1 0 1 0 1 1 0 1 0 1 0 0 1 1 1 0 0\n' +
            ' 1 0 0 0 0 0 1 0 0 0 1 0 0 0 0 1 1 0 1 1 0\n' +
            ' 1 1 1 1 1 1 1 0 1 1 0 1 0 1 0 0 1 1 1 0 0\n' +
            '>>\n';
        assert.strictEqual(qrCode.toString(), expected);
    });

    it('testAppendModeInfo', () => {
        const bits = new BitArray();
        QRCodeEncoder.appendModeInfo(QRCodeMode.NUMERIC, bits);
        assert.strictEqual(bits.toString(), ' ...X');
    });

    it('testAppendLengthInfo', () => {
        let bits = new BitArray();
        QRCodeEncoder.appendLengthInfo(1,  // 1 letter (1/1).
            QRCodeVersion.getVersionForNumber(1),
            QRCodeMode.NUMERIC,
            bits);
        assert.strictEqual(bits.toString(), ' ........ .X');  // 10 bits.
        bits = new BitArray();
        QRCodeEncoder.appendLengthInfo(2,  // 2 letters (2/1).
            QRCodeVersion.getVersionForNumber(10),
            QRCodeMode.ALPHANUMERIC,
            bits);
        assert.strictEqual(bits.toString(), ' ........ .X.');  // 11 bits.
        bits = new BitArray();
        QRCodeEncoder.appendLengthInfo(255,  // 255 letter (255/1).
            QRCodeVersion.getVersionForNumber(27),
            QRCodeMode.BYTE,
            bits);
        assert.strictEqual(bits.toString(), ' ........ XXXXXXXX');  // 16 bits.
        bits = new BitArray();
        QRCodeEncoder.appendLengthInfo(512,  // 512 letters (1024/2).
            QRCodeVersion.getVersionForNumber(40),
            QRCodeMode.KANJI,
            bits);
        assert.strictEqual(bits.toString(), ' ..X..... ....');  // 12 bits.
    });

    it('testAppendBytes', () => {
        ZXingStringEncoding.customEncoder = (b, e) => createCustomEncoder(e).encode(b);
        ZXingStringEncoding.customDecoder = (b, e) => createCustomDecoder(e).decode(b);

        // Should use appendNumericBytes.
        // 1 = 01 = 0001 in 4 bits.
        let bits = new BitArray();
        QRCodeEncoder.appendBytes('1', QRCodeMode.NUMERIC, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), ' ...X');
        // Should use appendAlphanumericBytes.
        // A = 10 = 0xa = 001010 in 6 bits
        bits = new BitArray();
        QRCodeEncoder.appendBytes('A', QRCodeMode.ALPHANUMERIC, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), ' ..X.X.');
        // Lower letters such as 'a' cannot be encoded in MODE_ALPHANUMERIC.
        try {
            QRCodeEncoder.appendBytes('a', QRCodeMode.ALPHANUMERIC, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        } catch (we/*WriterException*/) {
            if (we instanceof WriterException) {
                // good
            } else {
                throw we;
            }
        }
        // Should use append8BitBytes.
        // 0x61, 0x62, 0x63
        bits = new BitArray();
        QRCodeEncoder.appendBytes('abc', QRCodeMode.BYTE, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), ' .XX....X .XX...X. .XX...XX');
        // Anything can be encoded in QRCodeEncoderQRCode.MODE_8BIT_BYTE.
        // TYPESCRIPTPORT: this seems to be unused: QRCodeEncoder.appendBytes("\0", QRCodeMode.BYTE, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING)

        // Should use appendKanjiBytes.
        // 0x93, 0x5f
        bits = new BitArray();
        QRCodeEncoder.appendBytes(shiftJISString(Uint8Array.from([0x93, 0x5f])), QRCodeMode.KANJI, bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), ' .XX.XX.. XXXXX');

        ZXingStringEncoding.customEncoder = undefined;
        ZXingStringEncoding.customDecoder = undefined;
    });

    it('testTerminateBits', () => {
        let v = new BitArray();
        QRCodeEncoder.terminateBits(0, v);
        assert.strictEqual(v.toString(), '');
        v = new BitArray();
        QRCodeEncoder.terminateBits(1, v);
        assert.strictEqual(v.toString(), ' ........');
        v = new BitArray();
        v.appendBits(0, 3);  // Append 000
        QRCodeEncoder.terminateBits(1, v);
        assert.strictEqual(v.toString(), ' ........');
        v = new BitArray();
        v.appendBits(0, 5);  // Append 00000
        QRCodeEncoder.terminateBits(1, v);
        assert.strictEqual(v.toString(), ' ........');
        v = new BitArray();
        v.appendBits(0, 8);  // Append 00000000
        QRCodeEncoder.terminateBits(1, v);
        assert.strictEqual(v.toString(), ' ........');
        v = new BitArray();
        QRCodeEncoder.terminateBits(2, v);
        assert.strictEqual(v.toString(), ' ........ XXX.XX..');
        v = new BitArray();
        v.appendBits(0, 1);  // Append 0
        QRCodeEncoder.terminateBits(3, v);
        assert.strictEqual(v.toString(), ' ........ XXX.XX.. ...X...X');
    });

    it('testGetNumDataBytesAndNumECBytesForBlockID', () => {
        const numDataBytes = new Int32Array(1); /*Int32Array(1)*/
        const numEcBytes = new Int32Array(1); /*Int32Array(1)*/
        // Version 1-H.
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(26, 9, 1, 0, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 9);
        assert.strictEqual(numEcBytes[0], 17);

        // Version 3-H.  2 blocks.
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(70, 26, 2, 0, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 13);
        assert.strictEqual(numEcBytes[0], 22);
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(70, 26, 2, 1, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 13);
        assert.strictEqual(numEcBytes[0], 22);

        // Version 7-H. (4 + 1) blocks.
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(196, 66, 5, 0, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 13);
        assert.strictEqual(numEcBytes[0], 26);
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(196, 66, 5, 4, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 14);
        assert.strictEqual(numEcBytes[0], 26);

        // Version 40-H. (20 + 61) blocks.
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 0, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 15);
        assert.strictEqual(numEcBytes[0], 30);
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 20, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 16);
        assert.strictEqual(numEcBytes[0], 30);
        QRCodeEncoder.getNumDataBytesAndNumECBytesForBlockID(3706, 1276, 81, 80, numDataBytes, numEcBytes);
        assert.strictEqual(numDataBytes[0], 16);
        assert.strictEqual(numEcBytes[0], 30);
    });

    it('testInterleaveWithECBytes', () => {
        let dataBytes = Uint8Array.from([32, 65, 205, 69, 41, 220, 46, 128, 236]);
        let input = new BitArray();
        for (let i = 0, length = dataBytes.length; i !== length; i++) {
            const dataByte = dataBytes[i];
            input.appendBits(dataByte, 8);
        }
        let out: BitArray = QRCodeEncoder.interleaveWithECBytes(input, 26, 9, 1);
        let expected = Uint8Array.from([
            // Data bytes.
            32, 65, 205, 69, 41, 220, 46, 128, 236,
            // Error correction bytes.
            42, 159, 74, 221, 244, 169, 239, 150, 138, 70,
            237, 85, 224, 96, 74, 219, 61,
        ]);
        assert.strictEqual(out.getSizeInBytes(), expected.length);
        let outArray = new Uint8Array(expected.length);
        out.toBytes(0, outArray, 0, expected.length);
        // Can't use ZXingArrays.equals(), because outArray may be longer than out.sizeInBytes()
        for (let x: number /*int*/ = 0; x < expected.length; x++) {
            assert.strictEqual(outArray[x], expected[x]);
        }
        // Numbers are from http://www.swetake.com/qr/qr8.html
        dataBytes = Uint8Array.from([
            67, 70, 22, 38, 54, 70, 86, 102, 118, 134, 150, 166, 182,
            198, 214, 230, 247, 7, 23, 39, 55, 71, 87, 103, 119, 135,
            151, 166, 22, 38, 54, 70, 86, 102, 118, 134, 150, 166,
            182, 198, 214, 230, 247, 7, 23, 39, 55, 71, 87, 103, 119,
            135, 151, 160, 236, 17, 236, 17, 236, 17, 236,
            17
        ]);
        input = new BitArray();
        for (let i = 0, length = dataBytes.length; i !== length; i++) {
            const dataByte = dataBytes[i];
            input.appendBits(dataByte, 8);
        }

        out = QRCodeEncoder.interleaveWithECBytes(input, 134, 62, 4);
        expected = Uint8Array.from([
            // Data bytes.
            67, 230, 54, 55, 70, 247, 70, 71, 22, 7, 86, 87, 38, 23, 102, 103, 54, 39,
            118, 119, 70, 55, 134, 135, 86, 71, 150, 151, 102, 87, 166,
            160, 118, 103, 182, 236, 134, 119, 198, 17, 150,
            135, 214, 236, 166, 151, 230, 17, 182,
            166, 247, 236, 198, 22, 7, 17, 214, 38, 23, 236, 39,
            17,
            // Error correction bytes.
            175, 155, 245, 236, 80, 146, 56, 74, 155, 165,
            133, 142, 64, 183, 132, 13, 178, 54, 132, 108, 45,
            113, 53, 50, 214, 98, 193, 152, 233, 147, 50, 71, 65,
            190, 82, 51, 209, 199, 171, 54, 12, 112, 57, 113, 155, 117,
            211, 164, 117, 30, 158, 225, 31, 190, 242, 38,
            140, 61, 179, 154, 214, 138, 147, 87, 27, 96, 77, 47,
            187, 49, 156, 214,
        ]);
        assert.strictEqual(out.getSizeInBytes(), expected.length);
        outArray = new Uint8Array(expected.length);
        out.toBytes(0, outArray, 0, expected.length);
        for (let x: number /*int*/ = 0; x < expected.length; x++) {
            assert.strictEqual(outArray[x], expected[x]);
        }
    });

    it('testAppendNumericBytes', () => {
        // 1 = 01 = 0001 in 4 bits.
        let bits = new BitArray();
        QRCodeEncoder.appendNumericBytes('1', bits);
        assert.strictEqual(bits.toString(), ' ...X');
        // 12 = 0xc = 0001100 in 7 bits.
        bits = new BitArray();
        QRCodeEncoder.appendNumericBytes('12', bits);
        assert.strictEqual(bits.toString(), ' ...XX..');
        // 123 = 0x7b = 0001111011 in 10 bits.
        bits = new BitArray();
        QRCodeEncoder.appendNumericBytes('123', bits);
        assert.strictEqual(bits.toString(), ' ...XXXX. XX');
        // 1234 = "123" + "4" = 0001111011 + 0100
        bits = new BitArray();
        QRCodeEncoder.appendNumericBytes('1234', bits);
        assert.strictEqual(bits.toString(), ' ...XXXX. XX.X..');
        // Empty.
        bits = new BitArray();
        QRCodeEncoder.appendNumericBytes('', bits);
        assert.strictEqual(bits.toString(), '');
    });

    it('testAppendAlphanumericBytes', () => {
        // A = 10 = 0xa = 001010 in 6 bits
        let bits = new BitArray();
        QRCodeEncoder.appendAlphanumericBytes('A', bits);
        assert.strictEqual(bits.toString(), ' ..X.X.');
        // AB = 10 * 45 + 11 = 461 = 0x1cd = 00111001101 in 11 bits
        bits = new BitArray();
        QRCodeEncoder.appendAlphanumericBytes('AB', bits);
        assert.strictEqual(bits.toString(), ' ..XXX..X X.X');
        // ABC = "AB" + "C" = 00111001101 + 001100
        bits = new BitArray();
        QRCodeEncoder.appendAlphanumericBytes('ABC', bits);
        assert.strictEqual(bits.toString(), ' ..XXX..X X.X..XX. .');
        // Empty.
        bits = new BitArray();
        QRCodeEncoder.appendAlphanumericBytes('', bits);
        assert.strictEqual(bits.toString(), '');
        // Invalid data.
        try {
            QRCodeEncoder.appendAlphanumericBytes('abc', new BitArray());
        } catch (we/*WriterException*/) {
            // good
        }
    });

    it('testAppend8BitBytes', () => {
        ZXingStringEncoding.customEncoder = (b, e) => createCustomEncoder(e).encode(b);
        // 0x61, 0x62, 0x63
        let bits = new BitArray();
        QRCodeEncoder.append8BitBytes('abc', bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), ' .XX....X .XX...X. .XX...XX');
        // Empty.
        bits = new BitArray();
        QRCodeEncoder.append8BitBytes('', bits, QRCodeEncoder.DEFAULT_BYTE_MODE_ENCODING);
        assert.strictEqual(bits.toString(), '');
    });

    // Numbers are from page 21 of JISX0510:2004
    it('testAppendKanjiBytes', () => {
        ZXingStringEncoding.customEncoder = (b, e) => createCustomEncoder(e).encode(b);
        ZXingStringEncoding.customDecoder = (b, e) => createCustomDecoder(e).decode(b);

        const bits = new BitArray();
        QRCodeEncoder.appendKanjiBytes(shiftJISString(Uint8Array.from([0x93, 0x5f])), bits);
        assert.strictEqual(bits.toString(), ' .XX.XX.. XXXXX');
        QRCodeEncoder.appendKanjiBytes(shiftJISString(Uint8Array.from([0xe4, 0xaa])), bits);
        assert.strictEqual(bits.toString(), ' .XX.XX.. XXXXXXX. X.X.X.X. X.');

        ZXingStringEncoding.customEncoder = undefined;
        ZXingStringEncoding.customDecoder = undefined;
      });

    // Numbers are from http://www.swetake.com/qr/qr3.html and
    // http://www.swetake.com/qr/qr9.html
    it('testGenerateECBytes', () => {
        let dataBytes = Uint8Array.from([32, 65, 205, 69, 41, 220, 46, 128, 236]);
        let ecBytes: Uint8Array = QRCodeEncoder.generateECBytes(dataBytes, 17);
        let expected = Int32Array.from([
            42, 159, 74, 221, 244, 169, 239, 150, 138, 70, 237, 85, 224, 96, 74, 219, 61
        ]);
        assert.strictEqual(ecBytes.length, expected.length);
        for (let x: number /*int*/ = 0; x < expected.length; x++) {
            assert.strictEqual(ecBytes[x] & 0xFF, expected[x]);
        }
        dataBytes = Uint8Array.from([67, 70, 22, 38, 54, 70, 86, 102, 118,
            134, 150, 166, 182, 198, 214]);
        ecBytes = QRCodeEncoder.generateECBytes(dataBytes, 18);
        expected = Int32Array.from([
            175, 80, 155, 64, 178, 45, 214, 233, 65, 209, 12, 155, 117, 31, 140, 214, 27, 187
        ]);
        assert.strictEqual(ecBytes.length, expected.length);
        for (let x: number /*int*/ = 0; x < expected.length; x++) {
            assert.strictEqual(ecBytes[x] & 0xFF, expected[x]);
        }
        // High-order zero coefficient case.
        dataBytes = Uint8Array.from([32, 49, 205, 69, 42, 20, 0, 236, 17]);
        ecBytes = QRCodeEncoder.generateECBytes(dataBytes, 17);
        expected = Int32Array.from([
            0, 3, 130, 179, 194, 0, 55, 211, 110, 79, 98, 72, 170, 96, 211, 137, 213
        ]);
        assert.strictEqual(ecBytes.length, expected.length);
        for (let x: number /*int*/ = 0; x < expected.length; x++) {
            assert.strictEqual(ecBytes[x] & 0xFF, expected[x]);
        }
    });

    it('testBugInBitVectorNumBytes', () => {
        // There was a bug in BitVector.sizeInBytes() that caused it to return a
        // smaller-by-one value (ex. 1465 instead of 1466) if the number of bits
        // in the vector is not 8-bit aligned.  In QRCodeEncoder::InitQRCode(),
        // BitVector::sizeInBytes() is used for finding the smallest QR Code
        // version that can fit the given data.  Hence there were corner cases
        // where we chose a wrong QR Code version that cannot fit the given
        // data.  Note that the issue did not occur with MODE_8BIT_BYTE, as the
        // bits in the bit vector are always 8-bit aligned.
        //
        // Before the bug was fixed, the following test didn't pass, because:
        //
        // - MODE_NUMERIC is chosen as all bytes in the data are '0'
        // - The 3518-byte numeric data needs 1466 bytes
        //   - 3518 / 3 * 10 + 7 = 11727 bits = 1465.875 bytes
        //   - 3 numeric bytes are encoded in 10 bits, hence the first
        //     3516 bytes are encoded in 3516 / 3 * 10 = 11720 bits.
        //   - 2 numeric bytes can be encoded in 7 bits, hence the last
        //     2 bytes are encoded in 7 bits.
        // - The version 27 QR Code with the EC level L has 1468 bytes for data.
        //   - 1828 - 360 = 1468
        // - In InitQRCode(), 3 bytes are reserved for a header.  Hence 1465 bytes
        //   (1468 -3) are left for data.
        // - Because of the bug in BitVector::sizeInBytes(), InitQRCode() determines
        //   the given data can fit in 1465 bytes, despite it needs 1466 bytes.
        // - Hence QRCodeEncoder.encode() failed and returned false.
        //   - To be precise, it needs 11727 + 4 (getMode info) + 14 (length info) =
        //     11745 bits = 1468.125 bytes are needed (i.e. cannot fit in 1468
        //     bytes).
        const builder = new ZXingStringBuilder(); // 3518)
        for (let x: number /*int*/ = 0; x < 3518; x++) {
            builder.append('0');
        }
        QRCodeEncoder.encode(builder.toString(), QRCodeDecoderErrorCorrectionLevel.L);
    });

    function shiftJISString(bytes: Uint8Array): string {
        try {
            return ZXingStringEncoding.decode(bytes, CharacterSetECI.SJIS.getName());
        } catch (uee/*UnsupportedEncodingException*/) {
            throw new WriterException(uee.toString());
        }
    }

});
