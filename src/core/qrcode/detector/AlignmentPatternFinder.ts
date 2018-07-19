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

/*namespace com.google.zxing.qrcode.detector {*/

import ResultPointCallback from '../../ResultPointCallback';
import BitMatrix from '../../common/BitMatrix';
import AlignmentPattern from './AlignmentPattern';

import NotFoundException from '../../NotFoundException';

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
export default class AlignmentPatternFinder {

    private possibleCenters: AlignmentPattern[];
    private crossCheckStateCount: Int32Array;

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
    public constructor(private image: BitMatrix,
        private startX: number /*int*/,
        private startY: number /*int*/,
        private width: number /*int*/,
        private height: number /*int*/,
        private moduleSize: number/*float*/,
        private resultPointCallback: ResultPointCallback) {
        this.possibleCenters = []; // new Array<any>(5))
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
    public find(): AlignmentPattern /*throws NotFoundException*/ {
        const startX = this.startX;
        const height = this.height;
        const width = this.width;
        const maxJ = startX + width;
        const middleI = this.startY + (height / 2);
        // We are looking for black/white/black modules in 1:1:1 ratio
        // this tracks the number of black/white/black modules seen so far
        const stateCount = new Int32Array(3);
        const image = this.image;
        for (let iGen = 0; iGen < height; iGen++) {
            // Search from middle outwards
            const i = middleI + ((iGen & 0x01) === 0 ? Math.floor((iGen + 1) / 2) : -Math.floor((iGen + 1) / 2));

            stateCount[0] = 0;
            stateCount[1] = 0;
            stateCount[2] = 0;

            let j = startX;
            // Burn off leading white pixels before anything else; if we start in the middle of
            // a white run, it doesn't make sense to count its length, since we don't know if the
            // white run continued to the left of the start point
            while (j < maxJ && !image.get(j, i)) {
                j++;
            }
            let currentState = 0;
            while (j < maxJ) {
                if (image.get(j, i)) {
                    // Black pixel
                    if (currentState === 1) { // Counting black pixels
                        stateCount[1]++;
                    } else { // Counting white pixels
                        if (currentState === 2) { // A winner?
                            if (this.foundPatternCross(stateCount)) { // Yes
                                const confirmed = this.handlePossibleCenter(stateCount, i, j);
                                if (confirmed !== null) {
                                    return confirmed;
                                }
                            }
                            stateCount[0] = stateCount[2];
                            stateCount[1] = 1;
                            stateCount[2] = 0;
                            currentState = 1;
                        } else {
                            stateCount[++currentState]++;
                        }
                    }
                } else { // White pixel
                    if (currentState === 1) { // Counting black pixels
                        currentState++;
                    }
                    stateCount[currentState]++;
                }
                j++;
            }
            if (this.foundPatternCross(stateCount)) {
                const confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
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

        throw new NotFoundException();
    }

    /**
     * Given a count of black/white/black pixels just seen and an end position,
     * figures the location of the center of this black/white/black run.
     */
    private static centerFromEnd(stateCount: Int32Array, end: number /*int*/): number/*float*/ {
        return (end - stateCount[2]) - stateCount[1] / 2.0;
    }

    /**
     * @param stateCount count of black/white/black pixels just read
     * @return true iff the proportions of the counts is close enough to the 1/1/1 ratios
     *         used by alignment patterns to be considered a match
     */
    private foundPatternCross(stateCount: Int32Array): boolean {
        const moduleSize: number /*float*/ = this.moduleSize;
        const maxVariance: number /*float*/ = moduleSize / 2.0;
        for (let i = 0; i < 3; i++) {
            if (Math.abs(moduleSize - stateCount[i]) >= maxVariance) {
                return false;
            }
        }
        return true;
    }

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
    private crossCheckVertical(startI: number /*int*/, centerJ: number /*int*/, maxCount: number /*int*/,
        originalStateCountTotal: number /*int*/): number/*float*/ {
        const image = this.image;

        const maxI = image.getHeight();
        const stateCount = this.crossCheckStateCount;
        stateCount[0] = 0;
        stateCount[1] = 0;
        stateCount[2] = 0;

        // Start counting up from center
        let i = startI;
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
        if (i === maxI || stateCount[1] > maxCount) {
            return NaN;
        }
        while (i < maxI && !image.get(centerJ, i) && stateCount[2] <= maxCount) {
            stateCount[2]++;
            i++;
        }
        if (stateCount[2] > maxCount) {
            return NaN;
        }

        const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
        if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
            return NaN;
        }

        return this.foundPatternCross(stateCount) ? AlignmentPatternFinder.centerFromEnd(stateCount, i) : NaN;
    }

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
    private handlePossibleCenter(stateCount: Int32Array, i: number /*int*/, j: number /*int*/): AlignmentPattern {
        const stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
        const centerJ: number /*float*/ = AlignmentPatternFinder.centerFromEnd(stateCount, j);
        const centerI: number /*float*/ = this.crossCheckVertical(i, /*(int) */centerJ, 2 * stateCount[1], stateCountTotal);
        if (!isNaN(centerI)) {
            const estimatedModuleSize: number /*float*/ = (stateCount[0] + stateCount[1] + stateCount[2]) / 3.0;
            for (const center of this.possibleCenters) {
                // Look for about the same center and module size:
                if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
                    return center.combineEstimate(centerI, centerJ, estimatedModuleSize);
                }
            }
            // Hadn't found this before; save it
            const point = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
            this.possibleCenters.push(point);
            if (this.resultPointCallback !== null && this.resultPointCallback !== undefined) {
                this.resultPointCallback.foundPossibleResultPoint(point);
            }
        }
        return null;
    }

}
