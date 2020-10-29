import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class ReaderException extends Exception {
  static readonly kind: string = 'ReaderException';
}
