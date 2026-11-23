import { BarcodeFormat, BitArray, CodaBarReader, NotFoundException } from '@zxing/library';

const patterns: Record<string, string> = {
    '+': 'nnwnwnw',
    '0': 'nnnnnww',
    '1': 'nnnnwwn',
    '2': 'nnnwnnw',
    ':': 'wnnnwnw',
    A: 'nnwwnwn',
    B: 'nwnwnnw',
    D: 'nnnwwwn',
};

const narrowWidth = 4;
const wideWidth = 8;
const firstRow = 0;
const paddedQuietZone = 25;
const oversizedGuardWidth = 12;
const characterRuns = 7;
const characterStride = characterRuns + 1;
const startGuardWideBar = 2;

const widthsForPattern = (pattern: string): number[] =>
    [...pattern].map(element => element === 'n' ? narrowWidth : wideWidth);

const encodeWidths = (text: string): number[] => {
    const widths: number[] = [];
    for (const character of text) {
        if (widths.length) widths.push(narrowWidth);
        widths.push(...widthsForPattern(patterns[character]));
    }
    return widths;
};

const toBitArray = (widths: number[], quietZone: number = 0): BitArray => {
    const bits = new BitArray();
    for (let i = 0; i < quietZone; i++) bits.appendBit(false);
    let isBar = true;
    for (const width of widths) {
        for (let i = 0; i < width; i++) bits.appendBit(isBar);
        isBar = !isBar;
    }
    for (let i = 0; i < quietZone; i++) bits.appendBit(false);
    return bits;
};

describe('CodaBarReader', () => {
    it('returns the start and stop characters and the barcode position', () => {
        const widths = encodeWidths('A1B');
        const quietZone = 5;
        const rowNumber = 12;
        const rightmostBarPixel = widths.reduce((total, width) => total + width, quietZone) - 1;
        const result = new CodaBarReader().decodeRow(rowNumber, toBitArray(widths, quietZone));
        expect(result.getText()).toBe('A1B');
        expect(result.getBarcodeFormat()).toBe(BarcodeFormat.CODABAR);
        expect(result.getResultPoints().map(point => [point.getX(), point.getY()])).toEqual([
            [quietZone, rowNumber],
            [rightmostBarPixel, rowNumber],
        ]);
    });

    it('decodes the standard plus pattern', () => {
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(encodeWidths('A1+B')));
        expect(result.getText()).toBe('A1+B');
    });

    it('decodes zero when two elements differ by one pixel from their nominal widths', () => {
        const widths = encodeWidths('B0A');
        const payloadSpace = 11;
        const lastStopBar = 22;
        widths[payloadSpace] += 1;
        widths[lastStopBar] -= 1;
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths));
        expect(result.getText()).toBe('B0A');
    });

    it('decodes different bar and space widths without treating character gaps as spaces', () => {
        const gapWidth = 18;
        const extraBarWidth = 4;
        const spaceReduction = 2;
        const barParity = 0;
        const widths = encodeWidths('A+0B').map((width, index) => {
            if (index % characterStride === characterRuns) return gapWidth;
            return index % 2 === barParity ? width + extraBarWidth : width - spaceReduction;
        });
        // All three spaces in + are narrow, even with these small width differences.
        const firstPlusSpace = 9;
        const lastPlusSpace = 13;
        widths[firstPlusSpace] += 1;
        widths[lastPlusSpace] -= 1;
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths));
        expect(result.getText()).toBe('A+0B');
    });

    it('decodes the row when one wide start character bar is wider than the others', () => {
        const widths = encodeWidths('A12B');
        widths[startGuardWideBar] = oversizedGuardWidth;
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths, paddedQuietZone));
        expect(result.getText()).toBe('A12B');
    });

    const stopGuardWideBar = 28;
    const firstStartGuardWideSpace = 3;
    const secondStartGuardWideSpace = 5;
    const firstStopGuardWideSpace = 27;
    const secondStopGuardWideSpace = 29;
    it.each([
        ['wide bars', [startGuardWideBar, stopGuardWideBar]],
        ['wide spaces', [firstStartGuardWideSpace, secondStartGuardWideSpace, firstStopGuardWideSpace, secondStopGuardWideSpace]],
    ] as const)('decodes the payload when both guards have oversized %s', (_element, indices) => {
        const widths = encodeWidths('A12D');
        for (const index of indices) {
            widths[index] = oversizedGuardWidth;
        }
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths, paddedQuietZone));
        expect(result.getText()).toBe('A12D');
    });

    it('decodes a long payload with one oversized punctuation bar', () => {
        const widths = encodeWidths('A12:201210B');
        const punctuationBar = 24;
        const oversizedPunctuationWidth = 16;
        widths[punctuationBar] = oversizedPunctuationWidth;
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths, paddedQuietZone));
        expect(result.getText()).toBe('A12:201210B');
    });

    it('prefers the reading without a start/stop character in an ambiguous payload', () => {
        const widths = `
            6 2 9 6 6 5 5 5
            5 2 5 5 5 2 7 6
            6 3 4 4 6 6 7 7
            5 3 8 5 5 6 4
        `.trim().split(/\s+/).map(Number);
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(widths, paddedQuietZone));
        expect(result.getText()).toBe('A20A');
    });

    it('retains an unambiguous interior start/stop character', () => {
        const result = new CodaBarReader().decodeRow(firstRow, toBitArray(encodeWidths('A1BB')));
        expect(result.getText()).toBe('A1BB');
    });

    it('rejects the invalid five-wide-element pattern', () => {
        const widths = encodeWidths('A+B');
        const invalidPlusPattern = 'nnwwwww';
        widths.splice(characterStride, characterRuns, ...widthsForPattern(invalidPlusPattern));
        expect(() => new CodaBarReader().decodeRow(firstRow, toBitArray(widths))).toThrow(NotFoundException);
    });
});
