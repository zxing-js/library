import * as assert from 'assert';

import {
    BarcodeFormat, BinaryBitmap, BitArray, EncodeHintType, HybridBinarizer,
    PlanarYUVLuminanceSource, QRCodeEncoder, QRCodeMode, QRCodeReader,
    QRCodeWriter, ResultMetadataType, WriterException, ZXingStringEncoding
} from '@zxing/library';
import { createCustomEncoder } from '../util/textEncodingFactory';

describe('QRCodeWriter character encoding', () => {
    const originalEncoder = ZXingStringEncoding.customEncoder;

    beforeEach(() => {
        ZXingStringEncoding.customEncoder = undefined;
    });

    afterEach(() => {
        ZXingStringEncoding.customEncoder = originalEncoder;
    });

    function roundtrip(content: string, encoding?: string) {
        const hints = encoding === undefined ? null : new Map([[EncodeHintType.CHARACTER_SET, encoding]]);
        const matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 0, 0, hints);
        const width = matrix.getWidth();
        const height = matrix.getHeight();
        const luminances = new Uint8ClampedArray(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                luminances[y * width + x] = matrix.get(x, y) ? 0 : 255;
            }
        }
        const source = new PlanarYUVLuminanceSource(luminances, width, height, 0, 0, width, height, false);
        return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(source)));
    }

    it.each(['ISO-8859-1', 'ISO88591', 'ISO8859_1'])('writes Latin-1 bytes and ECI for %s', encoding => {
        const content = '\u0000\u007f\u00a0\u00e9\u00ff';
        const result = roundtrip(content, encoding);
        assert.strictEqual(result.getText(), content);
        assert.deepStrictEqual(result.getResultMetadata().get(ResultMetadataType.BYTE_SEGMENTS),
            [Uint8Array.from([0x00, 0x7f, 0xa0, 0xe9, 0xff])]);
    });

    it('encodes every Latin-1 code point as one byte', () => {
        const bytes = Uint8Array.from({ length: 256 }, (_, value) => value);
        const content = String.fromCharCode(...bytes);
        const bits = new BitArray();
        QRCodeEncoder.append8BitBytes(content, bits, 'ISO-8859-1');
        assert.strictEqual(bits.getSizeInBytes(), bytes.length);
        const actual = new Uint8Array(bytes.length);
        bits.toBytes(0, actual, 0, actual.length);
        assert.deepStrictEqual(actual, bytes);
    });

    it.each([undefined, 'UTF8', 'UTF-8'])('preserves UTF-8 encoding for %s', encoding => {
        assert.strictEqual(roundtrip('\u00e9\u20ac\ud83d\ude00', encoding).getText(), '\u00e9\u20ac\ud83d\ude00');
    });

    it.each(['ASCII', 'US-ASCII'])('writes ASCII bytes for %s', encoding => {
        assert.strictEqual(roundtrip('abc\u0000\u007f', encoding).getText(), 'abc\u0000\u007f');
    });

    it.each(['\u0100', '\u20ac', '\ud83d\ude00'])('rejects unrepresentable Latin-1 content %s', content => {
        assert.throws(() => roundtrip(content, 'ISO-8859-1'), WriterException);
    });

    it('rejects unrepresentable ASCII content', () => {
        assert.throws(() => roundtrip('\u00e9', 'US-ASCII'), WriterException);
    });

    it.each(['windows-1252', 'ISO-8859-7', 'Shift_JIS', 'SJIS', 'UTF-16BE', 'unknown-charset'])(
        'rejects unsupported %s instead of emitting UTF-8 bytes', encoding => {
            assert.throws(() => roundtrip('\u00e9', encoding), (error: Error) =>
                error instanceof WriterException && error.message.indexOf(encoding) !== -1);
        });

    it('gives a custom encoder precedence over built-in Latin-1 encoding', () => {
        const encoder = jest.fn(() => Uint8Array.from([0x61]));
        ZXingStringEncoding.customEncoder = encoder;
        assert.strictEqual(roundtrip('\u00e9', 'ISO8859_1').getText(), 'a');
        expect(encoder).toHaveBeenCalledTimes(1);
        expect(encoder).toHaveBeenCalledWith('\u00e9', 'ISO8859_1');
    });

    it('supports other ECI character sets through a custom encoder', () => {
        ZXingStringEncoding.customEncoder = (content, encoding) => createCustomEncoder(encoding).encode(content);
        assert.strictEqual(roundtrip('\u20ac', 'windows-1252').getText(), '\u20ac');
    });

    it.each(['SJIS', 'Shift_JIS'])('preserves custom Shift-JIS encoding for %s', encoding => {
        ZXingStringEncoding.customEncoder = (content, charset) => createCustomEncoder(charset).encode(content);
        assert.strictEqual(roundtrip('\u6f22\u5b57', encoding).getText(), '\u6f22\u5b57');
        if (encoding === 'SJIS') {
            assert.strictEqual(QRCodeEncoder.chooseMode('\u6f22\u5b57', encoding), QRCodeMode.KANJI);
        }
    });

    it('encodes Latin-1 without a native TextEncoder', () => {
        const originalTextEncoder = globalThis.TextEncoder;
        try {
            globalThis.TextEncoder = undefined;
            assert.strictEqual(roundtrip('\u00e9', 'ISO-8859-1').getText(), '\u00e9');
        } finally {
            globalThis.TextEncoder = originalTextEncoder;
        }
    });
});
