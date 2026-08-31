/*
 * Copyright 2010 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

import { BinaryBitmap } from '@zxing/library';
import { BitMatrix } from '@zxing/library';
import { HybridBinarizer } from '@zxing/library';
import { RGBLuminanceSource } from '@zxing/library';

/**
 * Renders an encoded BitMatrix onto a white canvas with a quiet zone, so the result can be handed
 * back to a reader.
 *
 * The writers only pad up to the requested width and height, which often leaves a quiet zone
 * narrower than a single module; adding one here is what makes an encode/decode round trip
 * meaningful.
 */
export function toBinaryBitmap(matrix: BitMatrix, quietZone: number = 20): BinaryBitmap {
    const matrixWidth = matrix.getWidth();
    const matrixHeight = matrix.getHeight();
    const width = matrixWidth + quietZone * 2;
    const height = matrixHeight + quietZone * 2;

    const luminances = new Uint8ClampedArray(width * height).fill(0xff);
    for (let y = 0; y < matrixHeight; y++) {
        for (let x = 0; x < matrixWidth; x++) {
            if (matrix.get(x, y)) {
                luminances[(y + quietZone) * width + (x + quietZone)] = 0x00;
            }
        }
    }

    return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminances, width, height)));
}

/**
 * Returns the codeword values behind a high-level encoded string, where each char code is one
 * codeword in the range 0..928.
 */
export function toCodewords(encoded: string): number[] {
    const codewords: number[] = [];
    for (let i = 0; i < encoded.length; i++) {
        codewords.push(encoded.charCodeAt(i));
    }
    return codewords;
}
