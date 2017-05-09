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
/*namespace com.google.zxing.common {*/
var Binarizer_1 = require("./../Binarizer");
var BitArray_1 = require("./BitArray");
var BitMatrix_1 = require("./BitMatrix");
var Exception_1 = require("./../Exception");
/**
 * This Binarizer implementation uses the old ZXing global histogram approach. It is suitable
 * for low-end mobile devices which don't have enough CPU or memory to use a local thresholding
 * algorithm. However, because it picks a global black point, it cannot handle difficult shadows
 * and gradients.
 *
 * Faster mobile devices and all desktop applications should probably use HybridBinarizer instead.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */
var GlobalHistogramBinarizer = (function (_super) {
    __extends(GlobalHistogramBinarizer, _super);
    function GlobalHistogramBinarizer(source) {
        var _this = _super.call(this, source) || this;
        _this.luminances = GlobalHistogramBinarizer.EMPTY;
        _this.buckets = new Int32Array(GlobalHistogramBinarizer.LUMINANCE_BUCKETS);
        return _this;
    }
    // Applies simple sharpening to the row data to improve performance of the 1D Readers.
    /*@Override*/
    GlobalHistogramBinarizer.prototype.getBlackRow = function (y /*int*/, row) {
        var source = this.getLuminanceSource();
        var width = source.getWidth();
        if (row === undefined || row === null || row.getSize() < width) {
            row = new BitArray_1.default(width);
        }
        else {
            row.clear();
        }
        this.initArrays(width);
        var localLuminances = source.getRow(y, this.luminances);
        var localBuckets = this.buckets;
        for (var x = 0; x < width; x++) {
            localBuckets[(localLuminances[x] & 0xff) >> GlobalHistogramBinarizer.LUMINANCE_SHIFT]++;
        }
        var blackPoint = GlobalHistogramBinarizer.estimateBlackPoint(localBuckets);
        if (width < 3) {
            // Special case for very small images
            for (var x = 0; x < width; x++) {
                if ((localLuminances[x] & 0xff) < blackPoint) {
                    row.set(x);
                }
            }
        }
        else {
            var left = localLuminances[0] & 0xff;
            var center = localLuminances[1] & 0xff;
            for (var x = 1; x < width - 1; x++) {
                var right = localLuminances[x + 1] & 0xff;
                // A simple -1 4 -1 box filter with a weight of 2.
                if (((center * 4) - left - right) / 2 < blackPoint) {
                    row.set(x);
                }
                left = center;
                center = right;
            }
        }
        return row;
    };
    // Does not sharpen the data, as this call is intended to only be used by 2D Readers.
    /*@Override*/
    GlobalHistogramBinarizer.prototype.getBlackMatrix = function () {
        var source = this.getLuminanceSource();
        var width = source.getWidth();
        var height = source.getHeight();
        var matrix = new BitMatrix_1.default(width, height);
        // Quickly calculates the histogram by sampling four rows from the image. This proved to be
        // more robust on the blackbox tests than sampling a diagonal as we used to do.
        this.initArrays(width);
        var localBuckets = this.buckets;
        for (var y = 1; y < 5; y++) {
            var row = height * y / 5;
            var localLuminances_1 = source.getRow(row, this.luminances);
            var right = (width * 4) / 5;
            for (var x = width / 5; x < right; x++) {
                var pixel = localLuminances_1[x] & 0xff;
                localBuckets[pixel >> GlobalHistogramBinarizer.LUMINANCE_SHIFT]++;
            }
        }
        var blackPoint = GlobalHistogramBinarizer.estimateBlackPoint(localBuckets);
        // We delay reading the entire image luminance until the black point estimation succeeds.
        // Although we end up reading four rows twice, it is consistent with our motto of
        // "fail quickly" which is necessary for continuous scanning.
        var localLuminances = source.getMatrix();
        for (var y = 0; y < height; y++) {
            var offset = y * width;
            for (var x = 0; x < width; x++) {
                var pixel = localLuminances[offset + x] & 0xff;
                if (pixel < blackPoint) {
                    matrix.set(x, y);
                }
            }
        }
        return matrix;
    };
    /*@Override*/
    GlobalHistogramBinarizer.prototype.createBinarizer = function (source) {
        return new GlobalHistogramBinarizer(source);
    };
    GlobalHistogramBinarizer.prototype.initArrays = function (luminanceSize /*int*/) {
        if (this.luminances.length < luminanceSize) {
            this.luminances = new Uint8Array(luminanceSize);
        }
        var buckets = this.buckets;
        for (var x = 0; x < GlobalHistogramBinarizer.LUMINANCE_BUCKETS; x++) {
            buckets[x] = 0;
        }
    };
    GlobalHistogramBinarizer.estimateBlackPoint = function (buckets) {
        // Find the tallest peak in the histogram.
        var numBuckets = buckets.length;
        var maxBucketCount = 0;
        var firstPeak = 0;
        var firstPeakSize = 0;
        for (var x = 0; x < numBuckets; x++) {
            if (buckets[x] > firstPeakSize) {
                firstPeak = x;
                firstPeakSize = buckets[x];
            }
            if (buckets[x] > maxBucketCount) {
                maxBucketCount = buckets[x];
            }
        }
        // Find the second-tallest peak which is somewhat far from the tallest peak.
        var secondPeak = 0;
        var secondPeakScore = 0;
        for (var x = 0; x < numBuckets; x++) {
            var distanceToBiggest = x - firstPeak;
            // Encourage more distant second peaks by multiplying by square of distance.
            var score = buckets[x] * distanceToBiggest * distanceToBiggest;
            if (score > secondPeakScore) {
                secondPeak = x;
                secondPeakScore = score;
            }
        }
        // Make sure firstPeak corresponds to the black peak.
        if (firstPeak > secondPeak) {
            var temp = firstPeak;
            firstPeak = secondPeak;
            secondPeak = temp;
        }
        // If there is too little contrast in the image to pick a meaningful black point, throw rather
        // than waste time trying to decode the image, and risk false positives.
        if (secondPeak - firstPeak <= numBuckets / 16) {
            throw new Exception_1.default("NotFoundException");
        }
        // Find a valley between them that is low and closer to the white peak.
        var bestValley = secondPeak - 1;
        var bestValleyScore = -1;
        for (var x = secondPeak - 1; x > firstPeak; x--) {
            var fromFirst = x - firstPeak;
            var score = fromFirst * fromFirst * (secondPeak - x) * (maxBucketCount - buckets[x]);
            if (score > bestValleyScore) {
                bestValley = x;
                bestValleyScore = score;
            }
        }
        return bestValley << GlobalHistogramBinarizer.LUMINANCE_SHIFT;
    };
    return GlobalHistogramBinarizer;
}(Binarizer_1.default));
GlobalHistogramBinarizer.LUMINANCE_BITS = 5;
GlobalHistogramBinarizer.LUMINANCE_SHIFT = 8 - GlobalHistogramBinarizer.LUMINANCE_BITS;
GlobalHistogramBinarizer.LUMINANCE_BUCKETS = 1 << GlobalHistogramBinarizer.LUMINANCE_BITS;
GlobalHistogramBinarizer.EMPTY = Uint8Array.from([0]);
exports.default = GlobalHistogramBinarizer;
//# sourceMappingURL=GlobalHistogramBinarizer.js.map