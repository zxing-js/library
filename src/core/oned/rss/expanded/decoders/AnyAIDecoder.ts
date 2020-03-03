import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';


export default class AnyAIDecoder extends AbstractExpandedDecoder {

  private static readonly HEADER_SIZE: number = 2 + 1 + 2;

  constructor(information: BitArray) {
    super(information);
  }

  public parseInformation(): string {
    let buf = new StringBuilder();
    return this.getGeneralDecoder().decodeAllCodes(buf, AnyAIDecoder.HEADER_SIZE);
  }
}
