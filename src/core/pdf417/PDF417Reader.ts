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

// package com.google.zxing.pdf417;

// import com.google.zxing.BarcodeFormat;
// import com.google.zxing.BinaryBitmap;
// import com.google.zxing.ChecksumException;
// import com.google.zxing.DecodeHintType;
// import com.google.zxing.FormatException;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.Reader;
// import com.google.zxing.Result;
// import com.google.zxing.ResultMetadataType;
// import com.google.zxing.ResultPoint;
// import com.google.zxing.common.DecoderResult;
// import com.google.zxing.multi.MultipleBarcodeReader;
// import com.google.zxing.pdf417.decoder.PDF417ScanningDecoder;
// import com.google.zxing.pdf417.detector.Detector;
// import com.google.zxing.pdf417.detector.PDF417DetectorResult;

// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;

/**
 * This implementation can detect and decode PDF417 codes in an image.
 *
 * @author Guenther Grau
 */
export default /*public final*/ class PDF417Reader implements Reader, MultipleBarcodeReader {

    private static /*final Result[]*/ EMPTY_RESULT_ARRAY = new Result[0];

    /**
     * Locates and decodes a PDF417 code in an image.
     *
     * @return a String representing the content encoded by the PDF417 code
     * @throws NotFoundException if a PDF417 code cannot be found,
     * @throws FormatException if a PDF417 cannot be decoded
     * @throws ChecksumException
     */
    //   @Override
    public decode(BinaryBitmap image): Result {
        return decode(image, null);
    }

    //   @Override
    //   public decode(BinaryBitmap image, Map<DecodeHintType,?> hints): Result throws NotFoundException, FormatException,
    //       ChecksumException {
    //     Result[] result = decode(image, hints, false);
    //     if (result == null || result.length == 0 || result[0] == null) {
    //       throw NotFoundException.getNotFoundInstance();
    //     }
    //     return result[0];
    //   }

    /**
     *
     * @param BinaryBitmap
     * @param image
     * @throws NotFoundException
     */
    //   @Override
    public decodeMultiple(BinaryBitmap image): Result[] {
        return decodeMultiple(image, null);
    }

    /**
     *
     * @throws NotFoundException
     */
    //   @Override
    public decodeMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any>): Result[] {
        try {
            return decode(image, hints, true);
        } catch (ignored) {
            if (ignored instanceof FormatException || ignored instanceof ChecksumException) {
                throw NotFoundException.getNotFoundInstance();
            }

            throw ignored;
        }
    }

    /**
     *
     * @param image
     * @param hints
     * @param multiple
     *
     * @throws NotFoundException
     * @throws FormatExceptionß
     * @throws ChecksumException
     */
    private static decode(image: BinaryBitmap, hints: Map<DecodeHintType, any>, multiple: boolean) {
        const results = new ArrayList<Result>();
        const detectorResult = Detector.detect(image, hints, multiple);
        for (const points of detectorResult.getPoints()) {
            const decoderResult = PDF417ScanningDecoder.decode(detectorResult.getBits(), points[4], points[5],
                points[6], points[7], getMinCodewordWidth(points), getMaxCodewordWidth(points));
            const result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), points, BarcodeFormat.PDF_417);
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, decoderResult.getECLevel());
            const pdf417ResultMetadata: PDF417ResultMetadata = decoderResult.getOther();
            if (pdf417ResultMetadata != null) {
                result.putMetadata(ResultMetadataType.PDF417_EXTRA_METADATA, pdf417ResultMetadata);
            }
            results.add(result);
        }
        return results.toArray(EMPTY_RESULT_ARRAY);
    }

    private static getMaxWidth(ResultPoint p1, ResultPoint p2): number /*int*/ {
        if (p1 == null || p2 == null) {
            return 0;
        }
        return /*(int)*/ Math.abs(p1.getX() - p2.getX());
    }

    private static getMinWidth(p1: ResultPoint, p2: ResultPoint): number /*int*/ {
        if (p1 == null || p2 == null) {
            return Integer.MAX_VALUE;
        }
        return /*(int)*/ Math.abs(p1.getX() - p2.getX());
    }

    private static getMaxCodewordWidth(p: ResultPoint[]): number /*int*/ {
        return Math.max(
            Math.max(getMaxWidth(p[0], p[4]), getMaxWidth(p[6], p[2]) * PDF417Common.MODULES_IN_CODEWORD /
                PDF417Common.MODULES_IN_STOP_PATTERN),
            Math.max(getMaxWidth(p[1], p[5]), getMaxWidth(p[7], p[3]) * PDF417Common.MODULES_IN_CODEWORD /
                PDF417Common.MODULES_IN_STOP_PATTERN));
    }

    private static getMinCodewordWidth(p: ResultPoint[]): number /*int*/ {
        return Math.min(
            Math.min(getMinWidth(p[0], p[4]), getMinWidth(p[6], p[2]) * PDF417Common.MODULES_IN_CODEWORD /
                PDF417Common.MODULES_IN_STOP_PATTERN),
            Math.min(getMinWidth(p[1], p[5]), getMinWidth(p[7], p[3]) * PDF417Common.MODULES_IN_CODEWORD /
                PDF417Common.MODULES_IN_STOP_PATTERN));
    }

    // @Override
    public reset(): void {
        // nothing needs to be reset
    }

}
