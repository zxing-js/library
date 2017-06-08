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

import DecodeHintType from './DecodeHintType'
import Reader from './Reader'
import Result from './Result'
import BinaryBitmap from './BinaryBitmap'
import BarcodeFormat from './BarcodeFormat'
import QRCodeReader from './qrcode/QRCodeReader'
import Exception from './Exception'

/*namespace com.google.zxing {*/

/**
 * MultiFormatReader is a convenience class and the main entry point into the library for most uses.
 * By default it attempts to decode all barcode formats that the library supports. Optionally, you
 * can provide a hints object to request different behavior, for example only decoding QR codes.
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class MultiFormatReader implements Reader {

  private hints: Map<DecodeHintType, any>|null
  private readers: Reader[]

  /**
   * This version of decode honors the intent of Reader.decode(BinaryBitmap) in that it
   * passes null as a hint to the decoders. However, that makes it inefficient to call repeatedly.
   * Use setHints() followed by decodeWithState() for continuous scan applications.
   *
   * @param image The pixel data to decode
   * @return The contents of the image
   * @throws NotFoundException Any errors which occurred
   */
  /*@Override*/
  // public decode(image: BinaryBitmap): Result /*throws NotFoundException */ {
  //   setHints(null)
  //   return decodeInternal(image)
  // }

  /**
   * Decode an image using the hints provided. Does not honor existing state.
   *
   * @param image The pixel data to decode
   * @param hints The hints to use, clearing the previous state.
   * @return The contents of the image
   * @throws NotFoundException Any errors which occurred
   */
  /*@Override*/
  public decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any>): Result /*throws NotFoundException */ {
    this.setHints(hints)
    return this.decodeInternal(image)
  }

  /**
   * Decode an image using the state set up by calling setHints() previously. Continuous scan
   * clients will get a <b>large</b> speed increase by using this instead of decode().
   *
   * @param image The pixel data to decode
   * @return The contents of the image
   * @throws NotFoundException Any errors which occurred
   */
  public decodeWithState(image: BinaryBitmap): Result /*throws NotFoundException */ {
    // Make sure to set up the default state so we don't crash
    if (this.readers === null || this.readers === undefined) {
      this.setHints(null)
    }
    return this.decodeInternal(image)
  }

  /**
   * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
   * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
   * is important for performance in continuous scan clients.
   *
   * @param hints The set of hints to use for subsequent calls to decode(image)
   */
  public setHints(hints?: Map<DecodeHintType, any>|null): void {
    this.hints = hints

    const tryHarder: boolean = hints !== null && hints !== undefined && undefined !== hints.get(DecodeHintType.TRY_HARDER)
    /*@SuppressWarnings("unchecked")*/
    const formats = hints === null || hints === undefined ? null : hints.get(DecodeHintType.POSSIBLE_FORMATS)
    const readers = new Array<Reader>()
    if (formats !== null && formats !== undefined) {
      const addOneDReader: boolean =
          formats.contains(BarcodeFormat.UPC_A) ||
          formats.contains(BarcodeFormat.UPC_E) ||
          formats.contains(BarcodeFormat.EAN_13) ||
          formats.contains(BarcodeFormat.EAN_8) ||
          formats.contains(BarcodeFormat.CODABAR) ||
          formats.contains(BarcodeFormat.CODE_39) ||
          formats.contains(BarcodeFormat.CODE_93) ||
          formats.contains(BarcodeFormat.CODE_128) ||
          formats.contains(BarcodeFormat.ITF) ||
          formats.contains(BarcodeFormat.RSS_14) ||
          formats.contains(BarcodeFormat.RSS_EXPANDED)
      // Put 1D readers upfront in "normal" mode
      
      // TYPESCRIPTPORT: TODO: uncomment below as they are ported

      // if (addOneDReader && !tryHarder) {
      //   readers.push(new MultiFormatOneDReader(hints))
      // }
      if (formats.contains(BarcodeFormat.QR_CODE)) {
        readers.push(new QRCodeReader())
      }
      // if (formats.contains(BarcodeFormat.DATA_MATRIX)) {
      //   readers.push(new DataMatrixReader())
      // }
      // if (formats.contains(BarcodeFormat.AZTEC)) {
      //   readers.push(new AztecReader())
      // }
      // if (formats.contains(BarcodeFormat.PDF_417)) {
      //    readers.push(new PDF417Reader())
      // }
      // if (formats.contains(BarcodeFormat.MAXICODE)) {
      //    readers.push(new MaxiCodeReader())
      // }
      // // At end in "try harder" mode
      // if (addOneDReader && tryHarder) {
      //   readers.push(new MultiFormatOneDReader(hints))
      // }
    }
    if (readers.length === 0) {
      // if (!tryHarder) {
      //   readers.push(new MultiFormatOneDReader(hints))
      // }

      readers.push(new QRCodeReader())
      // readers.push(new DataMatrixReader())
      // readers.push(new AztecReader())
      // readers.push(new PDF417Reader())
      // readers.push(new MaxiCodeReader())

      // if (tryHarder) {
      //   readers.push(new MultiFormatOneDReader(hints))
      // }
    }
    this.readers = readers//.toArray(new Reader[readers.size()])
  }

  /*@Override*/
  public reset(): void {
    if (this.readers !== null) {
      for (let i = 0, length = this.readers.length; i !== length; i++) {
        const reader = this.readers[i]
        reader.reset()
      }
    }
  }

  private decodeInternal(image: BinaryBitmap): Result /*throws NotFoundException */ {
    if (this.readers !== null) {
      for (let i = 0, length = this.readers.length; i !== length; i++) {
        const reader = this.readers[i]
        try {
          return reader.decode(image, this.hints)
        } catch (re/*ReaderException*/) {
          // continue
        }
      }
    }
    throw new Exception(Exception.NotFoundException)
  }

}
