/**
 * Ponyfill for Java's Integer class.
 */
export default class Integer {

  static MIN_VALUE_32_BITS = -2147483648;
  static MAX_VALUE: number = Number.MAX_SAFE_INTEGER;

  public static numberOfTrailingZeros(i: number): number {

    let y: number;

    if (i === 0) return 32;

    let n = 31;

    y = i << 16;

    if (y !== 0) {
      n -= 16;
      i = y;
    }

    y = i << 8;

    if (y !== 0) {
      n -= 8;
      i = y;
    }

    y = i << 4;

    if (y !== 0) {
      n -= 4;
      i = y;
    }

    y = i << 2;

    if (y !== 0) {
      n -= 2;
      i = y;
    }

    return n - ((i << 1) >>> 31);
  }

  public static numberOfLeadingZeros(i: number): number {

    // HD, Figure 5-6
    if (i === 0) {
      return 32;
    }

    let n = 1;

    if (i >>> 16 === 0) {
      n += 16;
      i <<= 16;
    }

    if (i >>> 24 === 0) {
      n += 8;
      i <<= 8;
    }

    if (i >>> 28 === 0) {
      n += 4;
      i <<= 4;
    }

    if (i >>> 30 === 0) {
      n += 2;
      i <<= 2;
    }

    n -= i >>> 31;

    return n;
  }

  public static toHexString(i: number) {
    return i.toString(16);
  }

  public static toBinaryString(intNumber: number): string {
    return String(parseInt(String(intNumber), 2));
  }

  // Returns the number of one-bits in the two's complement binary representation of the specified int value. This function is sometimes referred to as the population count.
  // Returns:
  // the number of one-bits in the two's complement binary representation of the specified int value.
  public static bitCount(i: number): number {
    // HD, Figure 5-2
    i = i - ((i >>> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
    i = (i + (i >>> 4)) & 0x0f0f0f0f;
    i = i + (i >>> 8);
    i = i + (i >>> 16);

    return i & 0x3f;
  }

  public static truncDivision(dividend: number, divisor: number): number {
    return Math.trunc(dividend / divisor);
  }

  /**
   * Converts A string to an integer.
   * @param s A string to convert into a number.
   * @param radix A value between 2 and 36 that specifies the base of the number in numString. If this argument is not supplied, strings with a prefix of '0x' are considered hexadecimal. All other strings are considered decimal.
   */
  static parseInt(num: string, radix: number = undefined) {
    return parseInt(num, radix);
  }
}
