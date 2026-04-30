import MicroQRDataMask from '../../../../core/microqr/decoder/MicroQRDataMask';
import BitMatrix from '../../../../core/common/BitMatrix';

describe('MicroQRDataMask', () => {

    function countFlippedBits(mask: MicroQRDataMask, dim: number): number {
        // Count cells that would be flipped by the mask
        // We test by applying unmask to an all-false matrix and counting set bits
        const bits = new BitMatrix(dim);
        mask.unmaskBitMatrix(bits, dim);
        let count = 0;
        for (let y = 0; y < dim; y++) {
            for (let x = 0; x < dim; x++) {
                if (bits.get(x, y)) count++;
            }
        }
        return count;
    }

    // Note: bits.get(x, y) → x=col=j, y=row=i

    it('mask 0: i mod 2 == 0', () => {
        const mask = MicroQRDataMask.forIndex(0);
        const dim = 11;
        const bits = new BitMatrix(dim);
        mask.unmaskBitMatrix(bits, dim);

        // Row 0 (i=0): all cells flipped (0%2=0)
        expect(bits.get(0, 0)).toBe(true);   // (i=0,j=0)
        expect(bits.get(1, 0)).toBe(true);   // (i=0,j=1)
        expect(bits.get(5, 0)).toBe(true);   // (i=0,j=5)
        // Row 1 (i=1): no cells flipped (1%2≠0)
        expect(bits.get(0, 1)).toBe(false);  // (i=1,j=0)
        expect(bits.get(5, 1)).toBe(false);  // (i=1,j=5)
        // Row 2 (i=2): all cells flipped (2%2=0)
        expect(bits.get(0, 2)).toBe(true);   // (i=2,j=0)
        expect(bits.get(3, 2)).toBe(true);   // (i=2,j=3)
    });

    it('mask 1: ((i div 2) + (j div 3)) mod 2 == 0', () => {
        const mask = MicroQRDataMask.forIndex(1);
        const dim = 11;
        const bits = new BitMatrix(dim);
        mask.unmaskBitMatrix(bits, dim);

        // (i=0,j=0): (0+0)%2=0 → flipped
        expect(bits.get(0, 0)).toBe(true);
        // (i=0,j=2): (0+0)%2=0 → flipped (floor(0/2)=0, floor(2/3)=0)
        expect(bits.get(2, 0)).toBe(true);
        // (i=0,j=3): (0+1)%2=1 → not flipped (floor(0/2)=0, floor(3/3)=1)
        expect(bits.get(3, 0)).toBe(false);
        // (i=1,j=0): (0+0)%2=0 → flipped (floor(1/2)=0, floor(0/3)=0)
        expect(bits.get(0, 1)).toBe(true);
        // (i=2,j=0): (1+0)%2=1 → not flipped (floor(2/2)=1, floor(0/3)=0)
        expect(bits.get(0, 2)).toBe(false);
        // (i=4,j=0): (2+0)%2=0 → flipped (floor(4/2)=2)
        expect(bits.get(0, 4)).toBe(true);
        // (i=0,j=6): (0+2)%2=0 → flipped (floor(6/3)=2)
        expect(bits.get(6, 0)).toBe(true);
        // (i=0,j=5): (0+1)%2=1 → not flipped (floor(5/3)=1)
        expect(bits.get(5, 0)).toBe(false);
    });

    it('mask 2: ((i*j mod 2) + (i*j mod 3)) mod 2 == 0', () => {
        const mask = MicroQRDataMask.forIndex(2);
        const dim = 11;
        const bits = new BitMatrix(dim);
        mask.unmaskBitMatrix(bits, dim);

        // Any cell where i=0 or j=0: i*j=0 → (0+0)%2=0 → always flipped
        expect(bits.get(0, 0)).toBe(true);
        expect(bits.get(5, 0)).toBe(true);  // i=0,j=5
        expect(bits.get(0, 5)).toBe(true);  // i=5,j=0
        // (i=1,j=1): tmp=1; (1%2+1%3)%2=(1+1)%2=0 → flipped
        expect(bits.get(1, 1)).toBe(true);
        // (i=1,j=3): tmp=3; (1%2+3%3)%2=(1+0)%2=1 → not flipped
        expect(bits.get(3, 1)).toBe(false);
        // (i=2,j=2): tmp=4; (4%2+4%3)%2=(0+1)%2=1 → not flipped
        expect(bits.get(2, 2)).toBe(false);
        // (i=2,j=3): tmp=6; (6%2+6%3)%2=(0+0)%2=0 → flipped
        expect(bits.get(3, 2)).toBe(true);
    });

    it('mask 3: ((i+j) mod 2 + i*j mod 3) mod 2 == 0', () => {
        const mask = MicroQRDataMask.forIndex(3);
        const dim = 11;
        const bits = new BitMatrix(dim);
        mask.unmaskBitMatrix(bits, dim);

        // (i=0,j=0): ((0+0)%2 + 0%3)%2=(0+0)%2=0 → flipped
        expect(bits.get(0, 0)).toBe(true);
        // (i=0,j=1): ((0+1)%2 + 0%3)%2=(1+0)%2=1 → not flipped
        expect(bits.get(1, 0)).toBe(false);
        // (i=0,j=2): ((0+2)%2 + 0%3)%2=(0+0)%2=0 → flipped
        expect(bits.get(2, 0)).toBe(true);
        // (i=1,j=0): ((1+0)%2 + 0%3)%2=(1+0)%2=1 → not flipped
        expect(bits.get(0, 1)).toBe(false);
        // (i=2,j=0): ((2+0)%2 + 0%3)%2=(0+0)%2=0 → flipped
        expect(bits.get(0, 2)).toBe(true);
        // (i=3,j=3): ((3+3)%2 + 9%3)%2=(0+0)%2=0 → flipped
        expect(bits.get(3, 3)).toBe(true);
        // (i=2,j=2): ((2+2)%2 + 4%3)%2=(0+1)%2=1 → not flipped
        expect(bits.get(2, 2)).toBe(false);
    });

    it('applying unmask twice restores original', () => {
        for (let maskIdx = 0; maskIdx < 4; maskIdx++) {
            const mask = MicroQRDataMask.forIndex(maskIdx);
            const dim = 13;
            const bits = new BitMatrix(dim);

            // Set some bits
            bits.set(2, 3);
            bits.set(5, 7);
            bits.set(10, 10);

            const original: boolean[][] = [];
            for (let y = 0; y < dim; y++) {
                original[y] = [];
                for (let x = 0; x < dim; x++) {
                    original[y][x] = bits.get(x, y);
                }
            }

            mask.unmaskBitMatrix(bits, dim);
            mask.unmaskBitMatrix(bits, dim); // apply twice = identity

            for (let y = 0; y < dim; y++) {
                for (let x = 0; x < dim; x++) {
                    expect(bits.get(x, y)).toBe(original[y][x]);
                }
            }
        }
    });

    it('should throw for invalid mask index', () => {
        expect(() => MicroQRDataMask.forIndex(-1)).toThrow();
        expect(() => MicroQRDataMask.forIndex(4)).toThrow();
    });
});
