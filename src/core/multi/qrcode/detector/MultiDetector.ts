/*
 * Copyright 2009 ZXing authors
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

import BitMatrix from '../../../common/BitMatrix';
import DetectorResult from '../../../common/DetectorResult';
import DecodeHintType from '../../../DecodeHintType';
import NotFoundException from '../../../NotFoundException';
import Detector from '../../../qrcode/detector/Detector';
import FinderPatternInfo from '../../../qrcode/detector/FinderPatternInfo';
import ReaderException from '../../../ReaderException';
import ResultPointCallback from '../../../ResultPointCallback';
import { List } from '../../../../customTypings';
import MultiFinderPatternFinder from './MultiFinderPatternFinder';

// package com.google.zxing.multi.qrcode.detector;

// import com.google.zxing.DecodeHintType;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.ReaderException;
// import com.google.zxing.ResultPointCallback;
// import com.google.zxing.common.BitMatrix;
// import com.google.zxing.common.DetectorResult;
// import com.google.zxing.qrcode.detector.Detector;
// import com.google.zxing.qrcode.detector.FinderPatternInfo;

// import java.util.ArrayList;
// import java.util.List;
// import java.util.Map;

/**
 * <p>Encapsulates logic that can detect one or more QR Codes in an image, even if the QR Code
 * is rotated or skewed, or partially obscured.</p>
 *
 * @author Sean Owen
 * @author Hannes Erven
 */
export default /* public final */ class MultiDetector extends Detector {

  private static /* final */ EMPTY_DETECTOR_RESULTS:  DetectorResult[] = [];

  public constructor( image: BitMatrix) {
    super(image);
  }

  /** @throws NotFoundException */
  public detectMulti(hints: Map<DecodeHintType, any>): DetectorResult[] {
    const image: BitMatrix = this.getImage();
    const resultPointCallback: ResultPointCallback =
        hints == null ? null : <ResultPointCallback> hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);
    const finder: MultiFinderPatternFinder = new MultiFinderPatternFinder(image, resultPointCallback);
    const infos: FinderPatternInfo[] = finder.findMulti(hints);

    if (infos.length === 0) {
      throw NotFoundException.getNotFoundInstance();
    }

    const result: List<DetectorResult> = [];
    for (const info of infos) {
      try {
        result.push(this.processFinderPatternInfo(info));
      } catch (e) {
        if (e instanceof ReaderException) {
          // ignore
        } else {
          throw e;
        }
      }
    }
    if (result.length === 0) {
      return MultiDetector.EMPTY_DETECTOR_RESULTS;
    } else {
      return result/* .toArray(EMPTY_DETECTOR_RESULTS) */;
    }
  }

}
