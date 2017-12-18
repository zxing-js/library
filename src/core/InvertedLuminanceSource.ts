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

import LuminanceSource from './LuminanceSource';

/*namespace com.google.zxing {*/

/**
 * A wrapper implementation of {@link LuminanceSource} which inverts the luminances it returns -- black becomes
 * white and vice versa, and each value becomes (255-value).
 *
 * @author Sean Owen
 */
export default class InvertedLuminanceSource extends LuminanceSource {

    public constructor(private delegate: LuminanceSource) {
        super(delegate.getWidth(), delegate.getHeight());
    }

    /*@Override*/
    public getRow(y: number /*int*/, row?: Uint8ClampedArray): Uint8ClampedArray {
        const sourceRow = this.delegate.getRow(y, row);
        const width: number /*int*/ = this.getWidth();
        for (let i = 0; i < width; i++) {
            sourceRow[i] = /*(byte)*/ (255 - (sourceRow[i] & 0xFF));
        }
        return sourceRow;
    }

    /*@Override*/
    public getMatrix(): Uint8ClampedArray {

        const matrix: Uint8ClampedArray = this.delegate.getMatrix();
        const length: number /*int*/ = this.getWidth() * this.getHeight();
        const invertedMatrix = new Uint8ClampedArray(length);

        for (let i = 0; i < length; i++) {
            invertedMatrix[i] = /*(byte)*/ (255 - (matrix[i] & 0xFF));
        }

        return invertedMatrix;
    }

    /*@Override*/
    public isCropSupported(): boolean {
        return this.delegate.isCropSupported();
    }

    /*@Override*/
    public crop(left: number /*int*/, top: number /*int*/, width: number /*int*/, height: number /*int*/): LuminanceSource {
        return new InvertedLuminanceSource(this.delegate.crop(left, top, width, height));
    }

    /*@Override*/
    public isRotateSupported(): boolean {
        return this.delegate.isRotateSupported();
    }

    /**
     * @return original delegate {@link LuminanceSource} since invert undoes itself
     */
    /*@Override*/
    public invert(): LuminanceSource {
        return this.delegate;
    }

    /*@Override*/
    public rotateCounterClockwise(): LuminanceSource {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise());
    }

    /*@Override*/
    public rotateCounterClockwise45(): LuminanceSource {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise45());
    }

}
