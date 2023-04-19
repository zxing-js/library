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

import BitMatrix from '../../common/BitMatrix';
import MathUtils from '../../common/detector/MathUtils';
import DetectorResult from '../../common/DetectorResult';
// import GridSampler from '../../common/GridSampler';
import GridSamplerInstance from '../../common/GridSamplerInstance';
import PerspectiveTransform from '../../common/PerspectiveTransform';
import DecodeHintType from '../../DecodeHintType';
import NotFoundException from '../../NotFoundException';
import ResultPoint from '../../ResultPoint';
import ResultPointCallback from '../../ResultPointCallback';
import Version from '../decoder/Version';
import AlignmentPattern from './AlignmentPattern';
import AlignmentPatternFinder from './AlignmentPatternFinder';
import FinderPattern from './FinderPattern';
import FinderPatternFinder from './FinderPatternFinder';
import FinderPatternInfo from './FinderPatternInfo';


/*import java.util.Map;*/

/**
 * <p>Encapsulates logic that can detect a QR Code in an image, even if the QR Code
 * is rotated or skewed, or partially obscured.</p>
 *
 * @author Sean Owen
 */
export default class Detector {

  private resultPointCallback: ResultPointCallback;

  public constructor(private image: BitMatrix) { }

  protected getImage(): BitMatrix {
    return this.image;
  }

  protected getResultPointCallback(): ResultPointCallback {
    return this.resultPointCallback;
  }

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
  public detect(hints: Map<DecodeHintType, any>): DetectorResult /*throws NotFoundException, FormatException*/ {

    this.resultPointCallback = (hints === null || hints === undefined) ? null :
        /*(ResultPointCallback) */hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);

    const finder = new FinderPatternFinder(this.image, this.resultPointCallback);
    const info = finder.find(hints);

