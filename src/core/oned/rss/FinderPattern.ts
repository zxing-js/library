
import ResultPoint from '../../ResultPoint';

export default class FinderPattern {

    private value: number;
    private startEnd: number[];
    private resultPoints: Array<ResultPoint>;

    public constructor(value: number, startEnd: number[], start: number, end: number, rowNumber: number) {
        this.value = value;
        this.startEnd = startEnd;
        this.resultPoints = new Array<ResultPoint>();
        this.resultPoints.push(new ResultPoint(start, rowNumber));
        this.resultPoints.push(new ResultPoint(end, rowNumber));
    }

    public getValue(): number {
        return this.value;
    }

    public getStartEnd(): number[] {
        return this.startEnd;
    }

    public getResultPoints(): Array<ResultPoint> {
        return this.resultPoints;
    }

    public equals(o: object): boolean {
        if (!(o instanceof FinderPattern)) {
            return false;
        }
        const that = <FinderPattern>o;
        return this.value === that.value;
    }

    public hashCode(): number {
        return this.value;
    }
}
