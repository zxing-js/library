import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class NullPointerException extends Exception {
  static readonly kind: string = 'NullPointerException';
}