    return this.processFinderPatternInfo(info);
  }

  protected processFinderPatternInfo(info: FinderPatternInfo): DetectorResult {

    const topLeft: FinderPattern = info.getTopLeft();
    const topRight: FinderPattern = info.getTopRight();
    const bottomLeft: FinderPattern = info.getBottomLeft();

    const moduleSize: number /*float*/ = this.calculateModuleSize(topLeft, topRight, bottomLeft);
    if (moduleSize < 1.0) {
      throw new NotFoundException('No pattern found in proccess finder.');
    }
    const dimension = Detector.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
    const provisionalVersion: Version = Version.getProvisionalVersionForDimension(dimension);
    const modulesBetweenFPCenters = provisionalVersion.getDimensionForVersion() - 7;

    let alignmentPattern: AlignmentPattern = null;
    // Anything above version 1 has an alignment pattern
    if (provisionalVersion.getAlignmentPatternCenters().length > 0) {

      // Guess where a "bottom right" finder pattern would have been
      const bottomRightX: number /*float*/ = topRight.getX() - topLeft.getX() + bottomLeft.getX();
      const bottomRightY: number /*float*/ = topRight.getY() - topLeft.getY() + bottomLeft.getY();

      // Estimate that alignment pattern is closer by 3 modules
      // from "bottom right" to known top left location
      const correctionToTopLeft: number /*float*/ = 1.0 - 3.0 / modulesBetweenFPCenters;
      const estAlignmentX = /*(int) */Math.floor(topLeft.getX() + correctionToTopLeft * (bottomRightX - topLeft.getX()));
      const estAlignmentY = /*(int) */Math.floor(topLeft.getY() + correctionToTopLeft * (bottomRightY - topLeft.getY()));

      // Kind of arbitrary -- expand search radius before giving up
      for (let i = 4; i <= 16; i <<= 1) {
        try {
          alignmentPattern = this.findAlignmentInRegion(moduleSize,
            estAlignmentX,
            estAlignmentY,
            i);
          break;
        } catch (re/*NotFoundException*/) {
          if (!(re instanceof NotFoundException)) {
            throw re;
          }
          // try next round
        }
      }
      // If we didn't find alignment pattern... well try anyway without it
    }

    const transform: PerspectiveTransform =
      Detector.createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);

    const bits: BitMatrix = Detector.sampleGrid(this.image, transform, dimension);

    let points: ResultPoint[];
    if (alignmentPattern === null) {
      points = [bottomLeft, topLeft, topRight];
    } else {
      points = [bottomLeft, topLeft, topRight, alignmentPattern];
    }
    return new DetectorResult(bits, points);
  }

  private static createTransform(topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint,
    alignmentPattern: ResultPoint,
    dimension: number /*int*/): PerspectiveTransform {
    const dimMinusThree: number /*float*/ = dimension - 3.5;
    let bottomRightX: number; /*float*/
    let bottomRightY: number; /*float*/
    let sourceBottomRightX: number; /*float*/
    let sourceBottomRightY: number; /*float*/
    if (alignmentPattern !== null) {
      bottomRightX = alignmentPattern.getX();
      bottomRightY = alignmentPattern.getY();
      sourceBottomRightX = dimMinusThree - 3.0;
      sourceBottomRightY = sourceBottomRightX;
    } else {
      // Don't have an alignment pattern, just make up the bottom-right point
      bottomRightX = (topRight.getX() - topLeft.getX()) + bottomLeft.getX();
      bottomRightY = (topRight.getY() - topLeft.getY()) + bottomLeft.getY();
      sourceBottomRightX = dimMinusThree;
      sourceBottomRightY = dimMinusThree;
    }

    return PerspectiveTransform.quadrilateralToQuadrilateral(
      3.5,
      3.5,
      dimMinusThree,
      3.5,
      sourceBottomRightX,
      sourceBottomRightY,
      3.5,
      dimMinusThree,
      topLeft.getX(),
      topLeft.getY(),
      topRight.getX(),
      topRight.getY(),
      bottomRightX,
      bottomRightY,
      bottomLeft.getX(),
      bottomLeft.getY());
  }

  private static sampleGrid(image: BitMatrix,
    transform: PerspectiveTransform,
    dimension: number /*int*/): BitMatrix /*throws NotFoundException*/ {

    const sampler = GridSamplerInstance.getInstance();
    return sampler.sampleGridWithTransform(image, dimension, dimension, transform);
  }

  /**
   * <p>Computes the dimension (number of modules on a size) of the QR Code based on the position
   * of the finder patterns and estimated module size.</p>
   */
  private static computeDimension(topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint,
    moduleSize: number/*float*/): number /*int*/ /*throws NotFoundException*/ {
    const tltrCentersDimension = MathUtils.round(ResultPoint.distance(topLeft, topRight) / moduleSize);
    const tlblCentersDimension = MathUtils.round(ResultPoint.distance(topLeft, bottomLeft) / moduleSize);
    let dimension = Math.floor((tltrCentersDimension + tlblCentersDimension) / 2) + 7;
    switch (dimension & 0x03) { // mod 4
      case 0:
        dimension++;
        break;
      // 1? do nothing
      case 2:
        dimension--;
        break;
      case 3:
        throw new NotFoundException('Dimensions could be not found.');
    }
    return dimension;
  }

  /**
   * <p>Computes an average estimated module size based on estimated derived from the positions
   * of the three finder patterns.</p>
   *
   * @param topLeft detected top-left finder pattern center
   * @param topRight detected top-right finder pattern center
   * @param bottomLeft detected bottom-left finder pattern center
   * @return estimated module size
   */
  protected calculateModuleSize(topLeft: ResultPoint,
    topRight: ResultPoint,
    bottomLeft: ResultPoint): number/*float*/ {
    // Take the average
    return (this.calculateModuleSizeOneWay(topLeft, topRight) +
      this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;
  }

  /**
   * <p>Estimates module size based on two finder patterns -- it uses
   * {@link #sizeOfBlackWhiteBlackRunBothWays(int, int, int, int)} to figure the
   * width of each, measuring along the axis between their centers.</p>
   */
  private calculateModuleSizeOneWay(pattern: ResultPoint, otherPattern: ResultPoint): number/*float*/ {
    const moduleSizeEst1: number /*float*/ = this.sizeOfBlackWhiteBlackRunBothWays(/*(int) */Math.floor(pattern.getX()),
        /*(int) */Math.floor(pattern.getY()),
        /*(int) */Math.floor(otherPattern.getX()),
        /*(int) */Math.floor(otherPattern.getY()));
    const moduleSizeEst2: number /*float*/ = this.sizeOfBlackWhiteBlackRunBothWays(/*(int) */Math.floor(otherPattern.getX()),
        /*(int) */Math.floor(otherPattern.getY()),
        /*(int) */Math.floor(pattern.getX()),
        /*(int) */Math.floor(pattern.getY()));
    if (isNaN(moduleSizeEst1)) {
      return moduleSizeEst2 / 7.0;
    }
    if (isNaN(moduleSizeEst2)) {
      return moduleSizeEst1 / 7.0;
    }
    // Average them, and divide by 7 since we've counted the width of 3 black modules,
    // and 1 white and 1 black module on either side. Ergo, divide sum by 14.
    return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
  }

  /**
   * See {@link #sizeOfBlackWhiteBlackRun(int, int, int, int)}; computes the total width of
   * a finder pattern by looking for a black-white-black run from the center in the direction
   * of another point (another finder pattern center), and in the opposite direction too.
   */
  private sizeOfBlackWhiteBlackRunBothWays(fromX: number /*int*/, fromY: number /*int*/, toX: number /*int*/, toY: number /*int*/): number/*float*/ {

    let result: number /*float*/ = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);

    // Now count other way -- don't run off image though of course
    let scale: number /*float*/ = 1.0;
    let otherToX = fromX - (toX - fromX);
    if (otherToX < 0) {
      scale = fromX / /*(float) */(fromX - otherToX);
      otherToX = 0;
    } else if (otherToX >= this.image.getWidth()) {
      scale = (this.image.getWidth() - 1 - fromX) / /*(float) */(otherToX - fromX);
      otherToX = this.image.getWidth() - 1;
    }
    let otherToY = /*(int) */Math.floor(fromY - (toY - fromY) * scale);

    scale = 1.0;
    if (otherToY < 0) {
      scale = fromY / /*(float) */(fromY - otherToY);
      otherToY = 0;
    } else if (otherToY >= this.image.getHeight()) {
      scale = (this.image.getHeight() - 1 - fromY) / /*(float) */(otherToY - fromY);
      otherToY = this.image.getHeight() - 1;
    }
    otherToX = /*(int) */Math.floor(fromX + (otherToX - fromX) * scale);

    result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);

    // Middle pixel is double-counted this way; subtract 1
    return result - 1.0;
  }

  /**
   * <p>This method traces a line from a point in the image, in the direction towards another point.
   * It begins in a black region, and keeps going until it finds white, then black, then white again.
   * It reports the distance from the start to this point.</p>
   *
   * <p>This is used when figuring out how wide a finder pattern is, when the finder pattern
   * may be skewed or rotated.</p>
   */
  private sizeOfBlackWhiteBlackRun(fromX: number /*int*/, fromY: number /*int*/, toX: number /*int*/, toY: number /*int*/): number/*float*/ {
    // Mild variant of Bresenham's algorithm
    // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
    const steep: boolean = Math.abs(toY - fromY) > Math.abs(toX - fromX);
    if (steep) {
      let temp = fromX;
      fromX = fromY;
      fromY = temp;
      temp = toX;
      toX = toY;
      toY = temp;
    }

    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    let error = -dx / 2;
    const xstep = fromX < toX ? 1 : -1;
    const ystep = fromY < toY ? 1 : -1;

    // In black pixels, looking for white, first or second time.
    let state = 0;
    // Loop up until x == toX, but not beyond
    const xLimit = toX + xstep;
    for (let x = fromX, y = fromY; x !== xLimit; x += xstep) {
      const realX = steep ? y : x;
      const realY = steep ? x : y;

      // Does current pixel mean we have moved white to black or vice versa?
      // Scanning black in state 0,2 and white in state 1, so if we find the wrong
      // color, advance to next state or end if we are in state 2 already
      if ((state === 1) === this.image.get(realX, realY)) {
        if (state === 2) {
          return MathUtils.distance(x, y, fromX, fromY);
        }
        state++;
      }

      error += dy;
      if (error > 0) {
        if (y === toY) {
          break;
        }
        y += ystep;
        error -= dx;
      }
    }
    // Found black-white-black; give the benefit of the doubt that the next pixel outside the image
    // is "white" so this last point at (toX+xStep,toY) is the right ending. This is really a
    // small approximation; (toX+xStep,toY+yStep) might be really correct. Ignore this.
    if (state === 2) {
      return MathUtils.distance(toX + xstep, toY, fromX, fromY);
    }
    // else we didn't find even black-white-black; no estimate is really possible
    return NaN;
  }

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
  protected findAlignmentInRegion(overallEstModuleSize: number/*float*/,
    estAlignmentX: number /*int*/,
    estAlignmentY: number /*int*/,
    allowanceFactor: number/*float*/): AlignmentPattern {
    // Look for an alignment pattern (3 modules in size) around where it
    // should be
    const allowance = /*(int) */Math.floor(allowanceFactor * overallEstModuleSize);
    const alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
    const alignmentAreaRightX = Math.min(this.image.getWidth() - 1, estAlignmentX + allowance);
    if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
      throw new NotFoundException('Alignment top exceeds estimated module size.');
    }

    const alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
    const alignmentAreaBottomY = Math.min(this.image.getHeight() - 1, estAlignmentY + allowance);
    if (alignmentAreaBottomY - alignmentAreaTopY < overallEstModuleSize * 3) {
      throw new NotFoundException('Alignment bottom exceeds estimated module size.');
    }

    const alignmentFinder = new AlignmentPatternFinder(
      this.image,
      alignmentAreaLeftX,
      alignmentAreaTopY,
      alignmentAreaRightX - alignmentAreaLeftX,
      alignmentAreaBottomY - alignmentAreaTopY,
      overallEstModuleSize,
      this.resultPointCallback
    );

    return alignmentFinder.find();
  }

}
