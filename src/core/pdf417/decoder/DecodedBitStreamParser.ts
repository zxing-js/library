/*
 * Copyright 2009 ZXing authors
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

// package com.google.zxing.pdf417.decoder;

// import com.google.zxing.FormatException;
import FormatException from '../../FormatException';
// import com.google.zxing.common.CharacterSetECI;
import CharacterSetECI from '../../common/CharacterSetECI';
// import com.google.zxing.common.DecoderResult;
import DecoderResult from '../../common/DecoderResult';
// import com.google.zxing.pdf417.PDF417ResultMetadata;
import PDF417ResultMetadata from '../PDF417ResultMetadata';

// import java.io.ByteArrayOutputStream;
// import java.math.BigInteger;
// import java.nio.charset.Charset;
// import java.nio.charset.StandardCharsets;
// import java.util.Arrays;
import Arrays from '../../util/Arrays';

import StringBuilder from '../../util/StringBuilder';
import Integer from '../../util/Integer';
import Long from '../../util/Long';
import ByteArrayOutputStream from '../../util/ByteArrayOutputStream';
import StringEncoding from '../../util/StringEncoding';

import { int } from '../../../customTypings';


/*private*/ enum Mode {
  ALPHA,
  LOWER,
  MIXED,
  PUNCT,
  ALPHA_SHIFT,
  PUNCT_SHIFT
}

/**
 * Indirectly access the global BigInt constructor, it
 * allows browsers that doesn't support BigInt to run
 * the library without breaking due to "undefined BigInt"
 * errors.
 */
function getBigIntConstructor(): BigIntConstructor {

  if (typeof window !== 'undefined') {
    return window['BigInt'] || null;
  }

  if (typeof global !== 'undefined') {
    return global['BigInt'] || null;
  }

  if (typeof self !== 'undefined') {
    return self['BigInt'] || null;
  }

  throw new Error('Can\'t search globals for BigInt!');
}

/**
 * Used to store the BigInt constructor.
 */
let BigInteger: BigIntConstructor;

/**
 * This function creates a bigint value. It allows browsers
 * that doesn't support BigInt to run the rest of the library
 * by not directly accessing the BigInt constructor.
 */
function createBigInt(num: number | string | bigint): bigint {

  if (typeof BigInteger === 'undefined') {
    BigInteger = getBigIntConstructor();
  }

  if (BigInteger === null) {
    throw new Error('BigInt is not supported!');
  }

  return BigInteger(num);
}

function getEXP900(): bigint[] {
  // in Java - array with length = 16
  let EXP900 = [];

  EXP900[0] = createBigInt(1);

  let nineHundred = createBigInt(900);

  EXP900[1] = nineHundred;

  // in Java - array with length = 16
  for (let i /*int*/ = 2; i < 16; i++) {
    EXP900[i] = EXP900[i - 1] * nineHundred;
  }

  return EXP900;
}

/**
 * <p>This class contains the methods for decoding the PDF417 codewords.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 * @author Guenther Grau
 */
