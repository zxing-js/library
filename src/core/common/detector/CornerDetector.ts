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
        var halfsize = initSize / 2;
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

        while (aBlackPointFoundOnBorder) {

            aBlackPointFoundOnBorder = false;

            // .....
            // . |
            // .....
            var rightBorderNotWhite = true;
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
            var bottomBorderNotWhite = true;
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
            var leftBorderNotWhite = true;
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
            var topBorderNotWhite = true;
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


        var width = right - left;
        var height = down - up;
        var sampler = 16 / this.targetMatrixSize;
        var sampler2 = 4 / this.targetMatrixSize;
        var deltaX = width * sampler2;
        var deltaY = height * sampler2;
        var areaWidth = deltaX + (right - left) * sampler;
        var areaHeight = deltaY + (down - up) * sampler;

        var a = new ResultPoint(left - deltaX, up - deltaY);
        var b = new ResultPoint(right + deltaX, up - deltaY);
        var c = new ResultPoint(right + deltaX, down + deltaY);
        var d = new ResultPoint(left - deltaX, down + deltaY);

        var ap = new ResultPoint(a.getX() + areaWidth, a.getY() + areaHeight);
        var bp = new ResultPoint(b.getX() - areaWidth, b.getY() + areaHeight);
        var cp = new ResultPoint(c.getX() - areaWidth, c.getY() - areaHeight);
        var dp = new ResultPoint(d.getX() + areaWidth, d.getY() - areaHeight);

        var topLeftCorner = this.getCornerFromArea(a.getX(), ap.getX(), a.getY(), ap.getY(), false, false);
        var topRightCorner = this.getCornerFromArea(bp.getX(), b.getX(), b.getY(), bp.getY(), true, false);
        var bottomRightCorner = this.getCornerFromArea(cp.getX(), c.getX(), cp.getY(), c.getY(), true, true);
        var bottomLeftCorner = this.getCornerFromArea(d.getX(), dp.getX(), dp.getY(), d.getY(), false, true);

        var xCorrection = (topRightCorner.getX() - topLeftCorner.getX()) / this.targetMatrixSize;
        var yCorrection = (bottomRightCorner.getY() - topRightCorner.getY()) / this.targetMatrixSize;

        var topLeftCornerCenter = new ResultPoint(topLeftCorner.getX() + xCorrection, topLeftCorner.getY() + yCorrection);
        var topRightCornerCenter = new ResultPoint(topRightCorner.getX() - xCorrection, topRightCorner.getY() + yCorrection);
        var bottomRightCornerCenter = new ResultPoint(bottomRightCorner.getX() - xCorrection, bottomRightCorner.getY() - yCorrection);
        var bottomLeftCornerCenter = new ResultPoint(bottomLeftCorner.getX() + xCorrection, bottomLeftCorner.getY() - yCorrection);

        var result: ResultPoint[] = [topLeftCornerCenter, topRightCornerCenter, bottomRightCornerCenter, bottomLeftCornerCenter];
        return result;
    }

    private getCornerFromArea(left: number, right: number, top: number, bottom: number, maximizeX: boolean, maximizeY: boolean): ResultPoint {
        var resX = maximizeX ? 0 : Number.MAX_VALUE;
        var resY = maximizeY ? 0 : Number.MAX_VALUE;
        for (var x = left; x < right; x++) {
            for (var y = top; y < bottom; y++) {
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
        if (resX == 0 || resY == 0) {
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
            for (var x = a; x <= b; x++) {
                if (this.image.get(x, fixed)) {
                    return true;
                }
            }
        } else {
            for (var y = a; y <= b; y++) {
                if (this.image.get(fixed, y)) {
                    return true;
                }
            }
        }

        return false;
    }

}
