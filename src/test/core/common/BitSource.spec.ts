/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing.common;*/

import * as assert from 'assert';
import { BitSource } from '@zxing/library';

/**
 * @author Sean Owen
 */
describe('BitSource', () => {

    it('testSource', () => {
        const bytes = Uint8Array.from([
            /*(byte)*/ 1,
            /*(byte)*/ 2,
            /*(byte)*/ 3,
            /*(byte)*/ 4,
            /*(byte)*/ 5
        ]);

        const source = new BitSource(bytes);

        assert.strictEqual(source.available(), 40);
        assert.strictEqual(source.readBits(1), 0);
        assert.strictEqual(source.available(), 39);
        assert.strictEqual(source.readBits(6), 0);
        assert.strictEqual(source.available(), 33);
        assert.strictEqual(source.readBits(1), 1);
        assert.strictEqual(source.available(), 32);
        assert.strictEqual(source.readBits(8), 2);
        assert.strictEqual(source.available(), 24);
        assert.strictEqual(source.readBits(10), 12);
        assert.strictEqual(source.available(), 14);
        assert.strictEqual(source.readBits(8), 16);
        assert.strictEqual(source.available(), 6);
        assert.strictEqual(source.readBits(6), 5);
        assert.strictEqual(source.available(), 0);
    });

});
