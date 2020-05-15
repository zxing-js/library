import Token from './Token';
import SimpleToken from './SimpleToken';

import { int } from '../../../customTypings';

export const /*final*/ MODE_NAMES: String[] = [
    'UPPER',
    'LOWER',
    'DIGIT',
    'MIXED',
    'PUNCT'
  ];

export const /*final*/ MODE_UPPER: int = 0; // 5 bits
export const /*final*/ MODE_LOWER: int = 1; // 5 bits
export const /*final*/ MODE_DIGIT: int = 2; // 4 bits
export const /*final*/ MODE_MIXED: int = 3; // 5 bits
export const /*final*/ MODE_PUNCT: int = 4; // 5 bits

export const EMPTY_TOKEN: Token = new SimpleToken(null, 0, 0);
