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

/*namespace com.google.zxing.qrcode {*/

import BarcodeFormat from '../BarcodeFormat';
import BinaryBitmap from '../BinaryBitmap';
import BitMatrix from '../common/BitMatrix';
import DecoderResult from '../common/DecoderResult';
import DecodeHintType from '../DecodeHintType';
import NotFoundException from '../NotFoundException';
import Reader from '../Reader';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
// import DetectorResult from '../common/DetectorResult';
import Decoder from './decoder/Decoder';
import QRCodeDecoderMetaData from './decoder/QRCodeDecoderMetaData';
import Detector from './detector/Detector';


/*import java.util.List;*/
/*import java.util.Map;*/

/**
 * This implementation can detect and decode QR Codes in an image.
 *
 * @author Sean Owen
 */
export default class QRCodeReader implements Reader {

  private static NO_POINTS = new Array<ResultPoint>();

  private decoder = new Decoder();

  protected getDecoder(): Decoder {
    return this.decoder;
  }

  /**
   * Locates and decodes a QR code in an image.
   *
   * @return a representing: string the content encoded by the QR code
   * @throws NotFoundException if a QR code cannot be found
   * @throws FormatException if a QR code cannot be decoded
   * @throws ChecksumException if error correction fails
   */
  /*@Override*/
  // public decode(image: BinaryBitmap): Result /*throws NotFoundException, ChecksumException, FormatException */ {
  //   return this.decode(image, null)
  // }

  /*@Override*/
  public decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any>): Result {
    let decoderResult: DecoderResult;
    let points: Array<ResultPoint>;
    if (hints !== undefined && hints !== null && undefined !== hints.get(DecodeHintType.PURE_BARCODE)) {
      const bits = QRCodeReader.extractPureBits(image.getBlackMatrix());
      decoderResult = this.decoder.decodeBitMatrix(bits, hints);
      points = QRCodeReader.NO_POINTS;
    } else {
      const detectorResult = new Detector(image.getBlackMatrix()).detect(hints);
      decoderResult = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints);
      points = detectorResult.getPoints();
    }

    // If the code was mirrored: swap the bottom-left and the top-right points.
    if (decoderResult.getOther() instanceof QRCodeDecoderMetaData) {
      (<QRCodeDecoderMetaData>decoderResult.getOther()).applyMirroredCorrection(points);
    }

    const result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), undefined, points, BarcodeFormat.QR_CODE, undefined);
    const byteSegments: Array<Uint8Array> = decoderResult.getByteSegments();
    if (byteSegments !== null) {
      result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
    }
    const ecLevel: string = decoderResult.getECLevel();
    if (ecLevel !== null) {
      result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
    }
    if (decoderResult.hasStructuredAppend()) {
      result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE,
        decoderResult.getStructuredAppendSequenceNumber());
      result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_PARITY,
        decoderResult.getStructuredAppendParity());
    }
    return result;
  }

  /*@Override*/
  public reset(): void {
    // do nothing
  }

  /**
   * This method detects a code in a "pure" image -- that is, pure monochrome image
   * which contains only an unrotated, unskewed, image of a code, with some white border
   * around it. This is a specialized method that works exceptionally fast in this special
   * case.
   *
   * @see com.google.zxing.datamatrix.DataMatrixReader#extractPureBits(BitMatrix)
   */
  private static extractPureBits(image: BitMatrix): BitMatrix /*throws NotFoundException */ {

    const leftTopBlack: Int32Array = image.getTopLeftOnBit();
    const rightBottomBlack: Int32Array = image.getBottomRightOnBit();
    if (leftTopBlack === null || rightBottomBlack === null) {
      throw new NotFoundException();
    }

    const moduleSize: number /*float*/ = this.moduleSize(leftTopBlack, image);

    let top = leftTopBlack[1];
    let bottom = rightBottomBlack[1];
    let left = leftTopBlack[0];
    let right = rightBottomBlack[0];

    // Sanity check!
    if (left >= right || top >= bottom) {
      throw new NotFoundException();
    }

    if (bottom - top !== right - left) {
      // Special case, where bottom-right module wasn't black so we found something else in the last row
      // Assume it's a square, so use height as the width
      right = left + (bottom - top);
      if (right >= image.getWidth()) {
        // Abort if that would not make sense -- off image
        throw new NotFoundException();
      }
    }

    const matrixWidth = Math.round((right - left + 1) / moduleSize);
    const matrixHeight = Math.round((bottom - top + 1) / moduleSize);
    if (matrixWidth <= 0 || matrixHeight <= 0) {
      throw new NotFoundException();
    }
    if (matrixHeight !== matrixWidth) {
      // Only possibly decode square regions
      throw new NotFoundException();
    }

    // Push in the "border" by half the module width so that we start
    // sampling in the middle of the module. Just in case the image is a
    // little off, this will help recover.
    const nudge = /*(int) */Math.floor(moduleSize / 2.0);
    top += nudge;
    left += nudge;

    // But careful that this does not sample off the edge
    // "right" is the farthest-right valid pixel location -- right+1 is not necessarily
    // This is positive by how much the inner x loop below would be too large
    const nudgedTooFarRight = left + /*(int) */Math.floor((matrixWidth - 1) * moduleSize) - right;
    if (nudgedTooFarRight > 0) {
      if (nudgedTooFarRight > nudge) {
        // Neither way fits; abort
        throw new NotFoundException();
      }
      left -= nudgedTooFarRight;
    }
    // See logic above
    const nudgedTooFarDown = top + /*(int) */Math.floor((matrixHeight - 1) * moduleSize) - bottom;
    if (nudgedTooFarDown > 0) {
      if (nudgedTooFarDown > nudge) {
        // Neither way fits; abort
        throw new NotFoundException();
      }
      top -= nudgedTooFarDown;
    }

    // Now just read off the bits
    const bits = new BitMatrix(matrixWidth, matrixHeight);
    for (let y = 0; y < matrixHeight; y++) {
      const iOffset = top + /*(int) */Math.floor(y * moduleSize);
      for (let x = 0; x < matrixWidth; x++) {
        if (image.get(left + /*(int) */Math.floor(x * moduleSize), iOffset)) {
          bits.set(x, y);
        }
      }
    }
    return bits;
  }

  private static moduleSize(leftTopBlack: Int32Array, image: BitMatrix): number/*float*/ /*throws NotFoundException */ {
    const height: number /*int*/ = image.getHeight();
    const width: number /*int*/ = image.getWidth();
    let x = leftTopBlack[0];
    let y = leftTopBlack[1];
    let inBlack: boolean = true;
    let transitions = 0;
    while (x < width && y < height) {
      if (inBlack !== image.get(x, y)) {
        if (++transitions === 5) {
          break;
        }
        inBlack = !inBlack;
      }
      x++;
      y++;
    }
    if (x === width || y === height) {
      throw new NotFoundException();
    }
    return (x - leftTopBlack[0]) / 7.0;
  }

}
