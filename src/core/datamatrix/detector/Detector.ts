import BitMatrix from '../../common/BitMatrix';
import WhiteRectangleDetector from '../../common/detector/WhiteRectangleDetector';
import DetectorResult from '../../common/DetectorResult';
import GridSamplerInstance from '../../common/GridSamplerInstance';
import NotFoundException from '../../NotFoundException';
import { float, int } from '../../../customTypings';
import ResultPoint from '../../ResultPoint';


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
    this.rectangleDetector = new WhiteRectangleDetector(this.image);
  }

  /**
   * <p>Detects a Data Matrix Code in an image.</p>
   *
   * @return {@link DetectorResult} encapsulating results of detecting a Data Matrix Code
   * @throws NotFoundException if no Data Matrix Code can be found
   */
  public detect(): DetectorResult {


    const cornerPoints = this.rectangleDetector.detect();

    let points = this.detectSolid1(cornerPoints);
    points = this.detectSolid2(points);
    points[3] = this.correctTopRight(points);
    if (!points[3]) {
       throw new NotFoundException();
    }
    points = this.shiftToModuleCenter(points);

    const topLeft = points[0];
    const bottomLeft = points[1];
    const bottomRight = points[2];
    const topRight = points[3];

    let dimensionTop = this.transitionsBetween(topLeft, topRight) + 1;
    let dimensionRight = this.transitionsBetween(bottomRight, topRight) + 1;
    if ((dimensionTop & 0x01) === 1) {
      dimensionTop += 1;
    }
    if ((dimensionRight & 0x01) === 1) {
      dimensionRight += 1;
    }

    if (4 * dimensionTop < 7 * dimensionRight && 4 * dimensionRight < 7 * dimensionTop) {
      // The matrix is square
      dimensionTop = dimensionRight = Math.max(dimensionTop, dimensionRight);
    }

    let bits = Detector.sampleGrid(this.image,
                                topLeft,
                                bottomLeft,
                                bottomRight,
                                topRight,
                                dimensionTop,
                                dimensionRight);

    return new DetectorResult(bits, [topLeft, bottomLeft, bottomRight, topRight]);
  }

  private static shiftPoint(point: ResultPoint, to: ResultPoint, div: float): ResultPoint {
    let x = (to.getX() - point.getX()) / (div + 1);
    let y = (to.getY() - point.getY()) / (div + 1);
    return new ResultPoint(point.getX() + x, point.getY() + y);
  }

  private static moveAway(point: ResultPoint, fromX: float, fromY: float): ResultPoint {
    let x = point.getX();
    let y = point.getY();

    if (x < fromX) {
      x -= 1;
    } else {
      x += 1;
    }

    if (y < fromY) {
      y -= 1;
    } else {
      y += 1;
    }

    return new ResultPoint(x, y);
  }

  /**
   * Detect a solid side which has minimum transition.
   */
  private detectSolid1(cornerPoints: ResultPoint[]): ResultPoint[] {
    // 0  2
    // 1  3
    let pointA = cornerPoints[0];
    let pointB = cornerPoints[1];
    let pointC = cornerPoints[3];
    let pointD = cornerPoints[2];

    let trAB = this.transitionsBetween(pointA, pointB);
    let trBC = this.transitionsBetween(pointB, pointC);
    let trCD = this.transitionsBetween(pointC, pointD);
    let trDA = this.transitionsBetween(pointD, pointA);

    // 0..3
    // :  :
    // 1--2
    let min = trAB;
    let points = [pointD, pointA, pointB, pointC];
    if (min > trBC) {
      min = trBC;
      points[0] = pointA;
      points[1] = pointB;
      points[2] = pointC;
      points[3] = pointD;
    }
    if (min > trCD) {
      min = trCD;
      points[0] = pointB;
      points[1] = pointC;
      points[2] = pointD;
      points[3] = pointA;
    }
    if (min > trDA) {
      points[0] = pointC;
      points[1] = pointD;
      points[2] = pointA;
      points[3] = pointB;
    }

    return points;
  }

  /**
   * Detect a second solid side next to first solid side.
   */
  private detectSolid2(points: ResultPoint[]): ResultPoint[] {
    // A..D
    // :  :
    // B--C
    let pointA = points[0];
    let pointB = points[1];
    let pointC = points[2];
    let pointD = points[3];

    // Transition detection on the edge is not stable.
    // To safely detect, shift the points to the module center.
    let tr = this.transitionsBetween(pointA, pointD);
    let pointBs = Detector.shiftPoint(pointB, pointC, (tr + 1) * 4);
    let pointCs = Detector.shiftPoint(pointC, pointB, (tr + 1) * 4);
    let trBA = this.transitionsBetween(pointBs, pointA);
    let trCD = this.transitionsBetween(pointCs, pointD);

    // 0..3
    // |  :
    // 1--2
    if (trBA < trCD) {
      // solid sides: A-B-C
      points[0] = pointA;
      points[1] = pointB;
      points[2] = pointC;
      points[3] = pointD;
    } else {
      // solid sides: B-C-D
      points[0] = pointB;
      points[1] = pointC;
      points[2] = pointD;
      points[3] = pointA;
    }

    return points;
  }

  /**
   * Calculates the corner position of the white top right module.
   */
  private correctTopRight(points: ResultPoint[]): ResultPoint {
    // A..D
    // |  :
    // B--C
    let pointA = points[0];
    let pointB = points[1];
    let pointC = points[2];
    let pointD = points[3];

    // shift points for safe transition detection.
    let trTop = this.transitionsBetween(pointA, pointD);
    let trRight = this.transitionsBetween(pointB, pointD);
    let pointAs = Detector.shiftPoint(pointA, pointB, (trRight + 1) * 4);
    let pointCs = Detector.shiftPoint(pointC, pointB, (trTop + 1) * 4);

    trTop = this.transitionsBetween(pointAs, pointD);
    trRight = this.transitionsBetween(pointCs, pointD);

    let candidate1 = new ResultPoint(
      pointD.getX() + (pointC.getX() - pointB.getX()) / (trTop + 1),
      pointD.getY() + (pointC.getY() - pointB.getY()) / (trTop + 1));
      let candidate2 = new ResultPoint(
      pointD.getX() + (pointA.getX() - pointB.getX()) / (trRight + 1),
      pointD.getY() + (pointA.getY() - pointB.getY()) / (trRight + 1));

    if (!this.isValid(candidate1)) {
      if (this.isValid(candidate2)) {
        return candidate2;
      }
      return null;
    }
    if (!this.isValid(candidate2)) {
      return candidate1;
    }

    let sumc1 = this.transitionsBetween(pointAs, candidate1) + this.transitionsBetween(pointCs, candidate1);
    let sumc2 = this.transitionsBetween(pointAs, candidate2) + this.transitionsBetween(pointCs, candidate2);

    if (sumc1 > sumc2) {
      return candidate1;
    } else {
      return candidate2;
    }
  }

  /**
   * Shift the edge points to the module center.
   */
  private shiftToModuleCenter(points: ResultPoint[]): ResultPoint[] {
    // A..D
    // |  :
    // B--C
    let pointA = points[0];
    let pointB = points[1];
    let pointC = points[2];
    let pointD = points[3];

    // calculate pseudo dimensions
    let dimH = this.transitionsBetween(pointA, pointD) + 1;
    let dimV = this.transitionsBetween(pointC, pointD) + 1;

    // shift points for safe dimension detection
    let pointAs = Detector.shiftPoint(pointA, pointB, dimV * 4);
    let pointCs = Detector.shiftPoint(pointC, pointB, dimH * 4);

    //  calculate more precise dimensions
    dimH = this.transitionsBetween(pointAs, pointD) + 1;
    dimV = this.transitionsBetween(pointCs, pointD) + 1;
    if ((dimH & 0x01) === 1) {
      dimH += 1;
    }
    if ((dimV & 0x01) === 1) {
      dimV += 1;
    }

    // WhiteRectangleDetector returns points inside of the rectangle.
    // I want points on the edges.
    let centerX = (pointA.getX() + pointB.getX() + pointC.getX() + pointD.getX()) / 4;
    let centerY = (pointA.getY() + pointB.getY() + pointC.getY() + pointD.getY()) / 4;
    pointA = Detector.moveAway(pointA, centerX, centerY);
    pointB = Detector.moveAway(pointB, centerX, centerY);
    pointC = Detector.moveAway(pointC, centerX, centerY);
    pointD = Detector.moveAway(pointD, centerX, centerY);

    let pointBs: ResultPoint;
    let pointDs: ResultPoint;

    // shift points to the center of each modules
    pointAs = Detector.shiftPoint(pointA, pointB, dimV * 4);
    pointAs = Detector.shiftPoint(pointAs, pointD, dimH * 4);
    pointBs = Detector.shiftPoint(pointB, pointA, dimV * 4);
    pointBs = Detector.shiftPoint(pointBs, pointC, dimH * 4);
    pointCs = Detector.shiftPoint(pointC, pointD, dimV * 4);
    pointCs = Detector.shiftPoint(pointCs, pointB, dimH * 4);
    pointDs = Detector.shiftPoint(pointD, pointC, dimV * 4);
    pointDs = Detector.shiftPoint(pointDs, pointA, dimH * 4);

    return [pointAs, pointBs, pointCs, pointDs];
  }

  private isValid(p: ResultPoint): boolean {
    return p.getX() >= 0 && p.getX() < this.image.getWidth() && p.getY() > 0 && p.getY() < this.image.getHeight();
  }

  private static sampleGrid(image: BitMatrix,
                                      topLeft: ResultPoint,
                                      bottomLeft: ResultPoint,
                                      bottomRight: ResultPoint,
                                      topRight: ResultPoint,
                                      dimensionX: int,
                                      dimensionY: int): BitMatrix {

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
                              bottomLeft.getY());
  }

  /**
   * Counts the number of black/white transitions between two points, using something like Bresenham's algorithm.
   */
  private transitionsBetween(from: ResultPoint, to: ResultPoint): int {
    // See QR Code Detector, sizeOfBlackWhiteBlackRun()
    let fromX = Math.trunc(from.getX());
    let fromY = Math.trunc(from.getY());
    let toX = Math.trunc(to.getX());
    let toY = Math.trunc(to.getY());
    let steep: boolean = Math.abs(toY - fromY) > Math.abs(toX - fromX);
    if (steep) {
      let temp = fromX;
      fromX = fromY;
      fromY = temp;
      temp = toX;
      toX = toY;
      toY = temp;
    }

    let dx = Math.abs(toX - fromX);
    let dy = Math.abs(toY - fromY);
    let error = -dx / 2;
    let ystep = fromY < toY ? 1 : -1;
    let xstep = fromX < toX ? 1 : -1;
    let transitions = 0;
    let inBlack: boolean = this.image.get(steep ? fromY : fromX, steep ? fromX : fromY);
    for (let x: int = fromX, y = fromY; x !== toX; x += xstep) {
      let isBlack: boolean = this.image.get(steep ? y : x, steep ? x : y);
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
    return transitions;
  }
}
