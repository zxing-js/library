/*
 * Copyright 2010 ZXing authors
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

// package com.google.zxing.oned;

import BarcodeFormat from '../BarcodeFormat';
import EncodeHintType from '../EncodeHintType';
import IllegalArgumentException from '../IllegalArgumentException';
import Integer from '../util/Integer';
import Code128Reader from './Code128Reader';
import OneDimensionalCodeWriter from './OneDimensionalCodeWriter';

import { int } from '../../customTypings';

const CODE_START_A = 103;
const CODE_START_B = 104;
const CODE_START_C = 105;
const CODE_CODE_A = 101;
const CODE_CODE_B = 100;
const CODE_CODE_C = 99;
const CODE_STOP = 106;

// Dummy characters used to specify control characters in input
const ESCAPE_FNC_1 = 'ñ';
const ESCAPE_FNC_2 = 'ò';
const ESCAPE_FNC_3 = 'ó';
const ESCAPE_FNC_4 = 'ô';

const CODE_FNC_1 = 102;   // Code A, Code B, Code C
const CODE_FNC_2 = 97;    // Code A, Code B
const CODE_FNC_3 = 96;    // Code A, Code B
const CODE_FNC_4_A = 101; // Code A
const CODE_FNC_4_B = 100; // Code B

/** Results of minimal lookahead for code C */
enum CType {
    UNCODABLE,
    ONE_DIGIT,
    TWO_DIGITS,
    FNC_1,
}

/** Ordinals match Java's enum ordinals, which index memoizedCost / minPath. */
enum MinimalCharset {
    A = 0,
    B = 1,
    C = 2,
    NONE = 3,
}

enum Latch {
    A = 0,
    B = 1,
    C = 2,
    SHIFT = 3,
    NONE = 4,
}

/**
 * This object renders a CODE128 code as a {@link BitMatrix}.
 *
 * @author erik.barbara@gmail.com (Erik Barbara)
 */
