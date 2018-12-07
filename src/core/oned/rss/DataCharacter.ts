export default class DataCharacter {

    private value: number;
    private checksumPortion: number;

    public constructor(value: number, checksumPortion: number) {
        this.value = value;
        this.checksumPortion = checksumPortion;
    }

    public getValue(): number {
        return this.value;
    }

    public getChecksumPortion(): number {
        return this.checksumPortion;
    }

    public toString(): string {
        return this.value + '(' + this.checksumPortion + ')';
    }

    public equals(o: object): boolean {
        if (!(o instanceof DataCharacter)) {
            return false;
        }
        const that = <DataCharacter>o;
        return this.value === that.value && this.checksumPortion === that.checksumPortion;
    }

    public hashCode(): number {
        return this.value ^ this.checksumPortion;
    }
}
