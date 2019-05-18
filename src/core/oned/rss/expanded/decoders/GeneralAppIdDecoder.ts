import BitArray from '../../../../common/BitArray';
import FormatException from '../../../../FormatException';
import IllegalStateException from '../../../../IllegalStateException';
import StringBuilder from '../../../../util/StringBuilder';
import BlockParsedResult from './BlockParsedResult';
import CurrentParsingState from './CurrentParsingState';
import DecodedChar from './DecodedChar';
import DecodedInformation from './DecodedInformation';
import DecodedNumeric from './DecodedNumeric';
import FieldParser from './FieldParser';

export default class GeneralAppIdDecoder {

  private readonly information: BitArray;
  private readonly current: CurrentParsingState;
  private readonly buffer = new StringBuilder();

  constructor(information: BitArray) {
    this.information = information;
  }

  decodeAllCodes(buff: StringBuilder, initialPosition: number): string {
    let currentPosition = initialPosition;
    let remaining = null;
    do {
      let info = this.decodeGeneralPurposeField(currentPosition, remaining);
      let parsedFields = FieldParser.parseFieldsInGeneralPurpose(info.getNewString());
      if (parsedFields != null) {
        buff.append(parsedFields);
      }
      if (info.isRemaining()) {
        remaining = '' + info.getRemainingValue();
      } else {
        remaining = null;
      }

      if (currentPosition === info.getNewPosition()) { // No step forward!
        break;
      }
      currentPosition = info.getNewPosition();
    } while (true);

    return buff.toString();
  }

  private isStillNumeric(pos: number): boolean {
    // It's numeric if it still has 7 positions
    // and one of the first 4 bits is "1".
    if (pos + 7 > this.information.getSize()) {
      return pos + 4 <= this.information.getSize();
    }

    for (let i = pos; i < pos + 3; ++i) {
      if (this.information.get(i)) {
        return true;
      }
    }

    return this.information.get(pos + 3);
  }

  private decodeNumeric(pos: number): DecodedNumeric {
    if (pos + 7 > this.information.getSize()) {
      let numeric = this.extractNumericValueFromBitArray(pos, 4);
      if (numeric === 0) {
        return new DecodedNumeric(this.information.getSize(), DecodedNumeric.FNC1, DecodedNumeric.FNC1);
      }
      return new DecodedNumeric(this.information.getSize(), numeric - 1, DecodedNumeric.FNC1);
    }
    let numeric = this.extractNumericValueFromBitArray(pos, 7);

    let digit1 = (numeric - 8) / 11;
    let digit2 = (numeric - 8) % 11;

    return new DecodedNumeric(pos + 7, digit1, digit2);
  }

  extractNumericValueFromBitArray(pos: number, bits: number): number {
    return GeneralAppIdDecoder.extractNumericValueFromBitArray(this.information, pos, bits);
  }

  static extractNumericValueFromBitArray(information: BitArray, pos: number, bits: number): number {
    let value = 0;
    for (let i = 0; i < bits; ++i) {
      if (information.get(pos + i)) {
        value |= 1 << (bits - i - 1);
      }
    }

    return value;
  }

  decodeGeneralPurposeField(pos: number, remaining: string): DecodedInformation {
    // this.buffer.setLength(0);
    this.buffer.setLengthToZero();

    if (remaining != null) {
      this.buffer.append(remaining);
    }

    this.current.setPosition(pos);

    let lastDecoded = this.parseBlocks();
    if (lastDecoded != null && lastDecoded.isRemaining()) {
      return new DecodedInformation(this.current.getPosition(), this.buffer.toString(), lastDecoded.getRemainingValue());
    }
    return new DecodedInformation(this.current.getPosition(), this.buffer.toString());
  }

  private parseBlocks(): DecodedInformation {
    let isFinished: boolean;
    let result: BlockParsedResult;
    do {
      let initialPosition = this.current.getPosition();

      if (this.current.isAlpha()) {
        result = this.parseAlphaBlock();
        isFinished = result.isFinished();
      } else if (this.current.isIsoIec646()) {
        result = this.parseIsoIec646Block();
        isFinished = result.isFinished();
      } else { // it must be numeric
        result = this.parseNumericBlock();
        isFinished = result.isFinished();
      }

      let positionChanged: boolean = initialPosition !== this.current.getPosition();
      if (!positionChanged && !isFinished) {
        break;
      }
    } while (!isFinished);

    return result.getDecodedInformation();
  }

