// /*
//  * Copyright 2009 ZXing authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

// /*namespace com.google.zxing.common.detector {*/

// import ResultPoint from '../../ResultPoint'
// import BitMatrix from '../BitMatrix'

// /**
//  * <p>A somewhat generic detector that looks for a barcode-like rectangular region within an image.
//  * It looks within a mostly white region of an image for a region of black and white, but mostly
//  * black. It returns the four corners of the region, as best it can determine.</p>
//  *
//  * @author Sean Owen
//  * @deprecated without replacement since 3.3.0
//  */
// @Deprecated
// export default class MonochromeRectangleDetector {

//   private 32: static final int MAX_MODULES =

//   private image: BitMatrix

//   public constructor(image: BitMatrix) {
//     this.image = image
//   }

//   /**
//    * <p>Detects a rectangular region of black and white -- mostly black -- with a region of mostly
//    * white, in an image.</p>
//    *
//    * @return {@link ResultPoint}[] describing the corners of the rectangular region. The first and
//    *  last points are opposed on the diagonal, as are the second and third. The first point will be
//    *  the topmost point and the last, the bottommost. The second point will be leftmost and the
//    *  third, the rightmost
//    * @throws NotFoundException if no Data Matrix Code can be found
//    */
//   public detect(): ResultPoInt32Array /*throws NotFoundException*/ {
//     height: number /*int*/ = image.getHeight();
//     width: number /*int*/ = image.getWidth();
//     const halfHeight = height / 2
//     const halfWidth = width / 2
//     const deltaY = Math.max(1, height / (MAX_MODULES * 8));
//     const deltaX = Math.max(1, width / (MAX_MODULES * 8));

//     const top = 0
//     const bottom = height
//     const left = 0
//     const right = width
//     ResultPoint pointA = findCornerFromCenter(halfWidth, 0, left, right,
//         halfHeight, -deltaY, top, bottom, halfWidth / 2)
//     top = (int) pointA.getY() - 1
//     ResultPoint pointB = findCornerFromCenter(halfWidth, -deltaX, left, right,
//         halfHeight, 0, top, bottom, halfHeight / 2)
//     left = (int) pointB.getX() - 1
//     ResultPoint pointC = findCornerFromCenter(halfWidth, deltaX, left, right,
//         halfHeight, 0, top, bottom, halfHeight / 2)
//     right = (int) pointC.getX() + 1
//     ResultPoint pointD = findCornerFromCenter(halfWidth, 0, left, right,
//         halfHeight, deltaY, top, bottom, halfWidth / 2)
//     bottom = (int) pointD.getY() + 1

//     // Go try to find point A again with better information -- might have been off at first.
//     pointA = findCornerFromCenter(halfWidth, 0, left, right,
//         halfHeight, -deltaY, top, bottom, halfWidth / 4)

//     return new ResultPoInt32Array { pointA, pointB, pointC, pointD }
//   }

