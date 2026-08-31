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

// package com.google.zxing.multi.qrcode;

import BarcodeFormat from '../../BarcodeFormat';
import BinaryBitmap from '../../BinaryBitmap';
import DecodeHintType from '../../DecodeHintType';
import DecoderResult from '../../common/DecoderResult';
import DetectorResult from '../../common/DetectorResult';
import QRCodeDecoderMetaData from '../../qrcode/decoder/QRCodeDecoderMetaData';
import QRCodeReader from '../../qrcode/QRCodeReader';
import Result from '../../Result';
import ResultMetadataType from '../../ResultMetadataType';
import ResultPoint from '../../ResultPoint';
import isReaderException from '../../util/isReaderException';
import MultipleBarcodeReader from '../MultipleBarcodeReader';
import MultiDetector from './detector/MultiDetector';

import { int, List } from '../../../customTypings';

/**
 * This implementation can detect and decode multiple QR Codes in an image.
 *
 * @author Sean Owen
 * @author Hannes Erven
 */
export default /*final*/ class QRCodeMultiReader extends QRCodeReader implements MultipleBarcodeReader {

    private static readonly EMPTY_RESULT_ARRAY: Result[] = [];
    private static readonly NO_RESULT_POINTS: ResultPoint[] = [];

    /**
     * @throws NotFoundException
     */
    public decodeMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any> = null): Result[] {
        let results: List<Result> = [];
        const detectorResults: DetectorResult[] = new MultiDetector(image.getBlackMatrix()).detectMulti(hints);
        for (const detectorResult of detectorResults) {
            try {
                const decoderResult: DecoderResult = this.getDecoder().decodeBitMatrix(detectorResult.getBits(), hints);
                const points: ResultPoint[] = detectorResult.getPoints();
                // If the code was mirrored: swap the bottom-left and the top-right points.
                if (decoderResult.getOther() instanceof QRCodeDecoderMetaData) {
                    (decoderResult.getOther() as QRCodeDecoderMetaData).applyMirroredCorrection(points);
                }
                const result = new Result(
                    decoderResult.getText(),
                    decoderResult.getRawBytes(),
                    undefined,
                    points,
                    BarcodeFormat.QR_CODE,
                    undefined
                );
                const byteSegments: Uint8Array[] = decoderResult.getByteSegments();
                if (byteSegments !== null) {
                    result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
                }
                const ecLevel: string = decoderResult.getECLevel();
                if (ecLevel !== null) {
                    result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
                }
                if (decoderResult.hasStructuredAppend()) {
                    result.putMetadata(
                        ResultMetadataType.STRUCTURED_APPEND_SEQUENCE,
                        decoderResult.getStructuredAppendSequenceNumber()
                    );
                    result.putMetadata(
                        ResultMetadataType.STRUCTURED_APPEND_PARITY,
                        decoderResult.getStructuredAppendParity()
                    );
                }
                // Upstream also records ResultMetadataType.SYMBOLOGY_IDENTIFIER here. Neither that
                // metadata key nor DecoderResult.getSymbologyModifier() exists in this port yet, so
                // that one field is left unset.
                result.putMetadata(ResultMetadataType.ERRORS_CORRECTED, decoderResult.getErrorsCorrected());

                results.push(result);
            } catch (re) {
                if (!isReaderException(re)) {
                    throw re;
                }
                // ignore and continue
            }
        }
        if (results.length === 0) {
            return QRCodeMultiReader.EMPTY_RESULT_ARRAY;
        }
        results = QRCodeMultiReader.processStructuredAppend(results);
        return results;
    }

    public static processStructuredAppend(results: List<Result>): List<Result> {
        const newResults: List<Result> = [];
        const saResults: List<Result> = [];
        for (const result of results) {
            // Result.getResultMetadata() is null until something is put on it, which the Java
            // original never has to consider because its own decodeMultiple always sets
            // ERRORS_CORRECTED first.
            const metadata = result.getResultMetadata();
            if (metadata != null && metadata.has(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE)) {
                saResults.push(result);
            } else {
                newResults.push(result);
            }
        }
        if (saResults.length === 0) {
            return results;
        }

        // sort and concatenate the SA list items
        saResults.sort(QRCodeMultiReader.saComparator);
        let newText = '';
        let newRawBytesLength: int = 0;
        let newByteSegmentLength: int = 0;
        for (const saResult of saResults) {
            newText += saResult.getText();
            newRawBytesLength += saResult.getRawBytes().length;
            const byteSegments = saResult.getResultMetadata().get(ResultMetadataType.BYTE_SEGMENTS) as Uint8Array[];
            if (byteSegments !== null && byteSegments !== undefined) {
                for (const segment of byteSegments) {
                    newByteSegmentLength += segment.length;
                }
            }
        }

        const newRawBytes = new Uint8Array(newRawBytesLength);
        const newByteSegment = new Uint8Array(newByteSegmentLength);
        let rawBytesOffset: int = 0;
        let byteSegmentOffset: int = 0;
        for (const saResult of saResults) {
            const saBytes: Uint8Array = saResult.getRawBytes();
            newRawBytes.set(saBytes, rawBytesOffset);
            rawBytesOffset += saBytes.length;
            const byteSegments = saResult.getResultMetadata().get(ResultMetadataType.BYTE_SEGMENTS) as Uint8Array[];
            if (byteSegments !== null && byteSegments !== undefined) {
                for (const segment of byteSegments) {
                    newByteSegment.set(segment, byteSegmentOffset);
                    byteSegmentOffset += segment.length;
                }
            }
        }

        const newResult = new Result(
            newText,
            newRawBytes,
            undefined,
            QRCodeMultiReader.NO_RESULT_POINTS,
            BarcodeFormat.QR_CODE,
            undefined
        );
        if (newByteSegmentLength > 0) {
            newResult.putMetadata(ResultMetadataType.BYTE_SEGMENTS, [newByteSegment]);
        }
        newResults.push(newResult);
        return newResults;
    }

    private static saComparator(a: Result, b: Result): int {
        const aNumber = a.getResultMetadata().get(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE) as number;
        const bNumber = b.getResultMetadata().get(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE) as number;
        return aNumber < bNumber ? -1 : aNumber > bNumber ? 1 : 0;
    }

}
