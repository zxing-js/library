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

// package com.google.zxing.oned;

import BarcodeFormat from '../BarcodeFormat';
import IllegalArgumentException from '../IllegalArgumentException';
import OneDimensionalCodeWriter from './OneDimensionalCodeWriter';

import { int } from '../../customTypings';

const W = 3; // Pixel width of a 3x wide line
const N = 1; // Pixel width of a narrow line

/**
 * This object renders a ITF code as a {@link BitMatrix}.
 *
 * @author erik.barbara@gmail.com (Erik Barbara)
 */
export default class ITFWriter extends OneDimensionalCodeWriter {

    private static readonly START_PATTERN: Int32Array = Int32Array.from([1, 1, 1, 1]);
    private static readonly END_PATTERN: Int32Array = Int32Array.from([3, 1, 1]);

    // See ITFReader.PATTERNS
    private static readonly PATTERNS: Int32Array[] = [
        Int32Array.from([N, N, W, W, N]), // 0
        Int32Array.from([W, N, N, N, W]), // 1
        Int32Array.from([N, W, N, N, W]), // 2
        Int32Array.from([W, W, N, N, N]), // 3
        Int32Array.from([N, N, W, N, W]), // 4
        Int32Array.from([W, N, W, N, N]), // 5
        Int32Array.from([N, W, W, N, N]), // 6
        Int32Array.from([N, N, N, W, W]), // 7
        Int32Array.from([W, N, N, W, N]), // 8
        Int32Array.from([N, W, N, W, N]), // 9
    ];

    // @Override
    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return [BarcodeFormat.ITF];
    }

    // @Override
    public encodeContents(contents: string): boolean[] {
        const length = contents.length;
        if (length % 2 !== 0) {
            throw new IllegalArgumentException('The length of the input should be even');
        }
        if (length > 80) {
            throw new IllegalArgumentException(
                'Requested contents should be less than 80 digits long, but got ' + length
            );
        }

        ITFWriter.checkNumeric(contents);

        const result = new Array<boolean>(9 + 9 * length).fill(false);
        let pos: int = ITFWriter.appendPattern(result, 0, ITFWriter.START_PATTERN, true);
        for (let i = 0; i < length; i += 2) {
            const one = parseInt(contents.charAt(i), 10);
            const two = parseInt(contents.charAt(i + 1), 10);
            const encoding = new Int32Array(10);
            for (let j = 0; j < 5; j++) {
                encoding[2 * j] = ITFWriter.PATTERNS[one][j];
                encoding[2 * j + 1] = ITFWriter.PATTERNS[two][j];
            }
            pos += ITFWriter.appendPattern(result, pos, encoding, true);
        }
        ITFWriter.appendPattern(result, pos, ITFWriter.END_PATTERN, true);

        return result;
    }

}
