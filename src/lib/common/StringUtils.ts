/*
 * Copyright (C) 2010 ZXing authors
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

/*namespace com.google.zxing.common {*/

/*import java.nio.charset.Charset;*/
/*import java.util.Map;*/

import DecodeHintType from './../DecodeHintType'
import CharacterSetECI from './CharacterSetECI'

/**
 * Common string-related functions.
 *
 * @author Sean Owen
 * @author Alex Dupre
 */
export default class StringUtils {

  public static SHIFT_JIS = CharacterSetECI.SJIS.getName()//"SJIS"
  public static GB2312 = "GB2312"
  private static EUC_JP = "EUC_JP"
  private static UTF8 = CharacterSetECI.UTF8.getName()//"UTF8"
  private static PLATFORM_DEFAULT_ENCODING = StringUtils.UTF8//"UTF8"//Charset.defaultCharset().name()
  private static ISO88591 = CharacterSetECI.ISO8859_1.getName()//"ISO8859_1"
  private static ASSUME_SHIFT_JIS = false
      // SHIFT_JIS.equalsIgnoreCase(PLATFORM_DEFAULT_ENCODING) ||
      // EUC_JP.equalsIgnoreCase(PLATFORM_DEFAULT_ENCODING);

  private StringUtils() {}

  /**
   * @param bytes bytes encoding a string, whose encoding should be guessed
   * @param hints decode hints if applicable
   * @return name of guessed encoding; at the moment will only guess one of:
   *  {@link #SHIFT_JIS}, {@link #UTF8}, {@link #ISO88591}, or the platform
   *  default encoding if none of these can possibly be correct
   */
  public static guessEncoding(bytes: Uint8Array, hints: Map<DecodeHintType, any>): string {
    if (hints !== null && hints !== undefined && undefined !== hints.get(DecodeHintType.CHARACTER_SET)) {
      return hints.get(DecodeHintType.CHARACTER_SET).toString()
    }
    // For now, merely tries to distinguish ISO-8859-1, UTF-8 and Shift_JIS,
    // which should be by far the most common encodings.
    const length = bytes.length
    let canBeISO88591 = true
    let canBeShiftJIS = true
    let canBeUTF8 = true
    let utf8BytesLeft = 0
    //int utf8LowChars = 0
    let utf2BytesChars = 0
    let utf3BytesChars = 0
    let utf4BytesChars = 0
    let sjisBytesLeft = 0
    //int sjisLowChars = 0
    let sjisKatakanaChars = 0
    //int sjisDoubleBytesChars = 0
    let sjisCurKatakanaWordLength = 0
    let sjisCurDoubleBytesWordLength = 0
    let sjisMaxKatakanaWordLength = 0
    let sjisMaxDoubleBytesWordLength = 0
    //int isoLowChars = 0
    //int isoHighChars = 0
    let isoHighOther = 0

    const utf8bom = bytes.length > 3 &&
        bytes[0] == /*(byte) */0xEF &&
        bytes[1] == /*(byte) */0xBB &&
        bytes[2] == /*(byte) */0xBF

    for (let i = 0;
         i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8);
         i++) {

      const value = bytes[i] & 0xFF

      // UTF-8 stuff
      if (canBeUTF8) {
        if (utf8BytesLeft > 0) {
          if ((value & 0x80) == 0) {
            canBeUTF8 = false
          } else {
            utf8BytesLeft--
          }
        } else if ((value & 0x80) != 0) {
          if ((value & 0x40) == 0) {
            canBeUTF8 = false
          } else {
            utf8BytesLeft++
            if ((value & 0x20) == 0) {
              utf2BytesChars++
            } else {
              utf8BytesLeft++
              if ((value & 0x10) == 0) {
                utf3BytesChars++
              } else {
                utf8BytesLeft++
                if ((value & 0x08) == 0) {
                  utf4BytesChars++
                } else {
                  canBeUTF8 = false
                }
              }
            }
          }
        } //else {
          //utf8LowChars++
        //}
      }

      // ISO-8859-1 stuff
      if (canBeISO88591) {
        if (value > 0x7F && value < 0xA0) {
          canBeISO88591 = false
        } else if (value > 0x9F) {
          if (value < 0xC0 || value == 0xD7 || value == 0xF7) {
            isoHighOther++
          } //else {
            //isoHighChars++
          //}
        } //else {
          //isoLowChars++
        //}
      }

      // Shift_JIS stuff
      if (canBeShiftJIS) {
        if (sjisBytesLeft > 0) {
          if (value < 0x40 || value == 0x7F || value > 0xFC) {
            canBeShiftJIS = false
          } else {
            sjisBytesLeft--
          }
        } else if (value == 0x80 || value == 0xA0 || value > 0xEF) {
          canBeShiftJIS = false
        } else if (value > 0xA0 && value < 0xE0) {
          sjisKatakanaChars++
          sjisCurDoubleBytesWordLength = 0
          sjisCurKatakanaWordLength++
          if (sjisCurKatakanaWordLength > sjisMaxKatakanaWordLength) {
            sjisMaxKatakanaWordLength = sjisCurKatakanaWordLength
          }
        } else if (value > 0x7F) {
          sjisBytesLeft++
          //sjisDoubleBytesChars++
          sjisCurKatakanaWordLength = 0
          sjisCurDoubleBytesWordLength++
          if (sjisCurDoubleBytesWordLength > sjisMaxDoubleBytesWordLength) {
            sjisMaxDoubleBytesWordLength = sjisCurDoubleBytesWordLength
          }
        } else {
          //sjisLowChars++
          sjisCurKatakanaWordLength = 0
          sjisCurDoubleBytesWordLength = 0
        }
      }
    }

    if (canBeUTF8 && utf8BytesLeft > 0) {
      canBeUTF8 = false
    }
    if (canBeShiftJIS && sjisBytesLeft > 0) {
      canBeShiftJIS = false
    }

    // Easy -- if there is BOM or at least 1 valid not-single byte character (and no evidence it can't be UTF-8), done
    if (canBeUTF8 && (utf8bom || utf2BytesChars + utf3BytesChars + utf4BytesChars > 0)) {
      return StringUtils.UTF8
    }
    // Easy -- if assuming Shift_JIS or at least 3 valid consecutive not-ascii characters (and no evidence it can't be), done
    if (canBeShiftJIS && (StringUtils.ASSUME_SHIFT_JIS || sjisMaxKatakanaWordLength >= 3 || sjisMaxDoubleBytesWordLength >= 3)) {
      return StringUtils.SHIFT_JIS
    }
    // Distinguishing Shift_JIS and ISO-8859-1 can be a little tough for short words. The crude heuristic is:
    // - If we saw
    //   - only two consecutive katakana chars in the whole text, or
    //   - at least 10% of bytes that could be "upper" not-alphanumeric Latin1,
    // - then we conclude Shift_JIS, else ISO-8859-1
    if (canBeISO88591 && canBeShiftJIS) {
      return (sjisMaxKatakanaWordLength == 2 && sjisKatakanaChars == 2) || isoHighOther * 10 >= length
          ? StringUtils.SHIFT_JIS : StringUtils.ISO88591
    }

    // Otherwise, try in order ISO-8859-1, Shift JIS, UTF-8 and fall back to default platform encoding
    if (canBeISO88591) {
      return StringUtils.ISO88591
    }
    if (canBeShiftJIS) {
      return StringUtils.SHIFT_JIS
    }
    if (canBeUTF8) {
      return StringUtils.UTF8
    }
    // Otherwise, we take a wild guess with platform encoding
    return StringUtils.PLATFORM_DEFAULT_ENCODING
  }

}
