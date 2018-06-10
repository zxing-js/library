/**
 * Custom Error class of type Exception.
 */
class Exception {

    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    public constructor(
        public message: string = ''
    ) {
        Error.apply(this, arguments);
    }
}

Exception.prototype = new Error();

export default Exception;
