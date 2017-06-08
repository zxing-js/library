// declare require to support dynamic text-encoding module loading in node
declare function require(moduleName: string): any

// declare window to use in browser
declare var window: any

import { TextDecoder as TextDecoderFromTE, TextEncoder as TextEncoderFromTE } from 'text-encoding'
import CharacterSetECI from './../common/CharacterSetECI'
import Exception from './../Exception'

export default class StringEncoding {
    public static decode(bytes: Uint8Array, encoding: string): string {
        if (StringEncoding.isBrowser()) {
            const TextDecoderBrowser = window['TextDecoder']
            // use TextEncoder if is available (should be in newer browsers) 
            if (undefined !== TextDecoderBrowser) {
                console.log(TextDecoderBrowser)
                return new TextDecoderBrowser(encoding).decode(bytes)
            } else {
                // fall back to minimal decoding
                return StringEncoding.decodeFallBack(bytes, encoding)
            }
        } else {
            const TextDecoderFromTEClass: typeof TextDecoderFromTE = require('text-encoding').TextDecoder
            return new TextDecoderFromTEClass(encoding).decode(bytes)
        }
    }

    public static encode(s: string, encoding: string): Uint8Array {
        if (StringEncoding.isBrowser()) {
            const TextEncoderBrowser = window['TextEncoder']
            // use TextEncoder if is available (should be in newer browsers) 
            const ec = CharacterSetECI.getCharacterSetECIByName(encoding)
            if (undefined !== TextEncoderBrowser) {
                // TODO: TextEncoder only supports utf-8 encoding as per specs
                return new TextEncoderBrowser(encoding).encode(s)
            } else {
                // fall back to minimal decoding
                return StringEncoding.encodeFallBack(s, encoding)
            }
        } else {
            // Note: NONSTANDARD_allowLegacyEncoding is required for other encodings than UTF8
            // TextEncoder only encodes to UTF8 by default as specified by encoding.spec.whatwg.org
            const TextEncoderFromTEClass: typeof TextEncoderFromTE = require('text-encoding').TextEncoder
            return new TextEncoderFromTEClass(encoding, { NONSTANDARD_allowLegacyEncoding: true }).encode(s)
        }
    }

    private static isBrowser(): boolean {
        return typeof window !== 'undefined' && ({}).toString.call(window) === '[object Window]'
    }

    private static decodeFallBack(bytes: Uint8Array, encoding: string): string {
        const ec = CharacterSetECI.getCharacterSetECIByName(encoding)
        if (ec.equals(CharacterSetECI.UTF8) || ec.equals(CharacterSetECI.ISO8859_1) || ec.equals(CharacterSetECI.ASCII)) {
            let s = ''
            for(let i = 0, s = ''; i < bytes.length; i++) {
                let h = bytes[i].toString(16)
                if(h.length < 2) {
                    h = '0' + h
                }
                s += '%' + h
            }
            return decodeURIComponent(s)
        } else if (ec.equals(CharacterSetECI.UnicodeBigUnmarked)) {
            return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer))
        } else {
            throw new Exception(Exception.UnsupportedOperationException, `encoding ${encoding} not supported`)
        }
    }

    private static encodeFallBack(s: string, encoding: string): Uint8Array {
        // TODO: encode
        return null
    }
}