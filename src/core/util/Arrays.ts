import System from './System';
import IllegalArgumentException from '../IllegalArgumentException';
import ArrayIndexOutOfBoundsException from '../ArrayIndexOutOfBoundsException';
import { int } from '../../customTypings';

export default class Arrays {

  /**
   * Assigns the specified int value to each element of the specified array
   * of ints.
   *
   * @param a the array to be filled
   * @param val the value to be stored in all elements of the array
   */
  public static fill(a: Int32Array | Uint8Array | any[], val: int): void {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] = val;
  }

  /**
   * Assigns the specified int value to each element of the specified
   * range of the specified array of ints.  The range to be filled
   * extends from index {@code fromIndex}, inclusive, to index
   * {@code toIndex}, exclusive.  (If {@code fromIndex==toIndex}, the
   * range to be filled is empty.)
   *
   * @param a the array to be filled
   * @param fromIndex the index of the first element (inclusive) to be
   *        filled with the specified value
   * @param toIndex the index of the last element (exclusive) to be
   *        filled with the specified value
   * @param val the value to be stored in all elements of the array
   * @throws IllegalArgumentException if {@code fromIndex > toIndex}
   * @throws ArrayIndexOutOfBoundsException if {@code fromIndex < 0} or
   *         {@code toIndex > a.length}
   */
  public static fillWithin(a: Int32Array, fromIndex: int, toIndex: int, val: int): void {
    Arrays.rangeCheck(a.length, fromIndex, toIndex);
    for (let i = fromIndex; i < toIndex; i++)
      a[i] = val;
  }

  /**
   * Checks that {@code fromIndex} and {@code toIndex} are in
   * the range and throws an exception if they aren't.
   */
  static rangeCheck(arrayLength: int, fromIndex: int, toIndex: int): void {
    if (fromIndex > toIndex) {
      throw new IllegalArgumentException(
        'fromIndex(' + fromIndex + ') > toIndex(' + toIndex + ')');
    }
    if (fromIndex < 0) {
      throw new ArrayIndexOutOfBoundsException(fromIndex);
    }
    if (toIndex > arrayLength) {
      throw new ArrayIndexOutOfBoundsException(toIndex);
    }
  }

  public static asList<T = any>(...args: T[]): T[] {
    return args;
  }

  public static create<T = any>(rows: int, cols: int, value?: T): T[][] {

    let arr = Array.from({ length: rows });

    return arr.map(x => Array.from<T>({ length: cols }).fill(value));
  }

  public static createInt32Array(rows: int, cols: int, value?: int): Int32Array[] {

    let arr = Array.from({ length: rows });

    return arr.map(x => Int32Array.from({ length: cols }).fill(value));
  }

  public static equals(first: any, second: any): boolean {
    if (!first) {
      return false;
    }
    if (!second) {
      return false;
    }
    if (!first.length) {
      return false;
    }
    if (!second.length) {
      return false;
    }
    if (first.length !== second.length) {
      return false;
    }
    for (let i = 0, length = first.length; i < length; i++) {
      if (first[i] !== second[i]) {
        return false;
      }
    }
    return true;
  }

  public static hashCode(a: any) {
    if (a === null) {
      return 0;
    }
    let result = 1;
    for (const element of a) {
      result = 31 * result + element;
    }
    return result;
  }

  public static fillUint8Array(a: Uint8Array, value: number) {
    for (let i = 0; i !== a.length; i++) {
      a[i] = value;
    }
  }

  public static copyOf(original: Int32Array, newLength: number): Int32Array {
    return original.slice(0, newLength);
  }

  public static copyOfUint8Array(original: Uint8Array, newLength: number): Uint8Array {

    if (original.length <= newLength) {
      const newArray = new Uint8Array(newLength);
      newArray.set(original);
      return newArray;
    }

    return original.slice(0, newLength);
  }

  public static copyOfRange(original: Int32Array, from: number, to: number): Int32Array {
    const newLength = to - from;
    const copy = new Int32Array(newLength);
    System.arraycopy(original, from, copy, 0, newLength);
    return copy;
  }

  /*
  * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point
  * for the new element.
  * Parameters:
  *     ar - A sorted array
  *     el - An element to search for
  *     comparator - A comparator function. The function takes two arguments: (a, b) and returns:
  *        a negative number  if a is less than b;
  *        0 if a is equal to b;
  *        a positive number of a is greater than b.
  * The array may contain duplicate elements. If there are more than one equal elements in the array,
  * the returned value can be the index of any one of the equal elements.
  *
  * http://jsfiddle.net/aryzhov/pkfst550/
  */
  public static binarySearch(ar: Int32Array, el: number, comparator?: (a: number, b: number) => number): number {
    if (undefined === comparator) {
      comparator = Arrays.numberComparator;
    }
    let m = 0;
    let n = ar.length - 1;
    while (m <= n) {
      const k = (n + m) >> 1;
      const cmp = comparator(el, ar[k]);
      if (cmp > 0) {
        m = k + 1;
      } else if (cmp < 0) {
        n = k - 1;
      } else {
        return k;
      }
    }
    return -m - 1;
  }

  public static numberComparator(a: number, b: number) {
    return a - b;
  }
}
