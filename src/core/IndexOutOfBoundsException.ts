import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class IndexOutOfBoundsException extends Exception {
  static readonly kind: string = 'IndexOutOfBoundsException';
}
