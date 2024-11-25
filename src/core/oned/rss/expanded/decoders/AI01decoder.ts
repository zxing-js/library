import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';

export default abstract class AI01decoder extends AbstractExpandedDecoder {

  static readonly GTIN_SIZE: number = 40;

  constructor(information: BitArray) {
    super(information);
  }

  encodeCompressedGtin(buf: StringBuilder, currentPos: number): void {
    buf.append('(01)');
    const initialPosition = buf.length();
    buf.append('9');

    this.encodeCompressedGtinWithoutAI(buf, currentPos, initialPosition);
  }

  encodeCompressedGtinWithoutAI(buf: StringBuilder, currentPos: number, initialBufferPosition: number): void {
    for (let i = 0; i < 4; ++i) {
      const currentBlock /* int */ = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos + 10 * i, 10);
      // Pad with leading zeroes.
      if (currentBlock < 100) {
        buf.append('0');
      }
      if (currentBlock < 10) {
        buf.append('0');
      }
      buf.append('' + currentBlock);
    }

    AI01decoder.appendCheckDigit(buf, initialBufferPosition);
  }

  private static appendCheckDigit(buf: StringBuilder, currentPos: number): void {
    let checkDigit = 0;
    for (let i = 0; i < 13; i++) {
      const digit = buf.charAt(i + currentPos).charCodeAt(0) - '0'.charCodeAt(0);
      checkDigit += (i & 0x01) === 0 ? 3 * digit : digit;
    }

    checkDigit = 10 - (checkDigit % 10);
    if (checkDigit === 10) {
      checkDigit = 0;
    }

    buf.append('' + checkDigit);
  }

}
