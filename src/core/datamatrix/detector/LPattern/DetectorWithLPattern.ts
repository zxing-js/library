import NotFoundException from '../../../../core/NotFoundException';
import BitMatrix from '../../../common/BitMatrix';
import DetectorResult from '../../../common/DetectorResult';
import GridSamplerInstance from '../../../common/GridSamplerInstance';
import ResultPoint from '../../../ResultPoint';
import { EdgeTracer } from './EdgeTracer';
import Point from './Point';
import { RegressionLine } from './RegressionLine';

/**
 * Ported from: ZXing CPP
 * https://github.com/nu-book/zxing-cpp/blob/2ceda95cba943b3b2ab30af3c90150c97e84d416/core/src/datamatrix/DMDetector.cpp#L442-L1072
 */
export default class DetectorWithLPattern {

  private image: BitMatrix;

  constructor(image: BitMatrix) {
    this.image = image;
  }

  /**
   * <p>Detects a Data Matrix Code in an image.</p>
   *
   * @return {@link DetectorResult} encapsulating results of detecting a Data Matrix Code
   * @throws NotFoundException if no Data Matrix Code can be found
   */
  public detect(): DetectorResult {
    return DetectorWithLPattern.DetectNew(this.image, false);
  }

  static SampleGrid(image: BitMatrix, tl: Point, bl: Point, br: Point, tr: Point, dimensionX: number, dimensionY: number): BitMatrix {
    // shrink shape by half a pixel to go from center of white pixel outside of code to the edge between white and black
    let moveHalfAPixel = (a: Point, b: Point) => {
      let a2b = Point.divideBy(Point.sub(b, a), Point.distance(a, b));
      a = Point.add(a, Point.multiplyBy(a2b, 0.5));
    };

    // move every point towards tr by half a pixel
    // reasoning: for very low res scans, the top and right border tend to be around half a pixel moved inward already.
    // for high res scans this half a pixel makes no difference anyway.
    moveHalfAPixel(tl, tr);
    moveHalfAPixel(bl, tr);
    moveHalfAPixel(br, tr);

    for (let p of [tl, bl, br, tr]) {
      p = Point.add(p, new Point(0.5, 0.5));
    }

    let border = 0.0;

    return GridSamplerInstance.getInstance().sampleGrid(
      image,
      dimensionX, dimensionY,
      border, border,
      dimensionX - border, border,
      dimensionX - border, dimensionY - border,
      border,	dimensionY - border,
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y);
  }

