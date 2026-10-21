/*
 * Copyright 2011 ZXing authors
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
import BitMatrix from '../common/BitMatrix';
import EncodeHintType from '../EncodeHintType';
import IllegalArgumentException from '../IllegalArgumentException';
import Integer from '../util/Integer';
import Writer from '../Writer';

import { int } from '../../customTypings';

/**
 * <p>Encapsulates functionality and implementation that is common to one-dimensional barcodes.</p>
 *
 * Java has two `encode` overloads distinguished by arity: one returning `boolean[]` and one
 * returning `BitMatrix`. TypeScript cannot express that, so the `boolean[]` variants are named
 * `encodeContents` / `encodeContentsWithHints` here and `encode` is reserved for the
 * {@link Writer} interface method.
 *
 * @author dsbnatut@gmail.com (Kazuki Nishiura)
 */
export default abstract class OneDimensionalCodeWriter implements Writer {

    private static readonly NUMERIC = /^[0-9]+$/;

    /**
     * Encode the contents to boolean array expression of one-dimensional barcode.
     * Start code and end code should be included in result, and side margins should not be included.
     *
     * (Java: `boolean[] encode(String contents)`)
     *
     * @param contents barcode contents to encode
     * @return a `boolean[]` of horizontal pixels (false = white, true = black)
     */
    public abstract encodeContents(contents: string): boolean[];

    /**
     * Can be overwritten if the encode requires to read the hints map. Otherwise it defaults to
     * {@link encodeContents}.
     *
     * (Java: `boolean[] encode(String contents, Map<EncodeHintType,?> hints)`)
     *
     * @param contents barcode contents to encode
     * @param hints encoding hints
     * @return a `boolean[]` of horizontal pixels (false = white, true = black)
     */
    public encodeContentsWithHints(contents: string, hints: Map<EncodeHintType, any>): boolean[] {
        return this.encodeContents(contents);
    }

    /**
     * Encode the contents following specified format.
     * `width` and `height` are required size. This method may return bigger size
     * `BitMatrix` when specified size is too small. The user can set both `width` and
     * `height` to zero to get minimum size barcode. If negative value is set to `width`
     * or `height`, `IllegalArgumentException` is thrown.
     */
    // @Override
    public encode(
        contents: string,
        format: BarcodeFormat,
        width: int,
        height: int,
        hints: Map<EncodeHintType, any> = null
    ): BitMatrix {

        if (contents.length === 0) {
            throw new IllegalArgumentException('Found empty contents');
        }

        if (width < 0 || height < 0) {
            throw new IllegalArgumentException('Negative size is not allowed. Input: ' + width + 'x' + height);
        }

        const supportedFormats = this.getSupportedWriteFormats();
        if (supportedFormats != null && !supportedFormats.includes(format)) {
            throw new IllegalArgumentException(
                'Can only encode ' + supportedFormats.map(f => BarcodeFormat[f]).join(',') + ', but got ' + format
            );
        }

        let sidesMargin: int = this.getDefaultMargin();
        if (hints != null && hints.has(EncodeHintType.MARGIN)) {
            sidesMargin = Integer.parseInt(hints.get(EncodeHintType.MARGIN).toString());
        }

        const code = this.encodeContentsWithHints(contents, hints);
        return OneDimensionalCodeWriter.renderResult(code, width, height, sidesMargin);
    }

    protected getSupportedWriteFormats(): BarcodeFormat[] {
        return null;
    }

    /**
     * @return a byte array of horizontal pixels (0 = white, 1 = black)
     */
    private static renderResult(code: boolean[], width: int, height: int, sidesMargin: int): BitMatrix {
        const inputWidth = code.length;
        // Add quiet zone on both sides.
        const fullWidth = inputWidth + sidesMargin;
        const outputWidth = Math.max(width, fullWidth);
        const outputHeight = Math.max(1, height);

        const multiple = Math.floor(outputWidth / fullWidth);
        const leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);

        const output = new BitMatrix(outputWidth, outputHeight);
        for (let inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
            if (code[inputX]) {
                output.setRegion(outputX, 0, multiple, outputHeight);
            }
        }
        return output;
    }

    /**
     * @param contents string to check for numeric characters
     * @throws IllegalArgumentException if input contains characters other than digits 0-9.
     */
    protected static checkNumeric(contents: string): void {
        if (!OneDimensionalCodeWriter.NUMERIC.test(contents)) {
            throw new IllegalArgumentException('Input should only contain digits 0-9');
        }
    }

    /**
     * @param target encode black/white pattern into this array
     * @param pos position to start encoding at in `target`
     * @param pattern lengths of black/white runs to encode
     * @param startColor starting color - false for white, true for black
     * @return the number of elements added to target.
     */
    protected static appendPattern(target: boolean[], pos: int, pattern: Int32Array | number[], startColor: boolean): int {
        let color = startColor;
        let numAdded = 0;
        for (let i = 0; i < pattern.length; i++) {
            const len = pattern[i];
            for (let j = 0; j < len; j++) {
                target[pos++] = color;
            }
            numAdded += len;
            color = !color; // flip color after each segment
        }
        return numAdded;
    }

    public getDefaultMargin(): int {
        // CodaBar spec requires a side margin to be more than ten times wider than narrow space.
        // This seems like a decent idea for a default for all formats.
        return 10;
    }
}
