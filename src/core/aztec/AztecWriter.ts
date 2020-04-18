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

// package com.google.zxing.aztec;

// import com.google.zxing.BarcodeFormat;
import BarcodeFormat from '../BarcodeFormat';
// import com.google.zxing.EncodeHintType;
import EncodeHintType from '../EncodeHintType';
// import com.google.zxing.Writer;
import Writer from '../Writer';
// import com.google.zxing.aztec.encoder.AztecCode;
import AztecCode from './encoder/AztecCode';
// import com.google.zxing.aztec.encoder.Encoder;
import Encoder from './encoder/Encoder';
// import com.google.zxing.common.BitMatrix;
import BitMatrix from '../common/BitMatrix';

// import java.nio.charset.Charset;
import Charset from '../util/Charset';
// import java.nio.charset.StandardCharsets;
import StandardCharsets from '../util/StandardCharsets';
// import java.util.Map;

import Integer from '../util/Integer';
import IllegalStateException from '../IllegalStateException';
import IllegalArgumentException from '../IllegalArgumentException';
import StringUtils from '../common/StringUtils';

import { int } from '../../customTypings';

/**
 * Renders an Aztec code as a {@link BitMatrix}.
 */
export default /*public final*/ class AztecWriter implements Writer {

  // @Override
  public encode(contents: string, format: BarcodeFormat, width: int, height: int): BitMatrix {
    return this.encodeWithHints(contents, format, width, height, null);
  }

  // @Override
  public encodeWithHints(contents: string, format: BarcodeFormat, width: int, height: int, hints: Map<EncodeHintType, any>): BitMatrix {
    let charset: Charset = StandardCharsets.ISO_8859_1;
    let eccPercent: int = Encoder.DEFAULT_EC_PERCENT;
    let layers: int = Encoder.DEFAULT_AZTEC_LAYERS;
    if (hints != null) {
      if (hints.has(EncodeHintType.CHARACTER_SET)) {
        charset = Charset.forName(hints.get(EncodeHintType.CHARACTER_SET).toString());
      }
      if (hints.has(EncodeHintType.ERROR_CORRECTION)) {
        eccPercent = Integer.parseInt(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
      }
      if (hints.has(EncodeHintType.AZTEC_LAYERS)) {
        layers = Integer.parseInt(hints.get(EncodeHintType.AZTEC_LAYERS).toString());
      }
    }
    return AztecWriter.encodeLayers(contents, format, width, height, charset, eccPercent, layers);
  }

  private static encodeLayers(contents: string, format: BarcodeFormat,
    width: int, height: int,
    charset: Charset, eccPercent: int, layers: int): BitMatrix {
    if (format !== BarcodeFormat.AZTEC) {
      throw new IllegalArgumentException('Can only encode AZTEC, but got ' + format);
    }
    let aztec: AztecCode = Encoder.encode(StringUtils.getBytes(contents, charset), eccPercent, layers);
    return AztecWriter.renderResult(aztec, width, height);
  }

  private static renderResult(code: AztecCode, width: int, height: int): BitMatrix {
    let input: BitMatrix = code.getMatrix();
    if (input == null) {
      throw new IllegalStateException();
    }
    let inputWidth: int = input.getWidth();
    let inputHeight: int = input.getHeight();
    let outputWidth: int = Math.max(width, inputWidth);
    let outputHeight: int = Math.max(height, inputHeight);

    let multiple: int = Math.min(outputWidth / inputWidth, outputHeight / inputHeight);
    let leftPadding: int = (outputWidth - (inputWidth * multiple)) / 2;
    let topPadding: int = (outputHeight - (inputHeight * multiple)) / 2;

    let output: BitMatrix = new BitMatrix(outputWidth, outputHeight);

    for (let inputY /*int*/ = 0, outputY = topPadding; inputY < inputHeight; inputY++ , outputY += multiple) {
      // Write the contents of this row of the barcode
      for (let inputX /*int*/ = 0, outputX = leftPadding; inputX < inputWidth; inputX++ , outputX += multiple) {
        if (input.get(inputX, inputY)) {
          output.setRegion(outputX, outputY, multiple, multiple);
        }
      }
    }
    return output;
  }
}
