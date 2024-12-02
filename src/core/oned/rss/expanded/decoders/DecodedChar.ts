import DecodedObject from './DecodedObject';

export default class DecodedChar extends DecodedObject {
  private readonly value: string;
  static readonly FNC1 = '$'; // It's not in Alphanumeric neither in ISO/IEC 646 charset

  constructor(newPosition: number, value: string) {
    super(newPosition);
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
  isFNC1(): boolean {
    return this.value === DecodedChar.FNC1;
  }

}
