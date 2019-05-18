import DecodedObject from './DecodedObject';

export default class DecodedInformation extends DecodedObject {

  private readonly newString: string;
  private readonly remainingValue: number;
  private readonly remaining: boolean;

  constructor(newPosition: number, newString: string, remainingValue?: number) {
    super(newPosition);
    if (remainingValue) {
      this.remaining = true;
      this.remainingValue = this.remainingValue;
    } else {
      this.remaining = false;
      this.remainingValue = 0;
    }
    this.newString = newString;
  }

  getNewString(): string {
    return this.newString;
  }

  isRemaining(): boolean {
    return this.remaining;
  }
  getRemainingValue() {
    return this.remainingValue;
  }
}