  static DetectNew(image: BitMatrix, tryRotate: boolean): DetectorResult {
    // walk to the left at first
    for (let startDirection of [new Point(-1, 0), new Point(1, 0), new Point(0, -1), new Point(0, 1)]) {

      let startTracer = new EdgeTracer(image, new Point(image.getWidth() / 2, image.getHeight() / 2), startDirection);

      while (startTracer.step()) {
        // go forward until we reach a white/black border
        if (!startTracer.isEdgeBehind())
          continue;

        let tl: Point, bl: Point, br: Point, tr: Point;
        let lineL: RegressionLine, lineB: RegressionLine, lineR: RegressionLine, lineT: RegressionLine;

        let t = startTracer;

        // follow left leg upwards
        t.setDirection(t.right());
        if (!t.traceLine(t.right(), lineL))
          continue;

        tl = t.traceCorner(t.right());
        lineL.reverse();
        let tlTracer = t;

        // follow left leg downwards
        t = startTracer;
        t.setDirection(t.left());
        if (!t.traceLine(t.left(), lineL))
          continue;

        if (!lineL.isValid())
          t.updateDirectionFromOrigin(tl);
        let up = t.back();
        bl = t.traceCorner(t.left());

        tlTracer.setDirection(t.front());

        // follow bottom leg right
        if (!t.traceLine(t.left(), lineB))
          continue;

        if (!lineL.isValid())
          t.updateDirectionFromOrigin(bl);
        let right = t.front();
        br = t.traceCorner(t.left());

        let lenL = Point.distance(tl, bl);
        let lenB = Point.distance(bl, br);
        if (lenL < 10 || lenB < 10 || lenB < lenL/4 || lenB > lenL*8)
          continue;

        let maxStepSize = (lenB / 5 + 1); // datamatrix dim is at least 10x10

        // at this point we found a plausible L-shape and are now looking for the b/w pattern at the top and right:
        // follow top row right 'half way' (4 gaps), see traceGaps break condition with 'invalid' line
        tlTracer.setDirection(right);
        if (!tlTracer.traceGaps(tlTracer.right(), lineT, maxStepSize, new RegressionLine()))
          continue;

        maxStepSize = Math.max(lineT.length / 4, (lenL / 5 + 1));

        // follow up until we reach the top line
        t.setDirection(up);
        if (!t.traceGaps(t.left(), lineR, maxStepSize, lineT))
          continue;

        // continue top row right until we cross the right line
        if (!tlTracer.traceGaps(tlTracer.right(), lineT, maxStepSize, lineR))
          continue;

        tr = t.traceCorner(t.left());

        let lenT = Point.distance(tl, tr);
        let lenR = Point.distance(tr, br);

        if (Math.abs(lenT - lenB) / lenB > 0.5 || Math.abs(lenR - lenL) / lenL > 0.5 ||
          lineT.points.length < 5 || lineR.points.length < 5)
          continue;

        // printf("L: %f, %f ^ %f, %f > %f, %f (%d : %d : %d : %d)\n", bl.x, bl.y,
        //        tl.x - bl.x, tl.y - bl.y, br.x - bl.x, br.y - bl.y, (int)lenL, (int)lenB, (int)lenT, (int)lenR);

        for (let l of [lineL, lineB, lineT, lineR]) {
          l.evaluate(true);
        }

        // find the bounding box corners of the code with sub-pixel precision by intersecting the 4 border lines
        bl = RegressionLine.intersect(lineB, lineL);
        tl = RegressionLine.intersect(lineT, lineL);
        tr = RegressionLine.intersect(lineT, lineR);
        br = RegressionLine.intersect(lineB, lineR);

        let dimT: number, dimR: number;
        let fracT: number, fracR: number;
        let splitDouble = (d: number, i: number, f: number) => {
          i = Math.abs(d) > 0 ? (d + 0.5) : 0;
          f = Math.abs(d) > 0 ? Math.abs(d - i) : Infinity;
        };

        splitDouble(lineT.modules(tl, tr), dimT, fracT);
        splitDouble(lineR.modules(br, tr), dimR, fracR);

        // printf("L: %f, %f ^ %f, %f > %f, %f ^> %f, %f\n", bl.x, bl.y,
        //        tl.x - bl.x, tl.y - bl.y, br.x - bl.x, br.y - bl.y, tr.x, tr.y);
        // printf("dim: %d x %d\n", dimT, dimR);

        // if we have an invalid rectangular data matrix dimension, we try to parse it by assuming a square
        // we use the dimension that is closer to an integral value
        if (dimT < 2 * dimR || dimT > 4 * dimR)
          dimT = dimR = fracR < fracT ? dimR : dimT;

        // the dimension is 2x the number of black/white transitions
        dimT *= 2;
        dimR *= 2;

        if (dimT < 10 || dimT > 144 || dimR < 8 || dimR > 144 )
          continue;

        let bits = this.SampleGrid(image, tl, bl, br, tr, dimT, dimR);

        // TODO: Debug Output
        // printf("modules top: %d, right: %d\n", dimT, dimR);
        // printBitMatrix(bits);

        // auto border = lineT.points();
        // border.insert(border.end(), lineR.points().begin(), lineR.points().end());
        // dumpDebugPPM(image, "binary.pnm", border);

        // TODO: Why do we need to check this?
        // if (bits.empty())
        //   continue;

        return new DetectorResult(bits, [
          new ResultPoint(tl.x, tl.y),
          new ResultPoint(bl.x, bl.y),
          new ResultPoint(br.x, br.y),
          new ResultPoint(tr.x, tr.y),
        ]);
      }

      // reached border of image -> try next scan direction
      if (!tryRotate)
        break; // only test left direction
    }

    // dumpDebugPPM<PointF>(image, "binary.pnm");//, { tl, bl, br, tr });

    throw new NotFoundException();
  }
}
