import Exception from './Exception';

/**
 * Custom Error class of type Exception.
 */
export default class IllegalStateException extends Exception {

    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    public constructor(
        message: string = ''
    ) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, IllegalStateException.prototype);
    }
}
