import {
  ZXingStringBuilder as StringBuilder,
  DataMatrixErrorCorrection as ErrorCorrection,
  DataMatrixSymbolInfo as SymbolInfo,
} from '@zxing/library';
import { assertEquals } from '../../util/AssertUtils';
import { visualize } from './HighLevelEncoder.spec';

describe('ErrorCorrectionTest', () => {
  it('testRS', () => {
    //Sample from Annexe R in ISO/IEC 16022:2000(E)
    const sb = new StringBuilder();
    sb.append(142);
    sb.append(164);
    sb.append(186);
    let cw = sb.toString();

    const symbolInfo = SymbolInfo.lookup(3);
    let s = ErrorCorrection.encodeECC200(cw, symbolInfo);
    let visualized = visualize(s);
    assertEquals(visualized, '142 164 186 114 25 5 88 102');

    //"A" encoded (ASCII encoding + 2 padding characters)
    sb.setLengthToZero();
    sb.append(66);
    sb.append(129);
    sb.append(70);

    cw = sb.toString();
    s = ErrorCorrection.encodeECC200(cw, symbolInfo);
    visualized = visualize(s);
    assertEquals(visualized, '66 129 70 138 234 82 82 95');
  });
});
