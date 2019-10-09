import DecoderResult from '../../common/DecoderResult';
import BitSource from '../../common/BitSource';
import StringBuilder from '../../util/StringBuilder';

import StringEncoding from '../../util/StringEncoding';
import StringUtils from '../../common/StringUtils';
import FormatException from '../../FormatException';
import IllegalStateException from '../../IllegalStateException';

/*
 * Copyright 2008 ZXing authors
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

enum Mode {
  PAD_ENCODE, // Not really a mode
  ASCII_ENCODE,
  C40_ENCODE,
  TEXT_ENCODE,
  ANSIX12_ENCODE,
  EDIFACT_ENCODE,
  BASE256_ENCODE
}

/**
 * <p>Data Matrix Codes can encode text as bits in one of several modes, and can use multiple modes
 * in one Data Matrix Code. This class decodes the bits back into text.</p>
 *
 * <p>See ISO 16022:2006, 5.2.1 - 5.2.9.2</p>
 *
 * @author bbrown@google.com (Brian Brown)
 * @author Sean Owen
 */
export default class DecodedBitStreamParser {

  /**
   * See ISO 16022:2006, Annex C Table C.1
   * The C40 Basic Character Set (*'s used for placeholders for the shift values)
   */
  private static C40_BASIC_SET_CHARS: string[] = [
    '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  private static C40_SHIFT2_SET_CHARS: string[] = [
    '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*',  '+', ',', '-', '.',
    '/', ':', ';', '<', '=', '>', '?',  '@', '[', '\\', ']', '^', '_'
  ];

  /**
   * See ISO 16022:2006, Annex C Table C.2
   * The Text Basic Character Set (*'s used for placeholders for the shift values)
   */
  private static TEXT_BASIC_SET_CHARS: string[] = [
    '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
  ];

  // Shift 2 for Text is the same encoding as C40
  private static TEXT_SHIFT2_SET_CHARS = DecodedBitStreamParser.C40_SHIFT2_SET_CHARS;

  private static TEXT_SHIFT3_SET_CHARS: string[] = [
    '`', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O',  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '{', '|', '}', '~', String.fromCharCode(127)
  ];

  static decode(bytes:  Uint8Array): DecoderResult {
    const bits = new BitSource(bytes);
    const result = new StringBuilder();
    const resultTrailer = new StringBuilder();
    const byteSegments = new Array<Uint8Array>();
    let mode = Mode.ASCII_ENCODE;
    do {
      if (mode === Mode.ASCII_ENCODE) {
        mode = this.decodeAsciiSegment(bits, result, resultTrailer);
      } else {
        switch (mode) {
          case Mode.C40_ENCODE:
            this.decodeC40Segment(bits, result);
            break;
          case Mode.TEXT_ENCODE:
            this.decodeTextSegment(bits, result);
            break;
          case Mode.ANSIX12_ENCODE:
            this.decodeAnsiX12Segment(bits, result);
            break;
          case Mode.EDIFACT_ENCODE:
            this.decodeEdifactSegment(bits, result);
            break;
          case Mode.BASE256_ENCODE:
            this.decodeBase256Segment(bits, result, byteSegments);
            break;
          default:
            throw new FormatException();
        }
        mode = Mode.ASCII_ENCODE;
      }
    } while (mode !== Mode.PAD_ENCODE && bits.available() > 0);
    if (resultTrailer.length() > 0) {
      result.append(resultTrailer.toString());
    }
    return new DecoderResult(bytes, result.toString(), byteSegments.length === 0 ? null : byteSegments, null);
  }

