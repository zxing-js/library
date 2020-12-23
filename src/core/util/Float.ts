import { float, int } from 'src/customTypings';

/**
 * Ponyfill for Java's Float class.
 */
export default class Float {

  /**
   * The float max value in JS is the number max value.
 */
  static MAX_VALUE: number = Number.MAX_SAFE_INTEGER;

  static NaN = NaN;

  /**
   * SincTS has no difference between int and float, there's all numbers,
   * this is used only to polyfill Java code.
 */
  public static floatToIntBits(f: number): number {
    return f;
  }

  public static isNaN(num: number) {
    return isNaN(num);
  }

  public static compare(x: float, y: float): int {
    if (x === y) return 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
}
