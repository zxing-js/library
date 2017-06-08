export default class Exception {

    public static IllegalArgumentException = "IllegalArgumentException"
    public static NotFoundException = "NotFoundException"
    public static ArithmeticException = "ArithmeticException"
    public static FormatException = "FormatException"
    public static ChecksumException = "ChecksumException"
    public static WriterException = "WriterException"
    public static IllegalStateException = "IllegalStateException"
    public static UnsupportedOperationException = "UnsupportedOperationException"
    public static ReedSolomonException = "ReedSolomonException"
    public static ArgumentException = "ArgumentException"
    public static ReaderException = "ReaderException"

    public constructor(private type: string, private message?: string) {}

    public getType(): string {
        return this.type
    }

    public getMessage(): string|undefined {
        return this.message
    }

    public static isOfType(ex: any, type: string): boolean {
        return ex.type === type
    }
}