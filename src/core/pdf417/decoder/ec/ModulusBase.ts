import IllegalArgumentException from '../../../IllegalArgumentException';
import ArithmeticException from '../../../ArithmeticException';

export default class ModulusBase {

  protected /*final*/ logTable: Int32Array;
  protected /*final*/ expTable: Int32Array;
  protected /*final*/ modulus: number;

  add(a: number, b: number): number {
    return (a + b) % this.modulus;
  }

  subtract(a: number, b: number): number {
    return (this.modulus + a - b) % this.modulus;
  }

  exp(a: number): number {
    return this.expTable[a];
  }

  log(a: number): number {
    if (a === 0) {
      throw new IllegalArgumentException();
    }
    return this.logTable[a];
  }

  inverse(a: number): number {
    if (a === 0) {
      throw new ArithmeticException();
    }
    return this.expTable[this.modulus - this.logTable[a] - 1];
  }

  multiply(a: number, b: number): number {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.modulus - 1)];
  }

  getSize(): number {
    return this.modulus;
  }

  equals(o: Object): boolean {
    return o === this;
  }
}
