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

import ResultPoint from '../../ResultPoint';

/**
 * <p>Encapsulates a finder pattern, which are the three square patterns found in
 * the corners of QR Codes. It also encapsulates a count of similar finder patterns,
 * as a convenience to the finder's bookkeeping.</p>
 *
 * @author Sean Owen
 */
export default class FinderPattern extends ResultPoint {

    // FinderPattern(posX: number/*float*/, posY: number/*float*/, estimatedModuleSize: number/*float*/) {
    //   this(posX, posY, estimatedModuleSize, 1)
    // }

    public constructor(posX: number/*float*/, posY: number/*float*/, private estimatedModuleSize: number/*float*/, private count?: number /*int*/) {
        super(posX, posY);
        if (undefined === count) {
            this.count = 1;
        }
    }

    public getEstimatedModuleSize(): number/*float*/ {
        return this.estimatedModuleSize;
    }

    public getCount(): number /*int*/ {
        return this.count;
    }

    /*
    void incrementCount() {
      this.count++
    }
     */

    /**
     * <p>Determines if this finder pattern "about equals" a finder pattern at the stated
     * position and size -- meaning, it is at nearly the same center with nearly the same size.</p>
     */
    public aboutEquals(moduleSize: number/*float*/, i: number/*float*/, j: number/*float*/): boolean {
        if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) <= moduleSize) {
            const moduleSizeDiff: number /*float*/ = Math.abs(moduleSize - this.estimatedModuleSize);
            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
        }
        return false;
    }

    /**
     * Combines this object's current estimate of a finder pattern position and module size
     * with a new estimate. It returns a new {@code FinderPattern} containing a weighted average
     * based on count.
     */
    public combineEstimate(i: number/*float*/, j: number/*float*/, newModuleSize: number/*float*/): FinderPattern {
        const combinedCount = this.count + 1;
        const combinedX: number /*float*/ = (this.count * this.getX() + j) / combinedCount;
        const combinedY: number /*float*/ = (this.count * this.getY() + i) / combinedCount;
        const combinedModuleSize: number /*float*/ = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
        return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
    }

}
