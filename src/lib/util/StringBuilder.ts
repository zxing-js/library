export default class StringBuilder {
  public constructor(private value: string = "") {

  }
  public append(s: string): StringBuilder {
    this.value += s
    return this
  }

  public length(): number {
    return this.value.length
  }

  public charAt(n: number): string {
    return this.value.charAt(n)
  }

  public deleteCharAt(n: number) {
    this.value = this.value.substr(0, n) + this.value.substring(n + 1)
  }

  public setCharAt(n: number, c: string) {
    this.value = this.value.substr(0, n) + c + this.value.substr(n + 1)
  }

  public toString(): string {
    return this.value
  }
}