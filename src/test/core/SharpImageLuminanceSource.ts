import { IllegalArgumentException, InvertedLuminanceSource, LuminanceSource } from '@zxing/library';
import SharpImage from './util/SharpImage';

/**
 * LuminanceSource used in conjunction with test implementing the sharp node package.
 * @note does not currently support rotations so some try harder tests do not yet pass.
 */
export default class SharpImageLuminanceSource extends LuminanceSource {

  public constructor(private image: SharpImage) {
    super(image.getWidth(), image.getHeight());
  }

  public getRow(y: number, row: Uint8ClampedArray): Uint8ClampedArray {
    if (y < 0 || y >= this.image.getHeight()) {
      throw new IllegalArgumentException('Requested row is outside the image: ' + y);
    }
    const width: number = this.image.getWidth();
    if (row === null || row.length < width) {
      row = new Uint8ClampedArray(width);
    }
    // The underlying raster of image consists of bytes with the luminance values
    this.image.getRow(y, row);
    return row;
  }

  public getMatrix(): Uint8ClampedArray {
    return this.image.getMatrix();
  }

  public getWidth(): number {
    return this.image.getWidth();
  }

  public getHeight(): number {
    return this.image.getHeight();
  }

  public isCropSupported(): boolean {
    return true;
  }

  public crop(left: number, top: number, width: number, height: number): LuminanceSource {
    super.crop(left, top, width, height);
    return this;
  }

  public invert(): LuminanceSource {
    return new InvertedLuminanceSource(this);
  }

}
