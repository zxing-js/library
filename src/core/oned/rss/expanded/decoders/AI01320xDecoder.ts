import AI013x0xDecoder from './AI013x0xDecoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';

export default class AI01320xDecoder extends AI013x0xDecoder {
  constructor(information: BitArray) {
    super(information);
  }

  protected addWeightCode(buf: StringBuilder, weight: number): void {
    if (weight < 10000) {
      buf.append('(3202)');
    } else {
      buf.append('(3203)');
    }
  }

  protected checkWeight(weight: number): number {
    if (weight < 10000) {
      return weight;
    }
    return weight - 10000;
  }
}
