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

import Reader from '../Reader';
import ResultPoint from '../ResultPoint';
import Result from '../Result';
import BarcodeFormat from '../BarcodeFormat';
import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
import ResultMetadataType from '../ResultMetadataType';
import System from '../util/System';

import MicroQRDecoder from './decoder/MicroQRDecoder';
import MicroQRDetector from './detector/MicroQRDetector';

/**
 * Detects and decodes Micro QR Codes in images.
 */
export default class MicroQRCodeReader implements Reader {

    private readonly decoder = new MicroQRDecoder();

    public decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any> | null): Result {
        let decoderResult;
        let points: ResultPoint[];

        if (hints != null && hints.get(DecodeHintType.PURE_BARCODE) !== undefined) {
            // Pure barcode path: image is already the bit matrix
            const bits = image.getBlackMatrix();
            decoderResult = this.decoder.decodeBitMatrix(bits, hints ?? undefined);
            points = [];
        } else {
            const detector = new MicroQRDetector(image.getBlackMatrix());
            const detectorResult = detector.detect(hints ?? undefined);
            points = detectorResult.getPoints();
            decoderResult = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints ?? undefined);
        }

        const result = new Result(
            decoderResult.getText(),
            decoderResult.getRawBytes(),
            decoderResult.getNumBits(),
            points,
            BarcodeFormat.MICRO_QR_CODE,
            System.currentTimeMillis()
        );

        const byteSegments = decoderResult.getByteSegments();
        if (byteSegments !== null) {
            result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
        }
        const ecLevel = decoderResult.getECLevel();
        if (ecLevel !== null) {
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
        }

        return result;
    }

    public reset(): void {
        // nothing to reset
    }
}
