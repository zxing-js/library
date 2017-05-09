export default class Exception {
    public constructor(private type: string, private message?: string) {}

    public getType(): string {
        return this.type
    }

    public getMessage(): string {
        return this.message
    }
}