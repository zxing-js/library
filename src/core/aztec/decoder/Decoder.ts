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


import AztecDetectorResult from '../AztecDetectorResult';
import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import IllegalStateException from '../../IllegalStateException';
import FormatException from '../../FormatException';
import StringUtils from '../../common/StringUtils';
import Integer from '../../util/Integer';
import { int } from '../../../customTypings';

// import java.util.Arrays;

enum Table {
    UPPER,
    LOWER,
    MIXED,
    DIGIT,
    PUNCT,
    BINARY
}

/**
 * <p>The main class which implements Aztec Code decoding -- as opposed to locating and extracting
 * the Aztec Code from an image.</p>
 *
 * @author David Olivier
 */
export default class Decoder {

    private static UPPER_TABLE: string[] = [
        'CTRL_PS', ' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'CTRL_LL', 'CTRL_ML', 'CTRL_DL', 'CTRL_BS'
    ];

    private static LOWER_TABLE: string[] = [
        'CTRL_PS', ' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
        'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'CTRL_US', 'CTRL_ML', 'CTRL_DL', 'CTRL_BS'
    ];

    private static MIXED_TABLE: string[] = [
        // Module parse failed: Octal literal in strict mode (50:29)
        // so number string were scaped
        'CTRL_PS', ' ', '\\1', '\\2', '\\3', '\\4', '\\5', '\\6', '\\7', '\b', '\t', '\n',
        '\\13', '\f', '\r', '\\33', '\\34', '\\35', '\\36', '\\37', '@', '\\', '^', '_',
        '`', '|', '~', '\\177', 'CTRL_LL', 'CTRL_UL', 'CTRL_PL', 'CTRL_BS'
    ];

    private static PUNCT_TABLE: string[] = [
        '', '\r', '\r\n', '. ', ', ', ': ', '!', '"', '#', '$', '%', '&', '\'', '(', ')',
        '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '[', ']', '{', '}', 'CTRL_UL'
    ];

    private static DIGIT_TABLE: string[] = [
        'CTRL_PS', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.', 'CTRL_UL', 'CTRL_US'
    ];

    private ddata: AztecDetectorResult;

    public decode(detectorResult: AztecDetectorResult): DecoderResult {
        this.ddata = detectorResult;
        let matrix = detectorResult.getBits();
        let rawbits = this.extractBits(matrix);
        let correctedBits = this.correctBits(rawbits);
        let rawBytes = Decoder.convertBoolArrayToByteArray(correctedBits);
        let result = Decoder.getEncodedData(correctedBits);
        let decoderResult = new DecoderResult(rawBytes, result, null, null);
        decoderResult.setNumBits(correctedBits.length);
        return decoderResult;
    }

    // This method is used for testing the high-level encoder
    public static highLevelDecode(correctedBits: boolean[]): string {
        return this.getEncodedData(correctedBits);
    }

    /**
     * Gets the string encoded in the aztec code bits
     *
     * @return the decoded string
     */
    private static getEncodedData(correctedBits: boolean[]): string {
        let endIndex: number = correctedBits.length;
        let latchTable = Table.UPPER; // table most recently latched to
        let shiftTable = Table.UPPER; // table to use for the next read
        let result: string = '';
        let index = 0;
        while (index < endIndex) {
            if (shiftTable === Table.BINARY) {
                if (endIndex - index < 5) {
                    break;
                }
                let length = Decoder.readCode(correctedBits, index, 5);
                index += 5;
                if (length === 0) {
                    if (endIndex - index < 11) {
                        break;
                    }
                    length = Decoder.readCode(correctedBits, index, 11) + 31;
                    index += 11;
                }
                for (let charCount = 0; charCount < length; charCount++) {
                    if (endIndex - index < 8) {
                        index = endIndex;  // Force outer loop to exit
                        break;
                    }
                    const code: int = Decoder.readCode(correctedBits, index, 8);
                    result += /*(char)*/ StringUtils.castAsNonUtf8Char(code);
                    index += 8;
                }
                // Go back to whatever mode we had been in
                shiftTable = latchTable;
            } else {
                let size = shiftTable === Table.DIGIT ? 4 : 5;
                if (endIndex - index < size) {
                    break;
                }
                let code = Decoder.readCode(correctedBits, index, size);
                index += size;
                let str = Decoder.getCharacter(shiftTable, code);
                if (str.startsWith('CTRL_')) {
                    // Table changes
                    // ISO/IEC 24778:2008 prescribes ending a shift sequence in the mode from which it was invoked.
                    // That's including when that mode is a shift.
                    // Our test case dlusbs.png for issue #642 exercises that.
                    latchTable = shiftTable;  // Latch the current mode, so as to return to Upper after U/S B/S
                    shiftTable = Decoder.getTable(str.charAt(5));
                    if (str.charAt(6) === 'L') {
                        latchTable = shiftTable;
                    }
                } else {
                    result += str;
                    // Go back to whatever mode we had been in
                    shiftTable = latchTable;
                }
            }
        }
        return result;
    }

