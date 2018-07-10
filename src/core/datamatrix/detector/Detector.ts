import DecodeHintType from '../../DecodeHintType';
import ResultPoint from '../../ResultPoint';
import ResultPointCallback from '../../ResultPointCallback';
import BitMatrix from '../../common/BitMatrix';
import DetectorResult from '../../common/DetectorResult';
import GridSampler from '../../common/GridSampler';
import GridSamplerInstance from '../../common/GridSamplerInstance';
import PerspectiveTransform from '../../common/PerspectiveTransform';
import MathUtils from '../../common/detector/MathUtils';
import Version from '../decoder/Version';
import WhiteRectangleDetector from '../../common/detector/WhiteRectangleDetector';

import NotFoundException from '../../NotFoundException';

/*
 * Copyright 2008 ZXing authors
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

/**
 * <p>Encapsulates logic that can detect a Data Matrix Code in an image, even if the Data Matrix Code
 * is rotated or skewed, or partially obscured.</p>
 *
 * @author Sean Owen
 */
export default class Detector {

  private image: BitMatrix;
  private rectangleDetector: WhiteRectangleDetector;

  constructor(image: BitMatrix) {
    this.image = image;
    this.rectangleDetector = new WhiteRectangleDetector(image);
  }

  /**
   * <p>Detects a Data Matrix Code in an image.</p>
   *
   * @return {@link DetectorResult} encapsulating results of detecting a Data Matrix Code
   * @throws NotFoundException if no Data Matrix Code can be found
   */
  public detect(): DetectorResult {

    const cornerPoints = this.rectangleDetector.detect();
    const pointA = cornerPoints[0];
    const pointB = cornerPoints[1];
    const pointC = cornerPoints[2];
    const pointD = cornerPoints[3];

    // Point A and D are across the diagonal from one another,
    // as are B and C. Figure out which are the solid black lines
    // by counting transitions
    const transitions: any[] = [];
    transitions.push(this.transitionsBetween(pointA, pointB));
    transitions.push(this.transitionsBetween(pointA, pointC));
    transitions.push(this.transitionsBetween(pointB, pointD));
    transitions.push(this.transitionsBetween(pointC, pointD));
    transitions.sort(ResultPointsAndTransitions.resultPointsAndTransitionsComparator);

    // Sort by number of transitions. First two will be the two solid sides; last two
    // will be the two alternating black/white sides
    const lSideOne = transitions[0];
    const lSideTwo = transitions[1];

    // Figure out which point is their intersection by tallying up the number of times we see the
    // endpoints in the four endpoints. One will show up twice.
    const pointCount = new Map<ResultPoint, number>();
    Detector.increment(pointCount, lSideOne.getFrom());
    Detector.increment(pointCount, lSideOne.getTo());
    Detector.increment(pointCount, lSideTwo.getFrom());
    Detector.increment(pointCount, lSideTwo.getTo());

    let maybeTopLeft: ResultPoint | null = null;
    let bottomLeft: ResultPoint | null  = null;
    let maybeBottomRight: ResultPoint | null = null;
    for (let [point, value] of Array.from(pointCount.entries())) {
      if (value === 2) {
        bottomLeft = point; // this is definitely the bottom left, then -- end of two L sides
      } else {
        // Otherwise it's either top left or bottom right -- just assign the two arbitrarily now
        if (maybeTopLeft == null) {
          maybeTopLeft = point;
        } else {
          maybeBottomRight = point;
        }
      }
    }

    if (maybeTopLeft == null || bottomLeft == null || maybeBottomRight == null) {
      throw new NotFoundException();
    }

    // Bottom left is correct but top left and bottom right might be switched
    const corners = [ maybeTopLeft, bottomLeft, maybeBottomRight ];
    // Use the dot product trick to sort them out
    ResultPoint.orderBestPatterns(corners);

    // Now we know which is which:
    const bottomRight = corners[0];
    bottomLeft = corners[1];
    const topLeft = corners[2];

    // Which point didn't we find in relation to the "L" sides? that's the top right corner
    let topRight;
    if (!pointCount.has(pointA)) {
      topRight = pointA;
    } else if (!pointCount.has(pointB)) {
      topRight = pointB;
    } else if (!pointCount.has(pointC)) {
      topRight = pointC;
    } else {
      topRight = pointD;
    }

    // Next determine the dimension by tracing along the top or right side and counting black/white
    // transitions. Since we start inside a black module, we should see a number of transitions
    // equal to 1 less than the code dimension. Well, actually 2 less, because we are going to
    // end on a black module:

    // The top right point is actually the corner of a module, which is one of the two black modules
    // adjacent to the white module at the top right. Tracing to that corner from either the top left
    // or bottom right should work here.

    let dimensionTop = this.transitionsBetween(topLeft, topRight).getTransitions();
    let dimensionRight = this.transitionsBetween(bottomRight, topRight).getTransitions();

    if ((dimensionTop & 0x01) === 1) {
      // it can't be odd, so, round... up?
      dimensionTop++;
    }
    dimensionTop += 2;

    if ((dimensionRight & 0x01) === 1) {
      // it can't be odd, so, round... up?
      dimensionRight++;
    }
    dimensionRight += 2;

    let bits: BitMatrix;
    let correctedTopRight: ResultPoint;

    // Rectangular symbols are 6x16, 6x28, 10x24, 10x32, 14x32, or 14x44. If one dimension is more
    // than twice the other, it's certainly rectangular, but to cut a bit more slack we accept it as
    // rectangular if the bigger side is at least 7/4 times the other:
    if (4 * dimensionTop >= 7 * dimensionRight || 4 * dimensionRight >= 7 * dimensionTop) {
      // The matrix is rectangular

      correctedTopRight =
          this.correctTopRightRectangular(bottomLeft, bottomRight, topLeft, topRight, dimensionTop, dimensionRight);
      if (correctedTopRight == null) {
        correctedTopRight = topRight;
      }

      dimensionTop = this.transitionsBetween(topLeft, correctedTopRight).getTransitions();
      dimensionRight = this.transitionsBetween(bottomRight, correctedTopRight).getTransitions();

      if ((dimensionTop & 0x01) === 1) {
        // it can't be odd, so, round... up?
        dimensionTop++;
      }

      if ((dimensionRight & 0x01) === 1) {
        // it can't be odd, so, round... up?
        dimensionRight++;
      }

      bits = Detector.sampleGrid(this.image, topLeft, bottomLeft, bottomRight, correctedTopRight, dimensionTop, dimensionRight);

    } else {
      // The matrix is square

      const dimension = Math.min(dimensionRight, dimensionTop);
      // correct top right point to match the white module
      correctedTopRight = this.correctTopRight(bottomLeft, bottomRight, topLeft, topRight, dimension);
      if (correctedTopRight == null) {
        correctedTopRight = topRight;
      }

      // Redetermine the dimension using the corrected top right point
      let dimensionCorrected = Math.max(this.transitionsBetween(topLeft, correctedTopRight).getTransitions(),
                                        this.transitionsBetween(bottomRight, correctedTopRight).getTransitions());
      dimensionCorrected++;
      if ((dimensionCorrected & 0x01) === 1) {
        dimensionCorrected++;
      }

      bits = Detector.sampleGrid(this.image,
                        topLeft,
                        bottomLeft,
                        bottomRight,
                        correctedTopRight,
                        dimensionCorrected,
                        dimensionCorrected);
    }
    return new DetectorResult(bits, [topLeft, bottomLeft, bottomRight, correctedTopRight]);
  }

