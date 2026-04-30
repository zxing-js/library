import StringBuilder from '../../util/StringBuilder';
import Dimension from '../../Dimension';
import { SymbolShapeHint } from './constants';
import SymbolInfo from './SymbolInfo';

export class EncoderContext {
  private shape: SymbolShapeHint;
  private minSize: Dimension;
  private maxSize: Dimension;
  private codewords: StringBuilder;
  pos: number = 0;
  private newEncoding: number;
  private symbolInfo: SymbolInfo;
  private skipAtEnd: number = 0;

  constructor(private readonly msg: string) {
    // From this point on Strings are not Unicode anymore!
    const msgBinary = msg.split('').map(c => c.charCodeAt(0));
    const sb = new StringBuilder();
    for (let i = 0, c = msgBinary.length; i < c; i++) {
      const ch = String.fromCharCode(msgBinary[i] & 0xff);
      if (ch === '?' && msg.charAt(i) !== '?') {
        throw new Error(
          'Message contains characters outside ISO-8859-1 encoding.'
        );
      }
      sb.append(ch);
    }
    this.msg = sb.toString(); // Not Unicode here!
    this.shape = SymbolShapeHint.FORCE_NONE;
    this.codewords = new StringBuilder();
    this.newEncoding = -1;
  }

  public setSymbolShape(shape: SymbolShapeHint) {
    this.shape = shape;
  }

  public setSizeConstraints(minSize: Dimension, maxSize: Dimension) {
    this.minSize = minSize;
    this.maxSize = maxSize;
  }

  public getMessage(): string {
    return this.msg;
  }

  public setSkipAtEnd(count: number) {
    this.skipAtEnd = count;
  }

  public getCurrentChar() {
    return this.msg.charCodeAt(this.pos);
  }

  public getCurrent() {
    return this.msg.charCodeAt(this.pos);
  }

  public getCodewords() {
    return this.codewords;
  }

  public writeCodewords(codewords: string) {
    this.codewords.append(codewords);
  }

  public writeCodeword(codeword: number | string) {
    this.codewords.append(codeword);
  }

  public getCodewordCount(): number {
    return this.codewords.length();
  }

  public getNewEncoding() {
    return this.newEncoding;
  }

  public signalEncoderChange(encoding: number) {
    this.newEncoding = encoding;
  }

  public resetEncoderSignal() {
    this.newEncoding = -1;
  }

  public hasMoreCharacters(): boolean {
    return this.pos < this.getTotalMessageCharCount();
  }

  private getTotalMessageCharCount(): number {
    return this.msg.length - this.skipAtEnd;
  }

  public getRemainingCharacters(): number {
    return this.getTotalMessageCharCount() - this.pos;
  }

  public getSymbolInfo() {
    return this.symbolInfo;
  }

  public updateSymbolInfo(len = this.getCodewordCount()) {
    if (this.symbolInfo == null || len > this.symbolInfo.getDataCapacity()) {
      this.symbolInfo = SymbolInfo.lookup(
        len,
        this.shape,
        this.minSize,
        this.maxSize,
        true
      );
    }
  }

  public resetSymbolInfo() {
    this.symbolInfo = null;
  }
}