  /**
   * See ISO 16022:2006, 5.2.3 and Annex C, Table C.2
   */
  private static decodeAsciiSegment(bits: BitSource,
                                         result: StringBuilder,
                                         resultTrailer: StringBuilder): Mode {
    let upperShift = false;
    do {
      let oneByte = bits.readBits(8);
      if (oneByte === 0) {
        throw new FormatException();
      } else if (oneByte <= 128) {  // ASCII data (ASCII value + 1)
        if (upperShift) {
          oneByte += 128;
          // upperShift = false;
        }
        result.append(String.fromCharCode(oneByte - 1));
        return Mode.ASCII_ENCODE;
      } else if (oneByte === 129) {  // Pad
        return Mode.PAD_ENCODE;
      } else if (oneByte <= 229) {  // 2-digit data 00-99 (Numeric Value + 130)
        const value = oneByte - 130;
        if (value < 10) { // pad with '0' for single digit values
          result.append('0');
        }
        result.append('' + value);
      } else {
        switch (oneByte) {
          case 230: // Latch to C40 encodation
            return Mode.C40_ENCODE;
          case 231: // Latch to Base 256 encodation
            return Mode.BASE256_ENCODE;
          case 232: // FNC1
            result.append(String.fromCharCode(29)); // translate as ASCII 29
            break;
          case 233: // Structured Append
          case 234: // Reader Programming
            // Ignore these symbols for now
            // throw ReaderException.getInstance();
            break;
          case 235: // Upper Shift (shift to Extended ASCII)
            upperShift = true;
            break;
          case 236: // 05 Macro
            result.append('[)>\u001E05\u001D');
            resultTrailer.insert(0, '\u001E\u0004');
            break;
          case 237: // 06 Macro
            result.append('[)>\u001E06\u001D');
            resultTrailer.insert(0, '\u001E\u0004');
            break;
          case 238: // Latch to ANSI X12 encodation
            return Mode.ANSIX12_ENCODE;
          case 239: // Latch to Text encodation
            return Mode.TEXT_ENCODE;
          case 240: // Latch to EDIFACT encodation
            return Mode.EDIFACT_ENCODE;
          case 241: // ECI Character
            // TODO(bbrown): I think we need to support ECI
            // throw ReaderException.getInstance();
            // Ignore this symbol for now
            break;
          default:
            // Not to be used in ASCII encodation
            // but work around encoders that end with 254, latch back to ASCII
            if (oneByte !== 254 || bits.available() !== 0) {
              throw new FormatException();
            }
            break;
        }
      }
    } while (bits.available() > 0);
    return Mode.ASCII_ENCODE;
  }

  /**
   * See ISO 16022:2006, 5.2.5 and Annex C, Table C.1
   */
  private static decodeC40Segment(bits: BitSource, result: StringBuilder): void {
    // Three C40 values are encoded in a 16-bit value as
    // (1600 * C1) + (40 * C2) + C3 + 1
    // TODO(bbrown): The Upper Shift with C40 doesn't work in the 4 value scenario all the time
    let upperShift = false;

    const cValues: number[] = [];
    let shift = 0;

    do {
      // If there is only one byte left then it will be encoded as ASCII
      if (bits.available() === 8) {
        return;
      }
      const firstByte = bits.readBits(8);
      if (firstByte === 254) {  // Unlatch codeword
        return;
      }

      this.parseTwoBytes(firstByte, bits.readBits(8), cValues);
      for (let i = 0; i < 3; i++) {
        const cValue = cValues[i];
        switch (shift) {
          case 0:
            if (cValue < 3) {
              shift = cValue + 1;
            } else if (cValue < this.C40_BASIC_SET_CHARS.length) {
              const c40char = this.C40_BASIC_SET_CHARS[cValue];
              if (upperShift) {
                result.append(String.fromCharCode(c40char.charCodeAt(0) + 128));
                upperShift = false;
              } else {
                result.append(c40char);
              }
            } else {
              throw new FormatException();
            }
            break;
          case 1:
            if (upperShift) {
              result.append(String.fromCharCode(cValue + 128));
              upperShift = false;
            } else {
              result.append(String.fromCharCode(cValue));
            }
            shift = 0;
            break;
          case 2:
            if (cValue < this.C40_SHIFT2_SET_CHARS.length) {
              const c40char = this.C40_SHIFT2_SET_CHARS[cValue];
              if (upperShift) {
                result.append(String.fromCharCode(c40char.charCodeAt(0) + 128));
                upperShift = false;
              } else {
                result.append(c40char);
              }
            } else {
              switch (cValue) {
                case 27: // FNC1
                  result.append(String.fromCharCode(29)); // translate as ASCII 29
                  break;
                case 30: // Upper Shift
                  upperShift = true;
                  break;
                default:
                throw new FormatException();
              }
            }
            shift = 0;
            break;
          case 3:
            if (upperShift) {
              result.append(String.fromCharCode(cValue + 224));
              upperShift = false;
            } else {
              result.append(String.fromCharCode(cValue + 96));
            }
            shift = 0;
            break;
          default:
            throw new FormatException();
        }
      }
    } while (bits.available() > 0);
  }

