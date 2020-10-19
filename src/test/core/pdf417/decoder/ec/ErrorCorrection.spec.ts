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

// import com.google.zxing.ChecksumException;
import { ChecksumException } from '@zxing/library';

// import org.junit.Ignore;
// import org.junit.Test;

// import java.util.Random;
import Random from '../../../util/Random';

import { PDF417DecoderErrorCorrection } from '@zxing/library';

import * as assert from 'assert';
import AbstractErrorCorrectionSpec from './AbstractErrorCorrection.spec';

/**
 * @author Sean Owen
 */
// public final class ErrorCorrectionTestCase extends AbstractErrorCorrectionTestCase {
// class ErrorCorrectionTestCase extends AbstractErrorCorrectionSpec {
describe('ErrorCorrectionTestCase', () => {

    //   @Test
    //   public void testNoError() throws ChecksumException {
    it('testNoError', () => {

        const received = Int32Array.from(PDF417_TEST_WITH_EC);
        // no errors
        checkDecode(received);
    });
    //   }

    //   @Test
    //   public void testOneError() throws ChecksumException {
    it('testOneError', () => {

        const random = AbstractErrorCorrectionSpec.getRandom();
        for (let i: number /*int*/ = 0; i < PDF417_TEST_WITH_EC.length; i++) {
            const received: Int32Array = Int32Array.from(PDF417_TEST_WITH_EC);
            received[i] = random.nextInt(256);
            checkDecode(received);
        }
    });
    // }

    //   @Test
    //   public void testMaxErrors() throws ChecksumException {
    it('testMaxErrors', () => {

        const random: Random = AbstractErrorCorrectionSpec.getRandom();

        for (let testIterations /*int*/ = 0; testIterations < 100; testIterations++) { // # iterations is kind of arbitrary
            const received: Int32Array = Int32Array.from(PDF417_TEST_WITH_EC);
            AbstractErrorCorrectionSpec.corrupt(received, MAX_ERRORS, random);
            checkDecode(received);
        }
    });
    //   }

    //   @Test
    //   public void testTooManyErrors() {
    it('testTooManyErrors', () => {

        const received: Int32Array = Int32Array.from(PDF417_TEST_WITH_EC);
        const random: Random = AbstractErrorCorrectionSpec.getRandom();
        AbstractErrorCorrectionSpec.corrupt(received, MAX_ERRORS + 1, random);
        try {
            checkDecode(received);
            assert.fail('Should not have decoded');
        } catch (ce) {
            if (ce instanceof ChecksumException) {
                // good
                return;
            }
            throw ce;
        }
    });
    //   }

    //   @Ignore("Erasures not implemented yet")
    //   @Test
    //   public void testMaxErasures() throws ChecksumException {
    it('testMaxErasures', () => {

        // ignored as Java version
        return;

        const random: Random = AbstractErrorCorrectionSpec.getRandom();
        for (const test /*int*/ of PDF417_TEST) { // # iterations is kind of arbitrary
            const received = Int32Array.from(PDF417_TEST_WITH_EC);
            const erasures = AbstractErrorCorrectionSpec.erase(received, MAX_ERASURES, random);
            checkDecode(received, erasures);
        }
    });
    //   }

    //   @Ignore("Erasures not implemented yet")
    //   @Test
    //   public void testTooManyErasures() {
    it('testTooManyErasures', () => {

        const random: Random = AbstractErrorCorrectionSpec.getRandom();
        const received: Int32Array = Int32Array.from(PDF417_TEST_WITH_EC);
        const erasures: Int32Array = AbstractErrorCorrectionSpec.erase(received, MAX_ERASURES + 1, random);
        try {
            checkDecode(received, erasures);
            assert.fail('Should not have decoded');
        } catch (ce) {
            if (ce instanceof ChecksumException) {
                // good
                return;
            }
            throw ce;
        }
    });
    //   }

});

const /*private static final int[]*/ PDF417_TEST = Int32Array.from([
    48, 901, 56, 141, 627, 856, 330, 69, 244, 900, 852, 169, 843, 895, 852, 895, 913, 154, 845, 778, 387, 89, 869,
    901, 219, 474, 543, 650, 169, 201, 9, 160, 35, 70, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900,
    900, 900
]);

const /*private static final int[]*/ PDF417_TEST_WITH_EC = Int32Array.from([
    48, 901, 56, 141, 627, 856, 330, 69, 244, 900, 852, 169, 843, 895, 852, 895, 913, 154, 845, 778, 387, 89, 869,
    901, 219, 474, 543, 650, 169, 201, 9, 160, 35, 70, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900,
    900, 900, 769, 843, 591, 910, 605, 206, 706, 917, 371, 469, 79, 718, 47, 777, 249, 262, 193, 620, 597, 477, 450,
    806, 908, 309, 153, 871, 686, 838, 185, 674, 68, 679, 691, 794, 497, 479, 234, 250, 496, 43, 347, 582, 882, 536,
    322, 317, 273, 194, 917, 237, 420, 859, 340, 115, 222, 808, 866, 836, 417, 121, 833, 459, 64, 159
]);

const /*private static final int*/ ECC_BYTES: number = PDF417_TEST_WITH_EC.length - PDF417_TEST.length;
const /*private static final int*/ ERROR_LIMIT: number = ECC_BYTES;
const /*private static final int*/ MAX_ERRORS: number = ERROR_LIMIT / 2;
const /*private static final int*/ MAX_ERASURES: number = ERROR_LIMIT;

const /*private final ErrorCorrection*/ ec = new PDF417DecoderErrorCorrection();

/**
 *
 * @throws ChecksumException
 */
function /*private void*/ checkDecode(received: Int32Array, erasures?: Int32Array) {
    ec.decode(received, ECC_BYTES, erasures || Int32Array.from([0]));
    for (let /*int*/ i = 0; i < PDF417_TEST.length; i++) {
        assert.strictEqual(received[i], PDF417_TEST[i]);
    }
}
