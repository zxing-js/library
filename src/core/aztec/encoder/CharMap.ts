import * as C from './EncoderConstants';
import Arrays from '../../util/Arrays';
import StringUtils from '../../common/StringUtils';

import { int } from '../../../customTypings';

export function static_CHAR_MAP(CHAR_MAP: Int32Array[]): Int32Array[] {
  const spaceCharCode = StringUtils.getCharCode(' ');
  const pointCharCode = StringUtils.getCharCode('.');
  const commaCharCode = StringUtils.getCharCode(',');

  CHAR_MAP[C.MODE_UPPER][spaceCharCode] = 1;
  const zUpperCharCode = StringUtils.getCharCode('Z');
  const aUpperCharCode = StringUtils.getCharCode('A');
  for (let c: int = aUpperCharCode; c <= zUpperCharCode; c++) {
    CHAR_MAP[C.MODE_UPPER][c] = c - aUpperCharCode + 2;
  }
  CHAR_MAP[C.MODE_LOWER][spaceCharCode] = 1;
  const zLowerCharCode = StringUtils.getCharCode('z');
  const aLowerCharCode = StringUtils.getCharCode('a');
  for (let c: int = aLowerCharCode; c <= zLowerCharCode; c++) {
    CHAR_MAP[C.MODE_LOWER][c] = c - aLowerCharCode + 2;
  }
  CHAR_MAP[C.MODE_DIGIT][spaceCharCode] = 1;
  const nineCharCode = StringUtils.getCharCode('9');
  const zeroCharCode = StringUtils.getCharCode('0');
  for (let c: int = zeroCharCode; c <= nineCharCode; c++) {
    CHAR_MAP[C.MODE_DIGIT][c] = c - zeroCharCode + 2;
  }
  CHAR_MAP[C.MODE_DIGIT][commaCharCode] = 12;
  CHAR_MAP[C.MODE_DIGIT][pointCharCode] = 13;
  const mixedTable = [
    '\x00',
    ' ',
    '\x01',
    '\x02',
    '\x03',
    '\x04',
    '\x05',
    '\x06',
    '\x07',
    '\b',
    '\t',
    '\n',
    '\x0b',
    '\f',
    '\r',
    '\x1b',
    '\x1c',
    '\x1d',
    '\x1e',
    '\x1f',
    '@',
    '\\',
    '^',
    '_',
    '`',
    '|',
    '~',
    '\x7f'
  ];
  for (let i: int = 0; i < mixedTable.length; i++) {
    CHAR_MAP[C.MODE_MIXED][StringUtils.getCharCode(mixedTable[i])] = i;
  }
  const punctTable = [
    '\x00',
    '\r',
    '\x00',
    '\x00',
    '\x00',
    '\x00',
    '!',
    '\'',
    '#',
    '$',
    '%',
    '&',
    '\'',
    '(',
    ')',
    '*',
    '+',
    ',',
    '-',
    '.',
    '/',
    ':',
    ';',
    '<',
    '=',
    '>',
    '?',
    '[',
    ']',
    '{',
    '}'
  ];

  for (let i: int = 0; i < punctTable.length; i++) {
    if (StringUtils.getCharCode(punctTable[i]) > 0) {
      CHAR_MAP[C.MODE_PUNCT][StringUtils.getCharCode(punctTable[i])] = i;
    }
  }

  return CHAR_MAP;
}

export const CHAR_MAP: Int32Array[] = static_CHAR_MAP(Arrays.createInt32Array(5, 256));
