import Arrays from '../../util/Arrays';
import * as C from './EncoderConstants';

export function static_SHIFT_TABLE(SHIFT_TABLE: Int32Array[]): Int32Array[] {
  for (let table /*Int32Array*/ of SHIFT_TABLE) {
    Arrays.fill(table, -1);
  }
  SHIFT_TABLE[C.MODE_UPPER][C.MODE_PUNCT] = 0;
  SHIFT_TABLE[C.MODE_LOWER][C.MODE_PUNCT] = 0;
  SHIFT_TABLE[C.MODE_LOWER][C.MODE_UPPER] = 28;
  SHIFT_TABLE[C.MODE_MIXED][C.MODE_PUNCT] = 0;
  SHIFT_TABLE[C.MODE_DIGIT][C.MODE_PUNCT] = 0;
  SHIFT_TABLE[C.MODE_DIGIT][C.MODE_UPPER] = 15;
  return SHIFT_TABLE;
}

export const /*final*/ SHIFT_TABLE: Int32Array[] = static_SHIFT_TABLE(Arrays.createInt32Array(6, 6)); // mode shift codes, per table