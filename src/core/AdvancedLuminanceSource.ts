import InvertedLuminanceSource from './InvertedLuminanceSource';
import LuminanceSource from './LuminanceSource';
import IllegalArgumentException from './IllegalArgumentException';

/** Used to determine how to calculate luminance from a given source. In JavaScript `0xFF` is identical to `255`. */
export enum ColorFormat {
  /** Luminance represented as a hexadecimal in the range `0x00 - 0xFF`. */
  Luminance,
  /** Color is formatted as `[R, G, B]` where numeric range is `0x00 - 0xFF`. */
  RGBMatrix,
  /** Color is formatted as `[R, G, B, A]` where numeric range is `0x00 - 0xFF`. */
  RGBAMatrix,
  /** Color is formatted as `0xRRGGBB` where hexadecimal range is `0x00 - 0xFF`. */
  RGBHex,
  /** Color is formatted as `0xAARRGGBB` where hexadecimal range is `0x00 - 0xFF`. */
  RGBAStartHex,
  /** Color is formatted as `0xRRGGBBAA` where hexadecimal range is `0x00 - 0xFF`. */
  RGBAEndHex,
  /** Color is formatted as `[H, S, L]` where numeric range of L is `0 - 100`. */
  HSLMatrix,
  /** Color is formatted as `[H, S, L, A]` where numeric range of L is `0 - 100`. */
  HSLAMatrix,
}

/**
 * Used instead of HTMLCanvasElementLuminanceSource in cases where DOM is not available e.g. web workers.
 * @note does not currently support cropping of image buffer.
 */
export default class AdvancedLuminanceSource extends LuminanceSource {
  private luminances: Uint8ClampedArray;

  public constructor(data: Uint8ClampedArray | Int32Array | Int8Array, width: number, height: number, format: ColorFormat) {
    super(width, height);
    this.luminances = AdvancedLuminanceSource.toLuminanceBuffer(data, width, height, format);
  }

  private static rgbaToLuminance(r: number, g: number, b: number, a = 0xFF) {
    if (a === 0) return 0xFF;
    // Calculate green-favouring average cheaply
    return ((r + g*2 + b) / 4) & 0xFF;
  }

  private static toLuminanceBuffer(
    data: Uint8ClampedArray | Int32Array | Int8Array,
    width: number,
    height: number,
    format: ColorFormat,
  ): Uint8ClampedArray {
    const luminances = new Uint8ClampedArray(width * height);
    let sequence = 1;
    if (format === ColorFormat.RGBMatrix || format === ColorFormat.HSLMatrix) sequence = 3;
    if (format === ColorFormat.RGBAMatrix || format === ColorFormat.HSLAMatrix) sequence = 4;

    for (let i = 0, j = 0, length = data.length; i < length; i += sequence, j++) {
      let luminance;
      switch (format) {
        case ColorFormat.RGBMatrix:
          luminance = AdvancedLuminanceSource.rgbaToLuminance(data[i], data[i + 1], data[i + 2]);
          break;
        case ColorFormat.RGBAMatrix:
          luminance = AdvancedLuminanceSource.rgbaToLuminance(data[i], data[i + 1], data[i + 2], data[i + 3]);
          break;
        case ColorFormat.RGBHex:
          luminance = AdvancedLuminanceSource.rgbaToLuminance(
            data[i] >> 16 & 0xff, data[i] >> 8 & 0xff, data[i] & 0xff
          );
          break;
        case ColorFormat.RGBAStartHex:
          luminance = AdvancedLuminanceSource.rgbaToLuminance(
            data[i] >> 16 & 0xff, data[i] >> 8 & 0xff, data[i] & 0xff, data[i] >> 24 & 0xff
          );
          break;
        case ColorFormat.RGBAEndHex:
          luminance = AdvancedLuminanceSource.rgbaToLuminance(
            data[i] >> 24 & 0xff, data[i] >> 16 & 0xff, data[i] >> 8 & 0xff, data[i] & 0xff
          );
          break;
        case ColorFormat.HSLMatrix:
          luminance = data[i + 2] / 100 * 0xff;
          break;
        case ColorFormat.HSLAMatrix:
          if (data[i + 3] === 0) luminance = 0xff;
          else luminance = data[i + 2] / 100 * 0xff;
          break;
        case ColorFormat.Luminance:
        default:
          luminance = data[i];
          break;
      }
      luminances[j] = luminance;
    }

    return luminances;
  }

  /** @inheritdoc */
  public getRow(y: number, row: Uint8ClampedArray): Uint8ClampedArray {
    if (y < 0 || y >= this.getHeight()) {
      throw new IllegalArgumentException(
        'Requested row is outside the image: ' + y
      );
    }
    const width: number = this.getWidth();
    const start = y * width;
    if (row === null) {
      row = this.luminances.slice(start, start + width);
    } else {
      if (row.length < width) {
        row = new Uint8ClampedArray(width);
      }
      // The underlying raster of image consists of bytes with the luminance values
      // TODO: can avoid set/slice?
      row.set(this.luminances.slice(start, start + width));
    }

    return row;
  }

  /** @inheritdoc */
  public getMatrix(): Uint8ClampedArray {
    return this.luminances;
  }

  /** @inheritdoc */
  public isCropSupported(): boolean {
    return true;
  }

