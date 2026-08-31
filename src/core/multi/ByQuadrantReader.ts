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

import { int } from '../../customTypings';

/**
 * This class attempts to decode a barcode from an image, not by scanning the whole image,
 * but by scanning subsets of the image. This is important when there may be multiple barcodes in
 * an image, and detecting a barcode may find parts of multiple barcode and fail to decode
 * (e.g. QR Codes). Instead this scans the four quadrants of the image -- and also the center
 * 'quadrant' to cover the case where a barcode is found in the center.
 *
 * @see GenericMultipleBarcodeReader
 */
export default /*final*/ class ByQuadrantReader implements Reader {

    public constructor(private readonly delegate: Reader) { }

    /**
     * @throws NotFoundException
     * @throws ChecksumException
     * @throws FormatException
     */
    public decode(image: BinaryBitmap, hints: Map<DecodeHintType, any> = null): Result {

        const width: int = image.getWidth();
        const height: int = image.getHeight();
        const halfWidth: int = Math.trunc(width / 2);
        const halfHeight: int = Math.trunc(height / 2);

        try {
            // No need to call makeAbsolute as results will be relative to original top left here
            return this.delegate.decode(image.crop(0, 0, halfWidth, halfHeight), hints);
        } catch (re) {
            if (!(re instanceof NotFoundException)) {
                throw re;
            }
            // continue
        }

        try {
            const result: Result = this.delegate.decode(image.crop(halfWidth, 0, halfWidth, halfHeight), hints);
            ByQuadrantReader.makeAbsolute(result.getResultPoints(), halfWidth, 0);
            return result;
        } catch (re) {
            if (!(re instanceof NotFoundException)) {
                throw re;
            }
            // continue
        }

        try {
            const result: Result = this.delegate.decode(image.crop(0, halfHeight, halfWidth, halfHeight), hints);
            ByQuadrantReader.makeAbsolute(result.getResultPoints(), 0, halfHeight);
            return result;
        } catch (re) {
            if (!(re instanceof NotFoundException)) {
                throw re;
            }
            // continue
        }

        try {
            const result: Result = this.delegate.decode(image.crop(halfWidth, halfHeight, halfWidth, halfHeight), hints);
            ByQuadrantReader.makeAbsolute(result.getResultPoints(), halfWidth, halfHeight);
            return result;
        } catch (re) {
            if (!(re instanceof NotFoundException)) {
                throw re;
            }
            // continue
        }

        const quarterWidth: int = Math.trunc(halfWidth / 2);
        const quarterHeight: int = Math.trunc(halfHeight / 2);
        const center: BinaryBitmap = image.crop(quarterWidth, quarterHeight, halfWidth, halfHeight);
        const result: Result = this.delegate.decode(center, hints);
        ByQuadrantReader.makeAbsolute(result.getResultPoints(), quarterWidth, quarterHeight);
        return result;
    }

    public reset(): void {
        this.delegate.reset();
    }

    private static makeAbsolute(points: ResultPoint[], leftOffset: int, topOffset: int): void {
        if (points != null) {
            for (let i = 0; i < points.length; i++) {
                const relative: ResultPoint = points[i];
                if (relative != null) {
                    points[i] = new ResultPoint(relative.getX() + leftOffset, relative.getY() + topOffset);
                }
            }
        }
    }

}
