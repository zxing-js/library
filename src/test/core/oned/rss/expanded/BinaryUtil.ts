import { BitArray, IllegalStateException } from '@zxing/library';
import StringBuilder from '../../../../../core/util/StringBuilder';

/*
 * Copyright (C) 2010 ZXing authors
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

// import com.google.zxing.common.BitArray;

// import java.util.regex.Pattern;


const /*private static /*final*/ ONE: RegExp = RegExp('1');
const /*private static /*final*/ ZERO: RegExp = RegExp('0');
const /*private static /*final*/ SPACE: RegExp = RegExp(' ');

/**
 * @author Pablo Orduña, University of Deusto (pablo.orduna@deusto.es)
 */
export default class BinaryUtil {

  private constructor() {
  }

  /*
  * Constructs a BitArray from a String like the one returned from BitArray.toString()
  */
  public static buildBitArrayFromString(data: string): BitArray {
    let dotsAndXs: string = data.replace(ONE, 'X').replace(ZERO, '.');
    let binary: BitArray = new BitArray(dotsAndXs.replace(SPACE, '').length);
    let counter: /*int*/ number = 0;

    for (let i /*int*/ = 0; i < dotsAndXs.length; ++i) {
      if (i % 9 === 0) { // spaces
        if (dotsAndXs.charAt(i) !== ' ') {
          throw new IllegalStateException('space expected');
        }
        continue;
      }

      let currentChar: string = dotsAndXs.charAt(i);
      if (currentChar === 'X' || currentChar === 'x') {
        binary.set(counter);
      }
      counter++;
    }
    return binary;
  }

  public static buildBitArrayFromStringWithoutSpaces(data: string): BitArray {
    let sb: StringBuilder = new StringBuilder();
    let dotsAndXs: string = data.replace(ONE, 'X').replace(ZERO, '.');
    let current: /*int*/ number = 0;
    while (current < dotsAndXs.length) {
      sb.append(' ');
      for (let i /*int*/ = 0; i < 8 && current < dotsAndXs.length; ++i) {
        sb.append(dotsAndXs.charAt(current));
        current++;
      }
    }
    return this.buildBitArrayFromString(sb.toString());
  }

}
