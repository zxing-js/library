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

/*namespace com.google.zxing {*/

/*import java.util.EnumMap;*/
/*import java.util.Map;*/
import ResultPoint from './ResultPoint';
import BarcodeFormat from './BarcodeFormat';
import System from './util/System';
import ResultMetadataType from './ResultMetadataType';

/**
 * <p>Encapsulates the result of decoding a barcode within an image.</p>
 *
 * @author Sean Owen
 */
export default class Result {

    private resultMetadata: Map<ResultMetadataType, Object>;

    // public constructor(private text: string,
    //               Uint8Array rawBytes,
    //               ResultPoconst resultPoints: Int32Array,
    //               BarcodeFormat format) {
    //   this(text, rawBytes, resultPoints, format, System.currentTimeMillis())
    // }

    // public constructor(text: string,
    //               Uint8Array rawBytes,
    //               ResultPoconst resultPoints: Int32Array,
    //               BarcodeFormat format,
    //               long timestamp) {
    //   this(text, rawBytes, rawBytes == null ? 0 : 8 * rawBytes.length,
    //        resultPoints, format, timestamp)
    // }

    public constructor(private text: string,
      private rawBytes: Uint8Array,
      private numBits: number /*int*/ = rawBytes == null ? 0 : 8 * rawBytes.length,
      private resultPoints: ResultPoint[],
      private format: BarcodeFormat,
      private timestamp: number /*long*/ = System.currentTimeMillis()) {
        this.text = text;
        this.rawBytes = rawBytes;
        if (undefined === numBits || null === numBits) {
            this.numBits = (rawBytes === null || rawBytes === undefined) ? 0 : 8 * rawBytes.length;
        } else {
            this.numBits = numBits;
        }
        this.resultPoints = resultPoints;
        this.format = format;
        this.resultMetadata = null;
        if (undefined === timestamp || null === timestamp) {
            this.timestamp = System.currentTimeMillis();
        } else {
            this.timestamp = timestamp;
        }
    }

    /**
     * @return raw text encoded by the barcode
     */
    public getText(): string {
        return this.text;
    }

    /**
     * @return raw bytes encoded by the barcode, if applicable, otherwise {@code null}
     */
    public getRawBytes(): Uint8Array {
        return this.rawBytes;
    }

    /**
     * @return how many bits of {@link #getRawBytes()} are valid; typically 8 times its length
     * @since 3.3.0
     */
    public getNumBits(): number /*int*/ {
        return this.numBits;
    }

    /**
     * @return points related to the barcode in the image. These are typically points
     *         identifying finder patterns or the corners of the barcode. The exact meaning is
     *         specific to the type of barcode that was decoded.
     */
    public getResultPoints(): Array<ResultPoint> {
        return this.resultPoints;
    }

    /**
     * @return {@link BarcodeFormat} representing the format of the barcode that was decoded
     */
    public getBarcodeFormat(): BarcodeFormat {
        return this.format;
    }

    /**
     * @return {@link Map} mapping {@link ResultMetadataType} keys to values. May be
     *   {@code null}. This contains optional metadata about what was detected about the barcode,
     *   like orientation.
     */
    public getResultMetadata(): Map<ResultMetadataType, Object> {
        return this.resultMetadata;
    }

    public putMetadata(type: ResultMetadataType, value: Object): void {
        if (this.resultMetadata === null) {
            this.resultMetadata = new Map<ResultMetadataType, Object>();
        }
        this.resultMetadata.set(type, value);
    }

    public putAllMetadata(metadata: Map<ResultMetadataType, Object>): void {
        if (metadata !== null) {
            if (this.resultMetadata === null) {
                this.resultMetadata = metadata;
            } else {
                this.resultMetadata = new Map(metadata);
            }
        }
    }

    public addResultPoints(newPoints: Array<ResultPoint>): void {
        const oldPoints = this.resultPoints;
        if (oldPoints === null) {
            this.resultPoints = newPoints;
        } else if (newPoints !== null && newPoints.length > 0) {
            const allPoints = new Array<ResultPoint>(oldPoints.length + newPoints.length);
            System.arraycopy(oldPoints, 0, allPoints, 0, oldPoints.length);
            System.arraycopy(newPoints, 0, allPoints, oldPoints.length, newPoints.length);
            this.resultPoints = allPoints;
        }
    }

    public getTimestamp(): number/*long*/ {
        return this.timestamp;
    }

    /*@Override*/
    public toString(): string {
        return this.text;
    }

}
