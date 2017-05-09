"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var Exception_1 = require("./Exception");
var InvertedLuminanceSource_1 = require("./InvertedLuminanceSource");
var StringBuilder_1 = require("./util/StringBuilder");
/*namespace com.google.zxing {*/
/**
 * The purpose of this class hierarchy is to abstract different bitmap implementations across
 * platforms into a standard interface for requesting greyscale luminance values. The interface
 * only provides immutable methods; therefore crop and rotation create copies. This is to ensure
 * that one Reader does not modify the original luminance source and leave it in an unknown state
 * for other Readers in the chain.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var LuminanceSource = (function () {
    function LuminanceSource(width /*int*/, height /*int*/) {
        this.width = width; /*int*/
        this.height = height; /*int*/
    }
    /**
     * @return The width of the bitmap.
     */
    LuminanceSource.prototype.getWidth = function () {
        return this.width;
    };
    /**
     * @return The height of the bitmap.
     */
    LuminanceSource.prototype.getHeight = function () {
        return this.height;
    };
    /**
     * @return Whether this subclass supports cropping.
     */
    LuminanceSource.prototype.isCropSupported = function () {
        return false;
    };
    /**
     * Returns a new object with cropped image data. Implementations may keep a reference to the
     * original data rather than a copy. Only callable if isCropSupported() is true.
     *
     * @param left The left coordinate, which must be in [0,getWidth())
     * @param top The top coordinate, which must be in [0,getHeight())
     * @param width The width of the rectangle to crop.
     * @param height The height of the rectangle to crop.
     * @return A cropped version of this object.
     */
    LuminanceSource.prototype.crop = function (left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        throw new Exception_1.default("UnsupportedOperationException", "This luminance source does not support cropping.");
    };
    /**
     * @return Whether this subclass supports counter-clockwise rotation.
     */
    LuminanceSource.prototype.isRotateSupported = function () {
        return false;
    };
    /**
     * @return a wrapper of this {@code LuminanceSource} which inverts the luminances it returns -- black becomes
     *  white and vice versa, and each value becomes (255-value).
     */
    LuminanceSource.prototype.invert = function () {
        return new InvertedLuminanceSource_1.default(this);
    };
    /**
     * Returns a new object with rotated image data by 90 degrees counterclockwise.
     * Only callable if {@link #isRotateSupported()} is true.
     *
     * @return A rotated version of this object.
     */
    LuminanceSource.prototype.rotateCounterClockwise = function () {
        throw new Exception_1.default("UnsupportedOperationException", "This luminance source does not support rotation by 90 degrees.");
    };
    /**
     * Returns a new object with rotated image data by 45 degrees counterclockwise.
     * Only callable if {@link #isRotateSupported()} is true.
     *
     * @return A rotated version of this object.
     */
    LuminanceSource.prototype.rotateCounterClockwise45 = function () {
        throw new Exception_1.default("UnsupportedOperationException", "This luminance source does not support rotation by 45 degrees.");
    };
    /*@Override*/
    LuminanceSource.prototype.toString = function () {
        var row = new Uint8Array(this.width);
        var result = new StringBuilder_1.default();
        for (var y = 0; y < this.height; y++) {
            var sourceRow = this.getRow(y, row);
            for (var x = 0; x < this.width; x++) {
                var luminance = sourceRow[x] & 0xFF;
                var c = void 0;
                if (luminance < 0x40) {
                    c = '#';
                }
                else if (luminance < 0x80) {
                    c = '+';
                }
                else if (luminance < 0xC0) {
                    c = '.';
                }
                else {
                    c = ' ';
                }
                result.append(c);
            }
            result.append('\n');
        }
        return result.toString();
    };
    return LuminanceSource;
}());
exports.default = LuminanceSource;
//# sourceMappingURL=LuminanceSource.js.map