export default class Code128Writer extends OneDimensionalCodeWriter {

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.CODE_128];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {
        return this.encodeContentsWithHints(contents, null);
    }

    // @Override
    public encodeContentsWithHints(contents: string, hints: Map<EncodeHintType, any>): boolean[] {

        const forcedCodeSet = Code128Writer.check(contents, hints);

        const hasCompactionHint = hints != null && hints.has(EncodeHintType.CODE128_COMPACT) &&
            String(hints.get(EncodeHintType.CODE128_COMPACT)) === 'true';

        return hasCompactionHint
            ? new MinimalEncoder().encode(contents)
            : Code128Writer.encodeFast(contents, forcedCodeSet);
    }

    private static check(contents: string, hints: Map<EncodeHintType, any>): int {
        // Check for forced code set hint.
        let forcedCodeSet = -1;
        if (hints != null && hints.has(EncodeHintType.FORCE_CODE_SET)) {
            const codeSetHint = hints.get(EncodeHintType.FORCE_CODE_SET).toString();
            switch (codeSetHint) {
                case 'A':
                    forcedCodeSet = CODE_CODE_A;
                    break;
                case 'B':
                    forcedCodeSet = CODE_CODE_B;
                    break;
                case 'C':
                    forcedCodeSet = CODE_CODE_C;
                    break;
                default:
                    throw new IllegalArgumentException('Unsupported code set hint: ' + codeSetHint);
            }
        }

        // Check content
        const length = contents.length;
        for (let i = 0; i < length; i++) {
            const c = contents.charAt(i);
            const code = contents.charCodeAt(i);
            // check for non ascii characters that are not special GS1 characters
            switch (c) {
                // special function characters
                case ESCAPE_FNC_1:
                case ESCAPE_FNC_2:
                case ESCAPE_FNC_3:
                case ESCAPE_FNC_4:
                    break;
                // non ascii characters
                default:
                    if (code > 127) {
                        // no full Latin-1 character set available at the moment
                        // shift and manual code change are not supported
                        throw new IllegalArgumentException('Bad character in input: ASCII value=' + code);
                    }
            }
            // check characters for compatibility with forced code set
            switch (forcedCodeSet) {
                case CODE_CODE_A:
                    // allows no ascii above 95 (no lower caps, no special symbols)
                    if (code > 95 && code <= 127) {
                        throw new IllegalArgumentException(
                            'Bad character in input for forced code set A: ASCII value=' + code
                        );
                    }
                    break;
                case CODE_CODE_B:
                    // allows no ascii below 32 (terminal symbols)
                    if (code < 32) {
                        throw new IllegalArgumentException(
                            'Bad character in input for forced code set B: ASCII value=' + code
                        );
                    }
                    break;
                case CODE_CODE_C:
                    // allows only numbers and no FNC 2/3/4
                    if (code < 48 || (code > 57 && code <= 127) ||
                        c === ESCAPE_FNC_2 || c === ESCAPE_FNC_3 || c === ESCAPE_FNC_4) {
                        throw new IllegalArgumentException(
                            'Bad character in input for forced code set C: ASCII value=' + code
                        );
                    }
                    break;
            }
        }
        return forcedCodeSet;
    }

    private static encodeFast(contents: string, forcedCodeSet: int): boolean[] {
        const length = contents.length;

        const patterns: Int32Array[] = []; // temporary storage for patterns
        let checkSum = 0;
        let checkWeight = 1;
        let codeSet = 0; // selected code (CODE_CODE_B or CODE_CODE_C)
        let position = 0; // position in contents

        while (position < length) {
            // Select code to use
            let newCodeSet: int;
            if (forcedCodeSet === -1) {
                newCodeSet = Code128Writer.chooseCode(contents, position, codeSet);
            } else {
                newCodeSet = forcedCodeSet;
            }

            // Get the pattern index
            let patternIndex: int;
            if (newCodeSet === codeSet) {
                // Encode the current character
                // First handle escapes
                switch (contents.charAt(position)) {
                    case ESCAPE_FNC_1:
                        patternIndex = CODE_FNC_1;
                        break;
                    case ESCAPE_FNC_2:
                        patternIndex = CODE_FNC_2;
                        break;
                    case ESCAPE_FNC_3:
                        patternIndex = CODE_FNC_3;
                        break;
                    case ESCAPE_FNC_4:
                        if (codeSet === CODE_CODE_A) {
                            patternIndex = CODE_FNC_4_A;
                        } else {
                            patternIndex = CODE_FNC_4_B;
                        }
                        break;
                    default:
                        // Then handle normal characters otherwise
                        switch (codeSet) {
                            case CODE_CODE_A:
                                patternIndex = contents.charCodeAt(position) - ' '.charCodeAt(0);
                                if (patternIndex < 0) {
                                    // everything below a space character comes behind the underscore
                                    // in the code patterns table
                                    patternIndex += '`'.charCodeAt(0);
                                }
                                break;
                            case CODE_CODE_B:
                                patternIndex = contents.charCodeAt(position) - ' '.charCodeAt(0);
                                break;
                            default:
                                // CODE_CODE_C
                                if (position + 1 === length) {
                                    // this is the last character, but the encoding is C, which always
                                    // encodes two characters
                                    throw new IllegalArgumentException(
                                        'Bad number of characters for digit only encoding.'
                                    );
                                }
                                patternIndex = Integer.parseInt(contents.substring(position, position + 2));
                                position++; // Also incremented below
                                break;
                        }
                }
                position++;
            } else {
                // Should we change the current code?
                // Do we have a code set?
                if (codeSet === 0) {
                    // No, we don't have a code set
                    switch (newCodeSet) {
                        case CODE_CODE_A:
                            patternIndex = CODE_START_A;
                            break;
                        case CODE_CODE_B:
                            patternIndex = CODE_START_B;
                            break;
                        default:
                            patternIndex = CODE_START_C;
                            break;
                    }
                } else {
                    // Yes, we have a code set
                    patternIndex = newCodeSet;
                }
                codeSet = newCodeSet;
            }

            // Get the pattern
            patterns.push(Code128Reader.CODE_PATTERNS[patternIndex]);

            // Compute checksum
            checkSum += patternIndex * checkWeight;
            if (position !== 0) {
                checkWeight++;
            }
        }
        return Code128Writer.produceResult(patterns, checkSum);
    }

    static produceResult(patterns: Int32Array[], checkSum: int): boolean[] {
        // Compute and append checksum
        checkSum %= 103;
        if (checkSum < 0) {
            throw new IllegalArgumentException('Unable to compute a valid input checksum');
        }
        patterns.push(Code128Reader.CODE_PATTERNS[checkSum]);

        // Append stop code
        patterns.push(Code128Reader.CODE_PATTERNS[CODE_STOP]);

        // Compute code width
        let codeWidth = 0;
        for (const pattern of patterns) {
            for (const width of pattern) {
                codeWidth += width;
            }
        }

        // Compute result
        const result = new Array<boolean>(codeWidth).fill(false);
        let pos = 0;
        for (const pattern of patterns) {
            pos += Code128Writer.appendPattern(result, pos, pattern, true);
        }

        return result;
    }

    private static findCType(value: string, start: int): CType {
        const last = value.length;
        if (start >= last) {
            return CType.UNCODABLE;
        }
        let c = value.charAt(start);
        if (c === ESCAPE_FNC_1) {
            return CType.FNC_1;
        }
        if (c < '0' || c > '9') {
            return CType.UNCODABLE;
        }
        if (start + 1 >= last) {
            return CType.ONE_DIGIT;
        }
        c = value.charAt(start + 1);
        if (c < '0' || c > '9') {
            return CType.ONE_DIGIT;
        }
        return CType.TWO_DIGITS;
    }

    private static chooseCode(value: string, start: int, oldCode: int): int {
        let lookahead = Code128Writer.findCType(value, start);
        if (lookahead === CType.ONE_DIGIT) {
            if (oldCode === CODE_CODE_A) {
                return CODE_CODE_A;
            }
            return CODE_CODE_B;
        }
        if (lookahead === CType.UNCODABLE) {
            if (start < value.length) {
                const c = value.charAt(start);
                if (c < ' ' || (oldCode === CODE_CODE_A && (c < '`' || (c >= ESCAPE_FNC_1 && c <= ESCAPE_FNC_4)))) {
                    // can continue in code A, encodes ASCII 0 to 95 or FNC1 to FNC4
                    return CODE_CODE_A;
                }
            }
            return CODE_CODE_B; // no choice
        }
        if (oldCode === CODE_CODE_A && lookahead === CType.FNC_1) {
            return CODE_CODE_A;
        }
        if (oldCode === CODE_CODE_C) { // can continue in code C
            return CODE_CODE_C;
        }
        if (oldCode === CODE_CODE_B) {
            if (lookahead === CType.FNC_1) {
                return CODE_CODE_B; // can continue in code B
            }
            // Seen two consecutive digits, see what follows
            lookahead = Code128Writer.findCType(value, start + 2);
            if (lookahead === CType.UNCODABLE || lookahead === CType.ONE_DIGIT) {
                return CODE_CODE_B; // not worth switching now
            }
            if (lookahead === CType.FNC_1) { // two digits, then FNC_1...
                lookahead = Code128Writer.findCType(value, start + 3);
                if (lookahead === CType.TWO_DIGITS) { // then two more digits, switch
                    return CODE_CODE_C;
                } else {
                    return CODE_CODE_B; // otherwise not worth switching
                }
            }
            // At this point, there are at least 4 consecutive digits.
            // Look ahead to choose whether to switch now or on the next round.
            let index = start + 4;
            while ((lookahead = Code128Writer.findCType(value, index)) === CType.TWO_DIGITS) {
                index += 2;
            }
            if (lookahead === CType.ONE_DIGIT) { // odd number of digits, switch later
                return CODE_CODE_B;
            }
            return CODE_CODE_C; // even number of digits, switch now
        }
        // Here oldCode == 0, which means we are choosing the initial code
        if (lookahead === CType.FNC_1) { // ignore FNC_1
            lookahead = Code128Writer.findCType(value, start + 1);
        }
        if (lookahead === CType.TWO_DIGITS) { // at least two digits, start in code C
            return CODE_CODE_C;
        }
        return CODE_CODE_B;
    }

}

