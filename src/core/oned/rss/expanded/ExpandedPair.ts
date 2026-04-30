import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';

export default class ExpandedPair {
  private readonly leftChar: DataCharacter | null;
  private readonly rightChar: DataCharacter | null;
  private readonly finderPattern: FinderPattern | null;

  constructor(
    leftChar: DataCharacter | null,
    rightChar: DataCharacter | null,
    finderPatter: FinderPattern | null,
  ) {
    this.leftChar = leftChar;
    this.rightChar = rightChar;
    this.finderPattern = finderPatter;
  }

  getLeftChar(): DataCharacter | null {
    return this.leftChar;
  }

  getRightChar(): DataCharacter | null {
    return this.rightChar;
  }

  getFinderPattern(): FinderPattern | null {
    return this.finderPattern;
  }

  mustBeLast(): boolean {
    return this.rightChar === null;
  }

  toString(): String {
    return '[ ' + this.leftChar + ', ' + this.rightChar + ' : ' + (this.finderPattern === null ? 'null' : this.finderPattern.getValue()) + ' ]';
  }

  static equals(o1: ExpandedPair | null, o2: any): boolean {
    if (o2 === null) return o1 === null;
    if (!(o2 instanceof ExpandedPair)) {
      return false;
    }
    return (o1.leftChar === null ? o2.leftChar === null : o1.leftChar.equals(o2.leftChar)) &&
      (o1.rightChar === null ? o2.rightChar === null : o1.rightChar.equals(o2.rightChar)) &&
      (o1.finderPattern === null ? o2.finderPattern === null : o1.finderPattern.equals(o2.finderPattern));
  }

  hashCode(): number {
    return ExpandedPair.hashNotNull(this.leftChar) ^ ExpandedPair.hashNotNull(this.rightChar) ^ ExpandedPair.hashNotNull(this.finderPattern);
  }

  private static hashNotNull(o: { hashCode(): number }): number {
    return o === null ? 0 : o.hashCode();
  }
}

