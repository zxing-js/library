import { BinaryBitmap, GlobalHistogramBinarizer } from '@zxing/library';
import AbstractBlackBoxSpec from '../../../common/AbstractBlackBox';
import SharpImageLuminanceSource from '../../../SharpImageLuminanceSource';
import SharpImage from '../../../util/SharpImage';

/*
 * Copyright (C) 2012 ZXing authors
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

/*
 * These authors would like to acknowledge the Spanish Ministry of Industry,
 * Tourism and Trade, for the support in the project TSI020301-2008-2
 * "PIRAmIDE: Personalizable Interactions with Resources on AmI-enabled
 * Mobile Dynamic Environments", led by Treelogic
 * ( http://www.treelogic.com/ ):
 *
 *   http://www.piramidepse.com/
 */

// package com.google.zxing.oned.rss.expanded;

// import java.awt.image.BufferedImage;
// import java.io.IOException;
// import java.nio.file.Path;

// import javax.imageio.ImageIO;

// import com.google.zxing.BinaryBitmap;
// import com.google.zxing.BufferedImageLuminanceSource;
// import com.google.zxing.common.AbstractBlackBoxTestCase;
// import com.google.zxing.common.GlobalHistogramBinarizer;

export default class TestCaseUtil {

  private constructor() { }

  /**
   * @throws IOException
   */
  private static getBufferedImage(path: string): Promise<SharpImage> {
    let file = AbstractBlackBoxSpec.buildTestBase(path);
    return SharpImage.loadWithRotation(file, 0);
  }

  /**
   * @throws IOException
   */
  static async getBinaryBitmap(path: string): Promise<BinaryBitmap> {
    let bufferedImage: SharpImage = await TestCaseUtil.getBufferedImage(path);
    let luminanceSource: SharpImageLuminanceSource = new SharpImageLuminanceSource(bufferedImage);
    return new BinaryBitmap(new GlobalHistogramBinarizer(luminanceSource));
  }

}
