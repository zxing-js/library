import AI01weightDecoder from './AI01weightDecoder';
import BitArray from '../../../../common/BitArray';
import StringBuilder from '../../../../util/StringBuilder';
import NotFoundException from '../../../../NotFoundException';

export default abstract class AI013x0xDecoder extends AI01weightDecoder {
  private static readonly HEADER_SIZE = 4 + 1;
  private static readonly WEIGHT_SIZE = 15;

  constructor(information: BitArray) {
    super(information);
  }

  public parseInformation() {
    if (
      this.getInformation().getSize() !==
      AI013x0xDecoder.HEADER_SIZE +
        AI01weightDecoder.GTIN_SIZE +
        AI013x0xDecoder.WEIGHT_SIZE
    ) {
      throw new NotFoundException();
    }

    let buf = new StringBuilder();

    this.encodeCompressedGtin(buf, AI013x0xDecoder.HEADER_SIZE);
    this.encodeCompressedWeight(
      buf,
      AI013x0xDecoder.HEADER_SIZE + AI01weightDecoder.GTIN_SIZE,
      AI013x0xDecoder.WEIGHT_SIZE
    );

    return buf.toString();
  }
}
