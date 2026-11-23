import { BarcodeFormat, BitArray, CodaBarReader, NotFoundException } from '@zxing/library';

const patterns: Record<string, string> = {
    '0': 'nnnnnww',
    '1': 'nnnnwwn',
    '2': 'nnnwnnw',
    '+': 'nnwnwnw',
    ':': 'wnnnwnw',
    A: 'nnwwnwn',
    B: 'nwnwnnw',
    D: 'nnnwwwn',
};

function encodeWidths(text: string): number[] {
    const widths: number[] = [];
    for (let i = 0; i < text.length; i++) {
        if (i > 0) widths.push(4);
        for (const element of patterns[text[i]]) {
            widths.push(element === 'n' ? 4 : 8);
        }
    }
    return widths;
}

function toBitArray(widths: number[], quietZone = 0): BitArray {
    const bits = new BitArray();
    for (let i = 0; i < quietZone; i++) bits.appendBit(false);
    for (const [index, width] of widths.entries()) {
        for (let i = 0; i < width; i++) bits.appendBit(index % 2 === 0);
    }
    for (let i = 0; i < quietZone; i++) bits.appendBit(false);
    return bits;
}

describe('CodaBarReader', () => {
    it('returns the start and stop characters and the barcode position', () => {
        const widths = encodeWidths('A1B');
        const quietZone = 5;
        const result = new CodaBarReader().decodeRow(12, toBitArray(widths, quietZone));
        expect(result.getText()).toBe('A1B');
        expect(result.getBarcodeFormat()).toBe(BarcodeFormat.CODABAR);
        expect(result.getResultPoints().map(point => [point.getX(), point.getY()])).toEqual([
            [quietZone, 12],
            [quietZone + widths.reduce((total, width) => total + width, 0) - 1, 12],
        ]);
    });

    it('decodes the standard plus pattern', () => {
        const result = new CodaBarReader().decodeRow(0, toBitArray(encodeWidths('A1+B')));
        expect(result.getText()).toBe('A1+B');
    });

    it('decodes zero when two elements differ by one pixel from their nominal widths', () => {
        const widths = encodeWidths('B0A');
        widths[11] += 1;
        widths[22] -= 1;
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths));
        expect(result.getText()).toBe('B0A');
    });

    it('decodes different bar and space widths without treating character gaps as spaces', () => {
        const widths = encodeWidths('A+0B').map((width, index) => {
            if (index % 8 === 7) return 18;
            return index % 2 === 0 ? width + 4 : width - 2;
        });
        // All three spaces in + are narrow, even with these small width differences.
        widths[9] += 1;
        widths[13] -= 1;
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths));
        expect(result.getText()).toBe('A+0B');
    });

    it('decodes the row when one wide start character bar is wider than the others', () => {
        const widths = encodeWidths('A12B');
        widths[2] = 12;
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths, 25));
        expect(result.getText()).toBe('A12B');
    });

    it.each([
        ['wide bars', [2, 28]],
        ['wide spaces', [3, 5, 27, 29]],
    ] as const)('decodes the payload when both guards have oversized %s', (_element, indices) => {
        const widths = encodeWidths('A12D');
        for (const index of indices) {
            widths[index] = 12;
        }
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths, 25));
        expect(result.getText()).toBe('A12D');
    });

    it('decodes a long payload with one oversized punctuation bar', () => {
        const widths = encodeWidths('A12:201210B');
        widths[24] = 16;
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths, 25));
        expect(result.getText()).toBe('A12:201210B');
    });

    it('prefers the reading without a start/stop character in an ambiguous payload', () => {
        const widths = [
            6, 2, 9, 6, 6, 5, 5, 5,
            5, 2, 5, 5, 5, 2, 7, 6,
            6, 3, 4, 4, 6, 6, 7, 7,
            5, 3, 8, 5, 5, 6, 4,
        ];
        const result = new CodaBarReader().decodeRow(0, toBitArray(widths, 25));
        expect(result.getText()).toBe('A20A');
    });

    it('retains an unambiguous interior start/stop character', () => {
        const result = new CodaBarReader().decodeRow(0, toBitArray(encodeWidths('A1BB')));
        expect(result.getText()).toBe('A1BB');
    });

    it('rejects the invalid five-wide-element pattern', () => {
        const widths = encodeWidths('A+B');
        widths.splice(8, 7, 4, 4, 8, 8, 8, 8, 8);
        expect(() => new CodaBarReader().decodeRow(0, toBitArray(widths))).toThrow(NotFoundException);
    });
});
