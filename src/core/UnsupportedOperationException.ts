import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class UnsupportedOperationException extends Exception {
  static readonly kind: string = 'UnsupportedOperationException';
}
