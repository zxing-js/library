export default class Point {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static equals(a: Point, b: Point) {
    return a.x === b.x && a.y === b.y; 
  }

  static add(a: Point, b: Point): Point {
    return new Point(a.x + b.x, a.y + b.y);
  }

  static sub(a: Point, b: Point): Point {
    return new Point(a.x - b.x, a.y - b.y);
  }

  static multiplyBy(a: Point, s: number): Point {
    return new Point(a.x * s, a.y * s);
  }

  static divideBy(a: Point, d: number): Point {
    return new Point(a.x / d, a.y / d);
  }

  static mul(a: Point, b: Point): number {
    return a.x * b.x + a.y * b.y;
  }

  static distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  static round(p: Point): Point {
    return new Point(Math.round(p.x), Math.round(p.y));
  }
}
