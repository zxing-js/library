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
import DecoderResult from '../common/DecoderResult';
import System from '../util/System';

import Decoder from './decoder/Decoder';
import Detector from './detector/Detector';
import Exception from '../../core/Exception';



// import java.util.List;
// import java.util.Map;

/**
 * This implementation can detect and decode Aztec codes in an image.
 *
 * @author David Olivier
 */
export default class AztecReader implements Reader {

    /**
     * Locates and decodes a Data Matrix code in an image.
     *
     * @return a String representing the content encoded by the Data Matrix code
     * @throws NotFoundException if a Data Matrix code cannot be found
     * @throws FormatException if a Data Matrix code cannot be decoded
     */
    public decode(image: BinaryBitmap, hints: Map<DecodeHintType, any> | null = null): Result {

        let exception: Exception = null;
        let detector = new Detector(image.getBlackMatrix());
        let points: ResultPoint[] = null;
        let decoderResult: DecoderResult = null;

        try {
            let detectorResult = detector.detectMirror(false);
            points = detectorResult.getPoints();
            this.reportFoundResultPoints(hints, points);
            decoderResult = new Decoder().decode(detectorResult);
        } catch (e) {
            exception = e;
        }
        if (decoderResult == null) {
            try {
                let detectorResult = detector.detectMirror(true);
                points = detectorResult.getPoints();
                this.reportFoundResultPoints(hints, points);
                decoderResult = new Decoder().decode(detectorResult);
            } catch (e) {
                if (exception != null) {
                    throw exception;
                }
                throw e;
            }
        }

        let result = new Result(decoderResult.getText(),
            decoderResult.getRawBytes(),
            decoderResult.getNumBits(),
            points,
            BarcodeFormat.AZTEC,
            System.currentTimeMillis());

        let byteSegments = decoderResult.getByteSegments();
        if (byteSegments != null) {
            result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
        }
        let ecLevel = decoderResult.getECLevel();
        if (ecLevel != null) {
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
        }

        return result;
    }

    private reportFoundResultPoints(hints: Map<DecodeHintType, any>, points: ResultPoint[]): void {
        if (hints != null) {
            let rpcb = hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);
            if (rpcb != null) {
                points.forEach((point, idx, arr) => {
                    rpcb.foundPossibleResultPoint(point);
                });
            }
        }
    }

    // @Override
    public reset(): void {
        // do nothing
    }

}
