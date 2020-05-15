/*
 * Copyright 2012 ZXing authors
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

// package com.google.zxing.pdf417.decoder.ec;

import Random from '../../../util/Random';
import BitSet from '../../../util/BitSet';
import { corrupt } from '../../../common/reedsolomon/ReedSolomonCorrupt';
// import org.junit.Assert;

// import java.util.BitSet;
// import java.util.Random;

/**
 * @author Sean Owen
 */
export default abstract class AbstractErrorCorrectionSpec {

    static corrupt(received: Int32Array, howMany: /*int*/number, random: Random): void {
        corrupt(received, howMany, random, 929);
    }

    static erase(received: Int32Array, howMany: /*int*/number, random: Random): Int32Array {
        const erased: BitSet = new Map<number, boolean>(/*received.length*/);
        const erasures = new Int32Array(howMany);

        let erasureOffset = 0;

        for (let j = 0; j < howMany; j++) {
            const location = random.next(received.length);
            if (erased.get(location)) {
                j--;
            } else {
                erased.set(location, true);
                received[location] = 0;
                erasures[erasureOffset++] = location;
            }
        }
        return erasures;
    }

    static getRandom(): Random {
        return new Random('0xDEADBEEF');
    }

}
