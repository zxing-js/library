"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.common.detector {*/
/**
 * General math-related and numeric utility functions.
 */
var MathUtils = (function () {
    function MathUtils() {
    }
    MathUtils.prototype.MathUtils = function () {
    };
    /**
     * Ends up being a bit faster than {@link Math#round(float)}. This merely rounds its
     * argument to the nearest int, where x.5 rounds up to x+1. Semantics of this shortcut
     * differ slightly from {@link Math#round(float)} in that half rounds down for negative
     * values. -2.5 rounds to -3, not -2. For purposes here it makes no difference.
     *
     * @param d real value to round
     * @return nearest {@code int}
     */
    MathUtils.round = function (d /*float*/) {
        return Math.floor(d + (d < 0.0 ? -0.5 : 0.5));
    };
    /**
     * @param aX point A x coordinate
     * @param aY point A y coordinate
     * @param bX point B x coordinate
     * @param bY point B y coordinate
     * @return Euclidean distance between points A and B
     */
    MathUtils.distance = function (aX /*float|int*/, aY /*float|int*/, bX /*float|int*/, bY /*float|int*/) {
        var xDiff = aX - bX;
        var yDiff = aY - bY;
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    };
    /**
     * @param aX point A x coordinate
     * @param aY point A y coordinate
     * @param bX point B x coordinate
     * @param bY point B y coordinate
     * @return Euclidean distance between points A and B
     */
    // public static distance(aX: number/*int*/, aY: number/*int*/, bX: number/*int*/, bY: number/*int*/): float {
    //   const xDiff = aX - bX
    //   const yDiff = aY - bY
    //   return (float) Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    // }
    /**
     * @param array values to sum
     * @return sum of values in array
     */
    MathUtils.sum = function (array) {
        var count = 0;
        for (var i = 0, length = array.length; i != length; i++) {
            var a = array[i];
            count += a;
        }
        return count;
    };
    return MathUtils;
}());
exports.default = MathUtils;
//# sourceMappingURL=MathUtils.js.map