  /**
   * Calculates the position of the white top right module using the output of the rectangle detector
   * for a rectangular matrix
   */
  private correctTopRightRectangular(bottomLeft: ResultPoint,
                                                 bottomRight: ResultPoint,
                                                 topLeft: ResultPoint,
                                                 topRight: ResultPoint,
                                                 dimensionTop: number,
                                                 dimensionRight: number): ResultPoint {

    let corr = Detector.distance(bottomLeft, bottomRight) / dimensionTop;
    let norm = Detector.distance(topLeft, topRight);
    let cos = (topRight.getX() - topLeft.getX()) / norm;
    let sin = (topRight.getY() - topLeft.getY()) / norm;

    const c1 = new ResultPoint(topRight.getX() + corr * cos, topRight.getY() + corr * sin);

    corr = Detector.distance(bottomLeft, topLeft) / dimensionRight;
    norm = Detector.distance(bottomRight, topRight);
    cos = (topRight.getX() - bottomRight.getX()) / norm;
    sin = (topRight.getY() - bottomRight.getY()) / norm;

    const c2 = new ResultPoint(topRight.getX() + corr * cos, topRight.getY() + corr * sin);

    if (!this.isValid(c1)) {
      if (this.isValid(c2)) {
        return c2;
      }
      return null;
    }
    if (!this.isValid(c2)) {
      return c1;
    }

    const l1 = Math.abs(dimensionTop - this.transitionsBetween(topLeft, c1).getTransitions()) +
          Math.abs(dimensionRight - this.transitionsBetween(bottomRight, c1).getTransitions());
    const l2 = Math.abs(dimensionTop - this.transitionsBetween(topLeft, c2).getTransitions()) +
    Math.abs(dimensionRight - this.transitionsBetween(bottomRight, c2).getTransitions());

    if (l1 <= l2) {
      return c1;
    }

    return c2;
  }

