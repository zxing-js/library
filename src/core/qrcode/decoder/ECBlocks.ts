import ECB from './ECB';

/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
export default class ECBlocks {
    private ecBlocks: ECB[];

    public constructor(private ecCodewordsPerBlock: number /*int*/, ...ecBlocks: ECB[]) {
        this.ecBlocks = ecBlocks;
    }

    public getECCodewordsPerBlock(): number /*int*/ {
        return this.ecCodewordsPerBlock;
    }

    public getNumBlocks(): number /*int*/ {
        let total = 0;
        const ecBlocks = this.ecBlocks;
        for (const ecBlock of ecBlocks) {
            total += ecBlock.getCount();
        }
        return total;
    }

    public getTotalECCodewords(): number /*int*/ {
        return this.ecCodewordsPerBlock * this.getNumBlocks();
    }

    public getECBlocks(): ECB[] {
        return this.ecBlocks;
    }
}
