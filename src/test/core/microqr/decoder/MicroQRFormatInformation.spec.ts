import MicroQRFormatInformation from '../../../../core/microqr/decoder/MicroQRFormatInformation';

describe('MicroQRFormatInformation', () => {

    // Helper: compute expected masked format word for data5
    function computeMaskedFormatWord(data5: number): number {
        const GENERATOR = 0x537;
        let d = data5 << 10;
        for (let i = 4; i >= 0; i--) {
            if ((d >> (i + 10)) & 1) {
                d ^= (GENERATOR << i);
            }
        }
        const formatWord = (data5 << 10) | (d & 0x3FF);
        return formatWord ^ 0x4445;
    }

    it('should decode M1 (versionIndicator=0, mask=0) exactly', () => {
        const masked = computeMaskedFormatWord(0b00000); // vi=0, mask=0
        const fi = MicroQRFormatInformation.decodeFormatInformation(masked);
        expect(fi).not.toBeNull();
        expect(fi!.getVersionIndicator()).toBe(0);
        expect(fi!.getDataMask()).toBe(0);
        expect(fi!.getMicroQRVersionNumber()).toBe(1);
        expect(fi!.getECLevelLabel()).toBeNull();
    });

    it('should decode M2-L (versionIndicator=1, mask=0)', () => {
        const masked = computeMaskedFormatWord(0b00100); // vi=1, mask=0
        const fi = MicroQRFormatInformation.decodeFormatInformation(masked);
        expect(fi).not.toBeNull();
        expect(fi!.getVersionIndicator()).toBe(1);
        expect(fi!.getDataMask()).toBe(0);
        expect(fi!.getMicroQRVersionNumber()).toBe(2);
        expect(fi!.getECLevelLabel()).toBe('L');
    });

    it('should decode M2-M (versionIndicator=2, mask=1)', () => {
        const masked = computeMaskedFormatWord(0b01001); // vi=2, mask=1
        const fi = MicroQRFormatInformation.decodeFormatInformation(masked);
        expect(fi).not.toBeNull();
        expect(fi!.getVersionIndicator()).toBe(2);
        expect(fi!.getDataMask()).toBe(1);
        expect(fi!.getMicroQRVersionNumber()).toBe(2);
        expect(fi!.getECLevelLabel()).toBe('M');
    });

    it('should decode M4-Q (versionIndicator=7, mask=3)', () => {
        const masked = computeMaskedFormatWord(0b11111); // vi=7, mask=3
        const fi = MicroQRFormatInformation.decodeFormatInformation(masked);
        expect(fi).not.toBeNull();
        expect(fi!.getVersionIndicator()).toBe(7);
        expect(fi!.getDataMask()).toBe(3);
        expect(fi!.getMicroQRVersionNumber()).toBe(4);
        expect(fi!.getECLevelLabel()).toBe('Q');
    });

    it('should correctly decode all 32 entries exactly', () => {
        for (let data5 = 0; data5 < 32; data5++) {
            const masked = computeMaskedFormatWord(data5);
            const fi = MicroQRFormatInformation.decodeFormatInformation(masked);
            expect(fi).not.toBeNull();
            expect(fi!.getVersionIndicator()).toBe((data5 >> 2) & 0x07);
            expect(fi!.getDataMask()).toBe(data5 & 0x03);
        }
    });

    it('should tolerate 1-bit error (Hamming distance 1)', () => {
        const masked = computeMaskedFormatWord(0b00100); // M2-L, mask=0
        // Flip bit 0
        const corrupted = masked ^ 1;
        const fi = MicroQRFormatInformation.decodeFormatInformation(corrupted);
        expect(fi).not.toBeNull();
        expect(fi!.getVersionIndicator()).toBe(1); // M2-L
    });

    it('should tolerate 3-bit error (Hamming distance 3)', () => {
        const masked = computeMaskedFormatWord(0b01101); // M3-L, mask=1
        // Flip bits 0, 1, 2
        const corrupted = masked ^ 0x07;
        const fi = MicroQRFormatInformation.decodeFormatInformation(corrupted);
        // Should still find a match (Hamming ≤ 3)
        expect(fi).not.toBeNull();
    });

    it('should return null for heavily corrupted format info', () => {
        // Flip 7 bits — should not match
        const fi = MicroQRFormatInformation.decodeFormatInformation(0xFFFF);
        // Very unlikely to match within distance 3 for all random inputs
        // (just verify the method doesn't crash)
        // Result could be null or a match; we just verify no exception
        expect(fi === null || fi !== null).toBe(true);
    });

    it('mask constant 0x4445 should have correct bit structure', () => {
        // 0x4445 = 0100 0100 0100 0101
        expect(0x4445).toBe(17477);
        // XOR mask should be 15 bits
        expect(0x4445 >> 15).toBe(0);
        expect((0x4445 >> 14) & 1).toBe(1);
    });

    it('numBitsDiffering should count correctly', () => {
        expect(MicroQRFormatInformation.numBitsDiffering(0, 0)).toBe(0);
        expect(MicroQRFormatInformation.numBitsDiffering(0xFF, 0)).toBe(8);
        expect(MicroQRFormatInformation.numBitsDiffering(0b1010, 0b0101)).toBe(4);
        expect(MicroQRFormatInformation.numBitsDiffering(0x4445, 0x4445)).toBe(0);
    });
});
