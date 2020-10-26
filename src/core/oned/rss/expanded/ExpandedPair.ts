import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';

export default class ExpandedPair {
  private readonly maybeLast: boolean;
  private readonly leftchar: DataCharacter;
  private readonly rightchar: DataCharacter;
  private readonly finderpattern: FinderPattern;

  constructor(leftChar: DataCharacter, rightChar: DataCharacter, finderPatter: FinderPattern, mayBeLast: boolean) {
    this.leftchar = leftChar;
    this.rightchar = rightChar;
    this.finderpattern = finderPatter;
    this.maybeLast = mayBeLast;
  }

  mayBeLast(): boolean {
    return this.maybeLast;
  }
  getLeftChar(): DataCharacter {
    return this.leftchar;
  }
  getRightChar(): DataCharacter {
    return this.rightchar;
  }
  getFinderPattern(): FinderPattern {
    return this.finderpattern;
  }
  mustBeLast() {
    return this.rightchar == null;
  }
  toString(): String {
    return '[ ' + this.leftchar + ', ' + this.rightchar + ' : ' + (this.finderpattern == null ? 'null' : this.finderpattern.getValue()) + ' ]';
  }

  static equals(o1: any, o2: any): boolean {
    if (!(o1 instanceof ExpandedPair)) {
      return false;
    }
    return ExpandedPair.equalsOrNull(o1.leftchar, o2.leftchar) &&
      ExpandedPair.equalsOrNull(o1.rightchar, o2.rightchar) &&
      ExpandedPair.equalsOrNull(o1.finderpattern, o2.finderpattern);
  }

  private static equalsOrNull(o1: any, o2: any): boolean {
    return o1 === null ? o2 === null : ExpandedPair.equals(o1, o2);
  }

  hashCode(): any {
    // return ExpandedPair.hashNotNull(leftChar) ^ hashNotNull(rightChar) ^ hashNotNull(finderPattern);
    let value = this.leftchar.getValue() ^ this.rightchar.getValue() ^ this.finderpattern.getValue();
    return value;
  }
  // To do - Re check the implementation
  // private static  hashNotNull(o: ExpandedPair): number {
  //   return o === null ? 0 : o.hashCode();
  // }
}

