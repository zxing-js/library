import BitMatrix from '../../../common/BitMatrix';
import Point from './Point';
import { RegressionLine } from './RegressionLine';

export enum StepResult {
  FOUND,
  OPEN_END,
  CLOSED_END
}

export enum Value {
  INVALID,
  WHITE,
  BLACK
}

export class EdgeTracer {
  private image: BitMatrix;
  private p: Point; // current position
  private d: Point; // current direction

  static mainDirection(d: Point): Point { return Math.abs(d.x) > Math.abs(d.y) ? new Point(d.x, 0) : new Point(0, d.y); }

  public pointIsIn(p: Point): boolean {
    const b = 0;
    return b <= p.x
      && p.x < this.image.getWidth() - b
      && b <= p.y && p.y < this.image.getHeight() - b;
  }

  public isIn() { return this.pointIsIn(this.p); }

  public getAt(p: Point): any {
    if (!this.pointIsIn(p))
      return Value.INVALID;
    const q: Point = Point.round(p);
    return this.image.get(q.x, q.y) ? Value.BLACK : Value.WHITE;
  }

  public blackAt(p: Point): boolean { return this.getAt(p) === Value.BLACK; }
  public whiteAt(p: Point): boolean { return this.getAt(p) === Value.WHITE; }

  public isEdge(pos: Point, dir: Point): boolean { return this.whiteAt(pos) && this.blackAt(Point.add(pos, dir)); }

  traceStep(dEdge: Point, maxStepSize: number, goodDirection: boolean): StepResult {
    dEdge = EdgeTracer.mainDirection(dEdge);
    for (let breadth = 1; breadth <= (goodDirection ? 1 : (maxStepSize === 1 ? 2 : 3)); ++breadth)
      for (let step = 1; step <= maxStepSize; ++step)
        for (let i = 0; i <= 2 * (step / 4 + 1) * breadth; ++i) {
          let pEdge = Point.add(
            Point.add(
              this.p,
              Point.multiplyBy(this.d, step)
            ),
            Point.multiplyBy(dEdge, (i & 1 ? (i + 1) / 2 : -i / 2))
          );
          this.log(pEdge);

          if (!this.blackAt(Point.add(pEdge, dEdge)))
            continue;

          // found black pixel -> go 'outward' until we hit the b/w border
          for (let j = 0; j < Math.max(maxStepSize, 3) && this.pointIsIn(pEdge); ++j) {
            if (this.whiteAt(pEdge)) {
              this.p = Point.round(pEdge);
              return StepResult.FOUND;
            }
            pEdge = Point.sub(pEdge, dEdge);
            if (this.blackAt(Point.sub(pEdge, this.d)))
              pEdge = Point.sub(pEdge, this.d);
            this.log(pEdge);
          }
          // no valid b/w border found within reasonable range
          return StepResult.CLOSED_END;
        }
    return StepResult.OPEN_END;
  }

  _log: BitMatrix;

  // TODO: IF DEBUG
  public log(p: Point): void {
    if (this._log.getHeight() !== this.image.getHeight() || this._log.getWidth() !== this.image.getWidth())
      this._log = new BitMatrix(this.image.getWidth(), this.image.getHeight());
    let q = Point.round(p);
    if (this.pointIsIn(q))
      this._log.set(q.x, q.y);
  }

  constructor(img: BitMatrix, p: Point, d: Point) {
    this.image = img;
    this.p = p;
    this.d = d;
  }

  step(s = 1): boolean {
    this.p = Point.add(this.p, Point.multiplyBy(this.d, s));
    this.log(this.p);
    return this.pointIsIn(this.p);
  }

  setDirection(dir: Point) {
    this.d = Point.divideBy(dir, Math.max(Math.abs(dir.x), Math.abs(dir.y)));
  }

  updateDirectionFromOrigin(origin: Point): boolean {
    let old_d = this.d;
    this.setDirection(Point.sub(this.p, origin));
    // it the new direction is pointing "backward", i.e. angle(new, old) > pi/2 -> break
    if (Point.mul(this.d, old_d) < 0)
      return false;
    // printf("new dir: %f, %f\n", d.x, d.y);
    // make sure d stays in the same quadrant to prevent an infinite loop
    if (EdgeTracer.mainDirection(this.d) !== EdgeTracer.mainDirection(old_d))
      this.d = Point.add(EdgeTracer.mainDirection(old_d), Point.multiplyBy(EdgeTracer.mainDirection(this.d), 0.99));
    return true;
  }

  front(): Point { return this.d; }
  back(): Point { return new Point(-this.d.x, -this.d.y); }
  right(): Point { return new Point(-this.d.y, this.d.x); }
  left(): Point { return new Point(this.d.y, -this.d.x); }

  isEdgeBehind(): boolean { return this.isEdge(this.p, this.back()); }

  traceLine(dEdge: Point, line: RegressionLine): boolean {
    do {
      this.log(this.p);
      line.add(Point.round(this.p));
      if (line.points.length % 30 === 10) {
        line.evaluate();
        if (!this.updateDirectionFromOrigin(Point.add(Point.sub(this.p, line.project(this.p)), line.points[0])))
          return false;
      }
      let stepResult = this.traceStep(dEdge, 1, line.isValid());
      if (stepResult !== StepResult.FOUND)
        return stepResult === StepResult.OPEN_END;
    } while (true);
  }


  traceGaps(dEdge: Point, line: RegressionLine, maxStepSize: number, finishLine: RegressionLine): boolean {
    line.setDirectionInward(dEdge);
    let gaps = 0;
    do {
      this.log(this.p);
      let next_p = Point.round(this.p);
      let diff = line.points.length === 0 ? new Point() : Point.sub(next_p, line.points[line.points.length - 1]);

      if (line.points.length === 0 || line.points[line.points.length - 1] !== next_p)
        line.add(next_p);

      if (Math.abs(Point.mul(diff, this.d)) > 1) {
        ++gaps;
        if (line.length > 5) {
          line.evaluate(true);
          if (!this.updateDirectionFromOrigin(Point.add(Point.sub(this.p, line.project(this.p)), line.points[0])))
            return false;
        }
        // the minimum size is 10x10 -> 4 gaps
        // TODO: maybe switch to termination condition based on bottom line length
        if (!finishLine.isValid() && gaps >= 4)
          return true;
      }
      if (line.isValid()) {
        // if we are drifting towards the inside of the code, pull the current position back out onto the line
        if (line.signedDistance(this.p) > 2)
          this.p = Point.add(line.project(this.p), this.d);
      }


      if (finishLine.isValid())
        maxStepSize = Math.min(maxStepSize, finishLine.signedDistance(this.p));


      let stepResult = this.traceStep(dEdge, maxStepSize, line.isValid());
      if (stepResult !== StepResult.FOUND)
        return stepResult === StepResult.OPEN_END;
    } while (true);
  }


  traceCorner(dir: Point): Point {
    this.step();
    let ret = this.p = Point.round(this.p);
    let _tmp = dir;
    dir = this.d;
    this.d = _tmp;
    this.traceStep(Point.multiplyBy(dir, -1), 2, false);
    // printf("turn: %f x %f -> %f, %f\n", p.x, p.y, d.x, d.y);
    return ret;
  }
}
