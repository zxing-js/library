import { deepStrictEqual, strictEqual, notStrictEqual, throws, AssertionError } from 'assert';

export default class AssertUtils {

  public static typedArraysAreEqual(left: Int32Array | Uint8ClampedArray, right: Int32Array | Uint8ClampedArray, size?: number): boolean {

    if (!size) {
      size = Math.max(left.length, right.length);
    }

    for (let i = 0; i < size; i++) {
      if (left[i] !== right[i]) {
        return false;
      }
    }

    return true;
  }

}

export const assertEquals = <T>(actual: any, expected: T, message?: string) => strictEqual(actual, expected, message);
export const assertArrayEquals = (a: Iterable<any>, b: Iterable<any>, message?: string) => deepStrictEqual(a, b, message);
export const assertFalse = x => strictEqual(!!x, false);
export const assertTrue = x => strictEqual(!!x, true);
export const assertNull = x => strictEqual(x, null);
export const assertNotNull = x => notStrictEqual(x, null);
export const assertThrow = (func, err) => throws(func, err);
export const assertLessThanEquals = (actual: number, expected: number, message: string) => {
  if (actual > expected) throw new AssertionError({ actual, expected, message, operator: 'assertLessThanEquals' });
};
export const assertGreaterThanEquals = (actual: number, expected: number, message: string) => {
  if (actual < expected) throw new AssertionError({ actual, expected, message, operator: 'assertGreaterThanEquals' });
};
export const assertLessThan = (actual: number, expected: number, message: string) => {
  if (actual >= expected) throw new AssertionError({ actual, expected, message, operator: 'assertLessThan' });
};
export const assertGreaterThan = (actual: number, expected: number, message: string) => {
  if (actual <= expected) throw new AssertionError({ actual, expected, message, operator: 'assertGreaterThan' });
};