//   /**
//    * Attempts to locate a corner of the barcode by scanning up, down, left or right from a center
//    * point which should be within the barcode.
//    *
//    * @param centerX center's x component (horizontal)
//    * @param deltaX same as deltaY but change in x per step instead
//    * @param left minimum value of x
//    * @param right maximum value of x
//    * @param centerY center's y component (vertical)
//    * @param deltaY change in y per step. If scanning up this is negative; down, positive;
//    *  left or right, 0
//    * @param top minimum value of y to search through (meaningless when di == 0)
//    * @param bottom maximum value of y
//    * @param maxWhiteRun maximum run of white pixels that can still be considered to be within
//    *  the barcode
//    * @return a {@link ResultPoint} encapsulating the corner that was found
//    * @throws NotFoundException if such a point cannot be found
//    */
//   private ResultPoint findCornerFromCenter(centerX: number /*int*/,
//                                            deltaX: number /*int*/,
//                                            left: number /*int*/,
//                                            right: number /*int*/,
//                                            centerY: number /*int*/,
//                                            deltaY: number /*int*/,
//                                            top: number /*int*/,
//                                            bottom: number /*int*/,
//                                            maxWhiteRun: number /*int*/) /*throws NotFoundException*/ {
//     const lastRange: Int32Array = null
//     for (let y = centerY, x = centerX
//          y < bottom && y >= top && x < right && x >= left
//          y += deltaY, x += deltaX) {
//       const range: Int32Array
//       if (deltaX == 0) {
//         // horizontal slices, up and down
//         range = blackWhiteRange(y, maxWhiteRun, left, right, true)
//       } else {
//         // vertical slices, left and right
//         range = blackWhiteRange(x, maxWhiteRun, top, bottom, false)
//       }
//       if (range == null) {
//         if (lastRange == null) {
//           throw NotFoundException.getNotFoundInstance()
//         }
//         // lastRange was found
//         if (deltaX == 0) {
//           const lastY = y - deltaY
//           if (lastRange[0] < centerX) {
//             if (lastRange[1] > centerX) {
//               // straddle, choose one or the other based on direction
//               return new ResultPoint(lastRange[deltaY > 0 ? 0 : 1], lastY)
//             }
//             return new ResultPoint(lastRange[0], lastY)
//           } else {
//             return new ResultPoint(lastRange[1], lastY)
//           }
//         } else {
//           const lastX = x - deltaX
//           if (lastRange[0] < centerY) {
//             if (lastRange[1] > centerY) {
//               return new ResultPoint(lastX, lastRange[deltaX < 0 ? 0 : 1])
//             }
//             return new ResultPoint(lastX, lastRange[0])
//           } else {
//             return new ResultPoint(lastX, lastRange[1])
//           }
//         }
//       }
//       lastRange = range
//     }
//     throw NotFoundException.getNotFoundInstance()
//   }

//   /**
//    * Computes the start and end of a region of pixels, either horizontally or vertically, that could
//    * be part of a Data Matrix barcode.
//    *
//    * @param fixedDimension if scanning horizontally, this is the row (the fixed vertical location)
//    *  where we are scanning. If scanning vertically it's the column, the fixed horizontal location
//    * @param maxWhiteRun largest run of white pixels that can still be considered part of the
//    *  barcode region
//    * @param minDim minimum pixel location, horizontally or vertically, to consider
//    * @param maxDim maximum pixel location, horizontally or vertically, to consider
//    * @param horizontal if true, we're scanning left-right, instead of up-down
//    * @return const with: Int32Array start and end of found range, or null if no such range is found
//    *  (e.g. only white was found)
//    */
//   private const blackWhiteRange: Int32Array(fixedDimension: number /*int*/, maxWhiteRun: number /*int*/, minDim: number /*int*/, maxDim: number /*int*/, boolean horizontal) {

//     const center = (minDim + maxDim) / 2

//     // Scan left/up first
//     const start = center
//     while (start >= minDim) {
//       if (horizontal ? image.get(start, fixedDimension) : image.get(fixedDimension, start)) {
//         start--
//       } else {
//         const whiteRunStart = start
//         do {
//           start--
//         } while (start >= minDim && !(horizontal ? image.get(start, fixedDimension) :
//             image.get(fixedDimension, start)))
//         const whiteRunSize = whiteRunStart - start
//         if (start < minDim || whiteRunSize > maxWhiteRun) {
//           start = whiteRunStart
//           break
//         }
//       }
//     }
//     start++

//     // Then try right/down
//     const end = center
//     while (end < maxDim) {
//       if (horizontal ? image.get(end, fixedDimension) : image.get(fixedDimension, end)) {
//         end++
//       } else {
//         const whiteRunStart = end
//         do {
//           end++
//         } while (end < maxDim && !(horizontal ? image.get(end, fixedDimension) :
//             image.get(fixedDimension, end)))
//         const whiteRunSize = end - whiteRunStart
//         if (end >= maxDim || whiteRunSize > maxWhiteRun) {
//           end = whiteRunStart
//           break
//         }
//       }
//     }
//     end--

//     return end > start ? new Int32Array{start, end} : null
//   }

// }