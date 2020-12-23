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
import DecodeHintType from '../../../DecodeHintType';
import NotFoundException from '../../../NotFoundException';
import FinderPattern from '../../../qrcode/detector/FinderPattern';
import FinderPatternFinder from '../../../qrcode/detector/FinderPatternFinder';
import FinderPatternInfo from '../../../qrcode/detector/FinderPatternInfo';
import ResultPoint from '../../../ResultPoint';
import ResultPointCallback from '../../../ResultPointCallback';
import Collections from '../../../util/Collections';
import Comparator from '../../../util/Comparator';
import { double, float, int, List } from '../../../../customTypings';

// package com.google.zxing.multi.qrcode.detector;

// import com.google.zxing.DecodeHintType;
// import com.google.zxing.NotFoundException;
// import com.google.zxing.ResultPoint;
// import com.google.zxing.ResultPointCallback;
// import com.google.zxing.common.BitMatrix;
// import com.google.zxing.qrcode.detector.FinderPattern;
// import com.google.zxing.qrcode.detector.FinderPatternFinder;
// import com.google.zxing.qrcode.detector.FinderPatternInfo;

// import java.io.Serializable;
// import java.util.ArrayList;
// import java.util.Collections;
// import java.util.Comparator;
// import java.util.List;
// import java.util.Map;

/**
 * <p>This class attempts to find finder patterns in a QR Code. Finder patterns are the square
 * markers at three corners of a QR Code.</p>
 *
 * <p>This class is thread-safe but not reentrant. Each thread must allocate its own object.
 *
 * <p>In contrast to {@link FinderPatternFinder}, this class will return an array of all possible
 * QR code locations in the image.</p>
 *
 * <p>Use the TRY_HARDER hint to ask for a more thorough detection.</p>
 *
 * @author Sean Owen
 * @author Hannes Erven
 */
