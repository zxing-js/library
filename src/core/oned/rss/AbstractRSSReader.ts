import MathUtils from '../../common/detector/MathUtils';
import NotFoundException from '../../NotFoundException';
import OneDReader from '../OneDReader';
// import Integer from '../../util/Integer';
// import Float from '../../util/Float';

export default abstract class AbstractRSSReader extends OneDReader {

  private static readonly MAX_AVG_VARIANCE: number = 0.2;
  private static readonly MAX_INDIVIDUAL_VARIANCE: number = 0.45;

  private static readonly MIN_FINDER_PATTERN_RATIO: number = 9.5 / 12.0;
  private static readonly MAX_FINDER_PATTERN_RATIO: number = 12.5 / 14.0;

    private readonly decodeFinderCounters: Int32Array;
    private readonly dataCharacterCounters: Int32Array;
    private readonly oddRoundingErrors: number[];
    private readonly evenRoundingErrors: number[];
    private readonly oddCounts: number[];
    private readonly evenCounts: number[];

    public constructor() {
        super();
        this.decodeFinderCounters = new Int32Array(4);
        this.dataCharacterCounters = new Int32Array(8);
        this.oddRoundingErrors = new Array<number>(4);
        this.evenRoundingErrors = new Array<number>(4);
        this.oddCounts = new Array<number>(this.dataCharacterCounters.length / 2);
        this.evenCounts = new Array<number>(this.dataCharacterCounters.length / 2);
    }

    protected getDecodeFinderCounters(): Int32Array {
        return this.decodeFinderCounters;
    }

    protected getDataCharacterCounters(): Int32Array {
        return this.dataCharacterCounters;
    }

  protected getOddRoundingErrors(): number[] {
    return this.oddRoundingErrors;
  }

  protected getEvenRoundingErrors(): number[] {
    return this.evenRoundingErrors;
  }

  protected getOddCounts(): number[] {
    return this.oddCounts;
  }

  protected getEvenCounts(): number[] {
    return this.evenCounts;
  }

  protected parseFinderValue(counters: Int32Array, finderPatterns: Int32Array[]): number {
    for (let value = 0; value < finderPatterns.length; value++) {
      if (OneDReader.patternMatchVariance(counters, finderPatterns[value], AbstractRSSReader.MAX_INDIVIDUAL_VARIANCE) < AbstractRSSReader.MAX_AVG_VARIANCE) {
        return value;
      }
    }
    throw new NotFoundException();
  }

  /**
   * @param array values to sum
   * @return sum of values
   * @deprecated call {@link MathUtils#sum(int[])}
   */
  protected static count(array: number[]) {
    return MathUtils.sum(new Int32Array(array));
  }

  protected static increment(array: number[], errors: number[]) {
    let index = 0;
    let biggestError = errors[0];
    for (let i = 1; i < array.length; i++) {
      if (errors[i] > biggestError) {
        biggestError = errors[i];
        index = i;
      }
    }
    array[index]++;
  }

  protected static decrement(array: number[], errors: number[]) {
    let index = 0;
    let biggestError = errors[0];
    for (let i = 1; i < array.length; i++) {
      if (errors[i] < biggestError) {
        biggestError = errors[i];
        index = i;
      }
    }
    array[index]--;
  }

  protected static isFinderPattern(counters: Int32Array): boolean {
    let firstTwoSum = counters[0] + counters[1];
    let sum = firstTwoSum + counters[2] + counters[3];
    let ratio = firstTwoSum / sum;
    if (ratio >= AbstractRSSReader.MIN_FINDER_PATTERN_RATIO && ratio <= AbstractRSSReader.MAX_FINDER_PATTERN_RATIO) {
      // passes ratio test in spec, but see if the counts are unreasonable
      let minCounter = Number.MAX_SAFE_INTEGER;
      let maxCounter = Number.MIN_SAFE_INTEGER;
      for (let counter of counters) {
        if (counter > maxCounter) {
          maxCounter = counter;
        }
        if (counter < minCounter) {
          minCounter = counter;
        }
      }
      return maxCounter < 10 * minCounter;
    }
    return false;
  }
}