  /**
   * See ISO 16022:2006, 5.2.6 and Annex C, Table C.2
   */
  private static decodeTextSegment(bits: BitSource, result: StringBuilder): void {
    // Three Text values are encoded in a 16-bit value as
    // (1600 * C1) + (40 * C2) + C3 + 1
    // TODO(bbrown): The Upper Shift with Text doesn't work in the 4 value scenario all the time
    let upperShift = false;

    let cValues: number[] = [];
    let shift = 0;
    do {
      // If there is only one byte left then it will be encoded as ASCII
      if (bits.available() === 8) {
        return;
      }
      const firstByte = bits.readBits(8);
      if (firstByte === 254) {  // Unlatch codeword
        return;
      }

      this.parseTwoBytes(firstByte, bits.readBits(8), cValues);

      for (let i = 0; i < 3; i++) {
        const cValue = cValues[i];
        switch (shift) {
          case 0:
            if (cValue < 3) {
              shift = cValue + 1;
            } else if (cValue < this.TEXT_BASIC_SET_CHARS.length) {
              const textChar = this.TEXT_BASIC_SET_CHARS[cValue];
              if (upperShift) {
                result.append(String.fromCharCode(textChar.charCodeAt(0) + 128));
                upperShift = false;
              } else {
                result.append(textChar);
              }
            } else {
              throw new FormatException();
            }
            break;
          case 1:
            if (upperShift) {
              result.append(String.fromCharCode(cValue + 128));
              upperShift = false;
            } else {
              result.append(String.fromCharCode(cValue));
            }
            shift = 0;
            break;
          case 2:
            // Shift 2 for Text is the same encoding as C40
            if (cValue < this.TEXT_SHIFT2_SET_CHARS.length) {
              const textChar = this.TEXT_SHIFT2_SET_CHARS[cValue];
              if (upperShift) {
                result.append(String.fromCharCode(textChar.charCodeAt(0) + 128));
                upperShift = false;
              } else {
                result.append(textChar);
              }
            } else {
              switch (cValue) {
                case 27: // FNC1
                  result.append(String.fromCharCode(29)); // translate as ASCII 29
                  break;
                case 30: // Upper Shift
                  upperShift = true;
                  break;
                default:
                throw new FormatException();
              }
            }
            shift = 0;
            break;
          case 3:
            if (cValue < this.TEXT_SHIFT3_SET_CHARS.length) {
              const textChar = this.TEXT_SHIFT3_SET_CHARS[cValue];
              if (upperShift) {
                result.append(String.fromCharCode(textChar.charCodeAt(0) + 128));
                upperShift = false;
              } else {
                result.append(textChar);
              }
              shift = 0;
            } else {
              throw new FormatException();
            }
            break;
          default:
          throw new FormatException();
        }
      }
    } while (bits.available() > 0);
  }

  /**
   * See ISO 16022:2006, 5.2.7
   */
  private static decodeAnsiX12Segment(bits: BitSource,
                                           result: StringBuilder): void {
    // Three ANSI X12 values are encoded in a 16-bit value as
    // (1600 * C1) + (40 * C2) + C3 + 1

    const cValues: number[] = [];
    do {
      // If there is only one byte left then it will be encoded as ASCII
      if (bits.available() === 8) {
        return;
      }
      const firstByte = bits.readBits(8);
      if (firstByte === 254) {  // Unlatch codeword
        return;
      }

      this.parseTwoBytes(firstByte, bits.readBits(8), cValues);

      for (let i = 0; i < 3; i++) {
        const cValue = cValues[i];
        switch (cValue) {
          case 0: // X12 segment terminator <CR>
            result.append('\r');
            break;
          case 1: // X12 segment separator *
            result.append('*');
            break;
          case 2: // X12 sub-element separator >
            result.append('>');
            break;
          case 3: // space
            result.append(' ');
            break;
          default:
            if (cValue < 14) {  // 0 - 9
              result.append(String.fromCharCode(cValue + 44));
            } else if (cValue < 40) {  // A - Z
              result.append(String.fromCharCode(cValue + 51));
            } else {
              throw new FormatException();
            }
            break;
        }
      }
    } while (bits.available() > 0);
  }

