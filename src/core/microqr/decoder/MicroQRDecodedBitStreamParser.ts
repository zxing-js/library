/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import BitSource from '../../common/BitSource';
import DecoderResult from '../../common/DecoderResult';
import StringUtils from '../../common/StringUtils';
import DecodeHintType from '../../DecodeHintType';
import FormatException from '../../FormatException';
import StringBuilder from '../../util/StringBuilder';
import StringEncoding from '../../util/StringEncoding';
import MicroQRVersion from './MicroQRVersion';

/**
 * Decodes Micro QR Code codeword bytes to text.
 *
 * Modes and character count bits by version (ISO 18004:2006, Annex E):
 *
 *            M1  M2  M3  M4
 * Numeric     3   4   5   6
 * Alpha       -   3   4   5
 * Byte        -   -   4   5
 * Kanji       -   -   3   4
 *
 * Mode indicator bits: 0 (M1), 1 (M2), 2 (M3), 3 (M4)
 * Terminator: 3 bits (M1), 5 bits (M2-M4)
 *
 * The terminator is detected when count==0 after reading a mode indicator.
 * For M1 (no mode indicator), it's detected when count==0.
 */
export default class MicroQRDecodedBitStreamParser {

    private static readonly ALPHANUMERIC_CHARS =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

    private static readonly MODE_NUMERIC = 0;
    private static readonly MODE_ALPHA   = 1;
    private static readonly MODE_BYTE    = 2;
    private static readonly MODE_KANJI   = 3;

    public static decode(
        bytes: Uint8Array,
        version: MicroQRVersion,
        hints: Map<DecodeHintType, any> | null
    ): DecoderResult {
        const bits = new BitSource(bytes);
        const result = new StringBuilder();
        const byteSegments: Uint8Array[] = [];
        const versionNumber = version.getVersionNumber();
        const modeIndicatorBits = version.getModeIndicatorBits();

        try {
            while (true) {
                // Determine mode
                let mode: number;

                if (modeIndicatorBits === 0) {
                    // M1: always Numeric, no mode indicator field
                    mode = MicroQRDecodedBitStreamParser.MODE_NUMERIC;
                } else {
                    if (bits.available() < modeIndicatorBits) break;
                    const modeBits = bits.readBits(modeIndicatorBits);
                    mode = MicroQRDecodedBitStreamParser.decodeMode(modeBits, versionNumber);
                }

                // Read character count
                const countBits = MicroQRDecodedBitStreamParser.charCountBits(mode, versionNumber);
                if (bits.available() < countBits) break;
                const count = bits.readBits(countBits);

                // count == 0 signals the terminator (all-zero trailing bits)
                if (count === 0) break;

                // Decode the segment
                switch (mode) {
                    case MicroQRDecodedBitStreamParser.MODE_NUMERIC:
                        MicroQRDecodedBitStreamParser.decodeNumeric(bits, result, count);
                        break;
                    case MicroQRDecodedBitStreamParser.MODE_ALPHA:
                        MicroQRDecodedBitStreamParser.decodeAlphanumeric(bits, result, count);
                        break;
                    case MicroQRDecodedBitStreamParser.MODE_BYTE:
                        MicroQRDecodedBitStreamParser.decodeByte(bits, result, byteSegments, count, hints);
                        break;
                    case MicroQRDecodedBitStreamParser.MODE_KANJI:
                        MicroQRDecodedBitStreamParser.decodeKanji(bits, result, count);
                        break;
                    default:
                        throw new FormatException();
                }
            }
        } catch (e) {
            if (e instanceof FormatException) throw e;
            throw new FormatException();
        }

        return new DecoderResult(
            bytes,
            result.toString(),
            byteSegments.length === 0 ? null : byteSegments,
            version.getECLevelLabel(),
            -1,
            -1
        );
    }

    /**
     * Decode mode indicator bits.
     * M2 (1 bit):  0=Numeric, 1=Alpha
     * M3 (2 bits): 00=Numeric, 01=Alpha, 10=Byte, 11=Kanji
     * M4 (3 bits): 000=Numeric, 001=Alpha, 010=Byte, 100=Kanji
     */
    private static decodeMode(modeBits: number, versionNumber: number): number {
        switch (versionNumber) {
            case 2: // M2: 1 bit
                return modeBits === 0
                    ? MicroQRDecodedBitStreamParser.MODE_NUMERIC
                    : MicroQRDecodedBitStreamParser.MODE_ALPHA;
            case 3: // M3: 2 bits
                switch (modeBits) {
                    case 0b00: return MicroQRDecodedBitStreamParser.MODE_NUMERIC;
                    case 0b01: return MicroQRDecodedBitStreamParser.MODE_ALPHA;
                    case 0b10: return MicroQRDecodedBitStreamParser.MODE_BYTE;
                    case 0b11: return MicroQRDecodedBitStreamParser.MODE_KANJI;
                }
                break;
            case 4: // M4: 3 bits; Kanji = 100 (not 011)
                switch (modeBits) {
                    case 0b000: return MicroQRDecodedBitStreamParser.MODE_NUMERIC;
                    case 0b001: return MicroQRDecodedBitStreamParser.MODE_ALPHA;
                    case 0b010: return MicroQRDecodedBitStreamParser.MODE_BYTE;
                    case 0b100: return MicroQRDecodedBitStreamParser.MODE_KANJI;
                }
                break;
        }
        throw new FormatException();
    }

