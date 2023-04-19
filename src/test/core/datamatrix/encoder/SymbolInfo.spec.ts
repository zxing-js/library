import * as assert from 'assert';

import {
  DataMatrixSymbolInfo as SymbolInfo,
  DataMatrixSymbolShapeHint as SymbolShapeHint,
} from '@zxing/library';
import { assertEquals, assertThrow } from '../../util/AssertUtils';

describe('SymbolInfoTest', () => {
  it('testSymbolInfo', () => {
    let info = SymbolInfo.lookup(3);
    assertEquals(5, info.getErrorCodewords());
    assertEquals(8, info.matrixWidth);
    assertEquals(8, info.matrixHeight);
    assertEquals(10, info.getSymbolWidth());
    assertEquals(10, info.getSymbolHeight());

    info = SymbolInfo.lookup(3, SymbolShapeHint.FORCE_RECTANGLE);
    assertEquals(7, info.getErrorCodewords());
    assertEquals(16, info.matrixWidth);
    assertEquals(6, info.matrixHeight);
    assertEquals(18, info.getSymbolWidth());
    assertEquals(8, info.getSymbolHeight());

    info = SymbolInfo.lookup(9);
    assertEquals(11, info.getErrorCodewords());
    assertEquals(14, info.matrixWidth);
    assertEquals(6, info.matrixHeight);
    assertEquals(32, info.getSymbolWidth());
    assertEquals(8, info.getSymbolHeight());

    info = SymbolInfo.lookup(9, SymbolShapeHint.FORCE_SQUARE);
    assertEquals(12, info.getErrorCodewords());
    assertEquals(14, info.matrixWidth);
    assertEquals(14, info.matrixHeight);
    assertEquals(16, info.getSymbolWidth());
    assertEquals(16, info.getSymbolHeight());

    //There's no rectangular symbol for more than 1558 data codewords
    /*assertThrow(
      () => SymbolInfo.lookup(0),
      "Can't find a symbol arrangement that matches the message. Data codewords: 0"
    );*/

    //"There's no rectangular symbol for 50 data codewords"
    /*assertThrow(
      () => SymbolInfo.lookup(50, SymbolShapeHint.FORCE_RECTANGLE),
      "Can't find a symbol arrangement that matches the message. Data codewords: 50"
    );*/

    info = SymbolInfo.lookup(35);
    assertEquals(24, info.getSymbolWidth());
    assertEquals(24, info.getSymbolHeight());

    /*const fixedSize = new Dimension(26, 26);
    info = SymbolInfo.lookup(
      35,
      SymbolShapeHint.FORCE_NONE,
      fixedSize,
      fixedSize,
      false
    );
    assertEquals(info).toBeDefined();
    assertEquals(26,info.getSymbolWidth());
    assertEquals(26,info.getSymbolHeight());
    
    info = SymbolInfo.lookup(45,
                             SymbolShapeHint.FORCE_NONE, fixedSize, fixedSize, false);
    assertNull(info);

    Dimension minSize = fixedSize;
    Dimension maxSize = new Dimension(32, 32);

    info = SymbolInfo.lookup(35,
                             SymbolShapeHint.FORCE_NONE, minSize, maxSize, false);
    assertNotNull(info);
    assertEquals(26, info.getSymbolWidth());
    assertEquals(26, info.getSymbolHeight());

    info = SymbolInfo.lookup(40,
                             SymbolShapeHint.FORCE_NONE, minSize, maxSize, false);
    assertNotNull(info);
    assertEquals(26, info.getSymbolWidth());
    assertEquals(26, info.getSymbolHeight());

    info = SymbolInfo.lookup(45,
                             SymbolShapeHint.FORCE_NONE, minSize, maxSize, false);
    assertNotNull(info);
    assertEquals(32, info.getSymbolWidth());
    assertEquals(32, info.getSymbolHeight());

    info = SymbolInfo.lookup(63,
                             SymbolShapeHint.FORCE_NONE, minSize, maxSize, false);
    assertNull(info);*/
  });
});
