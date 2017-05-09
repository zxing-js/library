"use strict";
/*
 * Copyright 2008 ZXing authors
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
/*namespace com.google.zxing.qrcode.encoder {*/
/*import java.util.Arrays;*/
var Arrays_1 = require("./../../util/Arrays");
var StringBuilder_1 = require("./../../util/StringBuilder");
/**
 * JAVAPORT: The original code was a 2D array of ints, but since it only ever gets assigned
 * -1, 0, and 1, I'm going to use less memory and go with bytes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var ByteMatrix = (function () {
    function ByteMatrix(width /*int*/, height /*int*/) {
        this.width = width; /*int*/
        this.height = height; /*int*/
        var bytes = new Array(height); //[height][width]
        for (var i = 0; i != height; i++) {
            bytes[i] = new Uint8Array(width);
        }
        this.bytes = bytes;
    }
    ByteMatrix.prototype.getHeight = function () {
        return this.height;
    };
    ByteMatrix.prototype.getWidth = function () {
        return this.width;
    };
    ByteMatrix.prototype.get = function (x /*int*/, y /*int*/) {
        return this.bytes[y][x];
    };
    /**
     * @return an internal representation as bytes, in row-major order. array[y][x] represents point (x,y)
     */
    ByteMatrix.prototype.getArray = function () {
        return this.bytes;
    };
    // TYPESCRIPTPORT: preffer to let two methods instead of override to avoid type comparison inside
    ByteMatrix.prototype.setNumber = function (x /*int*/, y /*int*/, value /*byte|int*/) {
        this.bytes[y][x] = value;
    };
    // public set(x: number/*int*/, y: number/*int*/, value: number/*int*/): void {
    //   bytes[y][x] = (byte) value
    // }
    ByteMatrix.prototype.setBoolean = function (x /*int*/, y /*int*/, value) {
        this.bytes[y][x] = (value ? 1 : 0);
    };
    ByteMatrix.prototype.clear = function (value /*byte*/) {
        for (var _i = 0, _a = this.bytes; _i < _a.length; _i++) {
            var aByte = _a[_i];
            Arrays_1.default.fillUint8Array(aByte, value);
        }
    };
    /*@Override*/
    ByteMatrix.prototype.toString = function () {
        var result = new StringBuilder_1.default(); //(2 * width * height + 2)
        for (var y = 0, height = this.height, width = this.width; y < height; ++y) {
            var bytesY = this.bytes[y];
            for (var x = 0; x < width; ++x) {
                switch (bytesY[x]) {
                    case 0:
                        result.append(" 0");
                        break;
                    case 1:
                        result.append(" 1");
                        break;
                    default:
                        result.append("  ");
                        break;
                }
            }
            result.append('\n');
        }
        return result.toString();
    };
    return ByteMatrix;
}());
exports.default = ByteMatrix;
//# sourceMappingURL=ByteMatrix.js.map