  private parseNumericBlock(): BlockParsedResult {
    while (this.isStillNumeric(this.current.getPosition())) {
      let numeric: DecodedNumeric = this.decodeNumeric(this.current.getPosition());
      this.current.setPosition(numeric.getNewPosition());

      if (numeric.isFirstDigitFNC1()) {
        let information: DecodedInformation;
        if (numeric.isSecondDigitFNC1()) {
          information = new DecodedInformation(this.current.getPosition(), this.buffer.toString());
        } else {
          information = new DecodedInformation(this.current.getPosition(), this.buffer.toString(), numeric.getSecondDigit());
        }
        return new BlockParsedResult(true, information);
      }
      this.buffer.append(numeric.getFirstDigit());

      if (numeric.isSecondDigitFNC1()) {
        let information = new DecodedInformation(this.current.getPosition(), this.buffer.toString());
        return new BlockParsedResult(true, information);
      }
      this.buffer.append(numeric.getSecondDigit());
    }

    if (this.isNumericToAlphaNumericLatch(this.current.getPosition())) {
      this.current.setAlpha();
      this.current.incrementPosition(4);
    }
    return new BlockParsedResult(false);
  }

  private parseIsoIec646Block(): BlockParsedResult {
    while (this.isStillIsoIec646(this.current.getPosition())) {
      let iso = this.decodeIsoIec646(this.current.getPosition());
      this.current.setPosition(iso.getNewPosition());

      if (iso.isFNC1()) {
        let information = new DecodedInformation(this.current.getPosition(), this.buffer.toString());
        return new BlockParsedResult(true, information);
      }
      this.buffer.append(iso.getValue());
    }

    if (this.isAlphaOr646ToNumericLatch(this.current.getPosition())) {
      this.current.incrementPosition(3);
      this.current.setNumeric();
    } else if (this.isAlphaTo646ToAlphaLatch(this.current.getPosition())) {
      if (this.current.getPosition() + 5 < this.information.getSize()) {
        this.current.incrementPosition(5);
      } else {
        this.current.setPosition(this.information.getSize());
      }

      this.current.setAlpha();
    }
    return new BlockParsedResult(false);
  }

  private parseAlphaBlock(): BlockParsedResult {
    while (this.isStillAlpha(this.current.getPosition())) {
      let alpha = this.decodeAlphanumeric(this.current.getPosition());
      this.current.setPosition(alpha.getNewPosition());

      if (alpha.isFNC1()) {
        let information = new DecodedInformation(this.current.getPosition(), this.buffer.toString());
        return new BlockParsedResult(true, information); // end of the char block
      }

      this.buffer.append(alpha.getValue());
    }

    if (this.isAlphaOr646ToNumericLatch(this.current.getPosition())) {
      this.current.incrementPosition(3);
      this.current.setNumeric();
    } else if (this.isAlphaTo646ToAlphaLatch(this.current.getPosition())) {
      if (this.current.getPosition() + 5 < this.information.getSize()) {
        this.current.incrementPosition(5);
      } else {
        this.current.setPosition(this.information.getSize());
      }

      this.current.setIsoIec646();
    }
    return new BlockParsedResult(false);
  }

  private isStillIsoIec646(pos: number): boolean {
    if (pos + 5 > this.information.getSize()) {
      return false;
    }

    let fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
    if (fiveBitValue >= 5 && fiveBitValue < 16) {
      return true;
    }

    if (pos + 7 > this.information.getSize()) {
      return false;
    }

    let sevenBitValue = this.extractNumericValueFromBitArray(pos, 7);
    if (sevenBitValue >= 64 && sevenBitValue < 116) {
      return true;
    }

    if (pos + 8 > this.information.getSize()) {
      return false;
    }

    let eightBitValue = this.extractNumericValueFromBitArray(pos, 8);
    return eightBitValue >= 232 && eightBitValue < 253;

  }

