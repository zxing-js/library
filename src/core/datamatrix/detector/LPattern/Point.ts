export default class Point {
  x: number;
  y: number;

  constructor(x: number = null, y: number = null) {
    this.x = x;
    this.y = y;
  }

  static equals(a: Point, b: Point) {
    return a.x === b.x && a.y === b.y;
  }

  static unequals(a: Point, b: Point) {
    return !Point.equals(a, b);
  }

  static add(a: Point, b: Point): Point {
    return new Point(a.x + b.x, a.y + b.y);
  }

  static sub(a: Point, b: Point): Point {
    return new Point(a.x - b.x, a.y - b.y);
  }

  static multiplyBy(a: Point, s: number): Point {
    return new Point(s * a.x, s * a.y);
  }

  static divideBy(a: Point, d: number): Point {
    return new Point(a.x / d, a.y / d);
  }

  static mul(a: Point, b: Point): number {
    return a.x * b.x + a.y * b.y;
  }

  static distance(a: Point, b: Point): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }

  static round(p: Point): Point {
    return new Point(Math.round(p.x), Math.round(p.y));
  }
}
