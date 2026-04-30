import ExpandedPair from './ExpandedPair';

export default class ExpandedRow {
  private readonly pairs: Array<ExpandedPair>;
  private readonly rowNumber: number;

  constructor(pairs: Array<ExpandedPair>, rowNumber: number) {
    this.pairs = [...pairs];
    this.rowNumber = rowNumber;
  }

  getPairs(): Array<ExpandedPair> {
    return this.pairs;
  }

  getRowNumber(): number {
    return this.rowNumber;
  }

  isEquivalent(otherPairs: Array<ExpandedPair>): boolean {
    return ExpandedRow.listEquals(this.getPairs(), otherPairs);
  }

  public toString(): String {
    return '{ ' + this.pairs + ' }';
  }

  /**
   * Two rows are equal if they contain the same pairs in the same order.
   */
  // @Override
  public static equals(o1: ExpandedRow | null, o2: any): boolean {
    if (o1 === null) return o2 === null;
    if (!(o2 instanceof ExpandedRow)) {
      return false;
    }
    return ExpandedRow.listEquals(o1.pairs, o2.getPairs());
  }

  static listEquals(pairs1: Array<ExpandedPair>, pairs2: Array<ExpandedPair>): boolean {
    if (pairs1.length !== pairs2.length) return false;
    return pairs1.every((pair1, index) => {
      const pair2 = pairs2[index];
      return ExpandedPair.equals(pair1, pair2);
    });
  }
}
