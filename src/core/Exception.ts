import { CustomError } from 'ts-custom-error';

/**
 * Custom Error class of type Exception.
 */
export default class Exception extends CustomError {

    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    constructor(
        public message: string = undefined
    ) {
        super(message);
    }
}
