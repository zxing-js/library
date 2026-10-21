/*
 * Copyright 2006 Jeremias Maerki in part, and ZXing Authors in part
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This file has been modified from its original form in Barcode4J.
 */

// package com.google.zxing.pdf417.encoder;

import ECIInput from '../../common/ECIInput';
import { MinimalECIInput } from '../../common/MinimalECIInput';
import Charset from '../../util/Charset';
import StandardCharsets from '../../util/StandardCharsets';
import StringBuilder from '../../util/StringBuilder';
import StringEncoding from '../../util/StringEncoding';
import WriterException from '../../WriterException';
import Compaction from './Compaction';

import { char, int } from '../../../customTypings';

/**
 * PDF417 high-level encoder following the algorithm described in ISO/IEC 15438:2001(E) in
 * annex P.
 */
export default /*final*/ class PDF417HighLevelEncoder {

    /**
     * code for Text compaction
     */
    private static readonly TEXT_COMPACTION: int = 0;

    /**
     * code for Byte compaction
     */
    private static readonly BYTE_COMPACTION: int = 1;

    /**
     * code for Numeric compaction
     */
    private static readonly NUMERIC_COMPACTION: int = 2;

    /**
     * Text compaction submode Alpha
     */
    private static readonly SUBMODE_ALPHA: int = 0;

    /**
     * Text compaction submode Lower
     */
    private static readonly SUBMODE_LOWER: int = 1;

    /**
     * Text compaction submode Mixed
     */
    private static readonly SUBMODE_MIXED: int = 2;

    /**
     * Text compaction submode Punctuation
     */
    private static readonly SUBMODE_PUNCTUATION: int = 3;

    /**
     * mode latch to Text Compaction mode
     */
    private static readonly LATCH_TO_TEXT: int = 900;

    /**
     * mode latch to Byte Compaction mode (number of characters NOT a multiple of 6)
     */
    private static readonly LATCH_TO_BYTE_PADDED: int = 901;

    /**
     * mode latch to Numeric Compaction mode
     */
    private static readonly LATCH_TO_NUMERIC: int = 902;

    /**
     * mode shift to Byte Compaction mode
     */
    private static readonly SHIFT_TO_BYTE: int = 913;

    /**
     * mode latch to Byte Compaction mode (number of characters a multiple of 6)
     */
    private static readonly LATCH_TO_BYTE: int = 924;

    /**
     * identifier for a user defined Extended Channel Interpretation (ECI)
     */
    private static readonly ECI_USER_DEFINED: int = 925;

    /**
     * identifier for a general purpose ECO format
     */
    private static readonly ECI_GENERAL_PURPOSE: int = 926;

    /**
     * identifier for an ECI of a character set of code page
     */
    private static readonly ECI_CHARSET: int = 927;

    /**
     * Raw code table for text compaction Mixed sub-mode
     */
    private static readonly TEXT_MIXED_RAW: Int8Array = Int8Array.from([
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 38, 13, 9, 44, 58,
        35, 45, 46, 36, 47, 43, 37, 42, 61, 94, 0, 32, 0, 0, 0,
    ]);

    /**
     * Raw code table for text compaction: Punctuation sub-mode
     */
    private static readonly TEXT_PUNCTUATION_RAW: Int8Array = Int8Array.from([
        59, 60, 62, 64, 91, 92, 93, 95, 96, 126, 33, 13, 9, 44, 58,
        10, 45, 46, 36, 47, 34, 124, 42, 40, 41, 63, 123, 125, 39, 0,
    ]);

    // Construct inverse lookups. Java does this in a static initialiser block.
    private static readonly MIXED: Int8Array = (() => {
        const mixed = new Int8Array(128).fill(-1);
        for (let i = 0; i < PDF417HighLevelEncoder.TEXT_MIXED_RAW.length; i++) {
            const b = PDF417HighLevelEncoder.TEXT_MIXED_RAW[i];
            if (b > 0) {
                mixed[b] = i;
            }
        }
        return mixed;
    })();

    private static readonly PUNCTUATION: Int8Array = (() => {
        const punctuation = new Int8Array(128).fill(-1);
        for (let i = 0; i < PDF417HighLevelEncoder.TEXT_PUNCTUATION_RAW.length; i++) {
            const b = PDF417HighLevelEncoder.TEXT_PUNCTUATION_RAW[i];
            if (b > 0) {
                punctuation[b] = i;
            }
        }
        return punctuation;
    })();

    private static readonly DEFAULT_ENCODING: Charset = StandardCharsets.ISO_8859_1;

    private constructor() { }

    /**
     * Performs high-level encoding of a PDF417 message using the algorithm described in annex P
     * of ISO/IEC 15438:2001(E). If byte compaction has been selected, then only byte compaction
     * is used.
     *
     * @param msg the message
     * @param compaction compaction mode to use
     * @param encoding character encoding used to encode in default or byte compaction
     *  or {@code null} for default / not applicable
     * @param autoECI encode input minimally using multiple ECIs if needed
     *   If autoECI encoding is specified and additionally {@code encoding} is specified, then the encoder
     *   will use the specified {@link Charset} for any character that can be encoded by it, regardless
     *   if a different encoding would lead to a more compact encoding. When no {@code encoding} is specified
     *   then charsets will be chosen so that the byte representation is minimal.
     * @return the encoded message (the char values range from 0 to 928)
     */
    public static encodeHighLevel(
        msg: string,
        compaction: Compaction,
        encoding: Charset,
        autoECI: boolean
    ): string /*throws WriterException*/ {

        if (msg.length === 0) {
            throw new WriterException('Empty message not allowed');
        }

        if (Compaction.TEXT === compaction) {
            PDF417HighLevelEncoder.checkCharset(msg, 127, 'Consider specifying Compaction.AUTO instead of Compaction.TEXT');
        }

        if (encoding == null && !autoECI) {
            PDF417HighLevelEncoder.checkCharset(
                msg,
                255,
                'Consider specifying EncodeHintType.PDF417_AUTO_ECI and/or EncodeTypeHint.CHARACTER_SET'
            );
        }

        // the codewords 0..928 are encoded as Unicode characters
        const sb = new StringBuilder();

        let input: ECIInput;
        if (autoECI) {
            input = new MinimalECIInput(msg, encoding, -1);
        } else {
            input = new NoECIInput(msg);
            if (encoding == null) {
                encoding = PDF417HighLevelEncoder.DEFAULT_ENCODING;
            } else if (PDF417HighLevelEncoder.DEFAULT_ENCODING !== encoding) {
                // In this port Charset already is a CharacterSetECI, so it doubles as the ECI.
                PDF417HighLevelEncoder.encodingECI(encoding.getValue(), sb);
            }
        }

        const len: int = input.length();
        let p: int = 0;
        let textSubMode: int = PDF417HighLevelEncoder.SUBMODE_ALPHA;

        // User selected encoding mode
        switch (compaction) {
            case Compaction.TEXT:
                PDF417HighLevelEncoder.encodeText(input, p, len, sb, textSubMode);
                break;
            case Compaction.BYTE:
                if (autoECI) {
                    PDF417HighLevelEncoder.encodeMultiECIBinary(input, 0, input.length(), PDF417HighLevelEncoder.TEXT_COMPACTION, sb);
                } else {
                    const msgBytes = StringEncoding.encode(input.toString(), encoding);
                    PDF417HighLevelEncoder.encodeBinary(msgBytes, p, msgBytes.length, PDF417HighLevelEncoder.BYTE_COMPACTION, sb);
                }
                break;
            case Compaction.NUMERIC:
                sb.append(String.fromCharCode(PDF417HighLevelEncoder.LATCH_TO_NUMERIC));
                PDF417HighLevelEncoder.encodeNumeric(input, p, len, sb);
                break;
            default: {
                let encodingMode: int = PDF417HighLevelEncoder.TEXT_COMPACTION; // Default mode, see 4.4.2.1
                while (p < len) {
                    while (p < len && input.isECI(p)) {
                        PDF417HighLevelEncoder.encodingECI(input.getECIValue(p), sb);
                        p++;
                    }
                    if (p >= len) {
                        break;
                    }
                    const n: int = PDF417HighLevelEncoder.determineConsecutiveDigitCount(input, p);
                    if (n >= 13) {
                        sb.append(String.fromCharCode(PDF417HighLevelEncoder.LATCH_TO_NUMERIC));
                        encodingMode = PDF417HighLevelEncoder.NUMERIC_COMPACTION;
                        textSubMode = PDF417HighLevelEncoder.SUBMODE_ALPHA; // Reset after latch
                        PDF417HighLevelEncoder.encodeNumeric(input, p, n, sb);
                        p += n;
                    } else {
                        const t: int = PDF417HighLevelEncoder.determineConsecutiveTextCount(input, p);
                        if (t >= 5 || n === len) {
                            if (encodingMode !== PDF417HighLevelEncoder.TEXT_COMPACTION) {
                                sb.append(String.fromCharCode(PDF417HighLevelEncoder.LATCH_TO_TEXT));
                                encodingMode = PDF417HighLevelEncoder.TEXT_COMPACTION;
                                textSubMode = PDF417HighLevelEncoder.SUBMODE_ALPHA; // start with submode alpha after latch
                            }
                            textSubMode = PDF417HighLevelEncoder.encodeText(input, p, t, sb, textSubMode);
                            p += t;
                        } else {
                            let b: int = PDF417HighLevelEncoder.determineConsecutiveBinaryCount(input, p, autoECI ? null : encoding);
                            if (b === 0) {
                                b = 1;
                            }
                            const bytes: Uint8Array = autoECI ? null : StringEncoding.encode(input.subSequence(p, p + b), encoding);
                            if (((bytes == null && b === 1) || (bytes != null && bytes.length === 1))
                                && encodingMode === PDF417HighLevelEncoder.TEXT_COMPACTION) {
                                // Switch for one byte (instead of latch)
                                if (autoECI) {
                                    PDF417HighLevelEncoder.encodeMultiECIBinary(input, p, 1, PDF417HighLevelEncoder.TEXT_COMPACTION, sb);
                                } else {
                                    PDF417HighLevelEncoder.encodeBinary(bytes, 0, 1, PDF417HighLevelEncoder.TEXT_COMPACTION, sb);
                                }
                            } else {
                                // Mode latch performed by encodeBinary()
                                if (autoECI) {
                                    PDF417HighLevelEncoder.encodeMultiECIBinary(input, p, p + b, encodingMode, sb);
                                } else {
                                    PDF417HighLevelEncoder.encodeBinary(bytes, 0, bytes.length, encodingMode, sb);
                                }
                                encodingMode = PDF417HighLevelEncoder.BYTE_COMPACTION;
                                textSubMode = PDF417HighLevelEncoder.SUBMODE_ALPHA; // Reset after latch
                            }
                            p += b;
                        }
                    }
                }
                break;
            }
        }

        return sb.toString();
    }

    /**
     * Check if input is only made of characters between 0 and the upper limit
     * @param input          the input
     * @param max            the upper limit for charset
     * @param errorMessage   the message to explain the error
     * @throws WriterException exception highlighting the offending character and a suggestion to avoid the error
     */
    public static checkCharset(input: string, max: int, errorMessage: string): void /*throws WriterException*/ {
        for (let i = 0; i < input.length; i++) {
            if (input.charCodeAt(i) > max) {
                throw new WriterException(
                    'Non-encodable character detected: ' + input.charAt(i) + ' (Unicode: ' + input.charCodeAt(i) +
                    ') at position #' + i + ' - ' + errorMessage
                );
            }
        }
    }

    /**
     * Encode parts of the message using Text Compaction as described in ISO/IEC 15438:2001(E),
     * chapter 4.4.2.
     *
     * @param input          the input
     * @param startpos       the start position within the message
     * @param count          the number of characters to encode
     * @param sb             receives the encoded codewords
     * @param initialSubmode should normally be SUBMODE_ALPHA
     * @return the text submode in which this method ends
     */
    private static encodeText(
        input: ECIInput,
        startpos: int,
        count: int,
        sb: StringBuilder,
        initialSubmode: int
    ): int /*throws WriterException*/ {
        const tmp = new StringBuilder();
        let submode: int = initialSubmode;
        let idx: int = 0;
        while (true) {
            if (input.isECI(startpos + idx)) {
                PDF417HighLevelEncoder.encodingECI(input.getECIValue(startpos + idx), sb);
                idx++;
            } else {
                const ch: char = input.charAt(startpos + idx);
                switch (submode) {
                    case PDF417HighLevelEncoder.SUBMODE_ALPHA:
                        if (PDF417HighLevelEncoder.isAlphaUpper(ch)) {
                            if (ch === 0x20 /* ' ' */) {
                                tmp.append(String.fromCharCode(26)); // space
                            } else {
                                tmp.append(String.fromCharCode(ch - 65));
                            }
                        } else {
                            if (PDF417HighLevelEncoder.isAlphaLower(ch)) {
                                submode = PDF417HighLevelEncoder.SUBMODE_LOWER;
                                tmp.append(String.fromCharCode(27)); // ll
                                continue;
                            } else if (PDF417HighLevelEncoder.isMixed(ch)) {
                                submode = PDF417HighLevelEncoder.SUBMODE_MIXED;
                                tmp.append(String.fromCharCode(28)); // ml
                                continue;
                            } else {
                                tmp.append(String.fromCharCode(29)); // ps
                                tmp.append(String.fromCharCode(PDF417HighLevelEncoder.PUNCTUATION[ch]));
                                break;
                            }
                        }
                        break;
                    case PDF417HighLevelEncoder.SUBMODE_LOWER:
                        if (PDF417HighLevelEncoder.isAlphaLower(ch)) {
                            if (ch === 0x20 /* ' ' */) {
                                tmp.append(String.fromCharCode(26)); // space
                            } else {
                                tmp.append(String.fromCharCode(ch - 97));
                            }
                        } else {
                            if (PDF417HighLevelEncoder.isAlphaUpper(ch)) {
                                tmp.append(String.fromCharCode(27)); // as
                                tmp.append(String.fromCharCode(ch - 65));
                                // space cannot happen here, it is also in "Lower"
                                break;
                            } else if (PDF417HighLevelEncoder.isMixed(ch)) {
                                submode = PDF417HighLevelEncoder.SUBMODE_MIXED;
                                tmp.append(String.fromCharCode(28)); // ml
                                continue;
                            } else {
                                tmp.append(String.fromCharCode(29)); // ps
                                tmp.append(String.fromCharCode(PDF417HighLevelEncoder.PUNCTUATION[ch]));
                                break;
                            }
                        }
                        break;
                    case PDF417HighLevelEncoder.SUBMODE_MIXED:
                        if (PDF417HighLevelEncoder.isMixed(ch)) {
                            tmp.append(String.fromCharCode(PDF417HighLevelEncoder.MIXED[ch]));
                        } else {
                            if (PDF417HighLevelEncoder.isAlphaUpper(ch)) {
                                submode = PDF417HighLevelEncoder.SUBMODE_ALPHA;
                                tmp.append(String.fromCharCode(28)); // al
                                continue;
                            } else if (PDF417HighLevelEncoder.isAlphaLower(ch)) {
                                submode = PDF417HighLevelEncoder.SUBMODE_LOWER;
                                tmp.append(String.fromCharCode(27)); // ll
                                continue;
                            } else {
                                if (startpos + idx + 1 < count &&
                                    !input.isECI(startpos + idx + 1) &&
                                    PDF417HighLevelEncoder.isPunctuation(input.charAt(startpos + idx + 1))) {
                                    submode = PDF417HighLevelEncoder.SUBMODE_PUNCTUATION;
                                    tmp.append(String.fromCharCode(25)); // pl
                                    continue;
                                }
                                tmp.append(String.fromCharCode(29)); // ps
                                tmp.append(String.fromCharCode(PDF417HighLevelEncoder.PUNCTUATION[ch]));
                            }
                        }
                        break;
                    default: // SUBMODE_PUNCTUATION
                        if (PDF417HighLevelEncoder.isPunctuation(ch)) {
                            tmp.append(String.fromCharCode(PDF417HighLevelEncoder.PUNCTUATION[ch]));
                        } else {
                            submode = PDF417HighLevelEncoder.SUBMODE_ALPHA;
                            tmp.append(String.fromCharCode(29)); // al
                            continue;
                        }
                }
                idx++;
                if (idx >= count) {
                    break;
                }
            }
        }
        let h: char = 0;
        const len: int = tmp.length();
        for (let i = 0; i < len; i++) {
            const odd: boolean = (i % 2) !== 0;
            if (odd) {
                h = ((h * 30) + tmp.charAt(i).charCodeAt(0)) & 0xFFFF;
                sb.append(String.fromCharCode(h));
            } else {
                h = tmp.charAt(i).charCodeAt(0);
            }
        }
        if ((len % 2) !== 0) {
            sb.append(String.fromCharCode(((h * 30) + 29) & 0xFFFF)); // ps
        }
        return submode;
    }

    /**
     * Encode all of the message using Byte Compaction as described in ISO/IEC 15438:2001(E)
     *
     * @param input     the input
     * @param startpos  the start position within the message
     * @param count     the number of bytes to encode
     * @param startmode the mode from which this method starts
     * @param sb        receives the encoded codewords
     */
    private static encodeMultiECIBinary(
        input: ECIInput,
        startpos: int,
        count: int,
        startmode: int,
        sb: StringBuilder
    ): void /*throws WriterException*/ {
        const end: int = Math.min(startpos + count, input.length());
        let localStart: int = startpos;
        while (true) {
            // encode all leading ECIs and advance localStart
            while (localStart < end && input.isECI(localStart)) {
                PDF417HighLevelEncoder.encodingECI(input.getECIValue(localStart), sb);
                localStart++;
            }
            let localEnd: int = localStart;
            // advance end until before the next ECI
            while (localEnd < end && !input.isECI(localEnd)) {
                localEnd++;
            }

            const localCount: int = localEnd - localStart;
            if (localCount <= 0) {
                // done
                break;
            } else {
                // encode the segment
                PDF417HighLevelEncoder.encodeBinary(
                    PDF417HighLevelEncoder.subBytes(input, localStart, localEnd),
                    0,
                    localCount,
                    localStart === startpos ? startmode : PDF417HighLevelEncoder.BYTE_COMPACTION,
                    sb
                );
                localStart = localEnd;
            }
        }
    }

    public static subBytes(input: ECIInput, start: int, end: int): Uint8Array {
        const count: int = end - start;
        const result = new Uint8Array(count);
        for (let i = start; i < end; i++) {
            result[i - start] = input.charAt(i) & 0xff;
        }
        return result;
    }

    /**
     * Encode parts of the message using Byte Compaction as described in ISO/IEC 15438:2001(E),
     * chapter 4.4.3. The Unicode characters will be converted to binary using the cp437
     * codepage.
     *
     * @param bytes     the message converted to a byte array
     * @param startpos  the start position within the message
     * @param count     the number of bytes to encode
     * @param startmode the mode from which this method starts
     * @param sb        receives the encoded codewords
     */
    private static encodeBinary(
        bytes: Uint8Array,
        startpos: int,
        count: int,
        startmode: int,
        sb: StringBuilder
    ): void {
        if (count === 1 && startmode === PDF417HighLevelEncoder.TEXT_COMPACTION) {
            sb.append(String.fromCharCode(PDF417HighLevelEncoder.SHIFT_TO_BYTE));
        } else {
            if ((count % 6) === 0) {
                sb.append(String.fromCharCode(PDF417HighLevelEncoder.LATCH_TO_BYTE));
            } else {
                sb.append(String.fromCharCode(PDF417HighLevelEncoder.LATCH_TO_BYTE_PADDED));
            }
        }

        let idx: int = startpos;
        // Encode sixpacks
        if (count >= 6) {
            const chars = new Int32Array(5);
            while ((startpos + count - idx) >= 6) {
                // Java accumulates into a long; six bytes need 48 bits, which exceeds the 32 bits
                // that JavaScript bitwise operators work on, so this multiplies instead of shifting.
                let t = 0;
                for (let i = 0; i < 6; i++) {
                    t = t * 256 + (bytes[idx + i] & 0xff);
                }
                for (let i = 0; i < 5; i++) {
                    chars[i] = t % 900;
                    t = Math.floor(t / 900);
                }
                for (let i = chars.length - 1; i >= 0; i--) {
                    sb.append(String.fromCharCode(chars[i]));
                }
                idx += 6;
            }
        }
        // Encode rest (remaining n<5 bytes if any)
        for (let i = idx; i < startpos + count; i++) {
            const ch: int = bytes[i] & 0xff;
            sb.append(String.fromCharCode(ch));
        }
    }

    private static encodeNumeric(input: ECIInput, startpos: int, count: int, sb: StringBuilder): void {
        let idx: int = 0;
        const num900 = BigInt(900);
        const num0 = BigInt(0);
        while (idx < count) {
            let tmp = '';
            const len: int = Math.min(44, count - idx);
            const part: string = '1' + input.subSequence(startpos + idx, startpos + idx + len);
            let bigint = BigInt(part);
            do {
                tmp += String.fromCharCode(Number(bigint % num900));
                bigint = bigint / num900;
            } while (bigint !== num0);

            // Reverse temporary string
            for (let i = tmp.length - 1; i >= 0; i--) {
                sb.append(tmp.charAt(i));
            }
            idx += len;
        }
    }

    private static isDigit(ch: char): boolean {
        return ch >= 0x30 /* '0' */ && ch <= 0x39 /* '9' */;
    }

    private static isAlphaUpper(ch: char): boolean {
        return ch === 0x20 /* ' ' */ || (ch >= 0x41 /* 'A' */ && ch <= 0x5A /* 'Z' */);
    }

    private static isAlphaLower(ch: char): boolean {
        return ch === 0x20 /* ' ' */ || (ch >= 0x61 /* 'a' */ && ch <= 0x7A /* 'z' */);
    }

    private static isMixed(ch: char): boolean {
        return PDF417HighLevelEncoder.MIXED[ch] !== -1;
    }

    private static isPunctuation(ch: char): boolean {
        return PDF417HighLevelEncoder.PUNCTUATION[ch] !== -1;
    }

    private static isText(ch: char): boolean {
        return ch === 0x09 /* '\t' */ || ch === 0x0A /* '\n' */ || ch === 0x0D /* '\r' */ || (ch >= 32 && ch <= 126);
    }

    /**
     * Determines the number of consecutive characters that are encodable using numeric compaction.
     *
     * @param input    the input
     * @param startpos the start position within the input
     * @return the requested character count
     */
    private static determineConsecutiveDigitCount(input: ECIInput, startpos: int): int {
        let count: int = 0;
        const len: int = input.length();
        let idx: int = startpos;
        if (idx < len) {
            while (idx < len && !input.isECI(idx) && PDF417HighLevelEncoder.isDigit(input.charAt(idx))) {
                count++;
                idx++;
            }
        }
        return count;
    }

    /**
     * Determines the number of consecutive characters that are encodable using text compaction.
     *
     * @param input    the input
     * @param startpos the start position within the input
     * @return the requested character count
     */
    private static determineConsecutiveTextCount(input: ECIInput, startpos: int): int {
        const len: int = input.length();
        let idx: int = startpos;
        while (idx < len) {
            let numericCount: int = 0;
            while (numericCount < 13 && idx < len && !input.isECI(idx) && PDF417HighLevelEncoder.isDigit(input.charAt(idx))) {
                numericCount++;
                idx++;
            }
            if (numericCount >= 13) {
                return idx - startpos - numericCount;
            }
            if (numericCount > 0) {
                // Heuristic: All text-encodable chars or digits are binary encodable
                continue;
            }

            // Check if character is encodable
            if (input.isECI(idx) || !PDF417HighLevelEncoder.isText(input.charAt(idx))) {
                break;
            }
            idx++;
        }
        return idx - startpos;
    }

    /**
     * Determines the number of consecutive characters that are encodable using binary compaction.
     *
     * @param input    the input
     * @param startpos the start position within the message
     * @param encoding the charset used to convert the message to a byte array
     * @return the requested character count
     */
    private static determineConsecutiveBinaryCount(
        input: ECIInput,
        startpos: int,
        encoding: Charset
    ): int /*throws WriterException*/ {
        const len: int = input.length();
        let idx: int = startpos;
        while (idx < len) {
            let numericCount: int = 0;

            let i: int = idx;
            while (numericCount < 13 && !input.isECI(i) && PDF417HighLevelEncoder.isDigit(input.charAt(i))) {
                numericCount++;
                // textCount++;
                i = idx + numericCount;
                if (i >= len) {
                    break;
                }
            }
            if (numericCount >= 13) {
                return idx - startpos;
            }

            if (encoding != null && !PDF417HighLevelEncoder.canEncode(input.charAt(idx), encoding)) {
                const ch: char = input.charAt(idx);
                throw new WriterException(
                    'Non-encodable character detected: ' + String.fromCharCode(ch) + ' (Unicode: ' + ch + ')'
                );
            }
            idx++;
        }
        return idx - startpos;
    }

    /**
     * Stands in for Java's {@code CharsetEncoder.canEncode}, which has no direct equivalent here.
     */
    private static canEncode(ch: char, encoding: Charset): boolean {
        try {
            return StringEncoding.encode(String.fromCharCode(ch), encoding) != null;
        } catch (ex) {
            return false;
        }
    }

    private static encodingECI(eci: int, sb: StringBuilder): void /*throws WriterException*/ {
        if (eci >= 0 && eci < 900) {
            sb.append(String.fromCharCode(PDF417HighLevelEncoder.ECI_CHARSET));
            sb.append(String.fromCharCode(eci));
        } else if (eci < 810900) {
            sb.append(String.fromCharCode(PDF417HighLevelEncoder.ECI_GENERAL_PURPOSE));
            sb.append(String.fromCharCode(Math.floor(eci / 900) - 1));
            sb.append(String.fromCharCode(eci % 900));
        } else if (eci < 811800) {
            sb.append(String.fromCharCode(PDF417HighLevelEncoder.ECI_USER_DEFINED));
            sb.append(String.fromCharCode(810900 - eci));
        } else {
            throw new WriterException('ECI number not in valid range from 0..811799, but was ' + eci);
        }
    }

}

/* private static final */ class NoECIInput implements ECIInput {

    public constructor(private input: string) { }

    public length(): int {
        return this.input.length;
    }

    public charAt(index: int): char {
        return this.input.charCodeAt(index);
    }

    public isECI(index: int): boolean {
        return false;
    }

    public getECIValue(index: int): int {
        return -1;
    }

    public haveNCharacters(index: int, n: int): boolean {
        return index + n <= this.input.length;
    }

    public subSequence(start: int, end: int): string {
        return this.input.substring(start, end);
    }

    public toString(): string {
        return this.input;
    }

}