/**
 * Encodes minimally using Divide-And-Conquer with Memoization
 */
class MinimalEncoder {

    // Java writes these with \u escapes; keep them escaped here too so no raw control
    // characters end up in the source.
    static readonly A =
        ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' +
        '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B' +
        '\u000C\u000D\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017' +
        '\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F' +
        '\u00FF';

    static readonly B =
        ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqr' +
        'stuvwxyz{|}~\u007F\u00FF';

    private static readonly CODE_SHIFT = 98;

    private memoizedCost: Int32Array[];
    private minPath: Latch[][];

    public encode(contents: string): boolean[] {
        this.memoizedCost = [];
        this.minPath = [];
        for (let i = 0; i < 4; i++) {
            this.memoizedCost.push(new Int32Array(contents.length));
            this.minPath.push(new Array<Latch>(contents.length).fill(null));
        }

        this.encodeInternal(contents, MinimalCharset.NONE, 0);

        const patterns: Int32Array[] = [];
        const checkSum = [0];
        const checkWeight = [1];
        const length = contents.length;
        let charset = MinimalCharset.NONE;
        for (let i = 0; i < length; i++) {
            const latch = this.minPath[charset][i];
            switch (latch) {
                case Latch.A:
                    charset = MinimalCharset.A;
                    MinimalEncoder.addPattern(patterns, i === 0 ? CODE_START_A : CODE_CODE_A, checkSum, checkWeight, i);
                    break;
                case Latch.B:
                    charset = MinimalCharset.B;
                    MinimalEncoder.addPattern(patterns, i === 0 ? CODE_START_B : CODE_CODE_B, checkSum, checkWeight, i);
                    break;
                case Latch.C:
                    charset = MinimalCharset.C;
                    MinimalEncoder.addPattern(patterns, i === 0 ? CODE_START_C : CODE_CODE_C, checkSum, checkWeight, i);
                    break;
                case Latch.SHIFT:
                    MinimalEncoder.addPattern(patterns, MinimalEncoder.CODE_SHIFT, checkSum, checkWeight, i);
                    break;
            }
            if (charset === MinimalCharset.C) {
                if (contents.charAt(i) === ESCAPE_FNC_1) {
                    MinimalEncoder.addPattern(patterns, CODE_FNC_1, checkSum, checkWeight, i);
                } else {
                    MinimalEncoder.addPattern(
                        patterns,
                        Integer.parseInt(contents.substring(i, i + 2)),
                        checkSum,
                        checkWeight,
                        i
                    );
                    // the algorithm never leads to a single trailing digit in character set C
                    if (i + 1 < length) {
                        i++;
                    }
                }
            } else { // charset A or B
                let patternIndex: int;
                switch (contents.charAt(i)) {
                    case ESCAPE_FNC_1:
                        patternIndex = CODE_FNC_1;
                        break;
                    case ESCAPE_FNC_2:
                        patternIndex = CODE_FNC_2;
                        break;
                    case ESCAPE_FNC_3:
                        patternIndex = CODE_FNC_3;
                        break;
                    case ESCAPE_FNC_4:
                        if (charset === MinimalCharset.A && latch !== Latch.SHIFT ||
                            charset === MinimalCharset.B && latch === Latch.SHIFT) {
                            patternIndex = CODE_FNC_4_A;
                        } else {
                            patternIndex = CODE_FNC_4_B;
                        }
                        break;
                    default:
                        patternIndex = contents.charCodeAt(i) - ' '.charCodeAt(0);
                }
                if ((charset === MinimalCharset.A && latch !== Latch.SHIFT ||
                     charset === MinimalCharset.B && latch === Latch.SHIFT) &&
                     patternIndex < 0) {
                    patternIndex += '`'.charCodeAt(0);
                }
                MinimalEncoder.addPattern(patterns, patternIndex, checkSum, checkWeight, i);
            }
        }
        this.memoizedCost = null;
        this.minPath = null;
        return Code128Writer.produceResult(patterns, checkSum[0]);
    }

