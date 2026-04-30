import * as assert from 'assert';

import {
  ZXingStringBuilder as StringBuilder,
  ZXingInteger as Integer,
  DataMatrixDefaultPlacement as DefaultPlacement,
} from '@zxing/library';

class DebugPlacement extends DefaultPlacement {
  toBitFieldStringArray(): string[] {
    const bits = this.getBits();
    const numrows = this.getNumrows();
    const numcols = this.getNumcols();
    const array: string[] = [];
    let startpos = 0;
    for (let row = 0; row < numrows; row++) {
      const sb = new StringBuilder();
      for (let i = 0; i < numcols; i++) {
        sb.append(bits[startpos + i] == 1 ? '1' : '0');
      }
      array[row] = sb.toString();
      startpos += numcols;
    }
    return array;
  }
}

describe('DefaultPlacementTest', () => {
  const unvisualize = (visualized: string): string => {
    const sb = new StringBuilder();

    for (const token of visualized.split(' ')) {
      sb.append(Number(token));
    }

    return sb.toString();
  };

  it('testPlacement', () => {
    const codewords = unvisualize(
      '66 74 78 66 74 78 129 56 35 102 192 96 226 100 156 1 107 221'
    ); //"AIMAIM" encoded

    const placement = new DebugPlacement(codewords, 12, 12);
    placement.place();
    const expected = [
      '011100001111',
      '001010101000',
      '010001010100',
      '001010100010',
      '000111000100',
      '011000010100',
      '000100001101',
      '011000010000',
      '001100001101',
      '100010010111',
      '011101011010',
      '001011001010',
    ];

    const actual = placement.toBitFieldStringArray();

    for (let i = 0; i < actual.length; i++) {
      assert.strictEqual(actual[i], expected[i]);
    }
  });
});
