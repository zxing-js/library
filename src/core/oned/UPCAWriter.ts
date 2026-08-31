/*
 * Copyright 2010 ZXing authors
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

// package com.google.zxing.oned;

import BarcodeFormat from '../BarcodeFormat';
import BitMatrix from '../common/BitMatrix';
import EncodeHintType from '../EncodeHintType';
import IllegalArgumentException from '../IllegalArgumentException';
import Writer from '../Writer';
import EAN13Writer from './EAN13Writer';

import { int } from '../../customTypings';

/**
 * This object renders a UPC-A code as a {@link BitMatrix}.
 *
 * @author qwandor@google.com (Andrew Walbran)
 */
export default class UPCAWriter implements Writer {

    private subWriter = new EAN13Writer();

    // @Override
    public encode(
        contents: string,
        format: BarcodeFormat,
        width: int,
        height: int,
        hints: Map<EncodeHintType, any> = null
    ): BitMatrix {
        if (format !== BarcodeFormat.UPC_A) {
            throw new IllegalArgumentException('Can only encode UPC-A, but got ' + format);
        }
        // Transform a UPC-A code into the equivalent EAN-13 code and write it that way
        return this.subWriter.encode('0' + contents, BarcodeFormat.EAN_13, width, height, hints);
    }

}
