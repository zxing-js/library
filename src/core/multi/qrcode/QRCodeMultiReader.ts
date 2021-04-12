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

import { int, List } from '../../../customTypings';
import BarcodeFormat from '../../BarcodeFormat';
import BinaryBitmap from '../../BinaryBitmap';
import DecoderResult from '../../common/DecoderResult';
import DetectorResult from '../../common/DetectorResult';
import DecodeHintType from '../../DecodeHintType';
import QRCodeDecoderMetaData from '../../qrcode/decoder/QRCodeDecoderMetaData';
import QRCodeReader from '../../qrcode/QRCodeReader';
import ReaderException from '../../ReaderException';
import Result from '../../Result';
import ResultMetadataType from '../../ResultMetadataType';
import ResultPoint from '../../ResultPoint';
import ByteArrayOutputStream from '../../util/ByteArrayOutputStream';
import Collections from '../../util/Collections';
import Comparator from '../../util/Comparator';
import Integer from '../../util/Integer';
import StringBuilder from '../../util/StringBuilder';
import MultipleBarcodeReader from '../MultipleBarcodeReader';
import MultiDetector from './detector/MultiDetector';

// package com.google.zxing.multi.qrcode;

// import com.google.zxing.BarcodeFormat;
// import com.google.zxing.BinaryBitmap;
// import com.google.zxing.DecodeHintType;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.ReaderException;
// import com.google.zxing.Result;
// import com.google.zxing.ResultMetadataType;
// import com.google.zxing.ResultPoint;
// import com.google.zxing.common.DecoderResult;
// import com.google.zxing.common.DetectorResult;
// import com.google.zxing.multi.MultipleBarcodeReader;
// import com.google.zxing.multi.qrcode.detector.MultiDetector;
// import com.google.zxing.qrcode.QRCodeReader;
// import com.google.zxing.qrcode.decoder.QRCodeDecoderMetaData;

// import java.io.ByteArrayOutputStream;
// import java.io.Serializable;
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;
// import java.util.Collections;
// import java.util.Comparator;

/**
 * This implementation can detect and decode multiple QR Codes in an image.
 *
 * @author Sean Owen
 * @author Hannes Erven
 */
export default /*public final*/ class QRCodeMultiReader extends QRCodeReader implements MultipleBarcodeReader {

  private static /* final */ EMPTY_RESULT_ARRAY: Result[] = [];
  protected static /* final */ NO_POINTS = new Array<ResultPoint>();

  /**
   * TYPESCRIPTPORT: this is an overloaded method so here it'll work only as a entrypoint for choosing which overload to call.
   */
  public decodeMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any> = null): Result[] {

    if (hints && hints instanceof Map) {
      return this.decodeMultipleImpl(image, hints);
    }

    return this.decodeMultipleOverload1(image);
  }

  /**
   * @throws NotFoundException
   * @override decodeMultiple
   */
  private decodeMultipleOverload1(image: BinaryBitmap): Result[] {
    return this.decodeMultipleImpl(image, null);
  }

  /**
   * @override
   * @throws NotFoundException
   */
  private decodeMultipleImpl(image: BinaryBitmap, hints:  Map<DecodeHintType, any>): Result[] {
    let results: List<Result> = [];
    const detectorResults: DetectorResult[] = new MultiDetector(image.getBlackMatrix()).detectMulti(hints);
    for (const detectorResult of detectorResults) {
      try {
        const decoderResult: DecoderResult = this.getDecoder().decodeBitMatrix(detectorResult.getBits(), hints);
        const points: ResultPoint[] = detectorResult.getPoints();
        // If the code was mirrored: swap the bottom-left and the top-right points.
        if (decoderResult.getOther() instanceof QRCodeDecoderMetaData) {
          (<QRCodeDecoderMetaData> decoderResult.getOther()).applyMirroredCorrection(points);
        }
        const result: Result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), points,
                                   BarcodeFormat.QR_CODE);
        const byteSegments: List<Uint8Array> = decoderResult.getByteSegments();
        if (byteSegments != null) {
          result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
        }
        const ecLevel: string = decoderResult.getECLevel();
        if (ecLevel != null) {
          result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        if (decoderResult.hasStructuredAppend()) {
          result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE,
                             decoderResult.getStructuredAppendSequenceNumber());
          result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_PARITY,
                             decoderResult.getStructuredAppendParity());
        }
        results.push(result);
      } catch (re) {
        if (re instanceof ReaderException) {
          // ignore and continue
        } else {
          throw re;
        }
      }
    }
    if (results.length === 0) {
      return QRCodeMultiReader.EMPTY_RESULT_ARRAY;
    } else {
      results = QRCodeMultiReader.processStructuredAppend(results);
      return results/* .toArray(QRCodeMultiReader.EMPTY_RESULT_ARRAY) */;
    }
  }

  static processStructuredAppend( results: List<Result>): List<Result> {
    const newResults: List<Result> = [];
    const saResults: List<Result> = [];
    for (const result of results) {
      if (result.getResultMetadata().has(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE)) {
        saResults.push(result);
      } else {
        newResults.push(result);
      }
    }
    if (saResults.length === 0) {
      return results;
    }

    // sort and concatenate the SA list items
    Collections.sort(saResults, new SAComparator());
    const newText: StringBuilder = new StringBuilder();
    const newRawBytes: ByteArrayOutputStream = new ByteArrayOutputStream();
    const newByteSegment: ByteArrayOutputStream = new ByteArrayOutputStream();
    for (const saResult of saResults) {
      newText.append(saResult.getText());
      const saBytes: Uint8Array = saResult.getRawBytes();
      newRawBytes.writeBytesOffset(saBytes, 0, saBytes.length);
      // @SuppressWarnings("unchecked")
      const byteSegments: Iterable<Uint8Array> =
          <Iterable<Uint8Array>> saResult.getResultMetadata().get(ResultMetadataType.BYTE_SEGMENTS);
      if (byteSegments != null) {
        for (const segment of byteSegments) {
          newByteSegment.writeBytesOffset(segment, 0, segment.length);
        }
      }
    }

    const newResult: Result = new Result(newText.toString(), newRawBytes.toByteArray(), QRCodeMultiReader.NO_POINTS, BarcodeFormat.QR_CODE);
    if (newByteSegment.size() > 0) {
      newResult.putMetadata(ResultMetadataType.BYTE_SEGMENTS, Collections.singletonList(newByteSegment.toByteArray()));
    }
    newResults.push(newResult); // TYPESCRIPTPORT: inserted element at the start of the array because it seems the Java version does that as well.
    return newResults;
  }

}

/* private static final*/ class SAComparator implements Comparator<Result>/*, Serializable*/ {
  /**
   * @override
   */
  public compare(a: Result,  b: Result): int {
    const aNumber: int = <int> a.getResultMetadata().get(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE);
    const bNumber: int = <int> b.getResultMetadata().get(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE);
    return Integer.compare(aNumber, bNumber);
  }
}
