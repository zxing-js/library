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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var LuminanceSource_1 = require("./LuminanceSource");
/*namespace com.google.zxing {*/
/**
 * A wrapper implementation of {@link LuminanceSource} which inverts the luminances it returns -- black becomes
 * white and vice versa, and each value becomes (255-value).
 *
 * @author Sean Owen
 */
var InvertedLuminanceSource = (function (_super) {
    __extends(InvertedLuminanceSource, _super);
    function InvertedLuminanceSource(delegate) {
        var _this = _super.call(this, delegate.getWidth(), delegate.getHeight()) || this;
        _this.delegate = delegate;
        return _this;
    }
    /*@Override*/
    InvertedLuminanceSource.prototype.getRow = function (y /*int*/, row) {
        var sourceRow = this.delegate.getRow(y, row);
        var width = this.getWidth();
        for (var i = 0; i < width; i++) {
            sourceRow[i] = (255 - (sourceRow[i] & 0xFF));
        }
        return sourceRow;
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.getMatrix = function () {
        var matrix = this.delegate.getMatrix();
        var length = this.getWidth() * this.getHeight();
        var invertedMatrix = new Uint8Array[length];
        for (var i = 0; i < length; i++) {
            invertedMatrix[i] = (255 - (matrix[i] & 0xFF));
        }
        return invertedMatrix;
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.isCropSupported = function () {
        return this.delegate.isCropSupported();
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.crop = function (left /*int*/, top /*int*/, width /*int*/, height /*int*/) {
        return new InvertedLuminanceSource(this.delegate.crop(left, top, width, height));
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.isRotateSupported = function () {
        return this.delegate.isRotateSupported();
    };
    /**
     * @return original delegate {@link LuminanceSource} since invert undoes itself
     */
    /*@Override*/
    InvertedLuminanceSource.prototype.invert = function () {
        return this.delegate;
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.rotateCounterClockwise = function () {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise());
    };
    /*@Override*/
    InvertedLuminanceSource.prototype.rotateCounterClockwise45 = function () {
        return new InvertedLuminanceSource(this.delegate.rotateCounterClockwise45());
    };
    return InvertedLuminanceSource;
}(LuminanceSource_1.default));
exports.default = InvertedLuminanceSource;
//# sourceMappingURL=InvertedLuminanceSource.js.map