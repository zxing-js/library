/*
 * Copyright 2013 ZXing authors
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

/*namespace com.google.zxing.qrcode.decoder {*/

import ResultPoint from '../../ResultPoint';

/**
 * Meta-data container for QR Code decoding. Instances of this class may be used to convey information back to the
 * decoding caller. Callers are expected to process this.
 *
 * @see com.google.zxing.common.DecoderResult#getOther()
 */
export default class QRCodeDecoderMetaData {


    public constructor(private mirrored: boolean) { }

    /**
     * @return true if the QR Code was mirrored.
     */
    public isMirrored(): boolean {
        return this.mirrored;
    }

    /**
     * Apply the result points' order correction due to mirroring.
     *
     * @param points Array of points to apply mirror correction to.
     */
    public applyMirroredCorrection(points: Array<ResultPoint>): void {
        if (!this.mirrored || points === null || points.length < 3) {
            return;
        }
        const bottomLeft = points[0];
        points[0] = points[2];
        points[2] = bottomLeft;
        // No need to 'fix' top-left and alignment pattern.
    }

}
