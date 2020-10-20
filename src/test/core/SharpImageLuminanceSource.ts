/*
/*
 * Copyright 2009 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing;*/

/*import java.awt.Graphics2D;*/
/*import java.awt.geom.AffineTransform;*/
/*import java.awt.image.BufferedImage;*/
/*import java.awt.image.WritableRaster;*/

import SharpImage from './util/SharpImage';
import { LuminanceSource } from '@zxing/library';
import { InvertedLuminanceSource } from '@zxing/library';
import { IllegalArgumentException } from '@zxing/library';

/**
 * This LuminanceSource implementation is meant for J2SE clients and our blackbox unit tests.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author code@elektrowolle.de (Wolfgang Jung)
 */
export default class SharpImageLuminanceSource extends LuminanceSource {

  public constructor(private image: SharpImage) {
    super(image.getWidth(), image.getHeight());
    // if (undefined === width) {
    //   this.width = image.getWidth()
    // }
    // if (undefined === height) {
    //   this.height = image.getHeight()
    // }

    // const sourceWidth: number /*int*/ = image.getWidth()
    // const sourceHeight: number /*int*/ = image.getHeight()
    // if (left + width > sourceWidth || top + height > sourceHeight) {
    //   throw new IllegalArgumentException("Crop rectangle does not fit within image data.")
    // }

    // if (left > 0 || width < sourceWidth || top > 0 || height < sourceHeight) {
    //   image.crop(left, top, width, height)
    // }

    // image.grayscale()
  }

  public getRow(y: number /*int*/, row: Uint8ClampedArray): Uint8ClampedArray {
    if (y < 0 || y >= this.image.getHeight()) {
      throw new IllegalArgumentException('Requested row is outside the image: ' + y);
    }
    const width: number /*int*/ = this.image.getWidth();
    if (row === null || row.length < width) {
      row = new Uint8ClampedArray(width); /*Int8Array(width)*/
    }
    // The underlying raster of image consists of bytes with the luminance values
    this.image.getRow(y, row);
    return row;
  }

  public getMatrix(): Uint8ClampedArray {
    return this.image.getMatrix();
  }

  public isCropSupported(): boolean {
    return true;
  }

  public crop(left: number /*int*/, top: number /*int*/, width: number /*int*/, height: number /*int*/): LuminanceSource {
    super.crop(left, top, width, height);
    return this;
  }

  /**
   * This is always true, since the image is a gray-scale image.
   *
   * @return true
   */
  public isRotateSupported(): boolean {
    return true;
  }

  public rotateCounterClockwise(): LuminanceSource {
    // this.image.rotate(-90)
    // TYPESCRIPTPORT: not used for tests, see AbstractBlackBox.spec, SharpImage.loadWithRotations
    return this;
  }

  public rotateCounterClockwise45(): LuminanceSource {
    // this.image.rotate(-45)
    // TYPESCRIPTPORT: not used for tests, see AbstractBlackBox.spec, SharpImage.loadWithRotations
    return this;
  }

  public invert(): LuminanceSource {
    return new InvertedLuminanceSource(this);
  }

}
