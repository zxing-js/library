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

// package com.google.zxing.pdf417.encoder;

import BarcodeRow from './BarcodeRow';

import { int } from '../../../customTypings';

/**
 * Holds all of the information for a barcode in a format where it can be easily accessible
 *
 * @author Jacob Haynes
 */
export default /*final*/ class BarcodeMatrix {

    private readonly matrix: BarcodeRow[];
    private currentRow: int;
    private readonly height: int;
    private readonly width: int;

    /**
     * @param height the height of the matrix (Rows)
     * @param width  the width of the matrix (Cols)
     */
    public constructor(height: int, width: int) {
        this.matrix = new Array<BarcodeRow>(height);
        // Initializes the array to the correct width
        for (let i = 0, matrixLength = this.matrix.length; i < matrixLength; i++) {
            this.matrix[i] = new BarcodeRow((width + 4) * 17 + 1);
        }
        this.width = width * 17;
        this.height = height;
        this.currentRow = -1;
    }

    public set(x: int, y: int, value: int /*byte*/): void {
        this.matrix[y].set(x, value);
    }

    public startRow(): void {
        ++this.currentRow;
    }

    public getCurrentRow(): BarcodeRow {
        return this.matrix[this.currentRow];
    }

    public getMatrix(): Uint8Array[] {
        return this.getScaledMatrix(1, 1);
    }

    public getScaledMatrix(xScale: int, yScale: int): Uint8Array[] {
        // Each row is replaced wholesale by the scaled BarcodeRow, whose length is the full row
        // buffer ((width + 4) * 17 + 1) * xScale rather than width * xScale. This mirrors the Java
        // original, where the pre-allocated row arrays are overwritten by reference assignment.
        const matrixOut = new Array<Uint8Array>(this.height * yScale);
        const yMax = this.height * yScale;
        for (let i = 0; i < yMax; i++) {
            matrixOut[yMax - i - 1] = this.matrix[Math.floor(i / yScale)].getScaledRow(xScale);
        }
        return matrixOut;
    }

}
