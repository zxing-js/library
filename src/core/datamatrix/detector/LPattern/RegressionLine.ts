import Point from './Point';

export class RegressionLine {

  private _points: Point[];
  private _directionInward: Point;
  private a: number;
  private b: number;
  private c: number;

  static intersect(l1: RegressionLine, l2: RegressionLine): Point {
    const d = l1.a * l2.b - l1.b * l2.a;
    const x = (l1.c * l2.b - l1.b * l2.c) / d;
    const y = (l1.a * l2.c - l1.c * l2.a) / d;
    return new Point(x, y);
  }

  public _evaluate(ps: Point[]): void {
    const allSummarized: Point = ps.reduce((acc, point) => Point.add(acc, point), new Point());
    const mean: Point = Point.divideBy(allSummarized, ps.length);

    let sumXX = 0, sumYY = 0, sumXY = 0;
    ps.forEach((p) => {
      sumXX += (p.x - mean.x) * (p.x - mean.x);
      sumYY += (p.y - mean.y) * (p.y - mean.y);
      sumXY += (p.x - mean.x) * (p.y - mean.y);
    });

    if (sumYY >= sumXX) {
      this.a = +sumYY / Math.sqrt(sumYY * sumYY + sumXY * sumXY);
      this.b = -sumXY / Math.sqrt(sumYY * sumYY + sumXY * sumXY);
    } else {
      this.a = +sumXY / Math.sqrt(sumXX * sumXX + sumXY * sumXY);
      this.b = -sumXX / Math.sqrt(sumXX * sumXX + sumXY * sumXY);
    }
    if (Point.mul(this._directionInward, this.normal()) < 0) {
      this.a = -this.a;
      this.b = -this.b;
    }
    this.c = Point.mul(this.normal(), mean);
  }

  static average(c: number[], filter: (x: number) => boolean): number {
    let sum = 0;
    let num = 0;
    for (let v of c)
      if (filter(v)) {
        sum += v;
        ++num;
      }
    return sum / num;
  }

  get points(): Point[] {
    return this._points;
  }

  get length(): number {
    return this.points.length >= 2
      ? Point.distance(this._points[0], this._points[this._points.length - 1])
      : 0;
  }

  public isValid(): boolean { return this.a !== undefined; }
  public normal(): Point { return new Point(this.a, this.b); }
  public project(p: Point): Point {
    return Point.sub(
      p,
      Point.multiplyBy(this.normal(), Point.mul(this.normal(), p) - this.c)
    );
  }
  public signedDistance(p: Point): number {
    return (Point.mul(this.normal(), p) - this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
  }
  public reverse() { this._points = this._points.reverse(); }
  public add(p: Point) { this._points.push(p); }
  public setDirectionInward(d: Point) { this._directionInward = d; }

  public evaluate(clean = false) {
    let ps = this._points;
    this._evaluate(ps);
    if (clean) {
      let old_points_length;
      while (true) {
        old_points_length = this._points.length;
        this._points = this._points.filter(p => this.signedDistance(p) > 1.5);
        if (old_points_length === this._points.length)
          break;

        // printf("removed %zu points\n", old_points_size - _points.size());
        this._evaluate(this._points);
      }
    }
  }

  public modules(beg: Point, end: Point): number {
    // assert(this._points.length > 3);

    let gapSizes: number[];

    // calculate the distance between the points projected onto the regression line
    for (let i = 1; i < this._points.length; ++i)
      gapSizes.push(Point.distance(this.project(this._points[i]), this.project(this._points[i - 1])));


    // calculate the (average) distance of two adjacent pixels
    const unitPixelDist: number = RegressionLine.average(gapSizes, (dist) => { return 0.75 < dist && dist < 1.5; });

    // calculate the width of 2 modules (first black pixel to first black pixel)
    let sum = Point.distance(beg, this.project(this._points[0])) - unitPixelDist;
    let i = gapSizes[0];
    for (let dist of gapSizes) {
      sum += dist;
      if (dist > 1.9 * unitPixelDist) {
        i += 1;
        gapSizes[i] = sum;
        sum = 0;
      }
    }
    i += 1;
    gapSizes[i] = sum + Point.distance(end, this.project(this._points[this._points.length - 1]));
    gapSizes = gapSizes.slice(0, i);
    let lineLength: number = Point.distance(beg, end) - unitPixelDist;
    let meanGapSize: number = lineLength / gapSizes.length;

    // printf("unit pixel dist: %f\n", unitPixelDist);
    // printf("lineLength: %f, meanGapSize: %f, gaps: %lu\n", lineLength, meanGapSize, gapSizes.size());
    meanGapSize = RegressionLine.average(gapSizes, (dist) => { return Math.abs(dist - meanGapSize) < meanGapSize / 2; });
    // printf("lineLength: %f, meanGapSize: %f, gaps: %lu\n", lineLength, meanGapSize, gapSizes.size());
    return lineLength / meanGapSize;
  }
}