    /**
     * gets the table corresponding to the char passed
     */
    private static getTable(t: string): Table {
        switch (t) {
            case 'L':
                return Table.LOWER;
            case 'P':
                return Table.PUNCT;
            case 'M':
                return Table.MIXED;
            case 'D':
                return Table.DIGIT;
            case 'B':
                return Table.BINARY;
            case 'U':
            default:
                return Table.UPPER;
        }
    }

    /**
     * Gets the character (or string) corresponding to the passed code in the given table
     *
     * @param table the table used
     * @param code the code of the character
     */
    private static getCharacter(table: Table, code: number): string {
        switch (table) {
            case Table.UPPER:
                return Decoder.UPPER_TABLE[code];
            case Table.LOWER:
                return Decoder.LOWER_TABLE[code];
            case Table.MIXED:
                return Decoder.MIXED_TABLE[code];
            case Table.PUNCT:
                return Decoder.PUNCT_TABLE[code];
            case Table.DIGIT:
                return Decoder.DIGIT_TABLE[code];
            default:
                // Should not reach here.
                throw new IllegalStateException('Bad table');
        }
    }

    /**
     * <p>Performs RS error correction on an array of bits.</p>
     *
     * @return the corrected array
     * @throws FormatException if the input contains too many errors
     */
    private correctBits(rawbits: boolean[]): boolean[] {
        let gf: GenericGF;
        let codewordSize: number;

        if (this.ddata.getNbLayers() <= 2) {
            codewordSize = 6;
            gf = GenericGF.AZTEC_DATA_6;
        } else if (this.ddata.getNbLayers() <= 8) {
            codewordSize = 8;
            gf = GenericGF.AZTEC_DATA_8;
        } else if (this.ddata.getNbLayers() <= 22) {
            codewordSize = 10;
            gf = GenericGF.AZTEC_DATA_10;
        } else {
            codewordSize = 12;
            gf = GenericGF.AZTEC_DATA_12;
        }

        let numDataCodewords = this.ddata.getNbDatablocks();
        let numCodewords = rawbits.length / codewordSize;
        if (numCodewords < numDataCodewords) {
            throw new FormatException();
        }
        let offset = rawbits.length % codewordSize;

        let dataWords: Int32Array = new Int32Array(numCodewords);
        for (let i = 0; i < numCodewords; i++ , offset += codewordSize) {
            dataWords[i] = Decoder.readCode(rawbits, offset, codewordSize);
        }

        try {
            let rsDecoder = new ReedSolomonDecoder(gf);
            rsDecoder.decode(dataWords, numCodewords - numDataCodewords);
        } catch (ex) {
            throw new FormatException(ex);
        }

        // Now perform the unstuffing operation.
        // First, count how many bits are going to be thrown out as stuffing
        let mask = (1 << codewordSize) - 1;
        let stuffedBits = 0;
        for (let i = 0; i < numDataCodewords; i++) {
            let dataWord = dataWords[i];
            if (dataWord === 0 || dataWord === mask) {
                throw new FormatException();
            } else if (dataWord === 1 || dataWord === mask - 1) {
                stuffedBits++;
            }
        }
        // Now, actually unpack the bits and remove the stuffing
        let correctedBits: boolean[] = new Array(numDataCodewords * codewordSize - stuffedBits);
        let index = 0;
        for (let i = 0; i < numDataCodewords; i++) {
            let dataWord = dataWords[i];
            if (dataWord === 1 || dataWord === mask - 1) {
                // next codewordSize-1 bits are all zeros or all ones
                correctedBits.fill(dataWord > 1, index, index + codewordSize - 1);
                // Arrays.fill(correctedBits, index, index + codewordSize - 1, dataWord > 1);
                index += codewordSize - 1;
            } else {
                for (let bit = codewordSize - 1; bit >= 0; --bit) {
                    correctedBits[index++] = (dataWord & (1 << bit)) !== 0;
                }
            }
        }
        return correctedBits;
    }

