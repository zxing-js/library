import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class ReaderException extends Exception {

    /**
     * Allows Exception to be constructed directly
     * with some type and message.
     */
    public constructor(
        message: string = ''
    ) {
        super(message);
    }
}
