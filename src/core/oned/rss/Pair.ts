import DataCharacter from './DataCharacter';
import FinderPattern from './FinderPattern';

export default class Pair extends DataCharacter {

    private finderPattern: FinderPattern;
    private count: number = 0;

    public constructor(value: number, checksumPortion: number, finderPattern: FinderPattern) {
        super(value, checksumPortion);
        this.finderPattern = finderPattern;
    }

    getFinderPattern(): FinderPattern {
        return this.finderPattern;
    }

    getCount(): number {
        return this.count;
    }

    incrementCount() {
        this.count++;
    }

}
