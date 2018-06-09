/**
 * Custom Error class of type Exception.
 */
export default class Exception extends Error {

    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    public constructor(
        message: string = ''
    ) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, Exception.prototype);
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
