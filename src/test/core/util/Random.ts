import * as seedrandom from 'seedrandom';

export default class Random {
    private r: seedrandom.prng;
    public constructor(seed: string) {
        this.r = seedrandom(seed);
    }

    public next(max: number): number {
        return Math.floor(this.r() * max);
    }

    public nextInt(max: number): number {
        return this.next(max);
    }
}