  private decodeIsoIec646(pos: number): DecodedChar {
    let fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
    if (fiveBitValue === 15) {
      return new DecodedChar(pos + 5, DecodedChar.FNC1);
    }

    if (fiveBitValue >= 5 && fiveBitValue < 15) {
      return new DecodedChar(pos + 5, ('0' + (fiveBitValue - 5)));
    }

    let sevenBitValue = this.extractNumericValueFromBitArray(pos, 7);

    if (sevenBitValue >= 64 && sevenBitValue < 90) {
      return new DecodedChar(pos + 7, ('' + (sevenBitValue + 1)));
    }

    if (sevenBitValue >= 90 && sevenBitValue < 116) {
      return new DecodedChar(pos + 7, ('' + (sevenBitValue + 7)));
    }

    let eightBitValue = this.extractNumericValueFromBitArray(pos, 8);
    let c;
    switch (eightBitValue) {
      case 232:
        c = '!';
        break;
      case 233:
        c = '"';
        break;
      case 234:
        c = '%';
        break;
      case 235:
        c = '&';
        break;
      case 236:
        c = '\'';
        break;
      case 237:
        c = '(';
        break;
      case 238:
        c = ')';
        break;
      case 239:
        c = '*';
        break;
      case 240:
        c = '+';
        break;
      case 241:
        c = ',';
        break;
      case 242:
        c = '-';
        break;
      case 243:
        c = '.';
        break;
      case 244:
        c = '/';
        break;
      case 245:
        c = ':';
        break;
      case 246:
        c = ';';
        break;
      case 247:
        c = '<';
        break;
      case 248:
        c = '=';
        break;
      case 249:
        c = '>';
        break;
      case 250:
        c = '?';
        break;
      case 251:
        c = '_';
        break;
      case 252:
        c = ' ';
        break;
      default:
        throw new FormatException();
    }
    return new DecodedChar(pos + 8, c);
  }

  private isStillAlpha(pos: number): boolean {
    if (pos + 5 > this.information.getSize()) {
      return false;
    }

    // We now check if it's a valid 5-bit value (0..9 and FNC1)
    let fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
    if (fiveBitValue >= 5 && fiveBitValue < 16) {
      return true;
    }

    if (pos + 6 > this.information.getSize()) {
      return false;
    }

    let sixBitValue = this.extractNumericValueFromBitArray(pos, 6);
    return sixBitValue >= 16 && sixBitValue < 63; // 63 not included
  }

  private decodeAlphanumeric(pos: number): DecodedChar {
    let fiveBitValue = this.extractNumericValueFromBitArray(pos, 5);
    if (fiveBitValue === 15) {
      return new DecodedChar(pos + 5, DecodedChar.FNC1);
    }

    if (fiveBitValue >= 5 && fiveBitValue < 15) {
      return new DecodedChar(pos + 5, ('0' + (fiveBitValue - 5)));
    }

    let sixBitValue = this.extractNumericValueFromBitArray(pos, 6);

    if (sixBitValue >= 32 && sixBitValue < 58) {
      return new DecodedChar(pos + 6, ('' + (sixBitValue + 33)));
    }

    let c;
    switch (sixBitValue) {
      case 58:
        c = '*';
        break;
      case 59:
        c = ',';
        break;
      case 60:
        c = '-';
        break;
      case 61:
        c = '.';
        break;
      case 62:
        c = '/';
        break;
      default:
        throw new IllegalStateException('Decoding invalid alphanumeric value: ' + sixBitValue);
    }
    return new DecodedChar(pos + 6, c);
  }

  private isAlphaTo646ToAlphaLatch(pos: number): boolean {
    if (pos + 1 > this.information.getSize()) {
      return false;
    }

    for (let i = 0; i < 5 && i + pos < this.information.getSize(); ++i) {
      if (i === 2) {
        if (!this.information.get(pos + 2)) {
          return false;
        }
      } else if (this.information.get(pos + i)) {
        return false;
      }
    }

    return true;
  }

  private isAlphaOr646ToNumericLatch(pos: number): boolean {
    // Next is alphanumeric if there are 3 positions and they are all zeros
    if (pos + 3 > this.information.getSize()) {
      return false;
    }

    for (let i = pos; i < pos + 3; ++i) {
      if (this.information.get(i)) {
        return false;
      }
    }
    return true;
  }

  private isNumericToAlphaNumericLatch(pos: number): boolean {
    // Next is alphanumeric if there are 4 positions and they are all zeros, or
    // if there is a subset of this just before the end of the symbol
    if (pos + 1 > this.information.getSize()) {
      return false;
    }

    for (let i = 0; i < 4 && i + pos < this.information.getSize(); ++i) {
      if (this.information.get(pos + i)) {
        return false;
      }
    }
    return true;
  }


}