    private static addPattern(
        patterns: Int32Array[],
        patternIndex: int,
        checkSum: number[],
        checkWeight: number[],
        position: int
    ): void {
        patterns.push(Code128Reader.CODE_PATTERNS[patternIndex]);
        if (position !== 0) {
            checkWeight[0]++;
        }
        checkSum[0] += patternIndex * checkWeight[0];
    }

    private static isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private canEncode(contents: string, charset: MinimalCharset, position: int): boolean {
        const c = contents.charAt(position);
        switch (charset) {
            case MinimalCharset.A:
                return c === ESCAPE_FNC_1 ||
                       c === ESCAPE_FNC_2 ||
                       c === ESCAPE_FNC_3 ||
                       c === ESCAPE_FNC_4 ||
                       MinimalEncoder.A.indexOf(c) >= 0;
            case MinimalCharset.B:
                return c === ESCAPE_FNC_1 ||
                       c === ESCAPE_FNC_2 ||
                       c === ESCAPE_FNC_3 ||
                       c === ESCAPE_FNC_4 ||
                       MinimalEncoder.B.indexOf(c) >= 0;
            case MinimalCharset.C:
                return c === ESCAPE_FNC_1 ||
                       (position + 1 < contents.length &&
                        MinimalEncoder.isDigit(c) &&
                        MinimalEncoder.isDigit(contents.charAt(position + 1)));
            default:
                return false;
        }
    }

