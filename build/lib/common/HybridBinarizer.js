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
var GlobalHistogramBinarizer_1 = require("./GlobalHistogramBinarizer");
var BitMatrix_1 = require("./BitMatrix");
/**
 * This class implements a local thresholding algorithm, which while slower than the
 * GlobalHistogramBinarizer, is fairly efficient for what it does. It is designed for
 * high frequency images of barcodes with black data on white backgrounds. For this application,
 * it does a much better job than a global blackpoint with severe shadows and gradients.
 * However it tends to produce artifacts on lower frequency images and is therefore not
 * a good general purpose binarizer for uses outside ZXing.
 *
 * This class extends GlobalHistogramBinarizer, using the older histogram approach for 1D readers,
 * and the newer local approach for 2D readers. 1D decoding using a per-row histogram is already
 * inherently local, and only fails for horizontal gradients. We can revisit that problem later,
 * but for now it was not a win to use local blocks for 1D.
 *
 * This Binarizer is the default for the unit tests and the recommended class for library users.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
var HybridBinarizer = (function (_super) {
    __extends(HybridBinarizer, _super);
    function HybridBinarizer(source) {
        var _this = _super.call(this, source) || this;
        _this.matrix = null;
        return _this;
    }
    /**
     * Calculates the final BitMatrix once for all requests. This could be called once from the
     * constructor instead, but there are some advantages to doing it lazily, such as making
     * profiling easier, and not doing heavy lifting when callers don't expect it.
     */
    /*@Override*/
    HybridBinarizer.prototype.getBlackMatrix = function () {
        if (this.matrix !== null) {
            return this.matrix;
        }
        var source = this.getLuminanceSource();
        var width = source.getWidth();
        var height = source.getHeight();
        if (width >= HybridBinarizer.MINIMUM_DIMENSION && height >= HybridBinarizer.MINIMUM_DIMENSION) {
            var luminances = source.getMatrix();
            var subWidth = width >> HybridBinarizer.BLOCK_SIZE_POWER;
            if ((width & HybridBinarizer.BLOCK_SIZE_MASK) != 0) {
                subWidth++;
            }
            var subHeight = height >> HybridBinarizer.BLOCK_SIZE_POWER;
            if ((height & HybridBinarizer.BLOCK_SIZE_MASK) != 0) {
                subHeight++;
            }
            var blackPoints = HybridBinarizer.calculateBlackPoints(luminances, subWidth, subHeight, width, height);
            var newMatrix = new BitMatrix_1.default(width, height);
            HybridBinarizer.calculateThresholdForBlock(luminances, subWidth, subHeight, width, height, blackPoints, newMatrix);
            this.matrix = newMatrix;
        }
        else {
            // If the image is too small, fall back to the global histogram approach.
            this.matrix = _super.prototype.getBlackMatrix.call(this);
        }
        return this.matrix;
    };
    /*@Override*/
    HybridBinarizer.prototype.createBinarizer = function (source) {
        return new HybridBinarizer(source);
    };
    /**
     * For each block in the image, calculate the average black point using a 5x5 grid
     * of the blocks around it. Also handles the corner cases (fractional blocks are computed based
     * on the last pixels in the row/column which are also used in the previous block).
     */
    HybridBinarizer.calculateThresholdForBlock = function (luminances, subWidth /*int*/, subHeight /*int*/, width /*int*/, height /*int*/, blackPoints, matrix) {
        var maxYOffset = height - HybridBinarizer.BLOCK_SIZE;
        var maxXOffset = width - HybridBinarizer.BLOCK_SIZE;
        for (var y = 0; y < subHeight; y++) {
            var yoffset = y << HybridBinarizer.BLOCK_SIZE_POWER;
            if (yoffset > maxYOffset) {
                yoffset = maxYOffset;
            }
            var top = HybridBinarizer.cap(y, 2, subHeight - 3);
            for (var x = 0; x < subWidth; x++) {
                var xoffset = x << HybridBinarizer.BLOCK_SIZE_POWER;
                if (xoffset > maxXOffset) {
                    xoffset = maxXOffset;
                }
                var left = HybridBinarizer.cap(x, 2, subWidth - 3);
                var sum = 0;
                for (var z = -2; z <= 2; z++) {
                    var blackRow = blackPoints[top + z];
                    sum += blackRow[left - 2] + blackRow[left - 1] + blackRow[left] + blackRow[left + 1] + blackRow[left + 2];
                }
                var average = sum / 25;
                HybridBinarizer.thresholdBlock(luminances, xoffset, yoffset, average, width, matrix);
            }
        }
    };
    HybridBinarizer.cap = function (value /*int*/, min /*int*/, max /*int*/) {
        return value < min ? min : value > max ? max : value;
    };
    /**
     * Applies a single threshold to a block of pixels.
     */
    HybridBinarizer.thresholdBlock = function (luminances, xoffset /*int*/, yoffset /*int*/, threshold /*int*/, stride /*int*/, matrix) {
        for (var y = 0, offset = yoffset * stride + xoffset; y < HybridBinarizer.BLOCK_SIZE; y++, offset += stride) {
            for (var x = 0; x < HybridBinarizer.BLOCK_SIZE; x++) {
                // Comparison needs to be <= so that black == 0 pixels are black even if the threshold is 0.
                if ((luminances[offset + x] & 0xFF) <= threshold) {
                    matrix.set(xoffset + x, yoffset + y);
                }
            }
        }
    };
    /**
     * Calculates a single black point for each block of pixels and saves it away.
     * See the following thread for a discussion of this algorithm:
     *  http://groups.google.com/group/zxing/browse_thread/thread/d06efa2c35a7ddc0
     */
    HybridBinarizer.calculateBlackPoints = function (luminances, subWidth /*int*/, subHeight /*int*/, width /*int*/, height /*int*/) {
        var maxYOffset = height - HybridBinarizer.BLOCK_SIZE;
        var maxXOffset = width - HybridBinarizer.BLOCK_SIZE;
        var blackPoints = new Array(subHeight); //subWidth
        for (var y = 0; y < subHeight; y++) {
            blackPoints[y] = new Int32Array(subWidth);
            var yoffset = y << HybridBinarizer.BLOCK_SIZE_POWER;
            if (yoffset > maxYOffset) {
                yoffset = maxYOffset;
            }
            for (var x = 0; x < subWidth; x++) {
                var xoffset = x << HybridBinarizer.BLOCK_SIZE_POWER;
                if (xoffset > maxXOffset) {
                    xoffset = maxXOffset;
                }
                var sum = 0;
                var min = 0xFF;
                var max = 0;
                for (var yy = 0, offset = yoffset * width + xoffset; yy < HybridBinarizer.BLOCK_SIZE; yy++, offset += width) {
                    for (var xx = 0; xx < HybridBinarizer.BLOCK_SIZE; xx++) {
                        var pixel = luminances[offset + xx] & 0xFF;
                        sum += pixel;
                        // still looking for good contrast
                        if (pixel < min) {
                            min = pixel;
                        }
                        if (pixel > max) {
                            max = pixel;
                        }
                    }
                    // short-circuit min/max tests once dynamic range is met
                    if (max - min > HybridBinarizer.MIN_DYNAMIC_RANGE) {
                        // finish the rest of the rows quickly
                        for (yy++, offset += width; yy < HybridBinarizer.BLOCK_SIZE; yy++, offset += width) {
                            for (var xx = 0; xx < HybridBinarizer.BLOCK_SIZE; xx++) {
                                sum += luminances[offset + xx] & 0xFF;
                            }
                        }
                    }
                }
                // The default estimate is the average of the values in the block.
                var average = sum >> (HybridBinarizer.BLOCK_SIZE_POWER * 2);
                if (max - min <= HybridBinarizer.MIN_DYNAMIC_RANGE) {
                    // If variation within the block is low, assume this is a block with only light or only
                    // dark pixels. In that case we do not want to use the average, as it would divide this
                    // low contrast area into black and white pixels, essentially creating data out of noise.
                    //
                    // The default assumption is that the block is light/background. Since no estimate for
                    // the level of dark pixels exists locally, use half the min for the block.
                    average = min / 2;
                    if (y > 0 && x > 0) {
                        // Correct the "white background" assumption for blocks that have neighbors by comparing
                        // the pixels in this block to the previously calculated black points. This is based on
                        // the fact that dark barcode symbology is always surrounded by some amount of light
                        // background for which reasonable black point estimates were made. The bp estimated at
                        // the boundaries is used for the interior.
                        // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                        var averageNeighborBlackPoint = (blackPoints[y - 1][x] + (2 * blackPoints[y][x - 1]) + blackPoints[y - 1][x - 1]) / 4;
                        if (min < averageNeighborBlackPoint) {
                            average = averageNeighborBlackPoint;
                        }
                    }
                }
                blackPoints[y][x] = average;
            }
        }
        return blackPoints;
    };
    return HybridBinarizer;
}(GlobalHistogramBinarizer_1.default));
// This class uses 5x5 blocks to compute local luminance, where each block is 8x8 pixels.
// So this is the smallest dimension in each axis we can accept.
HybridBinarizer.BLOCK_SIZE_POWER = 3;
HybridBinarizer.BLOCK_SIZE = 1 << HybridBinarizer.BLOCK_SIZE_POWER; // ...0100...00
HybridBinarizer.BLOCK_SIZE_MASK = HybridBinarizer.BLOCK_SIZE - 1; // ...0011...11
HybridBinarizer.MINIMUM_DIMENSION = HybridBinarizer.BLOCK_SIZE * 5;
HybridBinarizer.MIN_DYNAMIC_RANGE = 24;
exports.default = HybridBinarizer;
//# sourceMappingURL=HybridBinarizer.js.map