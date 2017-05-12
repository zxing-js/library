// TYPESCRIPTPORT: TODO: TextEncoder might not work in browser
// let window: any
// if (window) {
//     window.TextEncoder = window.TextDecoder = null
// }

import { TextDecoder, TextEncoder } from 'text-encoding'

export default class StringEncoding {
    public static decode(bytes: Uint8Array, encoding: string): string {
        return new TextDecoder(encoding).decode(bytes)
    }

    public static encode(s: string, encoding: string): Uint8Array {
        // Note: NONSTANDARD_allowLegacyEncoding is required for other encodings than UTF8
        // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
        return new TextEncoder(encoding, { NONSTANDARD_allowLegacyEncoding: true }).encode(s)
    }

    public static getDigit(singleCharacter: string): number {
        return singleCharacter.charCodeAt(0) - 48
    }

    public static isDigit(singleCharacter: string): boolean {
      const cn = StringEncoding.getDigit(singleCharacter)
      return cn >= 0 && cn <= 9
    }
}