import ExpandedPair from './ExpandedPair';


export default class ExpandedRow {
  private readonly pairs: Array<ExpandedPair>;
  private readonly rowNumber: number;
  private readonly wasReversed: boolean;

  constructor(pairs: Array<ExpandedPair>, rowNumber: number, wasReversed: boolean) {
    this.pairs = pairs;
    this.rowNumber = rowNumber;
    this.wasReversed = wasReversed;
  }

  getPairs(): Array<ExpandedPair> {
    return this.pairs;
  }

  getRowNumber(): number {
    return this.rowNumber;
  }

  isReversed(): boolean {
    return this.wasReversed;
  }
  // check implementation

  isEquivalent(otherPairs: Array<ExpandedPair>): boolean {
    return this.checkEqualitity(this, otherPairs);
  }
  // @Override

  public toString(): String {
    return '{ ' + this.pairs + ' }';
  }

  /**
   * Two rows are equal if they contain the same pairs in the same order.
   */
  // @Override
  // check implementation
  public equals(o1: ExpandedRow, o2: ExpandedRow): boolean {
    if (!(o1 instanceof ExpandedRow)) {
      return false;
    }
    return this.checkEqualitity(o1, o2) && o1.wasReversed === o2.wasReversed;
  }
  checkEqualitity(pair1: any, pair2: any): boolean {
    if (!pair1 || !pair2) return;
    let result;
    pair1.forEach((e1, i) => {
      pair2.forEach(e2 => {
        if (e1.getLeftChar().getValue() === e2.getLeftChar().getValue() && e1.getRightChar().getValue() === e2.getRightChar().getValue() && e1.getFinderPatter().getValue() === e2.getFinderPatter().getValue()) {
          result = true;
        }
      });
    });
    return result;
  }

  // @Override
  // check implementation
  // public int hashCode(): number {
  //   let hash = this.pairs.values ^ this.wasReversed
  //   //return pairs.hashCode() ^ Boolean.valueOf(wasReversed).hashCode();
  // }

}
