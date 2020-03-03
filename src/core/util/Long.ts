/**
 * Ponyfill for Java's Long class.
 */
export default class Long {

  /**
   * Parses a string to a number, since JS has no really Int64.
   *
   * @param num Numeric string.
   * @param radix Destination radix.
   */
  static parseLong(num: string, radix: number = undefined) {
    return parseInt(num, radix);
  }
}
