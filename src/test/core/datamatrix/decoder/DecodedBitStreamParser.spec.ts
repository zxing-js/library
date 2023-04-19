import * as assert from 'assert';
import { DataMatrixDecodedBitStreamParser } from '@zxing/library';

describe('QRCodeDecodedBitStreamParser', () => {

    it('testAsciiStandardDecode', () => {
    // ASCII characters 0-127 are encoded as the value + 1
        const bytes: Uint8Array = new Uint8Array(6);
        bytes[0] = 'a'.charCodeAt(0) + 1;
        bytes[1] = 'b'.charCodeAt(0) + 1;
        bytes[2] = 'c'.charCodeAt(0) + 1;
        bytes[3] = 'A'.charCodeAt(0) + 1;
        bytes[4] = 'B'.charCodeAt(0) + 1;
        bytes[5] = 'C'.charCodeAt(0) + 1;
        const decodedString = DataMatrixDecodedBitStreamParser.decode(bytes).getText();
        assert.strictEqual(decodedString, 'abcABC');
    });

    it('testAsciiDoubleDigitDecode', () => {
        const bytes: Uint8Array = new Uint8Array(4);
        bytes[0] = 130;
        bytes[1] = 1 + 130;
        bytes[2] = 98 + 130;
        bytes[3] = 99 + 130;
        const decodedString = DataMatrixDecodedBitStreamParser.decode(bytes).getText();
        assert.strictEqual(decodedString, '00019899');
    });

});
