"use strict";
/*
 * Copyright 2010 ZXing authors
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
var ResultPoint_1 = require("./../../ResultPoint");
var Exception_1 = require("./../../Exception");
var MathUtils_1 = require("./MathUtils");
/**
 * <p>
 * Detects a candidate barcode-like rectangular region within an image. It
 * starts around the center of the image, increases the size of the candidate
 * region until it finds a white rectangular region. By keeping track of the
 * last black points it encountered, it determines the corners of the barcode.
 * </p>
 *
 * @author David Olivier
 */
var WhiteRectangleDetector = (function () {
    // public constructor(private image: BitMatrix) /*throws NotFoundException*/ {
    //   this(image, INIT_SIZE, image.getWidth() / 2, image.getHeight() / 2)
    // }
    /**
     * @param image barcode image to find a rectangle in
     * @param initSize initial size of search area around center
     * @param x x position of search center
     * @param y y position of search center
     * @throws NotFoundException if image is too small to accommodate {@code initSize}
     */
    function WhiteRectangleDetector(image, initSize /*int*/, x /*int*/, y /*int*/) {
        this.image = image;
        this.height = image.getHeight();
        this.width = image.getWidth();
        if (undefined === initSize || null === initSize) {
            initSize = WhiteRectangleDetector.INIT_SIZE;
        }
        if (undefined === x || null === x) {
            x = image.getWidth() / 2;
        }
        if (undefined === y || null === y) {
            y = image.getHeight() / 2;
        }
        var halfsize = initSize / 2;
        this.leftInit = x - halfsize;
        this.rightInit = x + halfsize;
        this.upInit = y - halfsize;
        this.downInit = y + halfsize;
        if (this.upInit < 0 || this.leftInit < 0 || this.downInit >= this.height || this.rightInit >= this.width) {
            throw new Exception_1.default("NotFoundException");
        }
    }
    /**
     * <p>
     * Detects a candidate barcode-like rectangular region within an image. It
     * starts around the center of the image, increases the size of the candidate
     * region until it finds a white rectangular region.
     * </p>
     *
     * @return {@link ResultPoint}[] describing the corners of the rectangular
     *         region. The first and last points are opposed on the diagonal, as
     *         are the second and third. The first point will be the topmost
     *         point and the last, the bottommost. The second point will be
     *         leftmost and the third, the rightmost
     * @throws NotFoundException if no Data Matrix Code can be found
     */
    WhiteRectangleDetector.prototype.detect = function () {
        var left = this.leftInit;
        var right = this.rightInit;
        var up = this.upInit;
        var down = this.downInit;
        var sizeExceeded = false;
        var aBlackPointFoundOnBorder = true;
        var atLeastOneBlackPointFoundOnBorder = false;
        var atLeastOneBlackPointFoundOnRight = false;
        var atLeastOneBlackPointFoundOnBottom = false;
        var atLeastOneBlackPointFoundOnLeft = false;
        var atLeastOneBlackPointFoundOnTop = false;
        var width = this.width;
        var height = this.height;
        while (aBlackPointFoundOnBorder) {
            aBlackPointFoundOnBorder = false;
            // .....
            // .   |
            // .....
            var rightBorderNotWhite = true;
            while ((rightBorderNotWhite || !atLeastOneBlackPointFoundOnRight) && right < width) {
                rightBorderNotWhite = this.containsBlackPoint(up, down, right, false);
                if (rightBorderNotWhite) {
                    right++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnRight = true;
                }
                else if (!atLeastOneBlackPointFoundOnRight) {
                    right++;
                }
            }
            if (right >= width) {
                sizeExceeded = true;
                break;
            }
            // .....
            // .   .
            // .___.
            var bottomBorderNotWhite = true;
            while ((bottomBorderNotWhite || !atLeastOneBlackPointFoundOnBottom) && down < height) {
                bottomBorderNotWhite = this.containsBlackPoint(left, right, down, true);
                if (bottomBorderNotWhite) {
                    down++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnBottom = true;
                }
                else if (!atLeastOneBlackPointFoundOnBottom) {
                    down++;
                }
            }
            if (down >= height) {
                sizeExceeded = true;
                break;
            }
            // .....
            // |   .
            // .....
            var leftBorderNotWhite = true;
            while ((leftBorderNotWhite || !atLeastOneBlackPointFoundOnLeft) && left >= 0) {
                leftBorderNotWhite = this.containsBlackPoint(up, down, left, false);
                if (leftBorderNotWhite) {
                    left--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnLeft = true;
                }
                else if (!atLeastOneBlackPointFoundOnLeft) {
                    left--;
                }
            }
            if (left < 0) {
                sizeExceeded = true;
                break;
            }
            // .___.
            // .   .
            // .....
            var topBorderNotWhite = true;
            while ((topBorderNotWhite || !atLeastOneBlackPointFoundOnTop) && up >= 0) {
                topBorderNotWhite = this.containsBlackPoint(left, right, up, true);
                if (topBorderNotWhite) {
                    up--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnTop = true;
                }
                else if (!atLeastOneBlackPointFoundOnTop) {
                    up--;
                }
            }
            if (up < 0) {
                sizeExceeded = true;
                break;
            }
            if (aBlackPointFoundOnBorder) {
                atLeastOneBlackPointFoundOnBorder = true;
            }
        }
        if (!sizeExceeded && atLeastOneBlackPointFoundOnBorder) {
            var maxSize = right - left;
            var z = null;
            for (var i = 1; z === null && i < maxSize; i++) {
                z = this.getBlackPointOnSegment(left, down - i, left + i, down);
            }
            if (z == null) {
                throw new Exception_1.default("NotFoundException");
            }
            var t = null;
            //go down right
            for (var i = 1; t === null && i < maxSize; i++) {
                t = this.getBlackPointOnSegment(left, up + i, left + i, up);
            }
            if (t == null) {
                throw new Exception_1.default("NotFoundException");
            }
            var x = null;
            //go down left
            for (var i = 1; x === null && i < maxSize; i++) {
                x = this.getBlackPointOnSegment(right, up + i, right - i, up);
            }
            if (x == null) {
                throw new Exception_1.default("NotFoundException");
            }
            var y = null;
            //go up left
            for (var i = 1; y === null && i < maxSize; i++) {
                y = this.getBlackPointOnSegment(right, down - i, right - i, down);
            }
            if (y == null) {
                throw new Exception_1.default("NotFoundException");
            }
            return this.centerEdges(y, z, x, t);
        }
        else {
            throw new Exception_1.default("NotFoundException");
        }
    };
    WhiteRectangleDetector.prototype.getBlackPointOnSegment = function (aX /*float*/, aY /*float*/, bX /*float*/, bY /*float*/) {
        var dist = MathUtils_1.default.round(MathUtils_1.default.distance(aX, aY, bX, bY));
        var xStep = (bX - aX) / dist;
        var yStep = (bY - aY) / dist;
        var image = this.image;
        for (var i = 0; i < dist; i++) {
            var x = MathUtils_1.default.round(aX + i * xStep);
            var y = MathUtils_1.default.round(aY + i * yStep);
            if (image.get(x, y)) {
                return new ResultPoint_1.default(x, y);
            }
        }
        return null;
    };
    /**
     * recenters the points of a constant distance towards the center
     *
     * @param y bottom most point
     * @param z left most point
     * @param x right most point
     * @param t top most point
     * @return {@link ResultPoint}[] describing the corners of the rectangular
     *         region. The first and last points are opposed on the diagonal, as
     *         are the second and third. The first point will be the topmost
     *         point and the last, the bottommost. The second point will be
     *         leftmost and the third, the rightmost
     */
    WhiteRectangleDetector.prototype.centerEdges = function (y, z, x, t) {
        //
        //       t            t
        //  z                      x
        //        x    OR    z
        //   y                    y
        //
        var yi = y.getX();
        var yj = y.getY();
        var zi = z.getX();
        var zj = z.getY();
        var xi = x.getX();
        var xj = x.getY();
        var ti = t.getX();
        var tj = t.getY();
        var CORR = WhiteRectangleDetector.CORR;
        if (yi < this.width / 2.0) {
            return [
                new ResultPoint_1.default(ti - CORR, tj + CORR),
                new ResultPoint_1.default(zi + CORR, zj + CORR),
                new ResultPoint_1.default(xi - CORR, xj - CORR),
                new ResultPoint_1.default(yi + CORR, yj - CORR)
            ];
        }
        else {
            return [
                new ResultPoint_1.default(ti + CORR, tj + CORR),
                new ResultPoint_1.default(zi + CORR, zj - CORR),
                new ResultPoint_1.default(xi - CORR, xj + CORR),
                new ResultPoint_1.default(yi - CORR, yj - CORR)
            ];
        }
    };
    /**
     * Determines whether a segment contains a black point
     *
     * @param a          min value of the scanned coordinate
     * @param b          max value of the scanned coordinate
     * @param fixed      value of fixed coordinate
     * @param horizontal set to true if scan must be horizontal, false if vertical
     * @return true if a black point has been found, else false.
     */
    WhiteRectangleDetector.prototype.containsBlackPoint = function (a /*int*/, b /*int*/, fixed /*int*/, horizontal) {
        var image = this.image;
        if (horizontal) {
            for (var x = a; x <= b; x++) {
                if (image.get(x, fixed)) {
                    return true;
                }
            }
        }
        else {
            for (var y = a; y <= b; y++) {
                if (image.get(fixed, y)) {
                    return true;
                }
            }
        }
        return false;
    };
    return WhiteRectangleDetector;
}());
WhiteRectangleDetector.INIT_SIZE = 10;
WhiteRectangleDetector.CORR = 1;
exports.default = WhiteRectangleDetector;
//# sourceMappingURL=WhiteRectangleDetector.js.map