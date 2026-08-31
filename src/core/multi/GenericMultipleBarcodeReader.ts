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

// package com.google.zxing.multi;

import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
import NotFoundException from '../NotFoundException';
import Reader from '../Reader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
import MultipleBarcodeReader from './MultipleBarcodeReader';
import isReaderException from '../util/isReaderException';

import { float, int, List } from '../../customTypings';

/**
 * <p>Attempts to locate multiple barcodes in an image by repeatedly decoding portion of the image.
 * After one barcode is found, the areas left, above, right and below the barcode's
 * {@link ResultPoint}s are scanned, recursively.</p>
 *
 * <p>A caller may want to also employ {@link ByQuadrantReader} when attempting to find multiple
 * 2D barcodes, like QR Codes, in an image, where the presence of multiple barcodes might prevent
 * detecting any one of them.</p>
 *
 * <p>That is, instead of passing a {@link Reader} a caller might pass
 * {@code new ByQuadrantReader(reader)}.</p>
 *
 * @author Sean Owen
 */
export default /*final*/ class GenericMultipleBarcodeReader implements MultipleBarcodeReader {

    private static readonly MIN_DIMENSION_TO_RECUR: int = 100;
    private static readonly MAX_DEPTH: int = 4;

    public static readonly EMPTY_RESULT_ARRAY: Result[] = [];

    public constructor(private readonly delegate: Reader) { }

    /**
     * @throws NotFoundException
     */
    public decodeMultiple(image: BinaryBitmap, hints: Map<DecodeHintType, any> = null): Result[] {
        const results: List<Result> = [];
        this.doDecodeMultiple(image, hints, results, 0, 0, 0);
        if (results.length === 0) {
            throw NotFoundException.getNotFoundInstance();
        }
        return results;
    }

    private doDecodeMultiple(
        image: BinaryBitmap,
        hints: Map<DecodeHintType, any>,
        results: List<Result>,
        xOffset: int,
        yOffset: int,
        currentDepth: int
    ): void {
        if (currentDepth > GenericMultipleBarcodeReader.MAX_DEPTH) {
            return;
        }

        let result: Result;
        try {
            result = this.delegate.decode(image, hints);
        } catch (ignored) {
            if (!isReaderException(ignored)) {
                throw ignored;
            }
            return;
        }
        let alreadyFound = false;
        for (const existingResult of results) {
            if (existingResult.getText() === result.getText()) {
                alreadyFound = true;
                break;
            }
        }
        if (!alreadyFound) {
            results.push(GenericMultipleBarcodeReader.translateResultPoints(result, xOffset, yOffset));
        }
        const resultPoints: ResultPoint[] = result.getResultPoints();
        if (resultPoints == null || resultPoints.length === 0) {
            return;
        }
        const width: int = image.getWidth();
        const height: int = image.getHeight();
        let minX: float = width;
        let minY: float = height;
        let maxX: float = 0.0;
        let maxY: float = 0.0;
        for (const point of resultPoints) {
            if (point == null) {
                continue;
            }
            const x: float = point.getX();
            const y: float = point.getY();
            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
        }

        // Decode left of barcode
        if (minX > GenericMultipleBarcodeReader.MIN_DIMENSION_TO_RECUR) {
            this.doDecodeMultiple(
                image.crop(0, 0, Math.trunc(minX), height),
                hints, results,
                xOffset, yOffset,
                currentDepth + 1
            );
        }
        // Decode above barcode
        if (minY > GenericMultipleBarcodeReader.MIN_DIMENSION_TO_RECUR) {
            this.doDecodeMultiple(
                image.crop(0, 0, width, Math.trunc(minY)),
                hints, results,
                xOffset, yOffset,
                currentDepth + 1
            );
        }
        // Decode right of barcode
        if (maxX < width - GenericMultipleBarcodeReader.MIN_DIMENSION_TO_RECUR) {
            this.doDecodeMultiple(
                image.crop(Math.trunc(maxX), 0, width - Math.trunc(maxX), height),
                hints, results,
                xOffset + Math.trunc(maxX), yOffset,
                currentDepth + 1
            );
        }
        // Decode below barcode
        if (maxY < height - GenericMultipleBarcodeReader.MIN_DIMENSION_TO_RECUR) {
            this.doDecodeMultiple(
                image.crop(0, Math.trunc(maxY), width, height - Math.trunc(maxY)),
                hints, results,
                xOffset, yOffset + Math.trunc(maxY),
                currentDepth + 1
            );
        }
    }

    private static translateResultPoints(result: Result, xOffset: int, yOffset: int): Result {
        const oldResultPoints: ResultPoint[] = result.getResultPoints();
        if (oldResultPoints == null) {
            return result;
        }
        const newResultPoints = new Array<ResultPoint>(oldResultPoints.length);
        for (let i = 0; i < oldResultPoints.length; i++) {
            const oldPoint: ResultPoint = oldResultPoints[i];
            if (oldPoint != null) {
                newResultPoints[i] = new ResultPoint(oldPoint.getX() + xOffset, oldPoint.getY() + yOffset);
            }
        }
        const newResult = new Result(
            result.getText(),
            result.getRawBytes(),
            result.getNumBits(),
            newResultPoints,
            result.getBarcodeFormat(),
            result.getTimestamp()
        );
        newResult.putAllMetadata(result.getResultMetadata());
        return newResult;
    }

}
