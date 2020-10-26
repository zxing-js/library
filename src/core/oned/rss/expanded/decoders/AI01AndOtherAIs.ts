import AI01decoder from './AI01decoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';

export default class AI01AndOtherAIs extends AI01decoder {

  private static readonly HEADER_SIZE = 1 + 1 + 2; // first bit encodes the linkage flag,
  // the second one is the encodation method, and the other two are for the variable length

  constructor(information: BitArray) {
    super(information);
  }

  public parseInformation(): string {

    let buff = new StringBuilder();
    buff.append('(01)');
    let initialGtinPosition = buff.length();
    let firstGtinDigit = this.getGeneralDecoder().extractNumericValueFromBitArray(AI01AndOtherAIs.HEADER_SIZE, 4);
    buff.append(firstGtinDigit);
    this.encodeCompressedGtinWithoutAI(buff, AI01AndOtherAIs.HEADER_SIZE + 4, initialGtinPosition);
    return this.getGeneralDecoder().decodeAllCodes(buff, AI01AndOtherAIs.HEADER_SIZE + 44);
  }

}
