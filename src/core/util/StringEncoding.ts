import { TextEncoder as TextEncoderLegacy, TextDecoder as TextDecoderLegacy } from 'text-encoding';
import CharacterSetECI from './../common/CharacterSetECI';
import UnsupportedOperationException from '../UnsupportedOperationException';

/**
 * Responsible for en/decoding strings.
 */
export default class StringEncoding {

    /**
     * Decodes some Uint8Array to a string format.
     */
    public static decode(bytes: Uint8Array, encoding: string | CharacterSetECI): string {

        const encodingName = this.encodingName(encoding);

        // Node.js environment fallback.
        if (!StringEncoding.isBrowser()) {
            return new TextDecoderLegacy(encodingName).decode(bytes);
        }

        // TextDecoder not available
        if (typeof TextDecoder === 'undefined') {
            return this.decodeFallback(bytes, encodingName);
        }

        return new TextDecoder(encodingName).decode(bytes);
    }

    /**
     * Encodes some string into a Uint8Array.
     *
      * @todo natively support other string formats than UTF-8.
     */
    public static encode(s: string, encoding: string | CharacterSetECI): Uint8Array {

        const encodingName = this.encodingName(encoding);

        if (!StringEncoding.isBrowser()) {
            return new TextEncoderLegacy(encodingName, { NONSTANDARD_allowLegacyEncoding: true }).encode(s);
        }

        // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
        return new TextEncoder().encode(s);
    }

    private static isBrowser(): boolean {
        return typeof window !== 'undefined' && ({}).toString.call(window) === '[object Window]';
    }

    /**
     * Returns the string value from some encoding character set.
     */
    public static encodingName(encoding: string | CharacterSetECI): string {
        return typeof encoding === 'string'
            ? encoding
            : encoding.getName();
    }

    /**
     * Returns character set from some encoding character set.
     */
    public static encodingCharacterSet(encoding: string | CharacterSetECI): CharacterSetECI {
        return CharacterSetECI.getCharacterSetECIByName(this.getName(encoding));
    }

    /**
     * Runs a fallback for the native decoding funcion.
     */
    private static decodeFallback(bytes: Uint8Array, encoding: string | CharacterSetECI): string {

        const characterSet = this.encodingCharacterSet(encoding);

        if (characterSet.equals(CharacterSetECI.UTF8) ||
            characterSet.equals(CharacterSetECI.ISO8859_1) ||
            characterSet.equals(CharacterSetECI.ASCII)) {

            let s = '';

            for (let i = 0, length = bytes.length; i < length; i++) {

                let h = bytes[i].toString(16);

                if (h.length < 2) {
                    h = '0' + h;
                }

                s += '%' + h;
            }

            return decodeURIComponent(s);
        }

        if (characterSet.equals(CharacterSetECI.UnicodeBigUnmarked)) {
            return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer));
        }

        throw new UnsupportedOperationException(`Encoding ${this.encodingName(encoding)} not supported by fallback.`);
    }
}