    /**
     * Encode the string starting at position `position` starting with the character set `charset`.
     *
     * (Java: `private int encode(CharSequence, Charset, int)`)
     */
    private encodeInternal(contents: string, charset: MinimalCharset, position: int): int {
        const mCost = this.memoizedCost[charset][position];
        if (mCost > 0) {
            return mCost;
        }

        let minCost = Integer.MAX_VALUE;
        let minLatch = Latch.NONE;
        const atEnd = position + 1 >= contents.length;

        const sets = [MinimalCharset.A, MinimalCharset.B];
        for (let i = 0; i <= 1; i++) {
            if (this.canEncode(contents, sets[i], position)) {
                let cost = 1;
                let latch = Latch.NONE;
                if (charset !== sets[i]) {
                    cost++;
                    // Charset.A -> Latch.A, Charset.B -> Latch.B (matching ordinals)
                    latch = sets[i] === MinimalCharset.A ? Latch.A : Latch.B;
                }
                if (!atEnd) {
                    cost += this.encodeInternal(contents, sets[i], position + 1);
                }
                if (cost < minCost) {
                    minCost = cost;
                    minLatch = latch;
                }
                cost = 1;
                if (charset === sets[(i + 1) % 2]) {
                    cost++;
                    latch = Latch.SHIFT;
                    if (!atEnd) {
                        cost += this.encodeInternal(contents, charset, position + 1);
                    }
                    if (cost < minCost) {
                        minCost = cost;
                        minLatch = latch;
                    }
                }
            }
        }
        if (this.canEncode(contents, MinimalCharset.C, position)) {
            let cost = 1;
            let latch = Latch.NONE;
            if (charset !== MinimalCharset.C) {
                cost++;
                latch = Latch.C;
            }
            const advance = contents.charAt(position) === ESCAPE_FNC_1 ? 1 : 2;
            if (position + advance < contents.length) {
                cost += this.encodeInternal(contents, MinimalCharset.C, position + advance);
            }
            if (cost < minCost) {
                minCost = cost;
                minLatch = latch;
            }
        }
        if (minCost === Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                'Bad character in input: ASCII value=' + contents.charCodeAt(position)
            );
        }
        this.memoizedCost[charset][position] = minCost;
        this.minPath[charset][position] = minLatch;
        return minCost;
    }
}
