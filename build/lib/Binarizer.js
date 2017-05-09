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
/**
 * This class hierarchy provides a set of methods to convert luminance data to 1 bit data.
 * It allows the algorithm to vary polymorphically, for example allowing a very expensive
 * thresholding technique for servers and a fast one for mobile. It also permits the implementation
 * to vary, e.g. a JNI version for Android and a Java fallback version for other platforms.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var Binarizer = (function () {
    function Binarizer(source) {
        this.source = source;
    }
    Binarizer.prototype.getLuminanceSource = function () {
        return this.source;
    };
    Binarizer.prototype.getWidth = function () {
        return this.source.getWidth();
    };
    Binarizer.prototype.getHeight = function () {
        return this.source.getHeight();
    };
    return Binarizer;
}());
exports.default = Binarizer;
//# sourceMappingURL=Binarizer.js.map