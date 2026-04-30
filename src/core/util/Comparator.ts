import { int } from 'src/customTypings';

/**
 * Java Comparator interface polyfill.
 */
export default interface Comparator<T> {
  /**
   * Compares its two arguments for order. Returns a negative integer, zero,
   * or a positive integer as the first argument is less than, equal to,
   * or greater than the second.
   */
  compare(a: T,  b: T): int;
}
