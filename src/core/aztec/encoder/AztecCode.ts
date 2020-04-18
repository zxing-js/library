/*
* Copyright 2013 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
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

// package com.google.zxing.aztec.encoder;

// import com.google.zxing.common.BitMatrix;
import BitMatrix from '../../common/BitMatrix';

import { int } from '../../../customTypings';

/**
 * Aztec 2D code representation
 *
 * @author Rustam Abdullaev
 */
export default /*public final*/ class AztecCode {

  private compact: boolean;
  private size: int;
  private layers: int;
  private codeWords: int;
  private matrix: BitMatrix;

  /**
   * @return {@code true} if compact instead of full mode
   */
  public isCompact(): boolean {
    return this.compact;
  }

  public setCompact(compact: boolean): void {
    this.compact = compact;
  }

  /**
   * @return size in pixels (width and height)
   */
  public getSize(): int {
    return this.size;
  }

  public setSize(size: int): void {
    this.size = size;
  }

  /**
   * @return number of levels
   */
  public getLayers(): int {
    return this.layers;
  }

  public setLayers(layers: int): void {
    this.layers = layers;
  }

  /**
   * @return number of data codewords
   */
  public getCodeWords(): int {
    return this.codeWords;
  }

  public setCodeWords(codeWords: int): void {
    this.codeWords = codeWords;
  }

  /**
   * @return the symbol image
   */
  public getMatrix(): BitMatrix {
    return this.matrix;
  }

  public setMatrix(matrix: BitMatrix): void {
    this.matrix = matrix;
  }

}