  private static parseTwoBytes(firstByte: number, secondByte: number, result: number[]): void {
    let fullBitValue = (firstByte << 8) + secondByte - 1;
    let temp = Math.floor(fullBitValue / 1600);
    result[0] = temp;
    fullBitValue -= temp * 1600;
    temp = Math.floor(fullBitValue / 40);
    result[1] = temp;
    result[2] = fullBitValue - temp * 40;
  }

  /**
   * See ISO 16022:2006, 5.2.8 and Annex C Table C.3
   */
  private static decodeEdifactSegment(bits: BitSource, result: StringBuilder): void {
    do {
      // If there is only two or less bytes left then it will be encoded as ASCII
      if (bits.available() <= 16) {
        return;
      }

      for (let i = 0; i < 4; i++) {
        let edifactValue = bits.readBits(6);

        // Check for the unlatch character
        if (edifactValue === 0x1F) {  // 011111
          // Read rest of byte, which should be 0, and stop
          const bitsLeft = 8 - bits.getBitOffset();
          if (bitsLeft !== 8) {
            bits.readBits(bitsLeft);
          }
          return;
        }

        if ((edifactValue & 0x20) === 0) {  // no 1 in the leading (6th) bit
          edifactValue |= 0x40;  // Add a leading 01 to the 6 bit binary value
        }
        result.append(String.fromCharCode(edifactValue));
      }
    } while (bits.available() > 0);
  }

  /**
   * See ISO 16022:2006, 5.2.9 and Annex B, B.2
   */
  private static decodeBase256Segment(bits: BitSource,
                                           result: StringBuilder,
                                           byteSegments: Uint8Array[]): void {
    // Figure out how long the Base 256 Segment is.
    let codewordPosition = 1 + bits.getByteOffset(); // position is 1-indexed
    const d1 = this.unrandomize255State(bits.readBits(8), codewordPosition++);
    let count: number;
    if (d1 === 0) {  // Read the remainder of the symbol
      count = bits.available() / 8 | 0;
    } else if (d1 < 250) {
      count = d1;
    } else {
      count = 250 * (d1 - 249) + this.unrandomize255State(bits.readBits(8), codewordPosition++);
    }

    // We're seeing NegativeArraySizeException errors from users.
    if (count < 0) {
      throw new FormatException();
    }

    const bytes = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      // Have seen this particular error in the wild, such as at
      // http://www.bcgen.com/demo/IDAutomationStreamingDataMatrix.aspx?MODE=3&D=Fred&PFMT=3&PT=F&X=0.3&O=0&LM=0.2
      if (bits.available() < 8) {
        throw new FormatException();
      }
      bytes[i] = this.unrandomize255State(bits.readBits(8), codewordPosition++);
    }
    byteSegments.push(bytes);
    try {
      result.append(StringEncoding.decode(bytes, StringUtils.ISO88591));
    } catch (uee) {
      throw new IllegalStateException('Platform does not support required encoding: ' + uee.message);
    }
  }

  /**
   * See ISO 16022:2006, Annex B, B.2
   */
  private static unrandomize255State(randomizedBase256Codeword: number,
                                          base256CodewordPosition: number): number {
    const pseudoRandomNumber = ((149 * base256CodewordPosition) % 255) + 1;
    const tempVariable = randomizedBase256Codeword - pseudoRandomNumber;
    return tempVariable >= 0 ? tempVariable : tempVariable + 256;
  }
}
