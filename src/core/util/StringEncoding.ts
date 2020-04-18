import UnsupportedOperationException from '../UnsupportedOperationException';
import CharacterSetECI from '../common/CharacterSetECI';

/**
 * Responsible for en/decoding strings.
 */
export default class StringEncoding {

  /**
   * Allows the user to set a custom decoding function
   * so more encoding formats the native ones can be supported.
   */
  public static customDecoder: (bytes: Uint8Array, encodingName: string) => string;

  /**
   * Allows the user to set a custom encoding function
   * so more encoding formats the native ones can be supported.
   */
  public static customEncoder: (s: string, encodingName: string) => Uint8Array;

  /**
   * Decodes some Uint8Array to a string format.
   */
  public static decode(bytes: Uint8Array, encoding: string | CharacterSetECI): string {

    const encodingName = this.encodingName(encoding);

    if (this.customDecoder) {
      return this.customDecoder(bytes, encodingName);
    }

    // Increases browser support.
    if (typeof TextDecoder === 'undefined' || this.shouldDecodeOnFallback(encodingName)) {
      return this.decodeFallback(bytes, encodingName);
    }

    return new TextDecoder(encodingName).decode(bytes);
  }

  /**
   * Checks if the decoding method should use the fallback for decoding
   * once Node TextDecoder doesn't support all encoding formats.
   *
   * @param encodingName
   */
  private static shouldDecodeOnFallback(encodingName: string): boolean {
    return !StringEncoding.isBrowser() && encodingName === 'ISO-8859-1';
  }

  /**
   * Encodes some string into a Uint8Array.
   */
  public static encode(s: string, encoding: string | CharacterSetECI): Uint8Array {

    const encodingName = this.encodingName(encoding);

    if (this.customEncoder) {
      return this.customEncoder(s, encodingName);
    }

    // Increases browser support.
    if (typeof TextEncoder === 'undefined') {
      return this.encodeFallback(s);
    }

    // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
    return new TextEncoder().encode(s);
  }

  private static isBrowser(): boolean {
    return (typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]');
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

    if (encoding instanceof CharacterSetECI) {
      return encoding;
    }

    return CharacterSetECI.getCharacterSetECIByName(encoding);
  }

  /**
   * Runs a fallback for the native decoding funcion.
   */
  private static decodeFallback(bytes: Uint8Array, encoding: string | CharacterSetECI): string {

    const characterSet = this.encodingCharacterSet(encoding);

    if (StringEncoding.isDecodeFallbackSupported(characterSet)) {

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

  private static isDecodeFallbackSupported(characterSet: CharacterSetECI) {
    return characterSet.equals(CharacterSetECI.UTF8) ||
      characterSet.equals(CharacterSetECI.ISO8859_1) ||
      characterSet.equals(CharacterSetECI.ASCII);
  }

  /**
   * Runs a fallback for the native encoding funcion.
   *
   * @see https://stackoverflow.com/a/17192845/4367683
   */
  private static encodeFallback(s: string): Uint8Array {

    const encodedURIstring = btoa(unescape(encodeURIComponent(s)));
    const charList = encodedURIstring.split('');
    const uintArray = [];

    for (let i = 0; i < charList.length; i++) {
      uintArray.push(charList[i].charCodeAt(0));
    }

    return new Uint8Array(uintArray);
  }
}