  /** @inheritdoc */
  public crop(
    left: number,
    top: number,
    width: number,
    height: number
  ): AdvancedLuminanceSource {
    const currentWidth = this.getWidth();
    const currentHeight = this.getHeight();
    // Position can't be smaller than 0 nor larger currentWidth - 1
    // This means the smallest crop is 1x1
    left = Math.max(0, Math.min(left, currentWidth - 1));
    top = Math.max(0, Math.min(top, currentHeight - 1));
    width = Math.max(1, Math.min(width, currentWidth - left));
    height = Math.max(1, Math.min(height, currentHeight - top));
    const buffer = new Uint8ClampedArray(width * height).fill(255);
    const length = buffer.length;
    for (let i = 0; i < length; i++) {
      const { x, y } = AdvancedLuminanceSource.indexToCoordinate(i, width);
      const currentIndex = AdvancedLuminanceSource.coordinateToIndex(
        x + left,
        y + top,
        currentWidth
      );
      buffer[i] = this.luminances[currentIndex];
    }

    return new AdvancedLuminanceSource(buffer, width, height, ColorFormat.Luminance);
  }

  /** @inheritdoc */
  public isRotateSupported(): boolean {
    return true;
  }

  /** @inheritdoc */
  public rotateCounterClockwise(): AdvancedLuminanceSource {
    // Rotations of small sets of luminance become slightly damaged.
    // Todo: Consider implementing a different algorithm for angles divisible by 90.
    return this.rotate(-90);
  }

  /** @inheritdoc */
  public rotateCounterClockwise45(): AdvancedLuminanceSource {
    // Repeated rotations of 45 degrees degrades the image each iteration.
    return this.rotate(-45);
  }

  /**
   * Rotate the buffer by a given angle in degrees.
   * @param angle rotation angle in degrees
   */
  public rotate(angle: number) {
    const length = this.luminances.length;
    const currentWidth = this.getWidth();
    const currentHeight = this.getHeight();
    const radians = AdvancedLuminanceSource.degreesToRadians(angle);
    const { width, height } = AdvancedLuminanceSource.expandBuffer(
      currentWidth,
      currentHeight,
      radians
    );
    const buffer = new Uint8ClampedArray(width * height).fill(255);

    // Loop through original buffer length
    for (let i = 0; i < length; i++) {
      // Convert index to coordinate
      let { x, y } = AdvancedLuminanceSource.indexToCoordinate(
        i,
        currentWidth
      );
      // Translate center of image to 0,0
      x -= currentWidth / 2;
      y -= currentHeight / 2;
      // Rotate coordinate around 0,0 by given radians
      let { x: rx, y: ry } = AdvancedLuminanceSource.rotateCoordinate(
        x,
        y,
        radians
      );
      // Translate new coordinates back to new center
      rx = Math.round(rx + width / 2);
      ry = Math.round(ry + height / 2);
      // Convert new coordinates to new index
      const j = AdvancedLuminanceSource.coordinateToIndex(rx, ry, width);
      buffer[j] = this.luminances[i];
    }

    return new AdvancedLuminanceSource(buffer, width, height, ColorFormat.Luminance);
  }

  /** @inheritdoc */
  public invert(): AdvancedLuminanceSource {
    return new InvertedLuminanceSource(this) as any;
  }

  /* HELPERS */

  /**
   * Converts degrees to radians.
   * @param degrees the amount of degrees to convert to radians
   */
  static degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Converts a numeric index in the buffer to a `x` and `y` coordinate.
   * @param index the numerical position in the buffer
   * @param width how wide the buffer is
   * @returns the `x` and `y` coordinates.
   */
  static indexToCoordinate(index: number, width: number) {
    return {
      x: index % width,
      y: (index / width) << 0
    };
  }

  /**
   * Converts a `x` and `y` coordinate in the buffer to a numeric index.
   * @param x horizontal coordinate in the buffer
   * @param y vertical coordinate in the buffer
   * @param width how wide the buffer is
   */
  static coordinateToIndex(x: number, y: number, width: number) {
    return x + y * width;
  }

  /**
   * Expands a given width and height using a radian rotation.
   * @param width current width
   * @param height current height
   * @param radians how many radians to rotate the dimensions
   */
  static expandBuffer(width: number, height: number, radians: number) {
    return {
      width: Math.ceil(
        Math.abs(Math.cos(radians)) * width +
          Math.abs(Math.sin(radians)) * height
      ),
      height: Math.ceil(
        Math.abs(Math.sin(radians)) * width +
          Math.abs(Math.cos(radians)) * height
      )
    };
  }

  /**
   * Rotate a given coordinate by number of radians.
   * @param x horizontal coordinate in the buffer
   * @param y vertical coordinate in the buffer
   * @param radians how many radians to rotate the coordinates
   */
  static rotateCoordinate(x: number, y: number, radians: number) {
    x = AdvancedLuminanceSource.shearHorizontal(x, y, radians);
    y = AdvancedLuminanceSource.shearVertical(x, y, radians);
    x = AdvancedLuminanceSource.shearHorizontal(x, y, radians);
    return { x, y };
  }

  /**
   * Shift/shear coordinates in the horizontal direction.
   * @param x horizontal coordinate in the buffer
   * @param y vertical coordinate in the buffer
   * @param radians how many radians to shift the coordinates
   */
  static shearHorizontal(x: number, y: number, radians: number) {
    return Math.round(x + -y * Math.tan(radians / 2));
  }

  /**
   * Shift/shear coordinates in the vertical direction.
   * @param x horizontal coordinate in the buffer
   * @param y vertical coordinate in the buffer
   * @param radians how many radians to shift the coordinates
   */
  static shearVertical(x: number, y: number, radians: number) {
    return Math.round(x * Math.sin(radians) + y);
  }
}
