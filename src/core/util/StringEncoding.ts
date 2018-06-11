import CharacterSetECI from './../common/CharacterSetECI';
import { TextEncoder as TextEncoderLegacy } from 'text-encoding';

/**
 * Responsible for en/decoding strings.
 */
export default class StringEncoding {

    /**
     * Decodes some Uint8Array to a string format.
     */
    public static decode(bytes: Uint8Array, encoding: string | CharacterSetECI): string {

        const encodingName = this.encodingName(encoding);

        return new TextDecoder(encodingName).decode(bytes);
    }

    /**
     * Encodes some string into a Uint8Array.
     *
      * @todo natively support other string formats than UTF-8.
     */
    public static encode(s: string, encoding: string | CharacterSetECI): Uint8Array {

        const encodingName = this.encodingName(encoding);

        // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
        return new TextEncoderLegacy(encodingName, { NONSTANDARD_allowLegacyEncoding: true }).encode(s);
    }

    /**
     * Returns the string value from some encoding character set.
     */
    public static encodingName(encoding: string | CharacterSetECI): string {
        return typeof encoding === 'string'
            ? encoding
            : encoding.getName();
    }
}
