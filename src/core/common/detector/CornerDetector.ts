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

import ResultPoint from '../../ResultPoint';
import BitMatrix from '../../common/BitMatrix';
import NotFoundException from '../../NotFoundException';

/**
 * @author Mariusz Dąbrowski
 */
export default class CornerDetector {

    private image: BitMatrix;
    private height: number;
    private width: number;
    private leftInit: number;
    private rightInit: number;
    private downInit: number;
    private upInit: number;
    private targetMatrixSize: number;


    /**
     * @throws NotFoundException if image is too small to accommodate {@code initSize}
     */
    public constructor(image: BitMatrix, initSize: number, x: number, y: number, targetMatrixSize: number) {
        this.image = image;
        this.height = image.getHeight();
        this.width = image.getWidth();
        const halfsize = initSize / 2;
        this.leftInit = x - halfsize;
        this.rightInit = x + halfsize;
        this.upInit = y - halfsize;
        this.downInit = y + halfsize;
        this.targetMatrixSize = targetMatrixSize * 2;
        if (this.upInit < 0 || this.leftInit < 0 || this.downInit >= this.height || this.rightInit >= this.width) {
            throw new NotFoundException();
        }
    }

    /**
     * @throws NotFoundException if no Data Matrix Code can be found
     */
    public detect(): ResultPoint[] {

        let left = this.leftInit;
        let right = this.rightInit;
        let up = this.upInit;
        let down = this.downInit;
        let sizeExceeded = false;
        let aBlackPointFoundOnBorder = true;
        let atLeastOneBlackPointFoundOnBorder = false;

        let atLeastOneBlackPointFoundOnRight = false;
        let atLeastOneBlackPointFoundOnBottom = false;
        let atLeastOneBlackPointFoundOnLeft = false;
        let atLeastOneBlackPointFoundOnTop = false;

        while (aBlackPointFoundOnBorder) {

            aBlackPointFoundOnBorder = false;

            // .....
            // . |
            // .....
            let rightBorderNotWhite = true;
            while ((rightBorderNotWhite || !atLeastOneBlackPointFoundOnRight) && right < this.width) {
                rightBorderNotWhite = this.containsBlackPoint(up, down, right, false);
                if (rightBorderNotWhite) {
                    right++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnRight = true;
                } else if (!atLeastOneBlackPointFoundOnRight) {
                    right++;
                }
            }

            if (right >= this.width) {
                sizeExceeded = true;
                break;
            }

            // .....
            // . .
            // .___.
            let bottomBorderNotWhite = true;
            while ((bottomBorderNotWhite || !atLeastOneBlackPointFoundOnBottom) && down < this.height) {
                bottomBorderNotWhite = this.containsBlackPoint(left, right, down, true);
                if (bottomBorderNotWhite) {
                    down++;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnBottom = true;
                } else if (!atLeastOneBlackPointFoundOnBottom) {
                    down++;
                }
            }

            if (down >= this.height) {
                sizeExceeded = true;
                break;
            }

            // .....
            // | .
            // .....
            let leftBorderNotWhite = true;
            while ((leftBorderNotWhite || !atLeastOneBlackPointFoundOnLeft) && left >= 0) {
                leftBorderNotWhite = this.containsBlackPoint(up, down, left, false);
                if (leftBorderNotWhite) {
                    left--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnLeft = true;
                } else if (!atLeastOneBlackPointFoundOnLeft) {
                    left--;
                }
            }

            if (left < 0) {
                sizeExceeded = true;
                break;
            }

            // .___.
            // . .
            // .....
            let topBorderNotWhite = true;
            while ((topBorderNotWhite || !atLeastOneBlackPointFoundOnTop) && up >= 0) {
                topBorderNotWhite = this.containsBlackPoint(left, right, up, true);
                if (topBorderNotWhite) {
                    up--;
                    aBlackPointFoundOnBorder = true;
                    atLeastOneBlackPointFoundOnTop = true;
                } else if (!atLeastOneBlackPointFoundOnTop) {
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
            return this.findCorners(right, left, down, up);
        } else {
            throw new NotFoundException();
        }
    }

    private findCorners(right: number, left: number, down: number, up: number): ResultPoint[] {
        //
        //      A------------              ------------B
        //      |           |      up      |           |
        //      |    -------|--------------|-------    |
        //      |    |      |              |      |    |
        //      |    |      |              |      |    |
        //      ------------AP            BP------------
        //           |                            |
        //           |                            |
        //      left |                            | right
        //           |                            |
        //           |                            |
        //      ------------DP            CP------------
        //      |    |      |             |       |    |
        //      |    |      |   down      |       |    |
        //      |    -------|-------------|--------    |
        //      |           |             |            |
        //      D-----------|             |------------C
        //


        const width = right - left;
        const height = down - up;
        const sampler = 16 / this.targetMatrixSize;
        const sampler2 = 4 / this.targetMatrixSize;
        const deltaX = width * sampler2;
        const deltaY = height * sampler2;
        const areaWidth = deltaX + (right - left) * sampler;
        const areaHeight = deltaY + (down - up) * sampler;

        const a = new ResultPoint(left - deltaX, up - deltaY);
        const b = new ResultPoint(right + deltaX, up - deltaY);
        const c = new ResultPoint(right + deltaX, down + deltaY);
        const d = new ResultPoint(left - deltaX, down + deltaY);

        const ap = new ResultPoint(a.getX() + areaWidth, a.getY() + areaHeight);
        const bp = new ResultPoint(b.getX() - areaWidth, b.getY() + areaHeight);
        const cp = new ResultPoint(c.getX() - areaWidth, c.getY() - areaHeight);
        const dp = new ResultPoint(d.getX() + areaWidth, d.getY() - areaHeight);

        const topLeftCorner = this.getCornerFromArea(a.getX(), ap.getX(), a.getY(), ap.getY(), false, false);
        const topRightCorner = this.getCornerFromArea(bp.getX(), b.getX(), b.getY(), bp.getY(), true, false);
        const bottomRightCorner = this.getCornerFromArea(cp.getX(), c.getX(), cp.getY(), c.getY(), true, true);
        const bottomLeftCorner = this.getCornerFromArea(d.getX(), dp.getX(), dp.getY(), d.getY(), false, true);

        const xCorrection = (topRightCorner.getX() - topLeftCorner.getX()) / this.targetMatrixSize;
        const yCorrection = (bottomRightCorner.getY() - topRightCorner.getY()) / this.targetMatrixSize;

        const topLeftCornerCenter = new ResultPoint(topLeftCorner.getX() + xCorrection, topLeftCorner.getY() + yCorrection);
        const topRightCornerCenter = new ResultPoint(topRightCorner.getX() - xCorrection, topRightCorner.getY() + yCorrection);
        const bottomRightCornerCenter = new ResultPoint(bottomRightCorner.getX() - xCorrection, bottomRightCorner.getY() - yCorrection);
        const bottomLeftCornerCenter = new ResultPoint(bottomLeftCorner.getX() + xCorrection, bottomLeftCorner.getY() - yCorrection);

        const result: ResultPoint[] = [topLeftCornerCenter, topRightCornerCenter, bottomRightCornerCenter, bottomLeftCornerCenter];
        return result;
    }

    private getCornerFromArea(left: number, right: number, top: number, bottom: number, maximizeX: boolean, maximizeY: boolean): ResultPoint {
        let resX = maximizeX ? 0 : Number.MAX_VALUE;
        let resY = maximizeY ? 0 : Number.MAX_VALUE;
        for (let x = left; x < right; x++) {
            for (let y = top; y < bottom; y++) {
                if (x > 0 && y > 0 && x < this.image.getWidth() && y < this.image.getHeight()) {
                    if (this.image.get(x, y)) {
                        if (maximizeX) {
                            if (x > resX) {
                                resX = x;
                            }
                        } else {
                            if (x < resX) {
                                resX = x;
                            }
                        }
                        if (maximizeY) {
                            if (y > resY) {
                                resY = y;
                            }
                        } else {
                            if (y < resY) {
                                resY = y;
                            }
                        }
                    }
                }
            }
        }
        if (resX === 0 || resY === 0) {
            throw new NotFoundException();
        } else {
            return new ResultPoint(resX, resY);
        }
    }


    /**
     * Determines whether a segment contains a black point
     *
     * @param a          min value of the scanned coordinate
     * @param b          max value of the scanned coordinate
     * @param fixed      value of fixed coordinate
     * @param horizontal set to true if scan must be horizontal, false if vertical
     * @return true if a black point has been found, else false.
     */
    private containsBlackPoint(a: number, b: number, fixed: number, horizontal: boolean): boolean {

        if (horizontal) {
            for (let x = a; x <= b; x++) {
                if (this.image.get(x, fixed)) {
                    return true;
                }
            }
        } else {
            for (let y = a; y <= b; y++) {
                if (this.image.get(fixed, y)) {
                    return true;
                }
            }
        }

        return false;
    }

}
