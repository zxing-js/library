import { TextDecoder } from 'text-encoding'

export default class StringEncoding {
    public static decode(bytes: Uint8Array, encoding: string): string {
        return new TextDecoder(encoding).decode(bytes)
    }

    public static encode(s: string, encoding: string): Uint8Array {
        return new TextEncoder(encoding).encode(s)
    }

    public static getDigit(singleCharacter: string): number {
        return singleCharacter.charCodeAt(0) - 48
    }

    public static isDigit(singleCharacter: string): boolean {
      const cn = StringEncoding.getDigit(singleCharacter)
      return cn >= 0 && cn <= 9
    }
}