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
/*namespace com.google.zxing.common {*/
var GridSampler_1 = require("./GridSampler");
var BitMatrix_1 = require("./BitMatrix");
var PerspectiveTransform_1 = require("./PerspectiveTransform");
var Exception_1 = require("./../Exception");
/**
 * @author Sean Owen
 */
var DefaultGridSampler = (function (_super) {
    __extends(DefaultGridSampler, _super);
    function DefaultGridSampler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /*@Override*/
    DefaultGridSampler.prototype.sampleGrid = function (image, dimensionX /*int*/, dimensionY /*int*/, p1ToX /*float*/, p1ToY /*float*/, p2ToX /*float*/, p2ToY /*float*/, p3ToX /*float*/, p3ToY /*float*/, p4ToX /*float*/, p4ToY /*float*/, p1FromX /*float*/, p1FromY /*float*/, p2FromX /*float*/, p2FromY /*float*/, p3FromX /*float*/, p3FromY /*float*/, p4FromX /*float*/, p4FromY /*float*/) {
        var transform = PerspectiveTransform_1.default.quadrilateralToQuadrilateral(p1ToX, p1ToY, p2ToX, p2ToY, p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY);
        return this.sampleGridWithTransform(image, dimensionX, dimensionY, transform);
    };
    /*@Override*/
    DefaultGridSampler.prototype.sampleGridWithTransform = function (image, dimensionX /*int*/, dimensionY /*int*/, transform) {
        if (dimensionX <= 0 || dimensionY <= 0) {
            throw new Exception_1.default("NotFoundException");
        }
        var bits = new BitMatrix_1.default(dimensionX, dimensionY);
        var points = new Float32Array(2 * dimensionX);
        for (var y = 0; y < dimensionY; y++) {
            var max = points.length;
            var iValue = y + 0.5;
            for (var x = 0; x < max; x += 2) {
                points[x] = (x / 2) + 0.5;
                points[x + 1] = iValue;
            }
            transform.transformPoints(points);
            // Quick check to see if points transformed to something inside the image
            // sufficient to check the endpoints
            GridSampler_1.default.checkAndNudgePoints(image, points);
            try {
                for (var x = 0; x < max; x += 2) {
                    if (image.get(points[x], points[x + 1])) {
                        // Black(-ish) pixel
                        bits.set(x / 2, y);
                    }
                }
            }
            catch (aioobe /*: ArrayIndexOutOfBoundsException*/) {
                // This feels wrong, but, sometimes if the finder patterns are misidentified, the resulting
                // transform gets "twisted" such that it maps a straight line of points to a set of points
                // whose endpoints are in bounds, but others are not. There is probably some mathematical
                // way to detect this about the transformation that I don't know yet.
                // This results in an ugly runtime exception despite our clever checks above -- can't have
                // that. We could check each point's coordinates but that feels duplicative. We settle for
                // catching and wrapping ArrayIndexOutOfBoundsException.
                throw new Exception_1.default("NotFoundException");
            }
        }
        return bits;
    };
    return DefaultGridSampler;
}(GridSampler_1.default));
exports.default = DefaultGridSampler;
//# sourceMappingURL=DefaultGridSampler.js.map