  /**
   * Calculates the position of the white top right module using the output of the rectangle detector
   * for a square matrix
   */
  private correctTopRight(bottomLeft: ResultPoint,
                                      bottomRight: ResultPoint,
                                      topLeft: ResultPoint,
                                      topRight: ResultPoint,
                                      dimension: number): ResultPoint {

    let corr = Detector.distance(bottomLeft, bottomRight) / dimension;
    let norm = Detector.distance(topLeft, topRight);
    let cos = (topRight.getX() - topLeft.getX()) / norm;
    let sin = (topRight.getY() - topLeft.getY()) / norm;

    const c1 = new ResultPoint(topRight.getX() + corr * cos, topRight.getY() + corr * sin);

    corr = Detector.distance(bottomLeft, topLeft) / dimension;
    norm = Detector.distance(bottomRight, topRight);
    cos = (topRight.getX() - bottomRight.getX()) / norm;
    sin = (topRight.getY() - bottomRight.getY()) / norm;

    const c2 = new ResultPoint(topRight.getX() + corr * cos, topRight.getY() + corr * sin);

    if (!this.isValid(c1)) {
      if (this.isValid(c2)) {
        return c2;
      }
      return null;
    }
    if (!this.isValid(c2)) {
      return c1;
    }

    const l1 = Math.abs(this.transitionsBetween(topLeft, c1).getTransitions() -
                      this.transitionsBetween(bottomRight, c1).getTransitions());
    const l2 = Math.abs(this.transitionsBetween(topLeft, c2).getTransitions() -
                      this.transitionsBetween(bottomRight, c2).getTransitions());

    return l1 <= l2 ? c1 : c2;
  }

  private isValid(p: ResultPoint): boolean {
    return p.getX() >= 0 && p.getX() < this.image.getWidth() && p.getY() > 0 && p.getY() < this.image.getHeight();
  }

  private static distance(a: ResultPoint, b: ResultPoint): number {
    return MathUtils.round(ResultPoint.distance(a, b));
  }

  /**
   * Increments the Integer associated with a key by one.
   */
  private static increment(table: Map<ResultPoint, number>, key: ResultPoint): void {
    const value = table.get(key);
    table.set(key, value == null ? 1 : value + 1);
  }

  private static sampleGrid(image: BitMatrix ,
                                      topLeft: ResultPoint,
                                      bottomLeft: ResultPoint,
                                      bottomRight: ResultPoint,
                                      topRight: ResultPoint,
                                      dimensionX: number,
                                      dimensionY: number): BitMatrix {

    const sampler = GridSamplerInstance.getInstance();

    return sampler.sampleGrid(image,
                              dimensionX,
                              dimensionY,
                              0.5,
                              0.5,
                              dimensionX - 0.5,
                              0.5,
                              dimensionX - 0.5,
                              dimensionY - 0.5,
                              0.5,
                              dimensionY - 0.5,
                              topLeft.getX(),
                              topLeft.getY(),
                              topRight.getX(),
                              topRight.getY(),
                              bottomRight.getX(),
                              bottomRight.getY(),
                              bottomLeft.getX(),
                              bottomLeft.getY()
                            );
  }

  /**
   * Counts the number of black/white transitions between two points, using something like Bresenham's algorithm.
   */
  private transitionsBetween(from: ResultPoint, to: ResultPoint): ResultPointsAndTransitions {
    // See QR Code Detector, sizeOfBlackWhiteBlackRun()
    let fromX = from.getX() | 0;
    let fromY = from.getY() | 0;
    let toX = to.getX() | 0;
    let toY = to.getY() | 0;
    const steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
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
    const ystep = fromY < toY ? 1 : -1;
    const xstep = fromX < toX ? 1 : -1;
    let transitions = 0;
    let inBlack = this.image.get(steep ? fromY : fromX, steep ? fromX : fromY);
    for (let x = fromX, y = fromY; x !== toX; x += xstep) {
      const isBlack = this.image.get(steep ? y : x, steep ? x : y);
      if (isBlack !== inBlack) {
        transitions++;
        inBlack = isBlack;
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
    return new ResultPointsAndTransitions(from, to, transitions);
  }

  /**
   * Simply encapsulates two points and a number of transitions between them.
   */

  /**
   * Orders ResultPointsAndTransitions by number of transitions, ascending.
   */
}

class ResultPointsAndTransitions {

  private from: ResultPoint;
  private to: ResultPoint;
  private transitions: number;

  constructor(from: ResultPoint, to: ResultPoint, transitions: number) {
    this.from = from;
    this.to = to;
    this.transitions = transitions;
  }

  getFrom(): ResultPoint {
    return this.from;
  }

  getTo(): ResultPoint {
    return this.to;
  }

  getTransitions(): number {
    return this.transitions;
  }

  // @Override
  public toString() {
    return this.from + '/' + this.to + '/' + this.transitions;
  }

  public static resultPointsAndTransitionsComparator(o1: ResultPointsAndTransitions, o2: ResultPointsAndTransitions): number {
      return o1.getTransitions() - o2.getTransitions();
  }
}
