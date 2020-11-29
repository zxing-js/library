import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class FormatException extends Exception {

  static readonly kind: string = 'FormatException';

    static getFormatInstance(): FormatException {
        return new FormatException();
    }
}