export default /*final*/ class DecodedBitStreamParser {

  private static /*final*/ TEXT_COMPACTION_MODE_LATCH: int = 900;
  private static /*final*/ BYTE_COMPACTION_MODE_LATCH: int = 901;
  private static /*final*/ NUMERIC_COMPACTION_MODE_LATCH: int = 902;
  private static /*final*/ BYTE_COMPACTION_MODE_LATCH_6: int = 924;
  private static /*final*/ ECI_USER_DEFINED: int = 925;
  private static /*final*/ ECI_GENERAL_PURPOSE: int = 926;
  private static /*final*/ ECI_CHARSET: int = 927;
  private static /*final*/ BEGIN_MACRO_PDF417_CONTROL_BLOCK: int = 928;
  private static /*final*/ BEGIN_MACRO_PDF417_OPTIONAL_FIELD: int = 923;
  private static /*final*/ MACRO_PDF417_TERMINATOR: int = 922;
  private static /*final*/ MODE_SHIFT_TO_BYTE_COMPACTION_MODE: int = 913;
  private static /*final*/ MAX_NUMERIC_CODEWORDS: int = 15;

  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_FILE_NAME: int = 0;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_SEGMENT_COUNT: int = 1;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_TIME_STAMP: int = 2;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_SENDER: int = 3;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_ADDRESSEE: int = 4;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_FILE_SIZE: int = 5;
  private static /*final*/ MACRO_PDF417_OPTIONAL_FIELD_CHECKSUM: int = 6;

  private static /*final*/ PL: int = 25;
  private static /*final*/ LL: int = 27;
  private static /*final*/ AS: int = 27;
  private static /*final*/ ML: int = 28;
  private static /*final*/ AL: int = 28;
  private static /*final*/ PS: int = 29;
  private static /*final*/ PAL: int = 29;

  private static /*final*/ PUNCT_CHARS: string =
    ';<>@[\\]_`~!\r\t,:\n-.$/"|*()?{}\'';

  private static /*final*/ MIXED_CHARS: string =
    '0123456789&\r\t,:#-.$/+%*=^';

  /**
   * Table containing values for the exponent of 900.
   * This is used in the numeric compaction decode algorithm.
   */
  private static /*final*/ EXP900: bigint[] = getBigIntConstructor() ? getEXP900() : [];

  private static /*final*/ NUMBER_OF_SEQUENCE_CODEWORDS: int = 2;

  //   private DecodedBitStreamParser() {
  // }

  /**
   *
   * @param codewords
   * @param ecLevel
   *
   * @throws FormatException
   */
  static decode(codewords: Int32Array, ecLevel: string): DecoderResult {
    // pass encoding to result (will be used for decode symbols in byte mode)
    let result: StringBuilder = new StringBuilder('');
    // let encoding: Charset = StandardCharsets.ISO_8859_1;
    let encoding = CharacterSetECI.ISO8859_1;
    /**
     * @note the next command is specific from this TypeScript library
     * because TS can't properly cast some values to char and
     * convert it to string later correctly due to encoding
     * differences from Java version. As reported here:
     * https://github.com/zxing-js/library/pull/264/files#r382831593
     */
    result.enableDecoding(encoding);
    // Get compaction mode
    let codeIndex: int = 1;
    let code: int = codewords[codeIndex++];
    let resultMetadata: PDF417ResultMetadata = new PDF417ResultMetadata();
    while (codeIndex < codewords[0]) {
      switch (code) {
        case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
          codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
          break;
        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
          codeIndex = DecodedBitStreamParser.byteCompaction(code, codewords, encoding, codeIndex, result);
          break;
        case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
          result.append(/*(char)*/ codewords[codeIndex++]);
          break;
        case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
          codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex, result);
          break;
        case DecodedBitStreamParser.ECI_CHARSET:
          let charsetECI: CharacterSetECI =
            CharacterSetECI.getCharacterSetECIByValue(codewords[codeIndex++]);
          // encoding = Charset.forName(charsetECI.getName());
          break;
        case DecodedBitStreamParser.ECI_GENERAL_PURPOSE:
          // Can't do anything with generic ECI; skip its 2 characters
          codeIndex += 2;
          break;
        case DecodedBitStreamParser.ECI_USER_DEFINED:
          // Can't do anything with user ECI; skip its 1 character
          codeIndex++;
          break;
        case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
          codeIndex = DecodedBitStreamParser.decodeMacroBlock(codewords, codeIndex, resultMetadata);
          break;
        case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
        case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
          // Should not see these outside a macro block
          throw new FormatException();
        default:
          // Default to text compaction. During testing numerous barcodes
          // appeared to be missing the starting mode. In these cases defaulting
          // to text compaction seems to work.
          codeIndex--;
          codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
          break;
      }
      if (codeIndex < codewords.length) {
        code = codewords[codeIndex++];
      } else {
        throw FormatException.getFormatInstance();
      }
    }
    if (result.length() === 0) {
      throw FormatException.getFormatInstance();
    }
    let decoderResult: DecoderResult = new DecoderResult(null, result.toString(), null, ecLevel);
    decoderResult.setOther(resultMetadata);
    return decoderResult;
  }

  /**
   *
   * @param int
   * @param param1
   * @param codewords
   * @param int
   * @param codeIndex
   * @param PDF417ResultMetadata
   * @param resultMetadata
   *
   * @throws FormatException
   */
  // @SuppressWarnings("deprecation")
  static decodeMacroBlock(codewords: Int32Array, codeIndex: int, resultMetadata: PDF417ResultMetadata): int {
    if (codeIndex + DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS > codewords[0]) {
      // we must have at least two bytes left for the segment index
      throw FormatException.getFormatInstance();
    }
    let segmentIndexArray: Int32Array = new Int32Array(DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS);
    for (let i /*int*/ = 0; i < DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS; i++, codeIndex++) {
      segmentIndexArray[i] = codewords[codeIndex];
    }
    resultMetadata.setSegmentIndex(Integer.parseInt(DecodedBitStreamParser.decodeBase900toBase10(segmentIndexArray,
      DecodedBitStreamParser.NUMBER_OF_SEQUENCE_CODEWORDS)));

    let fileId: StringBuilder = new StringBuilder();
    codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, fileId);
    resultMetadata.setFileId(fileId.toString());

    let optionalFieldsStart: int = -1;
    if (codewords[codeIndex] === DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD) {
      optionalFieldsStart = codeIndex + 1;
    }

    while (codeIndex < codewords[0]) {
      switch (codewords[codeIndex]) {
        case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
          codeIndex++;
          switch (codewords[codeIndex]) {
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_NAME:
              let fileName: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, fileName);
              resultMetadata.setFileName(fileName.toString());
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SENDER:
              let sender: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, sender);
              resultMetadata.setSender(sender.toString());
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_ADDRESSEE:
              let addressee: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex + 1, addressee);
              resultMetadata.setAddressee(addressee.toString());
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_SEGMENT_COUNT:
              let segmentCount: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, segmentCount);
              resultMetadata.setSegmentCount(Integer.parseInt(segmentCount.toString()));
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_TIME_STAMP:
              let timestamp: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, timestamp);
              resultMetadata.setTimestamp(Long.parseLong(timestamp.toString()));
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_CHECKSUM:
              let checksum: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, checksum);
              resultMetadata.setChecksum(Integer.parseInt(checksum.toString()));
              break;
            case DecodedBitStreamParser.MACRO_PDF417_OPTIONAL_FIELD_FILE_SIZE:
              let fileSize: StringBuilder = new StringBuilder();
              codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex + 1, fileSize);
              resultMetadata.setFileSize(Long.parseLong(fileSize.toString()));
              break;
            default:
              throw FormatException.getFormatInstance();
          }
          break;
        case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
          codeIndex++;
          resultMetadata.setLastSegment(true);
          break;
        default:
          throw FormatException.getFormatInstance();
      }
    }

    // copy optional fields to additional options
    if (optionalFieldsStart !== -1) {
      let optionalFieldsLength: int = codeIndex - optionalFieldsStart;
      if (resultMetadata.isLastSegment()) {
        // do not include terminator
        optionalFieldsLength--;
      }
      resultMetadata.setOptionalData(Arrays.copyOfRange(codewords, optionalFieldsStart, optionalFieldsStart + optionalFieldsLength));
    }

    return codeIndex;
  }

  /**
   * Text Compaction mode (see 5.4.1.5) permits all printable ASCII characters to be
   * encoded, i.e. values 32 - 126 inclusive in accordance with ISO/IEC 646 (IRV), as
   * well as selected control characters.
   *
   * @param codewords The array of codewords (data + error)
   * @param codeIndex The current index into the codeword array.
   * @param result    The decoded data is appended to the result.
   * @return The next index into the codeword array.
   */
  private static textCompaction(codewords: Int32Array, codeIndex: int, result: StringBuilder): int {
    // 2 character per codeword
    let textCompactionData: Int32Array = new Int32Array((codewords[0] - codeIndex) * 2);
    // Used to hold the byte compaction value if there is a mode shift
    let byteCompactionData: Int32Array = new Int32Array((codewords[0] - codeIndex) * 2);

    let index: int = 0;
    let end: boolean = false;
    while ((codeIndex < codewords[0]) && !end) {
      let code: int = codewords[codeIndex++];
      if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
        textCompactionData[index] = code / 30;
        textCompactionData[index + 1] = code % 30;
        index += 2;
      } else {
        switch (code) {
          case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
            // reinitialize text compaction mode to alpha sub mode
            textCompactionData[index++] = DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH;
            break;
          case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
          case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
          case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
          case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
          case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
          case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
            codeIndex--;
            end = true;
            break;
          case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
            // The Mode Shift codeword 913 shall cause a temporary
            // switch from Text Compaction mode to Byte Compaction mode.
            // This switch shall be in effect for only the next codeword,
            // after which the mode shall revert to the prevailing sub-mode
            // of the Text Compaction mode. Codeword 913 is only available
            // in Text Compaction mode; its use is described in 5.4.2.4.
            textCompactionData[index] = DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE;
            code = codewords[codeIndex++];
            byteCompactionData[index] = code;
            index++;
            break;
        }
      }
    }
    DecodedBitStreamParser.decodeTextCompaction(textCompactionData, byteCompactionData, index, result);
    return codeIndex;
  }

  /**
   * The Text Compaction mode includes all the printable ASCII characters
   * (i.e. values from 32 to 126) and three ASCII control characters: HT or tab
   * (9: e), LF or line feed (10: e), and CR or carriage
   * return (13: e). The Text Compaction mode also includes various latch
   * and shift characters which are used exclusively within the mode. The Text
   * Compaction mode encodes up to 2 characters per codeword. The compaction rules
   * for converting data into PDF417 codewords are defined in 5.4.2.2. The sub-mode
   * switches are defined in 5.4.2.3.
   *
   * @param textCompactionData The text compaction data.
   * @param byteCompactionData The byte compaction data if there
   *                           was a mode shift.
   * @param length             The size of the text compaction and byte compaction data.
   * @param result             The decoded data is appended to the result.
   */
  private static decodeTextCompaction(textCompactionData: Int32Array,
    byteCompactionData: Int32Array,
    length: int,
    result: StringBuilder): void {
    // Beginning from an initial state of the Alpha sub-mode
    // The default compaction mode for PDF417 in effect at the start of each symbol shall always be Text
    // Compaction mode Alpha sub-mode (alphabetic: uppercase). A latch codeword from another mode to the Text
    // Compaction mode shall always switch to the Text Compaction Alpha sub-mode.
    let subMode: Mode = Mode.ALPHA;
    let priorToShiftMode: Mode = Mode.ALPHA;
    let i: int = 0;
    while (i < length) {
      let subModeCh: int = textCompactionData[i];
      let ch: /*char*/ string = '';
      switch (subMode) {
        case Mode.ALPHA:
          // Alpha (alphabetic: uppercase)
          if (subModeCh < 26) {
            // Upper case Alpha Character
            // Note: 65 = 'A' ASCII -> there is byte code of symbol
            ch = /*(char)('A' + subModeCh) */ String.fromCharCode(65 + subModeCh);
          } else {
            switch (subModeCh) {
              case 26:
                ch = ' ';
                break;
              case DecodedBitStreamParser.LL:
                subMode = Mode.LOWER;
                break;
              case DecodedBitStreamParser.ML:
                subMode = Mode.MIXED;
                break;
              case DecodedBitStreamParser.PS:
                // Shift to punctuation
                priorToShiftMode = subMode;
                subMode = Mode.PUNCT_SHIFT;
                break;
              case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                result.append(/*(char)*/ byteCompactionData[i]);
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;

        case Mode.LOWER:
          // Lower (alphabetic: lowercase)
          if (subModeCh < 26) {
            ch = /*(char)('a' + subModeCh)*/String.fromCharCode(97 + subModeCh);
          } else {
            switch (subModeCh) {
              case 26:
                ch = ' ';
                break;
              case DecodedBitStreamParser.AS:
                // Shift to alpha
                priorToShiftMode = subMode;
                subMode = Mode.ALPHA_SHIFT;
                break;
              case DecodedBitStreamParser.ML:
                subMode = Mode.MIXED;
                break;
              case DecodedBitStreamParser.PS:
                // Shift to punctuation
                priorToShiftMode = subMode;
                subMode = Mode.PUNCT_SHIFT;
                break;
              case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                // TODO Does this need to use the current character encoding? See other occurrences below
                result.append(/*(char)*/ byteCompactionData[i]);
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;

        case Mode.MIXED:
          // Mixed (punctuation: e)
          if (subModeCh < DecodedBitStreamParser.PL) {
            ch = DecodedBitStreamParser.MIXED_CHARS[subModeCh];
          } else {
            switch (subModeCh) {
              case DecodedBitStreamParser.PL:
                subMode = Mode.PUNCT;
                break;
              case 26:
                ch = ' ';
                break;
              case DecodedBitStreamParser.LL:
                subMode = Mode.LOWER;
                break;
              case DecodedBitStreamParser.AL:
                subMode = Mode.ALPHA;
                break;
              case DecodedBitStreamParser.PS:
                // Shift to punctuation
                priorToShiftMode = subMode;
                subMode = Mode.PUNCT_SHIFT;
                break;
              case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                result.append(/*(char)*/ byteCompactionData[i]);
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;

        case Mode.PUNCT:
          // Punctuation
          if (subModeCh < DecodedBitStreamParser.PAL) {
            ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
          } else {
            switch (subModeCh) {
              case DecodedBitStreamParser.PAL:
                subMode = Mode.ALPHA;
                break;
              case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                result.append(/*(char)*/ byteCompactionData[i]);
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;

        case Mode.ALPHA_SHIFT:
          // Restore sub-mode
          subMode = priorToShiftMode;
          if (subModeCh < 26) {
            ch = /*(char)('A' + subModeCh)*/ String.fromCharCode(65 + subModeCh);
          } else {
            switch (subModeCh) {
              case 26:
                ch = ' ';
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;

        case Mode.PUNCT_SHIFT:
          // Restore sub-mode
          subMode = priorToShiftMode;
          if (subModeCh < DecodedBitStreamParser.PAL) {
            ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
          } else {
            switch (subModeCh) {
              case DecodedBitStreamParser.PAL:
                subMode = Mode.ALPHA;
                break;
              case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE:
                // PS before Shift-to-Byte is used as a padding character,
                // see 5.4.2.4 of the specification
                result.append(/*(char)*/ byteCompactionData[i]);
                break;
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
                subMode = Mode.ALPHA;
                break;
            }
          }
          break;
      }
      // if (ch !== 0) {
      if (ch !== '') {
        // Append decoded character to result
        result.append(ch);
      }
      i++;
    }
  }

  /**
   * Byte Compaction mode (see 5.4.3) permits all 256 possible 8-bit byte values to be encoded.
   * This includes all ASCII characters value 0 to 127 inclusive and provides for international
   * character set support.
   *
   * @param mode      The byte compaction mode i.e. 901 or 924
   * @param codewords The array of codewords (data + error)
   * @param encoding  Currently active character encoding
   * @param codeIndex The current index into the codeword array.
   * @param result    The decoded data is appended to the result.
   * @return The next index into the codeword array.
   */
  private static /*int*/ byteCompaction(mode: int,
    codewords: Int32Array,
    encoding: /*Charset*/ CharacterSetECI,
    codeIndex: int,
    result: StringBuilder) {
    let decodedBytes: ByteArrayOutputStream = new ByteArrayOutputStream();
    let count: int = 0;
    let value: /*long*/ number = 0;
    let end: boolean = false;

    switch (mode) {
      case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
        // Total number of Byte Compaction characters to be encoded
        // is not a multiple of 6

        let byteCompactedCodewords: Int32Array = new Int32Array(6);
        let nextCode: int = codewords[codeIndex++];
        while ((codeIndex < codewords[0]) && !end) {
          byteCompactedCodewords[count++] = nextCode;
          // Base 900
          value = 900 * value + nextCode;
          nextCode = codewords[codeIndex++];
          // perhaps it should be ok to check only nextCode >= TEXT_COMPACTION_MODE_LATCH
          switch (nextCode) {
            case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
            case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
            case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
            case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
            case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
            case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
              codeIndex--;
              end = true;
              break;
            default:
              if ((count % 5 === 0) && (count > 0)) {
                // Decode every 5 codewords
                // Convert to Base 256
                for (let j /*int*/ = 0; j < 6; ++j) {
                  /* @note
                   * JavaScript stores numbers as 64 bits floating point numbers, but all bitwise operations are performed on 32 bits binary numbers.
                   * So the next bitwise operation could not be done with simple numbers
                   */
                  decodedBytes.write(/*(byte)*/Number(createBigInt(value) >> createBigInt(8 * (5 - j))));
                }
                value = 0;
                count = 0;
              }
              break;
          }
        }

        // if the end of all codewords is reached the last codeword needs to be added
        if (codeIndex === codewords[0] && nextCode < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
          byteCompactedCodewords[count++] = nextCode;
        }

        // If Byte Compaction mode is invoked with codeword 901,
        // the last group of codewords is interpreted directly
        // as one byte per codeword, without compaction.
        for (let i /*int*/ = 0; i < count; i++) {
          decodedBytes.write(/*(byte)*/ byteCompactedCodewords[i]);
        }

        break;

      case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
        // Total number of Byte Compaction characters to be encoded
        // is an integer multiple of 6
        while (codeIndex < codewords[0] && !end) {
          let code: int = codewords[codeIndex++];
          if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
            count++;
            // Base 900
            value = 900 * value + code;
          } else {
            switch (code) {
              case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
              case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
              case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH:
              case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
              case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
              case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
              case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
                codeIndex--;
                end = true;
                break;
            }
          }
          if ((count % 5 === 0) && (count > 0)) {
            // Decode every 5 codewords
            // Convert to Base 256
            /* @note
             * JavaScript stores numbers as 64 bits floating point numbers, but all bitwise operations are performed on 32 bits binary numbers.
             * So the next bitwise operation could not be done with simple numbers
            */
            for (let j /*int*/ = 0; j < 6; ++j) {
              decodedBytes.write(/*(byte)*/Number(createBigInt(value) >> createBigInt(8 * (5 - j))));
            }
            value = 0;
            count = 0;
          }
        }
        break;
    }
    result.append(StringEncoding.decode(decodedBytes.toByteArray(), encoding));
    return codeIndex;
  }

  /**
   * Numeric Compaction mode (see 5.4.4) permits efficient encoding of numeric data strings.
   *
   * @param codewords The array of codewords (data + error)
   * @param codeIndex The current index into the codeword array.
   * @param result    The decoded data is appended to the result.
   * @return The next index into the codeword array.
   *
   * @throws FormatException
   */
  private static numericCompaction(codewords: Int32Array, codeIndex: number /*int*/, result: StringBuilder): int {
    let count: int = 0;
    let end: boolean = false;

    let numericCodewords: Int32Array = new Int32Array(DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS);

    while (codeIndex < codewords[0] && !end) {
      let code: int = codewords[codeIndex++];
      if (codeIndex === codewords[0]) {
        end = true;
      }
      if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
        numericCodewords[count] = code;
        count++;
      } else {
        switch (code) {
          case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH:
          case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH:
          case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6:
          case DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK:
          case DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD:
          case DecodedBitStreamParser.MACRO_PDF417_TERMINATOR:
            codeIndex--;
            end = true;
            break;
        }
      }
      if ((count % DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS === 0 || code === DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH || end) && count > 0) {
        // Re-invoking Numeric Compaction mode (by using codeword 902
        // while in Numeric Compaction mode) serves  to terminate the
        // current Numeric Compaction mode grouping as described in 5.4.4.2,
        // and then to start a new one grouping.
        result.append(DecodedBitStreamParser.decodeBase900toBase10(numericCodewords, count));
        count = 0;
      }
    }
    return codeIndex;
  }

  /**
   * Convert a list of Numeric Compacted codewords from Base 900 to Base 10.
   *
   * @param codewords The array of codewords
   * @param count     The number of codewords
   * @return The decoded string representing the Numeric data.
   *
   * EXAMPLE
   * Encode the fifteen digit numeric string 000213298174000
   * Prefix the numeric string with a 1 and set the initial value of
   * t = 1 000 213 298 174 000
   * Calculate codeword 0
   * d0 = 1 000 213 298 174 000 mod 900 = 200
   *
   * t = 1 000 213 298 174 000 div 900 = 1 111 348 109 082
   * Calculate codeword 1
   * d1 = 1 111 348 109 082 mod 900 = 282
   *
   * t = 1 111 348 109 082 div 900 = 1 234 831 232
   * Calculate codeword 2
   * d2 = 1 234 831 232 mod 900 = 632
   *
   * t = 1 234 831 232 div 900 = 1 372 034
   * Calculate codeword 3
   * d3 = 1 372 034 mod 900 = 434
   *
   * t = 1 372 034 div 900 = 1 524
   * Calculate codeword 4
   * d4 = 1 524 mod 900 = 624
   *
   * t = 1 524 div 900 = 1
   * Calculate codeword 5
   * d5 = 1 mod 900 = 1
   * t = 1 div 900 = 0
   * Codeword sequence is: 1, 624, 434, 632, 282, 200
   *
   * Decode the above codewords involves
   *   1 x 900 power of 5 + 624 x 900 power of 4 + 434 x 900 power of 3 +
   * 632 x 900 power of 2 + 282 x 900 power of 1 + 200 x 900 power of 0 = 1000213298174000
   *
   * Remove leading 1 =>  Result is 000213298174000
   *
   * @throws FormatException
   */
  private static decodeBase900toBase10(codewords: Int32Array, count: int): string {
    let result = createBigInt(0);
    for (let i /*int*/ = 0; i < count; i++) {
      result += DecodedBitStreamParser.EXP900[count - i - 1] * createBigInt(codewords[i]);
    }
    let resultString: String = result.toString();
    if (resultString.charAt(0) !== '1') {
      throw new FormatException();
    }
    return resultString.substring(1);
  }

}
