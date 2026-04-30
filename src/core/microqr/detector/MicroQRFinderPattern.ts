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

import ResultPoint from '../../ResultPoint';

/**
 * Encapsulates a Micro QR Code finder pattern candidate.
 */
export default class MicroQRFinderPattern extends ResultPoint {

    public constructor(
        posX: number,
        posY: number,
        private estimatedModuleSize: number,
        private count: number = 1
    ) {
        super(posX, posY);
    }

    public getEstimatedModuleSize(): number {
        return this.estimatedModuleSize;
    }

    public getCount(): number {
        return this.count;
    }

    /**
     * Returns true if this pattern is approximately at position (i, j)
     * with the given module size.
     */
    public aboutEquals(moduleSize: number, i: number, j: number): boolean {
        if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) <= moduleSize) {
            const moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
        }
        return false;
    }

    /**
     * Return a new pattern that is a weighted average of this pattern and a new estimate.
     */
    public combineEstimate(i: number, j: number, newModuleSize: number): MicroQRFinderPattern {
        const combinedCount = this.count + 1;
        const combinedX = (this.count * this.getX() + j) / combinedCount;
        const combinedY = (this.count * this.getY() + i) / combinedCount;
        const combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
        return new MicroQRFinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
    }
}
