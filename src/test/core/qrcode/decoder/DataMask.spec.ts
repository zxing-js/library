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

/*package com.google.zxing.qrcode.decoder;*/

import * as assert from 'assert';
import BitMatrix from '../../../../core/common/BitMatrix';
import DataMask from '../../../../core/qrcode/decoder/DataMask';

interface MaskCondition {
    isMasked(i: number /*int*/, j: number /*int*/): boolean;
}

/**
 * @author Sean Owen
 */
describe('DataMask', () => {

    it('testMask0', () => {
        testMaskAcrossDimensions(0, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return (i + j) % 2 === 0;
            }
        });
    });

    it('testMask1', () => {
        testMaskAcrossDimensions(1, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return i % 2 === 0;
            }
        });
    });

    it('testMask2', () => {
        testMaskAcrossDimensions(2, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return j % 3 === 0;
            }
        });
    });

    it('testMask3', () => {
        testMaskAcrossDimensions(3, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return (i + j) % 3 === 0;
            }
        });
    });

    it('testMask4', () => {
        testMaskAcrossDimensions(4, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
            }
        });
    });

    it('testMask5', () => {
        testMaskAcrossDimensions(5, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return (i * j) % 2 + (i * j) % 3 === 0;
            }
        });
    });

    it('testMask6', () => {
        testMaskAcrossDimensions(6, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
            }
        });
    });

    it('testMask7', () => {
        testMaskAcrossDimensions(7, {
            isMasked(i: number /*int*/, j: number /*int*/): boolean {
                return ((i + j) % 2 + (i * j) % 3) % 2 === 0;
            }
        });
    });

    function testMaskAcrossDimensions(reference: number /*int*/, condition: MaskCondition): void {
        const mask = DataMask.values.get(reference);
        for (let version: number /*int*/ = 1; version <= 40; version++) {
            const dimension: number /*int*/ = 17 + 4 * version;
            testMask(mask, dimension, condition);
        }
    }

    function testMask(mask: DataMask, dimension: number /*int*/, condition: MaskCondition): void {
        const bits = new BitMatrix(dimension);
        mask.unmaskBitMatrix(bits, dimension);
        for (let i: number /*int*/ = 0; i < dimension; i++) {
            for (let j: number /*int*/ = 0; j < dimension; j++) {
                assert.strictEqual(
                    bits.get(j, i),
                    condition.isMasked(i, j),
                    '(' + i + ',' + j + ')');
            }
        }
    }

});
