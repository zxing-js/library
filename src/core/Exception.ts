/**
 * Custom Error class of type Exception.
 */
export default class Exception extends Error {

    public static IllegalArgumentException = 'IllegalArgumentException';
    public static NotFoundException = 'NotFoundException';
    public static ArithmeticException = 'ArithmeticException';
    public static FormatException = 'FormatException';
    public static ChecksumException = 'ChecksumException';
    public static WriterException = 'WriterException';
    public static IllegalStateException = 'IllegalStateException';
    public static UnsupportedOperationException = 'UnsupportedOperationException';
    public static ReedSolomonException = 'ReedSolomonException';
    public static ArgumentException = 'ArgumentException';
    public static ReaderException = 'ReaderException';

    /**
     * Allows Exception to be constructed directly
     * with some type and message.
     */
    public constructor(
        private type: string,
        public message: string = ''
    ) {
        super(message);
    }

    /**
     * Returns the Exception type.
     */
    public getType(): string {
        return this.type;
    }

    /**
     * Returns the Exception message.
     */
    public getMessage(): string {
        return this.message;
    }

    /**
     * Checks if some Exception is of some Exception type.
     */
    public static isOfType(exception: any, type: string): boolean {
        return exception.type === type;
    }
}