    /**
     * Gets the array of bits from an Aztec Code matrix
     *
     * @return the array of bits
     */
    private extractBits(matrix: BitMatrix): boolean[] {
        let compact = this.ddata.isCompact();
        let layers = this.ddata.getNbLayers();
        let baseMatrixSize = (compact ? 11 : 14) + layers * 4; // not including alignment lines
        let alignmentMap = new Int32Array(baseMatrixSize);
        let rawbits: boolean[] = new Array(this.totalBitsInLayer(layers, compact));

        if (compact) {
            for (let i = 0; i < alignmentMap.length; i++) {
                alignmentMap[i] = i;
            }
        } else {
            let matrixSize = baseMatrixSize + 1 + 2 * Integer.truncDivision((Integer.truncDivision(baseMatrixSize, 2) - 1), 15);
            let origCenter = baseMatrixSize / 2;
            let center = Integer.truncDivision(matrixSize, 2);
            for (let i = 0; i < origCenter; i++) {
                let newOffset = i + Integer.truncDivision(i, 15);
                alignmentMap[origCenter - i - 1] = center - newOffset - 1;
                alignmentMap[origCenter + i] = center + newOffset + 1;
            }
        }
        for (let i = 0, rowOffset = 0; i < layers; i++) {
            let rowSize = (layers - i) * 4 + (compact ? 9 : 12);
            // The top-left most point of this layer is <low, low> (not including alignment lines)
            let low = i * 2;
            // The bottom-right most point of this layer is <high, high> (not including alignment lines)
            let high = baseMatrixSize - 1 - low;
            // We pull bits from the two 2 x rowSize columns and two rowSize x 2 rows
            for (let j = 0; j < rowSize; j++) {
                let columnOffset = j * 2;
                for (let k = 0; k < 2; k++) {
                    // left column
                    rawbits[rowOffset + columnOffset + k] =
                        matrix.get(alignmentMap[low + k], alignmentMap[low + j]);
                    // bottom row
                    rawbits[rowOffset + 2 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[low + j], alignmentMap[high - k]);
                    // right column
                    rawbits[rowOffset + 4 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[high - k], alignmentMap[high - j]);
                    // top row
                    rawbits[rowOffset + 6 * rowSize + columnOffset + k] =
                        matrix.get(alignmentMap[high - j], alignmentMap[low + k]);
                }
            }
            rowOffset += rowSize * 8;
        }
        return rawbits;
    }

    /**
     * Reads a code of given length and at given index in an array of bits
     */
    private static readCode(rawbits: boolean[], startIndex: number, length: number): number {
        let res = 0;
        for (let i = startIndex; i < startIndex + length; i++) {
            res <<= 1;
            if (rawbits[i]) {
                res |= 0x01;
            }
        }
        return res;
    }

    /**
     * Reads a code of length 8 in an array of bits, padding with zeros
     */
    private static readByte(rawbits: boolean[], startIndex: number): number {
        let n = rawbits.length - startIndex;
        if (n >= 8) {
            return Decoder.readCode(rawbits, startIndex, 8);
        }
        return Decoder.readCode(rawbits, startIndex, n) << (8 - n);
    }

    /**
     * Packs a bit array into bytes, most significant bit first
     */
    public static convertBoolArrayToByteArray(boolArr: boolean[]): Uint8Array {
        let byteArr = new Uint8Array((boolArr.length + 7) / 8);
        for (let i = 0; i < byteArr.length; i++) {
            byteArr[i] = Decoder.readByte(boolArr, 8 * i);
        }
        return byteArr;
    }

    private totalBitsInLayer(layers: number, compact: boolean): number {
        return ((compact ? 88 : 112) + 16 * layers) * layers;
    }
}
