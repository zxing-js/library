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
var StringBuilder_1 = require("./../../util/StringBuilder");
/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
var QRCode = (function () {
    function QRCode() {
        this.maskPattern = -1;
    }
    QRCode.prototype.getMode = function () {
        return this.mode;
    };
    QRCode.prototype.getECLevel = function () {
        return this.ecLevel;
    };
    QRCode.prototype.getVersion = function () {
        return this.version;
    };
    QRCode.prototype.getMaskPattern = function () {
        return this.maskPattern;
    };
    QRCode.prototype.getMatrix = function () {
        return this.matrix;
    };
    /*@Override*/
    QRCode.prototype.toString = function () {
        var result = new StringBuilder_1.default(); //(200)
        result.append("<<\n");
        result.append(" mode: ");
        result.append(this.mode.toString());
        result.append("\n ecLevel: ");
        result.append(this.ecLevel.toString());
        result.append("\n version: ");
        result.append(this.version.toString());
        result.append("\n maskPattern: ");
        result.append(this.maskPattern.toString());
        if (this.matrix === null) {
            result.append("\n matrix: null\n");
        }
        else {
            result.append("\n matrix:\n");
            result.append(this.matrix.toString());
        }
        result.append(">>\n");
        return result.toString();
    };
    QRCode.prototype.setMode = function (value) {
        this.mode = value;
    };
    QRCode.prototype.setECLevel = function (value) {
        this.ecLevel = value;
    };
    QRCode.prototype.setVersion = function (version) {
        this.version = version;
    };
    QRCode.prototype.setMaskPattern = function (value /*int*/) {
        this.maskPattern = value;
    };
    QRCode.prototype.setMatrix = function (value) {
        this.matrix = value;
    };
    // Check if "mask_pattern" is valid.
    QRCode.isValidMaskPattern = function (maskPattern /*int*/) {
        return maskPattern >= 0 && maskPattern < QRCode.NUM_MASK_PATTERNS;
    };
    return QRCode;
}());
QRCode.NUM_MASK_PATTERNS = 8;
exports.default = QRCode;
//# sourceMappingURL=QRCode.js.map