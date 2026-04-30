import MicroQRDecodedBitStreamParser from '../../../../core/microqr/decoder/MicroQRDecodedBitStreamParser';
import MicroQRVersion from '../../../../core/microqr/decoder/MicroQRVersion';

describe('MicroQRDecodedBitStreamParser', () => {

    /**
     * Helper: encode a numeric value for M1 (no mode indicator, 3-bit count, then digits).
     * M1 can only encode numeric, count field = 3 bits, terminator = 3 bits.
     */
    function encodeM1Numeric(digits: string): Uint8Array {
        // Bit stream: [count:3][digits encoded][terminator:3]
        const bits: number[] = [];

        // Write count (3 bits)
        const count = digits.length;
        for (let b = 2; b >= 0; b--) bits.push((count >> b) & 1);

        // Encode digits
        let i = 0;
        while (i + 3 <= digits.length) {
            const val = parseInt(digits.substring(i, i + 3), 10);
            for (let b = 9; b >= 0; b--) bits.push((val >> b) & 1);
            i += 3;
        }
        if (i + 2 === digits.length) {
            const val = parseInt(digits.substring(i, i + 2), 10);
            for (let b = 6; b >= 0; b--) bits.push((val >> b) & 1);
            i += 2;
        } else if (i + 1 === digits.length) {
            const val = parseInt(digits.substring(i, i + 1), 10);
            for (let b = 3; b >= 0; b--) bits.push((val >> b) & 1);
            i += 1;
        }

        // Terminator: 3 zeros
        bits.push(0, 0, 0);

        // Pad to byte boundary
        while (bits.length % 8 !== 0) bits.push(0);

        // Pack bits into bytes
        const bytes = new Uint8Array(Math.ceil(bits.length / 8));
        for (let k = 0; k < bits.length; k++) {
            if (bits[k]) {
                bytes[Math.floor(k / 8)] |= (0x80 >> (k % 8));
            }
        }
        return bytes;
    }

    it('M1 - decode numeric "01234"', () => {
        // M1 can hold 5 digits max
        const bytes = encodeM1Numeric('01234');
        const version = MicroQRVersion.getVersionForIndicator(0); // M1
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('01234');
    });

    it('M1 - decode numeric "7"', () => {
        const bytes = encodeM1Numeric('7');
        const version = MicroQRVersion.getVersionForIndicator(0); // M1
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('7');
    });

    it('M1 - decode numeric "42"', () => {
        const bytes = encodeM1Numeric('42');
        const version = MicroQRVersion.getVersionForIndicator(0);
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('42');
    });

    it('M2 - decode numeric (mode=0)', () => {
        // M2: 1 mode bit (0=Numeric), 4-bit count, numeric digits, 5-bit terminator
        const bits: number[] = [];
        const str = '123';

        bits.push(0); // mode bit: 0 = Numeric

        // 4-bit count
        const count = str.length;
        for (let b = 3; b >= 0; b--) bits.push((count >> b) & 1);

        // Encode "123" as one 3-digit group = 123 in 10 bits
        const val = 123;
        for (let b = 9; b >= 0; b--) bits.push((val >> b) & 1);

        // 5-bit terminator (all 0)
        bits.push(0, 0, 0, 0, 0);
        while (bits.length % 8 !== 0) bits.push(0);

        const bytes = new Uint8Array(Math.ceil(bits.length / 8));
        for (let k = 0; k < bits.length; k++) {
            if (bits[k]) bytes[Math.floor(k / 8)] |= (0x80 >> (k % 8));
        }

        const version = MicroQRVersion.getVersionForIndicator(1); // M2-L
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('123');
    });

    it('M2 - decode alphanumeric (mode=1)', () => {
        // M2: 1 mode bit (1=Alpha), 3-bit count, alphanumeric digits, 5-bit terminator
        const bits: number[] = [];

        bits.push(1); // mode bit: 1 = Alphanumeric

        const str = 'AB'; // 2 chars
        const AIdx = 10; // 'A' = 10 in alphanumeric table
        const BIdx = 11; // 'B' = 11

        // 3-bit count = 2
        for (let b = 2; b >= 0; b--) bits.push((2 >> b) & 1);

        // Encode 2 chars: 45*A + B = 45*10 + 11 = 461, in 11 bits
        const val = 45 * AIdx + BIdx;
        for (let b = 10; b >= 0; b--) bits.push((val >> b) & 1);

        bits.push(0, 0, 0, 0, 0); // terminator
        while (bits.length % 8 !== 0) bits.push(0);

        const bytes = new Uint8Array(Math.ceil(bits.length / 8));
        for (let k = 0; k < bits.length; k++) {
            if (bits[k]) bytes[Math.floor(k / 8)] |= (0x80 >> (k % 8));
        }

        const version = MicroQRVersion.getVersionForIndicator(1); // M2-L
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('AB');
    });

    it('M4 - decode byte mode', () => {
        // M4: 3 mode bits (010=Byte), 5-bit count, 8 bits per byte, 5-bit terminator
        const bits: number[] = [];
        const str = 'Hi'; // 2 bytes: H=72, i=105

        // Mode: 010 (byte)
        bits.push(0, 1, 0);

        // 5-bit count = 2
        for (let b = 4; b >= 0; b--) bits.push((2 >> b) & 1);

        // H = 72 = 0x48
        for (let b = 7; b >= 0; b--) bits.push((72 >> b) & 1);
        // i = 105 = 0x69
        for (let b = 7; b >= 0; b--) bits.push((105 >> b) & 1);

        // Terminator: 5 zeros
        bits.push(0, 0, 0, 0, 0);
        while (bits.length % 8 !== 0) bits.push(0);

        const bytes = new Uint8Array(Math.ceil(bits.length / 8));
        for (let k = 0; k < bits.length; k++) {
            if (bits[k]) bytes[Math.floor(k / 8)] |= (0x80 >> (k % 8));
        }

        const version = MicroQRVersion.getVersionForIndicator(5); // M4-L
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getText()).toBe('Hi');
    });

    it('should return correct EC level in decoder result', () => {
        const bytes = encodeM1Numeric('1');
        const version = MicroQRVersion.getVersionForIndicator(0); // M1
        const result = MicroQRDecodedBitStreamParser.decode(bytes, version, null);
        expect(result.getECLevel()).toBeNull(); // M1 has no EC
    });
});
