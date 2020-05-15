/**
 * Ponyfill for Java's Float class.
 */
export default class Float {

  /**
   * The float max value in JS is the number max value.
   */
  static MAX_VALUE: number = Number.MAX_SAFE_INTEGER;

  /**
   * SincTS has no difference between int and float, there's all numbers,
   * this is used only to polyfill Java code.
   */
  public static floatToIntBits(f: number): number {
    return f;
  }
}
