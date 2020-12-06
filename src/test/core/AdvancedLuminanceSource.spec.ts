import { assertArrayEquals } from './util/AssertUtils';
import { AdvancedLuminanceSource, LuminanceSource } from '@zxing/library';
import { ColorFormat } from 'core/AdvancedLuminanceSource';
import { strictEqual } from 'assert';

describe('AdvancedLuminanceSource', () => {

  const SOURCE = new AdvancedLuminanceSource(Int32Array.from([
    0x000000, 0x7F7F7F, 0xFFFFFF,
    0xFF0000, 0x00FF00, 0x0000FF,
    0x0000FF, 0x00FF00, 0xFF0000,
  ]), 3, 3, ColorFormat.RGBHex);

  it('testCrop', () => {
    strictEqual(SOURCE.isCropSupported(), true);
    const cropped: LuminanceSource = SOURCE.crop(1, 1, 1, 1);
    strictEqual(cropped.getHeight(), 1);
    strictEqual(cropped.getWidth(), 1);
    assertArrayEquals(cropped.getRow(0, null), new Uint8ClampedArray([127]), 'Failed to crop luminance data.');
  });

  it('testMatrix', () => {
    assertArrayEquals(SOURCE.getMatrix(), Uint8ClampedArray.from([0, 127, 255, 63, 127, 63, 63, 127, 63]));

    const croppedFullWidth = SOURCE.crop(0, 1, 3, 2);
    assertArrayEquals(croppedFullWidth.getMatrix(), Uint8ClampedArray.from([63, 127, 63, 63, 127, 63]) );

    const croppedCorner = SOURCE.crop(1, 1, 2, 2);
    assertArrayEquals(croppedCorner.getMatrix(), Uint8ClampedArray.from([127, 63, 127, 63]));
  });

  it('testColorFormats', () => {
    let buffer: Uint8ClampedArray;
    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([112]), 1, 1, ColorFormat.Luminance).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Should not convert if luminance array is given.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([200, 50, 150]), 1, 1, ColorFormat.RGBMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format RGBMatrix.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([200, 50, 150, 127]), 1, 1, ColorFormat.RGBAMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format RGBAMatrix.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([200, 50, 150, 0]), 1, 1, ColorFormat.RGBAMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([255]), 'Incorrect transparency luminance conversion using format RGBMatrix.');

    buffer = new AdvancedLuminanceSource(new Int32Array([0xC83296]), 1, 1, ColorFormat.RGBHex).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format RGBHex.');

    buffer = new AdvancedLuminanceSource(new Int32Array([0x7FC83296]), 1, 1, ColorFormat.RGBAStartHex).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format RGBAStartHex.');

    buffer = new AdvancedLuminanceSource(new Int32Array([0x00C83296]), 1, 1, ColorFormat.RGBAStartHex).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([255]), 'Incorrect transparency luminance conversion using format RGBAStartHex.');

    buffer = new AdvancedLuminanceSource(new Int32Array([0xC832967F]), 1, 1, ColorFormat.RGBAEndHex).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format RGBAEndHex.');

    buffer = new AdvancedLuminanceSource(new Int32Array([0xC8329600]), 1, 1, ColorFormat.RGBAEndHex).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([255]), 'Incorrect transparency luminance conversion using format RGBAEndHex.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([88, 60, 44]), 1, 1, ColorFormat.HSLMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format HSLMatrix.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([88, 60, 44, 50]), 1, 1, ColorFormat.HSLAMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([112]), 'Incorrect luminance conversion using format HSLAMatrix.');

    buffer = new AdvancedLuminanceSource(new Uint8ClampedArray([88, 60, 44, 0]), 1, 1, ColorFormat.HSLAMatrix).getMatrix();
    assertArrayEquals(buffer, new Uint8ClampedArray([255]), 'Incorrect transparency luminance conversion using format HSLAMatrix.');
  });

  it('testRotation', () => {
    const enlargedSource = new AdvancedLuminanceSource(new Uint8ClampedArray(16).map((_, i) => 256 / 16 * i), 4, 4, ColorFormat.Luminance);
    let rotatedBuffer = enlargedSource.rotateCounterClockwise().getMatrix();
    assertArrayEquals(rotatedBuffer, Uint8ClampedArray.from([255, 255, 255, 255, 48, 112, 176, 240, 32, 96, 160, 224, 16, 80, 144, 208]));

    rotatedBuffer = enlargedSource.rotateCounterClockwise45().getMatrix();
    assertArrayEquals(rotatedBuffer, Uint8ClampedArray.from([
      255, 255, 255, 255, 255, 255,
      255, 255, 48, 112, 255, 255,
      255, 16, 32, 96, 176, 255,
      0, 64, 80, 160, 240, 255,
      255, 128, 144, 224, 255, 255,
      255, 255, 192, 208, 255, 255,
    ]));
  });

  it('testGetRow', () => {
    assertArrayEquals(SOURCE.getRow(2, new Uint8ClampedArray(3)), Uint8ClampedArray.from([63, 127, 63]));
  });

  it('testToString', () => {
    strictEqual(SOURCE.toString(), '#+ \n#+#\n#+#\n');
  });
});
