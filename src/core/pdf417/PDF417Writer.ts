/*
 * Copyright 2012 ZXing authors
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

// package com.google.zxing.pdf417;

import BarcodeFormat from '../BarcodeFormat';
import BitMatrix from '../common/BitMatrix';
import EncodeHintType from '../EncodeHintType';
import IllegalArgumentException from '../IllegalArgumentException';
import Charset from '../util/Charset';
import Writer from '../Writer';
import Compaction from './encoder/Compaction';
import Dimensions from './encoder/Dimensions';
import PDF417 from './encoder/PDF417';

import { int } from '../../customTypings';

/**
 * @author Jacob Haynes
 * @author qwandor@google.com (Andrew Walbran)
 */
export default /*final*/ class PDF417Writer implements Writer {

    /**
     * default white space (margin) around the code
     */
    private static readonly WHITE_SPACE: int = 30;

    /**
     * default error correction level
     */
    private static readonly DEFAULT_ERROR_CORRECTION_LEVEL: int = 2;

    /*@Override*/
    public encode(
        contents: string,
        format: BarcodeFormat,
        width: int,
        height: int,
        hints: Map<EncodeHintType, any> = null
    ): BitMatrix /*throws WriterException*/ {
        if (format !== BarcodeFormat.PDF_417) {
            throw new IllegalArgumentException('Can only encode PDF_417, but got ' + format);
        }

        const encoder = new PDF417();
        let margin: int = PDF417Writer.WHITE_SPACE;
        let errorCorrectionLevel: int = PDF417Writer.DEFAULT_ERROR_CORRECTION_LEVEL;
        let autoECI = false;

        if (hints != null) {
            if (hints.has(EncodeHintType.PDF417_COMPACT)) {
                encoder.setCompact(String(hints.get(EncodeHintType.PDF417_COMPACT)) === 'true');
            }
            if (hints.has(EncodeHintType.PDF417_COMPACTION)) {
                const compaction = hints.get(EncodeHintType.PDF417_COMPACTION);
                encoder.setCompaction(
                    typeof compaction === 'string' ? Compaction[compaction as keyof typeof Compaction] : compaction
                );
            }
            if (hints.has(EncodeHintType.PDF417_DIMENSIONS)) {
                const dimensions: Dimensions = hints.get(EncodeHintType.PDF417_DIMENSIONS);
                encoder.setDimensions(
                    dimensions.getMaxCols(),
                    dimensions.getMinCols(),
                    dimensions.getMaxRows(),
                    dimensions.getMinRows()
                );
            }
            if (hints.has(EncodeHintType.MARGIN)) {
                margin = Number.parseInt(hints.get(EncodeHintType.MARGIN).toString(), 10);
            }
            if (hints.has(EncodeHintType.ERROR_CORRECTION)) {
                errorCorrectionLevel = Number.parseInt(hints.get(EncodeHintType.ERROR_CORRECTION).toString(), 10);
            }
            if (hints.has(EncodeHintType.CHARACTER_SET)) {
                const encoding = Charset.forName(hints.get(EncodeHintType.CHARACTER_SET).toString());
                encoder.setEncoding(encoding);
            }
            autoECI = hints.has(EncodeHintType.PDF417_AUTO_ECI) &&
                String(hints.get(EncodeHintType.PDF417_AUTO_ECI)) === 'true';
        }

        return PDF417Writer.bitMatrixFromEncoder(encoder, contents, errorCorrectionLevel, width, height, margin, autoECI);
    }

    /**
     * Takes encoder, accounts for width/height, and retrieves bit matrix
     */
    private static bitMatrixFromEncoder(
        encoder: PDF417,
        contents: string,
        errorCorrectionLevel: int,
        width: int,
        height: int,
        margin: int,
        autoECI: boolean
    ): BitMatrix /*throws WriterException*/ {
        encoder.generateBarcodeLogic(contents, errorCorrectionLevel, autoECI);

        const aspectRatio: int = 4;
        let originalScale: Uint8Array[] = encoder.getBarcodeMatrix().getScaledMatrix(1, aspectRatio);
        let rotated = false;
        if ((height > width) !== (originalScale[0].length < originalScale.length)) {
            originalScale = PDF417Writer.rotateArray(originalScale);
            rotated = true;
        }

        const scaleX: int = Math.floor(width / originalScale[0].length);
        const scaleY: int = Math.floor(height / originalScale.length);
        const scale: int = Math.min(scaleX, scaleY);

        if (scale > 1) {
            let scaledMatrix: Uint8Array[] =
                encoder.getBarcodeMatrix().getScaledMatrix(scale, scale * aspectRatio);
            if (rotated) {
                scaledMatrix = PDF417Writer.rotateArray(scaledMatrix);
            }
            return PDF417Writer.bitMatrixFromBitArray(scaledMatrix, margin);
        }
        return PDF417Writer.bitMatrixFromBitArray(originalScale, margin);
    }

    /**
     * This takes an array holding the values of the PDF 417
     *
     * @param input a byte array of information with 0 is black, and 1 is white
     * @param margin border around the barcode
     * @return BitMatrix of the input
     */
    private static bitMatrixFromBitArray(input: Uint8Array[], margin: int): BitMatrix {
        // Creates the bit matrix with extra space for whitespace
        const output = new BitMatrix(input[0].length + 2 * margin, input.length + 2 * margin);
        output.clear();
        for (let y = 0, yOutput = output.getHeight() - margin - 1; y < input.length; y++, yOutput--) {
            const inputY = input[y];
            for (let x = 0; x < input[0].length; x++) {
                // Zero is white in the byte matrix
                if (inputY[x] === 1) {
                    output.set(x + margin, yOutput);
                }
            }
        }
        return output;
    }

    /**
     * Takes and rotates the it 90 degrees
     */
    private static rotateArray(bitarray: Uint8Array[]): Uint8Array[] {
        const temp = new Array<Uint8Array>(bitarray[0].length);
        for (let i = 0; i < temp.length; i++) {
            temp[i] = new Uint8Array(bitarray.length);
        }
        for (let ii = 0; ii < bitarray.length; ii++) {
            // This makes the direction consistent on screen when rotating the
            // screen;
            const inverseii: int = bitarray.length - ii - 1;
            for (let jj = 0; jj < bitarray[0].length; jj++) {
                temp[jj][inverseii] = bitarray[ii][jj];
            }
        }
        return temp;
    }

}
