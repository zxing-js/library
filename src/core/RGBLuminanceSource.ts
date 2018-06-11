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

/*namespace com.google.zxing {*/

import './InvertedLuminanceSource'; // required because of circular dependencies between LuminanceSource and InvertedLuminanceSource
import InvertedLuminanceSource from './InvertedLuminanceSource';
import LuminanceSource from './LuminanceSource';

import System from './util/System';
import IllegalArgumentException from './IllegalArgumentException';

/**
 * This class is used to help decode images from files which arrive as RGB data from
 * an ARGB pixel array. It does not support rotation.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Betaminos
 */
export default class RGBLuminanceSource extends LuminanceSource {

    // public constructor(width: number /*int*/, height: number /*int*/, const pixels: Int32Array) {
    //   super(width, height)

    //   dataWidth = width
    //   dataHeight = height
    //   left = 0
    //   top = 0

    //   // In order to measure pure decoding speed, we convert the entire image to a greyscale array
    //   // up front, which is the same as the Y channel of the YUVLuminanceSource in the real app.
    //   //
    //   // Total number of pixels suffices, can ignore shape
    //   const size = width * height;
    //   luminances = new byte[size]
    //   for (let offset = 0; offset < size; offset++) {
    //     const pixel = pixels[offset]
    //     const r = (pixel >> 16) & 0xff; // red
    //     const g2 = (pixel >> 7) & 0x1fe; // 2 * green
    //     const b = pixel & 0xff; // blue
    //     // Calculate green-favouring average cheaply
    //     luminances[offset] = (byte) ((r + g2 + b) / 4)
    //   }
    // }

    private luminances: Uint8ClampedArray;

    public constructor(luminances: Uint8ClampedArray | Int32Array,
        width: number /*int*/,
        height: number /*int*/,
        private dataWidth?: number /*int*/,
        private dataHeight?: number /*int*/,
        private left?: number /*int*/,
        private top?: number /*int*/) {
        super(width, height);

        if (luminances.BYTES_PER_ELEMENT === 4) {// Int32Array
            const size = width * height;
            const luminancesUint8Array = new Uint8ClampedArray(size);
            for (let offset = 0; offset < size; offset++) {
                const pixel = luminances[offset];
                const r = (pixel >> 16) & 0xff; // red
                const g2 = (pixel >> 7) & 0x1fe; // 2 * green
                const b = pixel & 0xff; // blue
                // Calculate green-favouring average cheaply
                luminancesUint8Array[offset] = /*(byte) */((r + g2 + b) / 4) & 0xFF;
            }
            this.luminances = luminancesUint8Array;
        } else {
            this.luminances = <Uint8ClampedArray>luminances;
        }

        if (undefined === dataWidth) {
            this.dataWidth = width;
        }
        if (undefined === dataHeight) {
            this.dataHeight = height;
        }
        if (undefined === left) {
            this.left = 0;
        }
        if (undefined === top) {
            this.top = 0;
        }
        if (this.left + width > this.dataWidth || this.top + height > this.dataHeight) {
            throw new IllegalArgumentException('Crop rectangle does not fit within image data.');
        }
    }

    /*@Override*/
    public getRow(y: number /*int*/, row?: Uint8ClampedArray): Uint8ClampedArray {
        if (y < 0 || y >= this.getHeight()) {
            throw new IllegalArgumentException('Requested row is outside the image: ' + y);
        }
        const width = this.getWidth();
        if (row === null || row === undefined || row.length < width) {
            row = new Uint8ClampedArray(width);
        }
        const offset = (y + this.top) * this.dataWidth + this.left;
        System.arraycopy(this.luminances, offset, row, 0, width);
        return row;
    }

    /*@Override*/
    public getMatrix(): Uint8ClampedArray {

        const width = this.getWidth();
        const height = this.getHeight();

        // If the caller asks for the entire underlying image, save the copy and give them the
        // original data. The docs specifically warn that result.length must be ignored.
        if (width === this.dataWidth && height === this.dataHeight) {
            return this.luminances;
        }

        const area = width * height;
        const matrix = new Uint8ClampedArray(area);
        let inputOffset = this.top * this.dataWidth + this.left;

        // If the width matches the full width of the underlying data, perform a single copy.
        if (width === this.dataWidth) {
            System.arraycopy(this.luminances, inputOffset, matrix, 0, area);
            return matrix;
        }

        // Otherwise copy one cropped row at a time.
        for (let y = 0; y < height; y++) {
            const outputOffset = y * width;
            System.arraycopy(this.luminances, inputOffset, matrix, outputOffset, width);
            inputOffset += this.dataWidth;
        }
        return matrix;
    }

    /*@Override*/
    public isCropSupported(): boolean {
        return true;
    }

    /*@Override*/
    public crop(left: number /*int*/, top: number /*int*/, width: number /*int*/, height: number /*int*/): LuminanceSource {
        return new RGBLuminanceSource(this.luminances,
            width,
            height,
            this.dataWidth,
            this.dataHeight,
            this.left + left,
            this.top + top, );
    }

    public invert(): LuminanceSource {
        return new InvertedLuminanceSource(this);
    }
}
