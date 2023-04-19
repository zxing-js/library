import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class IllegalArgumentException extends Exception {
  static readonly kind: string = 'IllegalArgumentException';
}