export default /* public final */ class MultiFinderPatternFinder extends FinderPatternFinder {

  private static /* final */ EMPTY_RESULT_ARRAY: FinderPatternInfo[] = [];
  private static /* final */ EMPTY_FP_ARRAY: FinderPattern[] = [];
  private static /* final */ EMPTY_FP_2D_ARRAY: FinderPattern[][] = [[]];

  // TODO MIN_MODULE_COUNT and MAX_MODULE_COUNT would be great hints to ask the user for
  // since it limits the number of regions to decode

  // max. legal count of modules per QR code edge (177)
  private static /* final */ MAX_MODULE_COUNT_PER_EDGE: float = 180;
  // min. legal count per modules per QR code edge (11)
  private static /* final */ MIN_MODULE_COUNT_PER_EDGE: float = 9;

  /**
   * More or less arbitrary cutoff point for determining if two finder patterns might belong
   * to the same code if they differ less than DIFF_MODSIZE_CUTOFF_PERCENT percent in their
   * estimated modules sizes.
   */
  private static /* final */ DIFF_MODSIZE_CUTOFF_PERCENT: float = 0.05;

  /**
   * More or less arbitrary cutoff point for determining if two finder patterns might belong
   * to the same code if they differ less than DIFF_MODSIZE_CUTOFF pixels/module in their
   * estimated modules sizes.
   */
  private static /* final */ DIFF_MODSIZE_CUTOFF: float = 0.5;


  public constructor(image: BitMatrix, resultPointCallback: ResultPointCallback) {
    super(image, resultPointCallback);
  }

  /**
   * @return the 3 best {@link FinderPattern}s from our list of candidates. The "best" are
   *         those that have been detected at least 2 times, and whose module
   *         size differs from the average among those patterns the least
   * @throws NotFoundException if 3 such finder patterns do not exist
   */
  private selectMultipleBestPatterns(): FinderPattern[][] {
    const possibleCenters: List<FinderPattern> = this.getPossibleCenters();
    const size: int = possibleCenters.length;

    if (size < 3) {
      // Couldn't find enough finder patterns
      throw NotFoundException.getNotFoundInstance();
    }

    /*
     * Begin HE modifications to safely detect multiple codes of equal size
     */
    if (size === 3) {
      return [ possibleCenters ];
    }

    // Sort by estimated module size to speed up the upcoming checks
    Collections.sort(possibleCenters, new ModuleSizeComparator());

    /*
     * Now lets start: build a list of tuples of three finder locations that
     *  - feature similar module sizes
     *  - are placed in a distance so the estimated module count is within the QR specification
     *  - have similar distance between upper left/right and left top/bottom finder patterns
     *  - form a triangle with 90° angle (checked by comparing top right/bottom left distance
     *    with pythagoras)
     *
     * Note: we allow each point to be used for more than one code region: this might seem
     * counterintuitive at first, but the performance penalty is not that big. At this point,
     * we cannot make a good quality decision whether the three finders actually represent
     * a QR code, or are just by chance laid out so it looks like there might be a QR code there.
     * So, if the layout seems right, lets have the decoder try to decode.
     */

    const results: List<FinderPattern[]> = new Array(); // holder for the results

    for (let i1: int = 0; i1 < (size - 2); i1++) {
      const p1: FinderPattern = possibleCenters[i1];
      if (p1 == null) {
        continue;
      }

      for (let i2: int = i1 + 1; i2 < (size - 1); i2++) {
        const p2: FinderPattern  = possibleCenters[i2];
        if (p2 == null) {
          continue;
        }

        // Compare the expected module sizes; if they are really off, skip
        const vModSize12: float = (p1.getEstimatedModuleSize() - p2.getEstimatedModuleSize()) /
            Math.min(p1.getEstimatedModuleSize(), p2.getEstimatedModuleSize());
        const vModSize12A: float = Math.abs(p1.getEstimatedModuleSize() - p2.getEstimatedModuleSize());
        if (vModSize12A > MultiFinderPatternFinder.DIFF_MODSIZE_CUTOFF && vModSize12 >= MultiFinderPatternFinder.DIFF_MODSIZE_CUTOFF_PERCENT) {
          // break, since elements are ordered by the module size deviation there cannot be
          // any more interesting elements for the given p1.
          break;
        }

        for (let i3: int = i2 + 1; i3 < size; i3++) {
          const p3: FinderPattern = possibleCenters[i3];
          if (p3 == null) {
            continue;
          }

          // Compare the expected module sizes; if they are really off, skip
          const vModSize23: float = (p2.getEstimatedModuleSize() - p3.getEstimatedModuleSize()) /
              Math.min(p2.getEstimatedModuleSize(), p3.getEstimatedModuleSize());
          const vModSize23A: float = Math.abs(p2.getEstimatedModuleSize() - p3.getEstimatedModuleSize());
          if (vModSize23A > MultiFinderPatternFinder.DIFF_MODSIZE_CUTOFF && vModSize23 >= MultiFinderPatternFinder.DIFF_MODSIZE_CUTOFF_PERCENT) {
            // break, since elements are ordered by the module size deviation there cannot be
            // any more interesting elements for the given p1.
            break;
          }

          const test: FinderPattern[] = [p1, p2, p3];
          ResultPoint.orderBestPatterns(test);

          // Calculate the distances: a = topleft-bottomleft, b=topleft-topright, c = diagonal
          const info: FinderPatternInfo = new FinderPatternInfo(test);
          const dA: float = ResultPoint.distance(info.getTopLeft(), info.getBottomLeft());
          const dC: float = ResultPoint.distance(info.getTopRight(), info.getBottomLeft());
          const dB: float = ResultPoint.distance(info.getTopLeft(), info.getTopRight());

          // Check the sizes
          const estimatedModuleCount: float = (dA + dB) / (p1.getEstimatedModuleSize() * 2.0);
          if (estimatedModuleCount > MultiFinderPatternFinder.MAX_MODULE_COUNT_PER_EDGE ||
              estimatedModuleCount < MultiFinderPatternFinder.MIN_MODULE_COUNT_PER_EDGE) {
            continue;
          }

          // Calculate the difference of the edge lengths in percent
          const vABBC: float = Math.abs((dA - dB) / Math.min(dA, dB));
          if (vABBC >= 0.1) {
            continue;
          }

          // Calculate the diagonal length by assuming a 90° angle at topleft
          const dCpy: float = <float> Math.sqrt(<double> dA * dA + <double> dB * dB);
          // Compare to the real distance in %
          const vPyC: float = Math.abs((dC - dCpy) / Math.min(dC, dCpy));

          if (vPyC >= 0.1) {
            continue;
          }

          // All tests passed!
          results.push(test);
        }
      }
    }

    if (results.length > 0) {
      return results/* .toArray(MultiFinderPatternFinder.EMPTY_FP_2D_ARRAY) */;
    }

    // Nothing found!
    throw NotFoundException.getNotFoundInstance();
  }

  /**
   * @throws NotFoundException
   */
  public findMulti(hints: Map<DecodeHintType, any>): FinderPatternInfo[] {
    const tryHarder: boolean = hints != null && hints.has(DecodeHintType.TRY_HARDER);
    const image: BitMatrix = this.getImage();
    const maxI: int = image.getHeight();
    const maxJ: int = image.getWidth();
    // We are looking for black/white/black/white/black modules in
    // 1:1:3:1:1 ratio; this tracks the number of such modules seen so far

    // Let's assume that the maximum version QR Code we support takes up 1/4 the height of the
    // image, and then account for the center being 3 modules in size. This gives the smallest
    // number of pixels the center could be, so skip this often. When trying harder, look for all
    // QR versions regardless of how dense they are.
    let iSkip: int = Math.trunc((3 * maxI) / (4 * MultiFinderPatternFinder.MAX_MODULES)); // TYPESCRIPTPORT: Java integer divisions always discard decimal chars.
    if (iSkip < MultiFinderPatternFinder.MIN_SKIP || tryHarder) {
      iSkip = MultiFinderPatternFinder.MIN_SKIP;
    }

    const stateCount: Int32Array = Int32Array.from({ length: 5 });
    for (let i: int = iSkip - 1; i < maxI; i += iSkip) {
      // Get a row of black/white values
      this.clearCounts(stateCount);
      let currentState: int = 0;
      for (let j: int = 0; j < maxJ; j++) {
        if (image.get(j, i)) {
          // Black pixel
          if ((currentState & 1) === 1) { // Counting white pixels
            currentState++;
          }
          stateCount[currentState]++;
        } else { // White pixel
          if ((currentState & 1) === 0) { // Counting black pixels
            if (currentState === 4) { // A winner?
              if (MultiFinderPatternFinder.foundPatternCross(stateCount) && this.handlePossibleCenter(stateCount, i, j)) { // Yes
                // Clear state to start looking again
                currentState = 0;
                this.clearCounts(stateCount);
              } else { // No, shift counts back by two
                this.shiftCounts2(stateCount);
                currentState = 3;
              }
            } else {
              stateCount[++currentState]++;
            }
          } else { // Counting white pixels
            stateCount[currentState]++;
          }
        }
      } // for j=...

      if (MultiFinderPatternFinder.foundPatternCross(stateCount)) {
        this.handlePossibleCenter(stateCount, i, maxJ);
      }
    } // for i=iSkip-1 ...
    const patternInfo: FinderPattern[][] = this.selectMultipleBestPatterns();
    const result: List<FinderPatternInfo> = new Array();
    for (const pattern of patternInfo) {
      ResultPoint.orderBestPatterns(pattern);
      result.push(new FinderPatternInfo(pattern));
    }

    if (result.length === 0) {
      return MultiFinderPatternFinder.EMPTY_RESULT_ARRAY;
    } else {
      return result/* .toArray(MultiFinderPatternFinder.EMPTY_RESULT_ARRAY) */;
    }
  }

}

  /**
   * A comparator that orders FinderPatterns by their estimated module size.
   */
  /* private static final */ class ModuleSizeComparator implements Comparator<FinderPattern>/* , Serializable */ {
    /** @override */
    public compare(center1: FinderPattern, center2: FinderPattern): int {
      const value: float = center2.getEstimatedModuleSize() - center1.getEstimatedModuleSize();
      return value < 0.0 ? -1 : value > 0.0 ? 1 : 0;
    }
  }
