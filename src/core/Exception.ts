/**
 * Custom Error class of type Exception.
 */
export default class Exception extends Error {

    /**
     * Allows Exception to be constructed directly
     * with some type and message.
     */
    public constructor(
        message: string = ''
    ) {
        super(message);
    }

    /**
     * Returns the Exception type.
     */
    public getType(): string {
        return typeof this;
    }

    /**
     * Returns the Exception message.
     */
    public getMessage(): string {
        return this.message;
    }
}
