import BitArray from '../../../../common/BitArray';
import GeneralAppIdDecoder from './GeneralAppIdDecoder';

export default abstract class AbstractExpandedDecoder {

  private readonly information: BitArray;

  private readonly generalDecoder: GeneralAppIdDecoder;

  constructor(information: BitArray) {
    this.information = information;
    this.generalDecoder = new GeneralAppIdDecoder(information);
  }

  protected getInformation(): BitArray {
    return this.information;
  }

  protected getGeneralDecoder(): GeneralAppIdDecoder {
    return this.generalDecoder;
  }

  public abstract parseInformation(): string;

  // createDecoder moved to own file due to circular dependency
}
