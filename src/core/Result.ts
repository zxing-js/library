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

/* namespace com.google.zxing { */

/* import java.util.EnumMap; */
/* import java.util.Map; */
import ResultPoint from './ResultPoint';
import BarcodeFormat from './BarcodeFormat';
import System from './util/System';
import ResultMetadataType from './ResultMetadataType';
import { long } from '../customTypings';
import { isBarcodeFormatValue } from './util/BarcodeFormatHelpers';

/**
 * <p>Encapsulates the result of decoding a barcode within an image.</p>
 *
 * @author Sean Owen
 */
export default class Result {

  private resultMetadata: Map<ResultMetadataType, Object>;
  private numBits: number;
  private resultPoints: ResultPoint[];
  private format: BarcodeFormat;

  public constructor(
    text: string,
    rawBytes: Uint8Array,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
  );
  public constructor(
    text: string,
    rawBytes: Uint8Array,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
    timestamp: long,
  );
  public constructor(
    text: string,
    rawBytes: Uint8Array,
    numBits: number,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
    timestamp?: number
  );
  public constructor(
    private text: string,
    private rawBytes: Uint8Array,
    resultPoints_resultPoints_numBits: ResultPoint[] | ResultPoint[] | number,
    format_format_resultPoints: BarcodeFormat | BarcodeFormat | ResultPoint[],
    nothing_timestamp_format: undefined | long | BarcodeFormat = null,
    private timestamp: long = System.currentTimeMillis()
  ) {
    // checks overloading order from most to least params

    // check overload 3
    if (Number.isInteger(resultPoints_resultPoints_numBits) && Array.isArray(format_format_resultPoints) && isBarcodeFormatValue(nothing_timestamp_format)) {
      const impl3_numBits = (resultPoints_resultPoints_numBits || null) as number;
      const impl3_resultPoints = format_format_resultPoints as ResultPoint[];
      const impl3_format = nothing_timestamp_format as BarcodeFormat;
      this.constructorImpl(text, rawBytes, impl3_numBits, impl3_resultPoints, impl3_format, timestamp);
      return;
    }

    // check overload 2
    if (Array.isArray(resultPoints_resultPoints_numBits) && isBarcodeFormatValue(format_format_resultPoints as BarcodeFormat) && Number.isInteger(nothing_timestamp_format)) {
      const impl2_resultPoints = resultPoints_resultPoints_numBits as ResultPoint[];
      const impl2_format = format_format_resultPoints as BarcodeFormat;
      const impl2_timestamp = nothing_timestamp_format as long;
      this.constructorOverload2(text, rawBytes, impl2_resultPoints, impl2_format, impl2_timestamp);
      return;
    }

    // check overload 1
    if (typeof text === 'string' && rawBytes instanceof Uint8Array && Array.isArray(resultPoints_resultPoints_numBits) && isBarcodeFormatValue(format_format_resultPoints as BarcodeFormat)) {
      const impl1_resultPoints = resultPoints_resultPoints_numBits as ResultPoint[];
      const impl1_format = format_format_resultPoints as BarcodeFormat;
      this.constructorOverload1(text, rawBytes, impl1_resultPoints, impl1_format);
      return;
    }

    // throw no supported overload exception
    throw new Error('No supported overload for the given combination of parameters.');
  }

  private constructorOverload1(
    text: string,
    rawBytes: Uint8Array,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
  ) {
    return this.constructorOverload2(text, rawBytes, resultPoints, format, System.currentTimeMillis());
  }

  private constructorOverload2(
    text: string,
    rawBytes: Uint8Array,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
    timestamp: long,
  ) {
    const numBits = rawBytes == null ? 0 : 8 * rawBytes.length;
    return this.constructorImpl(text, rawBytes, numBits, resultPoints, format, timestamp);
  }

  private constructorImpl(
    text: string,
    rawBytes: Uint8Array,
    numBits: number | null,
    resultPoints: ResultPoint[],
    format: BarcodeFormat,
    timestamp: number | null
  ) {
    this.text = text;
    this.rawBytes = rawBytes;
    if (!Number.isInteger(numBits)) {
      this.numBits = !rawBytes ? 0 : 8 * rawBytes.length;
    } else {
      this.numBits = numBits;
    }
    this.resultPoints = resultPoints;
    this.format = format;
    this.resultMetadata = null;
    if (!Number.isInteger(timestamp)) {
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
  public getNumBits(): number /* int */ {
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

  public getTimestamp(): number/* long */ {
    return this.timestamp;
  }

  /* @Override */
  public toString(): string {
    return this.text;
  }

}
