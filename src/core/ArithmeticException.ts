import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class ArithmeticException extends Exception {
  static readonly kind: string = 'ArithmeticException';
}
