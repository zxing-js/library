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
var AlignmentPattern_1 = require("./AlignmentPattern");
var Exception_1 = require("./../../Exception");
/*import java.util.ArrayList;*/
/*import java.util.List;*/
/**
 * <p>This class attempts to find alignment patterns in a QR Code. Alignment patterns look like finder
 * patterns but are smaller and appear at regular intervals throughout the image.</p>
 *
 * <p>At the moment this only looks for the bottom-right alignment pattern.</p>
 *
 * <p>This is mostly a simplified copy of {@link FinderPatternFinder}. It is copied,
 * pasted and stripped down here for maximum performance but does unfortunately duplicate
 * some code.</p>
 *
 * <p>This class is thread-safe but not reentrant. Each thread must allocate its own object.</p>
 *
 * @author Sean Owen
 */
var AlignmentPatternFinder = (function () {
    /**
     * <p>Creates a finder that will look in a portion of the whole image.</p>
     *
     * @param image image to search
     * @param startX left column from which to start searching
     * @param startY top row from which to start searching
     * @param width width of region to search
     * @param height height of region to search
     * @param moduleSize estimated module size so far
     */
    function AlignmentPatternFinder(image, startX /*int*/, startY /*int*/, width /*int*/, height /*int*/, moduleSize /*float*/, resultPointCallback) {
        this.image = image;
        this.startX = startX; /*int*/
        this.startY = startY; /*int*/
        this.width = width; /*int*/
        this.height = height; /*int*/
        this.moduleSize = moduleSize; /*float*/
        this.resultPointCallback = resultPointCallback;
        this.possibleCenters = []; //new Array<any>(5)
        // TYPESCRIPTPORT: array initialization without size as the length is checked below
        this.crossCheckStateCount = new Int32Array(3);
    }
    /**
     * <p>This method attempts to find the bottom-right alignment pattern in the image. It is a bit messy since
     * it's pretty performance-critical and so is written to be fast foremost.</p>
     *
     * @return {@link AlignmentPattern} if found
     * @throws NotFoundException if not found
     */
    AlignmentPatternFinder.prototype.find = function () {
        var startX = this.startX;
        var height = this.height;
        var width = this.width;
        var maxJ = startX + width;
        var middleI = this.startY + (height / 2);
        // We are looking for black/white/black modules in 1:1:1 ratio
        // this tracks the number of black/white/black modules seen so far
        var stateCount = new Int32Array(3);
        var image = this.image;
        for (var iGen = 0; iGen < height; iGen++) {
            // Search from middle outwards
            var i = middleI + ((iGen & 0x01) == 0 ? (iGen + 1) / 2 : -((iGen + 1) / 2));
            stateCount[0] = 0;
            stateCount[1] = 0;
            stateCount[2] = 0;
            var j = startX;
            // Burn off leading white pixels before anything else; if we start in the middle of
            // a white run, it doesn't make sense to count its length, since we don't know if the
            // white run continued to the left of the start point
            while (j < maxJ && !image.get(j, i)) {
                j++;
            }
            var currentState = 0;
            while (j < maxJ) {
                if (image.get(j, i)) {
                    // Black pixel
                    if (currentState == 1) {
                        stateCount[1]++;
                    }
                    else {
                        if (currentState == 2) {
                            if (this.foundPatternCross(stateCount)) {
                                var confirmed = this.handlePossibleCenter(stateCount, i, j);
                                if (confirmed !== null) {
                                    return confirmed;
                                }
                            }
                            stateCount[0] = stateCount[2];
                            stateCount[1] = 1;
                            stateCount[2] = 0;
                            currentState = 1;
                        }
                        else {
                            stateCount[++currentState]++;
                        }
                    }
                }
                else {
                    if (currentState == 1) {
                        currentState++;
                    }
                    stateCount[currentState]++;
                }
                j++;
            }
            if (this.foundPatternCross(stateCount)) {
                var confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
                if (confirmed !== null) {
                    return confirmed;
                }
            }
        }
        // Hmm, nothing we saw was observed and confirmed twice. If we had
        // any guess at all, return it.
        if (this.possibleCenters.length !== 0) {
            return this.possibleCenters[0];
        }
        throw new Exception_1.default("NotFoundException");
    };
    /**
     * Given a count of black/white/black pixels just seen and an end position,
     * figures the location of the center of this black/white/black run.
     */
    AlignmentPatternFinder.centerFromEnd = function (stateCount, end /*int*/) {
        return (end - stateCount[2]) - stateCount[1] / 2.0;
    };
    /**
     * @param stateCount count of black/white/black pixels just read
     * @return true iff the proportions of the counts is close enough to the 1/1/1 ratios
     *         used by alignment patterns to be considered a match
     */
    AlignmentPatternFinder.prototype.foundPatternCross = function (stateCount) {
        var moduleSize = this.moduleSize;
        var maxVariance = moduleSize / 2.0;
        for (var i = 0; i < 3; i++) {
            if (Math.abs(moduleSize - stateCount[i]) >= maxVariance) {
                return false;
            }
        }
        return true;
    };
    /**
     * <p>After a horizontal scan finds a potential alignment pattern, this method
     * "cross-checks" by scanning down vertically through the center of the possible
     * alignment pattern to see if the same proportion is detected.</p>
     *
     * @param startI row where an alignment pattern was detected
     * @param centerJ center of the section that appears to cross an alignment pattern
     * @param maxCount maximum reasonable number of modules that should be
     * observed in any reading state, based on the results of the horizontal scan
     * @return vertical center of alignment pattern, or {@link Float#NaN} if not found
     */
    AlignmentPatternFinder.prototype.crossCheckVertical = function (startI /*int*/, centerJ /*int*/, maxCount /*int*/, originalStateCountTotal /*int*/) {
        var image = this.image;
        var maxI = image.getHeight();
        var stateCount = this.crossCheckStateCount;
        stateCount[0] = 0;
        stateCount[1] = 0;
        stateCount[2] = 0;
        // Start counting up from center
        var i = startI;
        while (i >= 0 && image.get(centerJ, i) && stateCount[1] <= maxCount) {
            stateCount[1]++;
            i--;
        }
        // If already too many modules in this state or ran off the edge:
        if (i < 0 || stateCount[1] > maxCount) {
            return NaN;
        }
        while (i >= 0 && !image.get(centerJ, i) && stateCount[0] <= maxCount) {
            stateCount[0]++;
            i--;
        }
        if (stateCount[0] > maxCount) {
            return NaN;
        }
        // Now also count down from center
        i = startI + 1;
        while (i < maxI && image.get(centerJ, i) && stateCount[1] <= maxCount) {
            stateCount[1]++;
            i++;
        }
        if (i == maxI || stateCount[1] > maxCount) {
            return NaN;
        }
        while (i < maxI && !image.get(centerJ, i) && stateCount[2] <= maxCount) {
            stateCount[2]++;
            i++;
        }
        if (stateCount[2] > maxCount) {
            return NaN;
        }
        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
        if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
            return NaN;
        }
        return this.foundPatternCross(stateCount) ? AlignmentPatternFinder.centerFromEnd(stateCount, i) : NaN;
    };
    /**
     * <p>This is called when a horizontal scan finds a possible alignment pattern. It will
     * cross check with a vertical scan, and if successful, will see if this pattern had been
     * found on a previous horizontal scan. If so, we consider it confirmed and conclude we have
     * found the alignment pattern.</p>
     *
     * @param stateCount reading state module counts from horizontal scan
     * @param i row where alignment pattern may be found
     * @param j end of possible alignment pattern in row
     * @return {@link AlignmentPattern} if we have found the same pattern twice, or null if not
     */
    AlignmentPatternFinder.prototype.handlePossibleCenter = function (stateCount, i /*int*/, j /*int*/) {
        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
        var centerJ = AlignmentPatternFinder.centerFromEnd(stateCount, j);
        var centerI = this.crossCheckVertical(i, /*(int) */ centerJ, 2 * stateCount[1], stateCountTotal);
        if (!isNaN(centerI)) {
            var estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3.0;
            for (var _i = 0, _a = this.possibleCenters; _i < _a.length; _i++) {
                var center = _a[_i];
                // Look for about the same center and module size:
                if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
                    return center.combineEstimate(centerI, centerJ, estimatedModuleSize);
                }
            }
            // Hadn't found this before; save it
            var point = new AlignmentPattern_1.default(centerJ, centerI, estimatedModuleSize);
            this.possibleCenters.push(point);
            if (this.resultPointCallback !== null) {
                this.resultPointCallback.foundPossibleResultPoint(point);
            }
        }
        return null;
    };
    return AlignmentPatternFinder;
}());
exports.default = AlignmentPatternFinder;
//# sourceMappingURL=AlignmentPatternFinder.js.map