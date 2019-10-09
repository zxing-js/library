import Token from './Token';
import SimpleToken from './SimpleToken';
import BinaryShiftToken from './BinaryShiftToken';

export function addBinaryShift(
  token: Token,
  start: number,
  byteCount: number
): Token {
  // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
  return new BinaryShiftToken(token, start, byteCount);
}

export function add(token: Token, value: number, bitCount: number): Token {
  return new SimpleToken(token, value, bitCount);
}
