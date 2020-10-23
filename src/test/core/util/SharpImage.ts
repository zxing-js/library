import * as sharp from 'sharp';

import { BitMatrix } from '@zxing/library';


export default class SharpImage {

  public constructor(
    private wrapper: sharp.Sharp,
    private buffer: Uint8ClampedArray,
    private width: number,
    private height: number
  ) { }

  public static async loadWithRotations(path: string, rotations: number[]): Promise<Map<number, SharpImage>> {

    const images = new Map<number, SharpImage>();

    for (const rotation of rotations) {

      const image = await this.loadWithRotation(path, rotation);

      images.set(rotation, image);
    }

    return images;
  }

  public static async loadWithRotation(path: string, rotation: number): Promise<SharpImage> {

    const wrapper = sharp(path).raw();

    const metadata = await wrapper.metadata();

    if (metadata.channels !== 3 && metadata.space !== 'srgb') {
      // Image ${path} has ${metadata.channels} channels and will be transformed to sRGB.
      wrapper.toColorspace('sRGB');
    }

    const { data, info } = await wrapper.rotate(rotation).toBuffer({ resolveWithObject: true });
    const grayscaleBuffer = SharpImage.toGrayscaleBuffer(new Uint8ClampedArray(data.buffer), info.width, info.height, info.channels);

    return new SharpImage(wrapper, grayscaleBuffer, info.width, info.height);
  }

  public static load(path: string, rotation: number): SharpImage {

    const wrapper = sharp(path).raw();

    return new SharpImage(wrapper, undefined, undefined, undefined);
  }

  public static async loadAsBitMatrix(path: string): Promise<BitMatrix> {

    const wrapper = sharp(path).raw();
    const metadata = await wrapper.metadata();

    if (metadata.channels !== 3) {
      // Image ${path} has ${metadata.channels} channels and will be transformed to sRGB
      wrapper.toColorspace('sRGB');
    }

    const { data, info } = await wrapper.toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    const width = info.width;
    const height = info.height;
    const grayscaleBuffer = SharpImage.toGrayscaleBuffer(new Uint8ClampedArray(data.buffer), width, height, channels);
    // const image = new SharpImage(wrapper, grayscaleBuffer, info.width, info.height)
    const matrix = new BitMatrix(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = grayscaleBuffer[y * width + x];
        if (pixel <= 0x7F) {
          matrix.set(x, y);
        }
      }
    }

    return matrix;
  }

  private static toGrayscaleBuffer(imageBuffer: Uint8ClampedArray, width: number, height: number, channels: number): Uint8ClampedArray {

    const grayscaleBuffer = new Uint8ClampedArray(width * height);

    for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += channels, j++) {
      let gray = undefined;
      if (channels > 3) {
        const alpha = imageBuffer[i + 3];
        // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
        // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
        // barcode image. Force any such pixel to be white:
        if (alpha === 0) {
          gray = 0xFF;
        }
      }
      if (gray === undefined) {
        const pixelR = imageBuffer[i];
        const pixelG = imageBuffer[i + 1];
        const pixelB = imageBuffer[i + 2];
        // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
        // (306*R) >> 10 is approximately equal to R*0.299, and so on.
        // 0x200 >> 10 is 0.5, it implements rounding.
        gray = (306 * pixelR +
          601 * pixelG +
          117 * pixelB +
          0x200) >> 10;
      }
      grayscaleBuffer[j] = gray;
    }

    return grayscaleBuffer;
  }

  public save(path: string): void {
    this.wrapper.toFile(path).catch(err => console.error(err));
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  // public crop(x: number, y: number, width: number, height: number) {
  //     this.jimpImage.crop(x, y, width, height)
  // }

  public getRow(y: number, row: Uint8ClampedArray): void {
    for (let j = 0, i = y * this.width, end = (y + 1) * this.width; i !== end; i++) {
      row[j++] = this.buffer[i];
    }
  }

  public getMatrix(): Uint8ClampedArray {
    return this.buffer;
  }

  // private static getPixelIndex(width: number, height: number, x: number, y: number): number {
  //     // round input
  //     x = Math.round(x);
  //     y = Math.round(y);

  //     let i = (width * y + x) << 2;

  //     // if out of bounds index is -1
  //     if (x < 0 || x > width) i = -1;
  //     if (y < 0 || y > height) i = -1;

  //     return i;
  // }
}
