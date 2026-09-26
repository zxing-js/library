import { assertEquals } from '../util/AssertUtils';

import StringBuilder from '@zxing/library/core/util/StringBuilder';
import UPCEReader from '@zxing/library/core/oned/UPCEReader';

describe('UPCEReader', () => {
  it('appends only the requested characters', () => {
    const builder = new StringBuilder();
    builder.appendChars(['A', 'B', 'C'], 1, 2);
    assertEquals(builder.toString(), 'BC');
  });

  it('expands a UPC-E code into the equivalent UPC-A', () => {
    assertEquals(UPCEReader.convertUPCEtoUPCA('01230000'), '012000003000');
    assertEquals(UPCEReader.convertUPCEtoUPCA('01234530'), '012300000450');
    assertEquals(UPCEReader.convertUPCEtoUPCA('01234540'), '012340000050');
    assertEquals(UPCEReader.convertUPCEtoUPCA('01234565'), '012345000065');
    assertEquals(UPCEReader.convertUPCEtoUPCA('0123000'), '01200000300');
  });
});
