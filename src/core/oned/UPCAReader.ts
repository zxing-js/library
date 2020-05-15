/*
 * Copyright 2008 ZXing authors
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

/*namespace com.google.zxing.oned {*/

import BinaryBitmap from '../BinaryBitmap';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';

import Reader from '../Reader';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import NotFoundException from '../NotFoundException';

/**
 * Encapsulates functionality and implementation that is common to all families
 * of one-dimensional barcodes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author sam2332 (Sam Rudloff)
 */
export default abstract class UPCAReader implements Reader {



    // Note that we don't try rotation without the try harder flag, even if rotation was supported.
    // @Override
    public decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any>): Result {
        
    }

    // @Override
    public reset(): void {
        // do nothing
    }
}
