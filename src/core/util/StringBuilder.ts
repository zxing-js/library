import { char, int } from '../../customTypings';
import ArgumentException from '../ArgumentException';
import CharacterSetECI from '../common/CharacterSetECI';
import StringUtils from '../common/StringUtils';

export default class StringBuilder {

  private encoding: CharacterSetECI;

  public constructor(private value: string = '') { }

  public enableDecoding(encoding: CharacterSetECI): StringBuilder {
    this.encoding = encoding;
    return this;
  }

  public append(s: string | number): StringBuilder {
    this.value += this.normalizeString(s);
    return this;
  }

  public normalizeString(s: string | number) {
    if (typeof s === 'string') {
      return s.toString();
    }

    if (this.encoding) {
      // use passed format (fromCharCode will return UTF8 encoding)
      return StringUtils.castAsNonUtf8Char(s, this.encoding);
    }

    // correctly converts from UTF-8, but not other encodings
    return String.fromCharCode(s);
  }

  public appendChars(str: char[] | string[], offset: int, len: int): StringBuilder {
    const strLength = str.length;
    if (strLength < len) throw new ArgumentException('`str` must be the same size or smaller than `len`');
    for (let i = offset; i < offset + len; i++) {
      if (i > strLength) throw new ArgumentException('Index out of bounds!');
      this.append(str[i]);
    }
    return this;
  }

  public length(): number {
    return this.value.length;
  }

  public charAt(n: number): string {
    return this.value.charAt(n);
  }

  public deleteCharAt(n: number) {
    this.value = this.value.substr(0, n) + this.value.substring(n + 1);
  }

  public setCharAt(n: number, c: string) {
    this.value = this.value.substr(0, n) + c + this.value.substr(n + 1);
  }

  public substring(start: int, end: int): string {
    return this.value.substring(start, end);
  }

  public setLengthToZero(): void {
    this.value = '';
  }

  public toString(): string {
    return this.value;
  }

  public insert(n: number, s: string | number, replace: int = 0) {
    const c = this.normalizeString(s);
    const fromLength = !replace && replace !== 0 ? c.length : replace;
    this.value = this.value.substr(0, n) + c + this.value.substr(n + fromLength);
    return this;
  }
}
