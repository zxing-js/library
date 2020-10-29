import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class IllegalStateException extends Exception {
  static readonly kind: string = 'IllegalStateException';
}
