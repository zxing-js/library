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
Object.defineProperty(exports, "__esModule", { value: true });
var ResultPoint_1 = require("./../../ResultPoint");
var DetectorResult_1 = require("./../../common/DetectorResult");
var GridSampler_1 = require("./../../common/GridSampler");
var PerspectiveTransform_1 = require("./../../common/PerspectiveTransform");
var MathUtils_1 = require("./../../common/detector/MathUtils");
var Version_1 = require("./../decoder/Version");
var FinderPatternFinder_1 = require("./FinderPatternFinder");
var Exception_1 = require("./../../Exception");
var AlignmentPatternFinder_1 = require("./AlignmentPatternFinder");
/*import java.util.Map;*/
/**
 * <p>Encapsulates logic that can detect a QR Code in an image, even if the QR Code
 * is rotated or skewed, or partially obscured.</p>
 *
 * @author Sean Owen
 */
var Detector = (function () {
    function Detector(image) {
        this.image = image;
    }
    Detector.prototype.getImage = function () {
        return this.image;
    };
    Detector.prototype.getResultPointCallback = function () {
        return this.resultPointCallback;
    };
    /**
     * <p>Detects a QR Code in an image.</p>
     *
     * @return {@link DetectorResult} encapsulating results of detecting a QR Code
     * @throws NotFoundException if QR Code cannot be found
     * @throws FormatException if a QR Code cannot be decoded
     */
    // public detect(): DetectorResult /*throws NotFoundException, FormatException*/ {
    //   return detect(null)
    // }
    /**
     * <p>Detects a QR Code in an image.</p>
     *
     * @param hints optional hints to detector
     * @return {@link DetectorResult} encapsulating results of detecting a QR Code
     * @throws NotFoundException if QR Code cannot be found
     * @throws FormatException if a QR Code cannot be decoded
     */
    Detector.prototype.detect = function (hints) {
        this.resultPointCallback = (hints === null || hints === undefined) ? null :
            /*(ResultPointCallback) */ hints.get(9 /* NEED_RESULT_POINT_CALLBACK */);
        var finder = new FinderPatternFinder_1.default(this.image, this.resultPointCallback);
        var info = finder.find(hints);
        return this.processFinderPatternInfo(info);
    };
    Detector.prototype.processFinderPatternInfo = function (info) {
        var topLeft = info.getTopLeft();
        var topRight = info.getTopRight();
        var bottomLeft = info.getBottomLeft();
        var moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);
        if (moduleSize < 1.0) {
            throw new Exception_1.default("NotFoundException");
        }
        var dimension = Detector.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
        var provisionalVersion = Version_1.default.getProvisionalVersionForDimension(dimension);
        var modulesBetweenFPCenters = provisionalVersion.getDimensionForVersion() - 7;
        var alignmentPattern = null;
        // Anything above version 1 has an alignment pattern
        if (provisionalVersion.getAlignmentPatternCenters().length > 0) {
            // Guess where a "bottom right" finder pattern would have been
            var bottomRightX = topRight.getX() - topLeft.getX() + bottomLeft.getX();
            var bottomRightY = topRight.getY() - topLeft.getY() + bottomLeft.getY();
            // Estimate that alignment pattern is closer by 3 modules
            // from "bottom right" to known top left location
            var correctionToTopLeft = 1.0 - 3.0 / modulesBetweenFPCenters;
            var estAlignmentX = Math.floor(topLeft.getX() + correctionToTopLeft * (bottomRightX - topLeft.getX()));
            var estAlignmentY = Math.floor(topLeft.getY() + correctionToTopLeft * (bottomRightY - topLeft.getY()));
            // Kind of arbitrary -- expand search radius before giving up
            for (var i = 4; i <= 16; i <<= 1) {
                try {
                    alignmentPattern = this.findAlignmentInRegion(moduleSize, estAlignmentX, estAlignmentY, i);
                    break;
                }
                catch (re /*NotFoundException*/) {
                    if (re.getType() !== "NotFoundException") {
                        throw re;
                    }
                    // try next round
                }
            }
            // If we didn't find alignment pattern... well try anyway without it
        }
        var transform = Detector.createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);
        var bits = Detector.sampleGrid(this.image, transform, dimension);
        var points;
        if (alignmentPattern === null) {
            points = [bottomLeft, topLeft, topRight];
        }
        else {
            points = [bottomLeft, topLeft, topRight, alignmentPattern];
        }
        return new DetectorResult_1.default(bits, points);
    };
    Detector.createTransform = function (topLeft, topRight, bottomLeft, alignmentPattern, dimension /*int*/) {
        var dimMinusThree = dimension - 3.5;
        var bottomRightX; /*float*/
        var bottomRightY; /*float*/
        var sourceBottomRightX; /*float*/
        var sourceBottomRightY; /*float*/
        if (alignmentPattern !== null) {
            bottomRightX = alignmentPattern.getX();
            bottomRightY = alignmentPattern.getY();
            sourceBottomRightX = dimMinusThree - 3.0;
            sourceBottomRightY = sourceBottomRightX;
        }
        else {
            // Don't have an alignment pattern, just make up the bottom-right point
            bottomRightX = (topRight.getX() - topLeft.getX()) + bottomLeft.getX();
            bottomRightY = (topRight.getY() - topLeft.getY()) + bottomLeft.getY();
            sourceBottomRightX = dimMinusThree;
            sourceBottomRightY = dimMinusThree;
        }
        return PerspectiveTransform_1.default.quadrilateralToQuadrilateral(3.5, 3.5, dimMinusThree, 3.5, sourceBottomRightX, sourceBottomRightY, 3.5, dimMinusThree, topLeft.getX(), topLeft.getY(), topRight.getX(), topRight.getY(), bottomRightX, bottomRightY, bottomLeft.getX(), bottomLeft.getY());
    };
    Detector.sampleGrid = function (image, transform, dimension /*int*/) {
        var sampler = GridSampler_1.default.getInstance();
        return sampler.sampleGridWithTransform(image, dimension, dimension, transform);
    };
    /**
     * <p>Computes the dimension (number of modules on a size) of the QR Code based on the position
     * of the finder patterns and estimated module size.</p>
     */
    Detector.computeDimension = function (topLeft, topRight, bottomLeft, moduleSize /*float*/) {
        var tltrCentersDimension = MathUtils_1.default.round(ResultPoint_1.default.distance(topLeft, topRight) / moduleSize);
        var tlblCentersDimension = MathUtils_1.default.round(ResultPoint_1.default.distance(topLeft, bottomLeft) / moduleSize);
        var dimension = ((tltrCentersDimension + tlblCentersDimension) / 2) + 7;
        switch (dimension & 0x03) {
            case 0:
                dimension++;
                break;
            // 1? do nothing
            case 2:
                dimension--;
                break;
            case 3:
                throw new Exception_1.default("NotFoundException");
        }
        return dimension;
    };
    /**
     * <p>Computes an average estimated module size based on estimated derived from the positions
     * of the three finder patterns.</p>
     *
     * @param topLeft detected top-left finder pattern center
     * @param topRight detected top-right finder pattern center
     * @param bottomLeft detected bottom-left finder pattern center
     * @return estimated module size
     */
    Detector.prototype.calculateModuleSize = function (topLeft, topRight, bottomLeft) {
        // Take the average
        return (this.calculateModuleSizeOneWay(topLeft, topRight) +
            this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;
    };
    /**
     * <p>Estimates module size based on two finder patterns -- it uses
     * {@link #sizeOfBlackWhiteBlackRunBothWays(int, int, int, int)} to figure the
     * width of each, measuring along the axis between their centers.</p>
     */
    Detector.prototype.calculateModuleSizeOneWay = function (pattern, otherPattern) {
        var moduleSizeEst1 = this.sizeOfBlackWhiteBlackRunBothWays(/*(int) */ pattern.getX(), 
        /*(int) */ Math.floor(pattern.getY()), 
        /*(int) */ Math.floor(otherPattern.getX()), 
        /*(int) */ Math.floor(otherPattern.getY()));
        var moduleSizeEst2 = this.sizeOfBlackWhiteBlackRunBothWays(/*(int) */ otherPattern.getX(), 
        /*(int) */ Math.floor(otherPattern.getY()), 
        /*(int) */ Math.floor(pattern.getX()), 
        /*(int) */ Math.floor(pattern.getY()));
        if (isNaN(moduleSizeEst1)) {
            return moduleSizeEst2 / 7.0;
        }
        if (isNaN(moduleSizeEst2)) {
            return moduleSizeEst1 / 7.0;
        }
        // Average them, and divide by 7 since we've counted the width of 3 black modules,
        // and 1 white and 1 black module on either side. Ergo, divide sum by 14.
        return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
    };
    /**
     * See {@link #sizeOfBlackWhiteBlackRun(int, int, int, int)}; computes the total width of
     * a finder pattern by looking for a black-white-black run from the center in the direction
     * of another point (another finder pattern center), and in the opposite direction too.
     */
    Detector.prototype.sizeOfBlackWhiteBlackRunBothWays = function (fromX /*int*/, fromY /*int*/, toX /*int*/, toY /*int*/) {
        var result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);
        // Now count other way -- don't run off image though of course
        var scale = 1.0;
        var otherToX = fromX - (toX - fromX);
        if (otherToX < 0) {
            scale = fromX / (fromX - otherToX);
            otherToX = 0;
        }
        else if (otherToX >= this.image.getWidth()) {
            scale = (this.image.getWidth() - 1 - fromX) / (otherToX - fromX);
            otherToX = this.image.getWidth() - 1;
        }
        var otherToY = Math.floor(fromY - (toY - fromY) * scale);
        scale = 1.0;
        if (otherToY < 0) {
            scale = fromY / (fromY - otherToY);
            otherToY = 0;
        }
        else if (otherToY >= this.image.getHeight()) {
            scale = (this.image.getHeight() - 1 - fromY) / (otherToY - fromY);
            otherToY = this.image.getHeight() - 1;
        }
        otherToX = Math.floor(fromX + (otherToX - fromX) * scale);
        result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);
        // Middle pixel is double-counted this way; subtract 1
        return result - 1.0;
    };
    /**
     * <p>This method traces a line from a point in the image, in the direction towards another point.
     * It begins in a black region, and keeps going until it finds white, then black, then white again.
     * It reports the distance from the start to this point.</p>
     *
     * <p>This is used when figuring out how wide a finder pattern is, when the finder pattern
     * may be skewed or rotated.</p>
     */
    Detector.prototype.sizeOfBlackWhiteBlackRun = function (fromX /*int*/, fromY /*int*/, toX /*int*/, toY /*int*/) {
        // Mild variant of Bresenham's algorithm
        // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
        var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
        if (steep) {
            var temp = fromX;
            fromX = fromY;
            fromY = temp;
            temp = toX;
            toX = toY;
            toY = temp;
        }
        var dx = Math.abs(toX - fromX);
        var dy = Math.abs(toY - fromY);
        var error = -dx / 2;
        var xstep = fromX < toX ? 1 : -1;
        var ystep = fromY < toY ? 1 : -1;
        // In black pixels, looking for white, first or second time.
        var state = 0;
        // Loop up until x == toX, but not beyond
        var xLimit = toX + xstep;
        for (var x = fromX, y = fromY; x != xLimit; x += xstep) {
            var realX = steep ? y : x;
            var realY = steep ? x : y;
            // Does current pixel mean we have moved white to black or vice versa?
            // Scanning black in state 0,2 and white in state 1, so if we find the wrong
            // color, advance to next state or end if we are in state 2 already
            if ((state === 1) === this.image.get(realX, realY)) {
                if (state === 2) {
                    return MathUtils_1.default.distance(x, y, fromX, fromY);
                }
                state++;
            }
            error += dy;
            if (error > 0) {
                if (y == toY) {
                    break;
                }
                y += ystep;
                error -= dx;
            }
        }
        // Found black-white-black; give the benefit of the doubt that the next pixel outside the image
        // is "white" so this last point at (toX+xStep,toY) is the right ending. This is really a
        // small approximation; (toX+xStep,toY+yStep) might be really correct. Ignore this.
        if (state == 2) {
            return MathUtils_1.default.distance(toX + xstep, toY, fromX, fromY);
        }
        // else we didn't find even black-white-black; no estimate is really possible
        return NaN;
    };
    /**
     * <p>Attempts to locate an alignment pattern in a limited region of the image, which is
     * guessed to contain it. This method uses {@link AlignmentPattern}.</p>
     *
     * @param overallEstModuleSize estimated module size so far
     * @param estAlignmentX x coordinate of center of area probably containing alignment pattern
     * @param estAlignmentY y coordinate of above
     * @param allowanceFactor number of pixels in all directions to search from the center
     * @return {@link AlignmentPattern} if found, or null otherwise
     * @throws NotFoundException if an unexpected error occurs during detection
     */
    Detector.prototype.findAlignmentInRegion = function (overallEstModuleSize /*float*/, estAlignmentX /*int*/, estAlignmentY /*int*/, allowanceFactor /*float*/) {
        // Look for an alignment pattern (3 modules in size) around where it
        // should be
        var allowance = Math.floor(allowanceFactor * overallEstModuleSize);
        var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
        var alignmentAreaRightX = Math.min(this.image.getWidth() - 1, estAlignmentX + allowance);
        if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
            throw new Exception_1.default("NotFoundException");
        }
        var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
        var alignmentAreaBottomY = Math.min(this.image.getHeight() - 1, estAlignmentY + allowance);
        if (alignmentAreaBottomY - alignmentAreaTopY < overallEstModuleSize * 3) {
            throw new Exception_1.default("NotFoundException");
        }
        var alignmentFinder = new AlignmentPatternFinder_1.default(this.image, alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, this.resultPointCallback);
        return alignmentFinder.find();
    };
    return Detector;
}());
exports.default = Detector;
//# sourceMappingURL=Detector.js.map