    /**
     * Character count bit widths by mode and version:
     *
     *            M1  M2  M3  M4
     * Numeric     3   4   5   6     → versionNumber + 2
     * Alpha       -   3   4   5     → versionNumber + 1
     * Byte        -   -   4   5     → versionNumber + 1  (M3=4, M4=5)
     * Kanji       -   -   3   4     → versionNumber      (M3=3, M4=4)
     */
    private static charCountBits(mode: number, versionNumber: number): number {
        switch (mode) {
            case MicroQRDecodedBitStreamParser.MODE_NUMERIC:
                return versionNumber + 2; // M1=3, M2=4, M3=5, M4=6
            case MicroQRDecodedBitStreamParser.MODE_ALPHA:
                return versionNumber + 1; // M2=3, M3=4, M4=5
            case MicroQRDecodedBitStreamParser.MODE_BYTE:
                return versionNumber + 1; // M3=4, M4=5
            case MicroQRDecodedBitStreamParser.MODE_KANJI:
                return versionNumber;     // M3=3, M4=4
            default:
                throw new FormatException();
        }
    }

    private static decodeNumeric(bits: BitSource, result: StringBuilder, count: number): void {
        let remaining = count;
        while (remaining >= 3) {
            if (bits.available() < 10) throw new FormatException();
            const threeDigits = bits.readBits(10);
            if (threeDigits >= 1000) throw new FormatException();
            result.append(MicroQRDecodedBitStreamParser.toChar(Math.floor(threeDigits / 100)));
            result.append(MicroQRDecodedBitStreamParser.toChar(Math.floor(threeDigits / 10) % 10));
            result.append(MicroQRDecodedBitStreamParser.toChar(threeDigits % 10));
            remaining -= 3;
        }
        if (remaining === 2) {
            if (bits.available() < 7) throw new FormatException();
            const twoDigits = bits.readBits(7);
            if (twoDigits >= 100) throw new FormatException();
            result.append(MicroQRDecodedBitStreamParser.toChar(Math.floor(twoDigits / 10)));
            result.append(MicroQRDecodedBitStreamParser.toChar(twoDigits % 10));
        } else if (remaining === 1) {
            if (bits.available() < 4) throw new FormatException();
            const oneDigit = bits.readBits(4);
            if (oneDigit >= 10) throw new FormatException();
            result.append(MicroQRDecodedBitStreamParser.toChar(oneDigit));
        }
    }

    private static decodeAlphanumeric(bits: BitSource, result: StringBuilder, count: number): void {
        let remaining = count;
        while (remaining > 1) {
            if (bits.available() < 11) throw new FormatException();
            const twoChars = bits.readBits(11);
            result.append(MicroQRDecodedBitStreamParser.toAlphaNum(Math.floor(twoChars / 45)));
            result.append(MicroQRDecodedBitStreamParser.toAlphaNum(twoChars % 45));
            remaining -= 2;
        }
        if (remaining === 1) {
            if (bits.available() < 6) throw new FormatException();
            result.append(MicroQRDecodedBitStreamParser.toAlphaNum(bits.readBits(6)));
        }
    }

    private static decodeByte(
        bits: BitSource,
        result: StringBuilder,
        byteSegments: Uint8Array[],
        count: number,
        hints: Map<DecodeHintType, any> | null
    ): void {
        if (8 * count > bits.available()) throw new FormatException();
        const readBytes = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            readBytes[i] = bits.readBits(8) & 0xFF;
        }
        const encoding = StringUtils.guessEncoding(readBytes, hints);
        try {
            result.append(StringEncoding.decode(readBytes, encoding));
        } catch (e) {
            throw new FormatException();
        }
        byteSegments.push(readBytes);
    }

    private static decodeKanji(bits: BitSource, result: StringBuilder, count: number): void {
        if (13 * count > bits.available()) throw new FormatException();
        const buffer = new Uint8Array(2 * count);
        let offset = 0;
        for (let i = 0; i < count; i++) {
            const twoBytes = bits.readBits(13);
            let assembled = (Math.floor(twoBytes / 0x0C0) << 8) | (twoBytes % 0x0C0);
            assembled += assembled < 0x01F00 ? 0x08140 : 0x0C140;
            buffer[offset++] = (assembled >> 8) & 0xFF;
            buffer[offset++] = assembled & 0xFF;
        }
        try {
            result.append(StringEncoding.decode(buffer, StringUtils.SHIFT_JIS));
        } catch (e) {
            throw new FormatException();
        }
    }

    private static toChar(value: number): string {
        if (value >= MicroQRDecodedBitStreamParser.ALPHANUMERIC_CHARS.length) {
            throw new FormatException();
        }
        return MicroQRDecodedBitStreamParser.ALPHANUMERIC_CHARS[value];
    }

    private static toAlphaNum(value: number): string {
        if (value >= MicroQRDecodedBitStreamParser.ALPHANUMERIC_CHARS.length) {
            throw new FormatException();
        }
        return MicroQRDecodedBitStreamParser.ALPHANUMERIC_CHARS[value];
    }
}
