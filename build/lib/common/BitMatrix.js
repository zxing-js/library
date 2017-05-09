"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.common {*/
/*import java.util.Arrays;*/
var Exception_1 = require("./../Exception");
var BitArray_1 = require("./BitArray");
var System_1 = require("./../util/System");
var Arrays_1 = require("./../util/Arrays");
var StringBuilder_1 = require("./../util/StringBuilder");
/**
 * <p>Represents a 2D matrix of bits. In function arguments below, and throughout the common
 * module, x is the column position, and y is the row position. The ordering is always x, y.
 * The origin is at the top-left.</p>
 *
 * <p>Internally the bits are represented in a 1-D array of 32-bit ints. However, each row begins
 * with a new int. This is done intentionally so that we can copy out a row into a BitArray very
 * efficiently.</p>
 *
 * <p>The ordering of bits is row-major. Within each int, the least significant bits are used first,
 * meaning they represent lower x values. This is compatible with BitArray's implementation.</p>
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
var BitMatrix /*implements Cloneable*/ = (function () {
    /**
     * Creates an empty square {@link BitMatrix}.
     *
     * @param dimension height and width
     */
    // public constructor(dimension: number/*int*/) {
    //   this(dimension, dimension)
    // }
    /**
     * Creates an empty {@link BitMatrix}.
     *
     * @param width bit matrix width
     * @param height bit matrix height
     */
    // public constructor(width: number/*int*/, height: number/*int*/) {
    //   if (width < 1 || height < 1) {
    //     throw new Exception("IllegalArgumentException", "Both dimensions must be greater than 0")
    //   }
    //   this.width = width
    //   this.height = height
    //   this.rowSize = (width + 31) / 32
    //   bits = new int[rowSize * height];
    // }
    function BitMatrix(width /*int*/, height /*int*/, rowSize /*int*/, bits) {
        this.width = width; /*int*/
        this.height = height; /*int*/
        this.rowSize = rowSize; /*int*/
        this.bits = bits;
        if (undefined === height || null === height) {
            height = width;
        }
        if (width < 1 || height < 1) {
            throw new Exception_1.default("IllegalArgumentException", "Both dimensions must be greater than 0");
        }
        if (undefined === rowSize || null === rowSize) {
            this.rowSize = (width + 31) / 32;
        }
        if (undefined === bits || null === bits) {
            this.bits = new Int32Array(rowSize * height);
        }
    }
    /**
     * Interprets a 2D array of booleans as a {@link BitMatrix}, where "true" means an "on" bit.
     *
     * @param image bits of the image, as a row-major 2D array. Elements are arrays representing rows
     * @return {@link BitMatrix} representation of image
     */
    BitMatrix.parseFromBooleanArray = function (image) {
        var height = image.length;
        var width = image[0].length;
        var bits = new BitMatrix(width, height);
        for (var i = 0; i < height; i++) {
            var imageI = image[i];
            for (var j = 0; j < width; j++) {
                if (imageI[j]) {
                    bits.set(j, i);
                }
            }
        }
        return bits;
    };
    BitMatrix.parseFromString = function (stringRepresentation, setString, unsetString) {
        if (stringRepresentation === null) {
            throw new Exception_1.default("IllegalArgumentException", "stringRepresentation cannot be null");
        }
        var bits = new Array(stringRepresentation.length);
        var bitsPos = 0;
        var rowStartPos = 0;
        var rowLength = -1;
        var nRows = 0;
        var pos = 0;
        while (pos < stringRepresentation.length) {
            if (stringRepresentation.charAt(pos) == '\n' ||
                stringRepresentation.charAt(pos) == '\r') {
                if (bitsPos > rowStartPos) {
                    if (rowLength === -1) {
                        rowLength = bitsPos - rowStartPos;
                    }
                    else if (bitsPos - rowStartPos != rowLength) {
                        throw new Exception_1.default("IllegalArgumentException", "row lengths do not match");
                    }
                    rowStartPos = bitsPos;
                    nRows++;
                }
                pos++;
            }
            else if (stringRepresentation.substring(pos, pos + setString.length) == setString) {
                pos += setString.length;
                bits[bitsPos] = true;
                bitsPos++;
            }
            else if (stringRepresentation.substring(pos, pos + unsetString.length) == unsetString) {
                pos += unsetString.length;
                bits[bitsPos] = false;
                bitsPos++;
            }
            else {
                throw new Exception_1.default("IllegalArgumentException", "illegal character encountered: " + stringRepresentation.substring(pos));
            }
        }
        // no EOL at end?
        if (bitsPos > rowStartPos) {
            if (rowLength == -1) {
                rowLength = bitsPos - rowStartPos;
            }
            else if (bitsPos - rowStartPos != rowLength) {
                throw new Exception_1.default("IllegalArgumentException", "row lengths do not match");
            }
            nRows++;
        }
        var matrix = new BitMatrix(rowLength, nRows);
        for (var i = 0; i < bitsPos; i++) {
            if (bits[i]) {
                matrix.set(i % rowLength, i / rowLength);
            }
        }
        return matrix;
    };
    /**
     * <p>Gets the requested bit, where true means black.</p>
     *
     * @param x The horizontal component (i.e. which column)
     * @param y The vertical component (i.e. which row)
     * @return value of given bit in matrix
     */
    BitMatrix.prototype.get = function (x /*int*/, y /*int*/) {
        var offset = y * this.rowSize + (x / 32);
        return ((this.bits[offset] >>> (x & 0x1f)) & 1) != 0;
    };
    /**
     * <p>Sets the given bit to true.</p>
     *
     * @param x The horizontal component (i.e. which column)
     * @param y The vertical component (i.e. which row)
     */
    BitMatrix.prototype.set = function (x /*int*/, y /*int*/) {
        var offset = y * this.rowSize + (x / 32);
        this.bits[offset] |= 1 << (x & 0x1f);
    };
    BitMatrix.prototype.unset = function (x /*int*/, y /*int*/) {
        var offset = y * this.rowSize + (x / 32);
        this.bits[offset] &= ~(1 << (x & 0x1f));
    };
    /**
     * <p>Flips the given bit.</p>
     *
     * @param x The horizontal component (i.e. which column)
     * @param y The vertical component (i.e. which row)
     */
    BitMatrix.prototype.flip = function (x /*int*/, y /*int*/) {
        var offset = y * this.rowSize + (x / 32);
        this.bits[offset] ^= 1 << (x & 0x1f);
    };
    /**
     * Exclusive-or (XOR): Flip the bit in this {@code BitMatrix} if the corresponding
     * mask bit is set.
     *
     * @param mask XOR mask
     */
    BitMatrix.prototype.xor = function (mask) {
        if (this.width != mask.getWidth() || this.height != mask.getHeight()
            || this.rowSize != mask.getRowSize()) {
            throw new Exception_1.default("IllegalArgumentException", "input matrix dimensions do not match");
        }
        var rowArray = new BitArray_1.default(this.width / 32 + 1);
        var rowSize = this.rowSize;
        var bits = this.bits;
        for (var y = 0, height = this.height; y < height; y++) {
            var offset = y * rowSize;
            var row = mask.getRow(y, rowArray).getBitArray();
            for (var x = 0; x < rowSize; x++) {
                bits[offset + x] ^= row[x];
            }
        }
    };
    /**
     * Clears all bits (sets to false).
     */
    BitMatrix.prototype.clear = function () {
        var bits = this.bits;
        var max = bits.length;
        for (var i = 0; i < max; i++) {
            bits[i] = 0;
        }
    };
    /**
     * <p>Sets a square region of the bit matrix to true.</p>
     *
     * @param left The horizontal position to begin at (inclusive)
     * @param top The vertical position to begin at (inclusive)
     * @param width The width of the region
     * @param height The height of the region
     */
    BitMatrix.prototype.setRegion = function (left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        if (top < 0 || left < 0) {
            throw new Exception_1.default("IllegalArgumentException", "Left and top must be nonnegative");
        }
        if (height < 1 || width < 1) {
            throw new Exception_1.default("IllegalArgumentException", "Height and width must be at least 1");
        }
        var right = left + width;
        var bottom = top + height;
        if (bottom > this.height || right > this.width) {
            throw new Exception_1.default("IllegalArgumentException", "The region must fit inside the matrix");
        }
        var rowSize = this.rowSize;
        var bits = this.bits;
        for (var y = top; y < bottom; y++) {
            var offset = y * rowSize;
            for (var x = left; x < right; x++) {
                bits[offset + (x / 32)] |= 1 << (x & 0x1f);
            }
        }
    };
    /**
     * A fast method to retrieve one row of data from the matrix as a BitArray.
     *
     * @param y The row to retrieve
     * @param row An optional caller-allocated BitArray, will be allocated if null or too small
     * @return The resulting BitArray - this reference should always be used even when passing
     *         your own row
     */
    BitMatrix.prototype.getRow = function (y /*int*/, row) {
        if (row == null || row.getSize() < this.width) {
            row = new BitArray_1.default(this.width);
        }
        else {
            row.clear();
        }
        var rowSize = this.rowSize;
        var bits = this.bits;
        var offset = y * rowSize;
        for (var x = 0; x < rowSize; x++) {
            row.setBulk(x * 32, bits[offset + x]);
        }
        return row;
    };
    /**
     * @param y row to set
     * @param row {@link BitArray} to copy from
     */
    BitMatrix.prototype.setRow = function (y /*int*/, row) {
        System_1.default.arraycopy(row.getBitArray(), 0, this.bits, y * this.rowSize, this.rowSize);
    };
    /**
     * Modifies this {@code BitMatrix} to represent the same but rotated 180 degrees
     */
    BitMatrix.prototype.rotate180 = function () {
        var width = this.getWidth();
        var height = this.getHeight();
        var topRow = new BitArray_1.default(width);
        var bottomRow = new BitArray_1.default(width);
        for (var i = 0; i < (height + 1) / 2; i++) {
            topRow = this.getRow(i, topRow);
            bottomRow = this.getRow(height - 1 - i, bottomRow);
            topRow.reverse();
            bottomRow.reverse();
            this.setRow(i, bottomRow);
            this.setRow(height - 1 - i, topRow);
        }
    };
    /**
     * This is useful in detecting the enclosing rectangle of a 'pure' barcode.
     *
     * @return {@code left,top,width,height} enclosing rectangle of all 1 bits, or null if it is all white
     */
    BitMatrix.prototype.getEnclosingRectangle = function () {
        var width = this.width;
        var height = this.height;
        var rowSize = this.rowSize;
        var bits = this.bits;
        var left = width;
        var top = height;
        var right = -1;
        var bottom = -1;
        for (var y = 0; y < height; y++) {
            for (var x32 = 0; x32 < rowSize; x32++) {
                var theBits = bits[y * rowSize + x32];
                if (theBits != 0) {
                    if (y < top) {
                        top = y;
                    }
                    if (y > bottom) {
                        bottom = y;
                    }
                    if (x32 * 32 < left) {
                        var bit = 0;
                        while ((theBits << (31 - bit)) == 0) {
                            bit++;
                        }
                        if ((x32 * 32 + bit) < left) {
                            left = x32 * 32 + bit;
                        }
                    }
                    if (x32 * 32 + 31 > right) {
                        var bit = 31;
                        while ((theBits >>> bit) == 0) {
                            bit--;
                        }
                        if ((x32 * 32 + bit) > right) {
                            right = x32 * 32 + bit;
                        }
                    }
                }
            }
        }
        if (right < left || bottom < top) {
            return null;
        }
        return Int32Array.from([left, top, right - left + 1, bottom - top + 1]);
    };
    /**
     * This is useful in detecting a corner of a 'pure' barcode.
     *
     * @return {@code x,y} coordinate of top-left-most 1 bit, or null if it is all white
     */
    BitMatrix.prototype.getTopLeftOnBit = function () {
        var rowSize = this.rowSize;
        var bits = this.bits;
        var bitsOffset = 0;
        while (bitsOffset < bits.length && bits[bitsOffset] == 0) {
            bitsOffset++;
        }
        if (bitsOffset === bits.length) {
            return null;
        }
        var y = bitsOffset / rowSize;
        var x = (bitsOffset % rowSize) * 32;
        var theBits = bits[bitsOffset];
        var bit = 0;
        while ((theBits << (31 - bit)) == 0) {
            bit++;
        }
        x += bit;
        return Int32Array.from([x, y]);
    };
    BitMatrix.prototype.getBottomRightOnBit = function () {
        var rowSize = this.rowSize;
        var bits = this.bits;
        var bitsOffset = bits.length - 1;
        while (bitsOffset >= 0 && bits[bitsOffset] == 0) {
            bitsOffset--;
        }
        if (bitsOffset < 0) {
            return null;
        }
        var y = bitsOffset / rowSize;
        var x = (bitsOffset % rowSize) * 32;
        var theBits = bits[bitsOffset];
        var bit = 31;
        while ((theBits >>> bit) == 0) {
            bit--;
        }
        x += bit;
        return Int32Array.from([x, y]);
    };
    /**
     * @return The width of the matrix
     */
    BitMatrix.prototype.getWidth = function () {
        return this.width;
    };
    /**
     * @return The height of the matrix
     */
    BitMatrix.prototype.getHeight = function () {
        return this.height;
    };
    /**
     * @return The row size of the matrix
     */
    BitMatrix.prototype.getRowSize = function () {
        return this.rowSize;
    };
    /*@Override*/
    BitMatrix.prototype.equals = function (o) {
        if (!(o instanceof BitMatrix)) {
            return false;
        }
        var other = o;
        return this.width === other.width && this.height === other.height && this.rowSize === other.rowSize &&
            Arrays_1.default.equals(this.bits, other.bits);
    };
    /*@Override*/
    BitMatrix.prototype.hashCode = function () {
        var hash = this.width;
        hash = 31 * hash + this.width;
        hash = 31 * hash + this.height;
        hash = 31 * hash + this.rowSize;
        hash = 31 * hash + Arrays_1.default.hashCode(this.bits);
        return hash;
    };
    /**
     * @return string representation using "X" for set and " " for unset bits
     */
    /*@Override*/
    // public toString(): string {
    //   return toString(": "X, "  ")
    // }
    /**
     * @param setString representation of a set bit
     * @param unsetString representation of an unset bit
     * @return string representation of entire matrix utilizing given strings
     */
    // public toString(setString: string = "X ", unsetString: string = "  "): string {
    //   return this.buildToString(setString, unsetString, "\n")
    // }
    /**
     * @param setString representation of a set bit
     * @param unsetString representation of an unset bit
     * @param lineSeparator newline character in string representation
     * @return string representation of entire matrix utilizing given strings and line separator
     * @deprecated call {@link #toString(String,String)} only, which uses \n line separator always
     */
    // @Deprecated
    BitMatrix.prototype.toString = function (setString, unsetString, lineSeparator) {
        if (setString === void 0) { setString = "X "; }
        if (unsetString === void 0) { unsetString = "  "; }
        if (lineSeparator === void 0) { lineSeparator = "\n"; }
        return this.buildToString(setString, unsetString, lineSeparator);
    };
    BitMatrix.prototype.buildToString = function (setString, unsetString, lineSeparator) {
        var result = new StringBuilder_1.default();
        for (var y = 0, height = this.height; y < height; y++) {
            for (var x = 0, width = this.width; x < width; x++) {
                result.append(this.get(x, y) ? setString : unsetString);
            }
            result.append(lineSeparator);
        }
        return result.toString();
    };
    /*@Override*/
    BitMatrix.prototype.clone = function () {
        return new BitMatrix(this.width, this.height, this.rowSize, this.bits.slice());
    };
    return BitMatrix;
}());
exports.default = BitMatrix;
//# sourceMappingURL=BitMatrix.js.map