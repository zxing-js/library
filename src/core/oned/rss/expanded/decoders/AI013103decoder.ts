import AI013x0xDecoder from './AI013x0xDecoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';

export default class AI013103decoder extends AI013x0xDecoder {
  constructor(information: BitArray) {
    super(information);
  }

  protected addWeightCode(buf: StringBuilder, weight: number): void {
    buf.append('(3103)');
  }

  protected checkWeight(weight: number): number {
    return weight;
  }

}
