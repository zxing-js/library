/*
 * Copyright 2014 ZXing authors
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
// package com.google.zxing.aztec.decoder;

// import com.google.zxing.FormatException;
// import com.google.zxing.ResultPoint;
// import com.google.zxing.aztec.AztecDetectorResult;
// import com.google.zxing.common.BitMatrix;
import { BitMatrix } from '@zxing/library';
// import com.google.zxing.common.DecoderResult;
// import org.junit.Test;
// import org.junit.Assert;
import { assertEquals, assertArrayEquals, assertThrow } from '../../../core/util/AssertUtils';

import { ResultPoint } from '@zxing/library';
import { AztecDecoder } from '@zxing/library';
import { AztecDetectorResult } from '@zxing/library';
import { FormatException } from '@zxing/library';

/**
 * Tests {@link Decoder}.
 */
describe('DecoderTest', () => {

    const NO_POINTS: ResultPoint[] = [];

    /**
     * @Test
     * @throws FormatException
     */
    it('testAztecResult', () => {
        const matrix = BitMatrix.parseFromString(
            'X X X X X     X X X       X X X     X X X     \n' +
            'X X X     X X X     X X X X     X X X     X X \n' +
            '  X   X X       X   X   X X X X     X     X X \n' +
            '  X   X X     X X     X     X   X       X   X \n' +
            '  X X   X X         X               X X     X \n' +
            '  X X   X X X X X X X X X X X X X X X     X   \n' +
            '  X X X X X                       X   X X X   \n' +
            '  X   X   X   X X X X X X X X X   X X X   X X \n' +
            '  X   X X X   X               X   X X       X \n' +
            '  X X   X X   X   X X X X X   X   X X X X   X \n' +
            '  X X   X X   X   X       X   X   X   X X X   \n' +
            '  X   X   X   X   X   X   X   X   X   X   X   \n' +
            '  X X X   X   X   X       X   X   X X   X X   \n' +
            '  X X X X X   X   X X X X X   X   X X X   X X \n' +
            'X X   X X X   X               X   X   X X   X \n' +
            '  X       X   X X X X X X X X X   X   X     X \n' +
            '  X X   X X                       X X   X X   \n' +
            '  X X X   X X X X X X X X X X X X X X   X X   \n' +
            'X     X     X     X X   X X               X X \n' +
            'X   X X X X X   X X X X X     X   X   X     X \n' +
            'X X X   X X X X           X X X       X     X \n' +
            'X X     X X X     X X X X     X X X     X X   \n' +
            '    X X X     X X X       X X X     X X X X   \n',
            'X ', '  ');
        const r = new AztecDetectorResult(matrix, NO_POINTS, false, 30, 2);
        const result = new AztecDecoder().decode(r);
        assertEquals('88888TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', result.getText());
        assertArrayEquals(
            new Uint8Array([- 11, 85, 85, 117, 107, 90, -42, -75, -83, 107,
                90, -42, -75, -83, 107, 90, -42, -75, -83, 107,
                90, -42, -80]),
            result.getRawBytes());
        assertEquals(180, result.getNumBits());
    });

    /**
     * @Test(expected = FormatException.class)
     * throws FormatException
    */
    it('testDecodeTooManyErrors', () => {
        const matrix = BitMatrix.parseFromString(''
            + 'X X . X . . . X X . . . X . . X X X . X . X X X X X . \n'
            + 'X X . . X X . . . . . X X . . . X X . . . X . X . . X \n'
            + 'X . . . X X . . X X X . X X . X X X X . X X . . X . . \n'
            + '. . . . X . X X . . X X . X X . X . X X X X . X . . X \n'
            + 'X X X . . X X X X X . . . . . X X . . . X . X . X . X \n'
            + 'X X . . . . . . . . X . . . X . X X X . X . . X . . . \n'
            + 'X X . . X . . . . . X X . . . . . X . . . . X . . X X \n'
            + '. . . X . X . X . . . . . X X X X X X . . . . . . X X \n'
            + 'X . . . X . X X X X X X . . X X X . X . X X X X X X . \n'
            + 'X . . X X X . X X X X X X X X X X X X X . . . X . X X \n'
            + '. . . . X X . . . X . . . . . . . X X . . . X X . X . \n'
            + '. . . X X X . . X X . X X X X X . X . . X . . . . . . \n'
            + 'X . . . . X . X . X . X . . . X . X . X X . X X . X X \n'
            + 'X . X . . X . X . X . X . X . X . X . . . . . X . X X \n'
            + 'X . X X X . . X . X . X . . . X . X . X X X . . . X X \n'
            + 'X X X X X X X X . X . X X X X X . X . X . X . X X X . \n'
            + '. . . . . . . X . X . . . . . . . X X X X . . . X X X \n'
            + 'X X . . X . . X . X X X X X X X X X X X X X . . X . X \n'
            + 'X X X . X X X X . . X X X X . . X . . . . X . . X X X \n'
            + '. . . . X . X X X . . . . X X X X . . X X X X . . . . \n'
            + '. . X . . X . X . . . X . X X . X X . X . . . X . X . \n'
            + 'X X . . X . . X X X X X X X . . X . X X X X X X X . . \n'
            + 'X . X X . . X X . . . . . X . . . . . . X X . X X X . \n'
            + 'X . . X X . . X X . X . X . . . . X . X . . X . . X . \n'
            + 'X . X . X . . X . X X X X X X X X . X X X X . . X X . \n'
            + 'X X X X . . . X . . X X X . X X . . X . . . . X X X . \n'
            + 'X X . X . X . . . X . X . . . . X X . X . . X X . . . \n',
            'X ', '. ');
        const r = new AztecDetectorResult(matrix, NO_POINTS, true, 16, 4);
        assertThrow(() => new AztecDecoder().decode(r), FormatException);
    });

    /**
     *
     * @Test(expected = FormatException.class)
     * @throws FormatException
     */
    it('testDecodeTooManyErrors2', () => {
        const matrix = BitMatrix.parseFromString(''
            + '. X X . . X . X X . . . X . . X X X . . . X X . X X . \n'
            + 'X X . X X . . X . . . X X . . . X X . X X X . X . X X \n'
            + '. . . . X . . . X X X . X X . X X X X . X X . . X . . \n'
            + 'X . X X . . X . . . X X . X X . X . X X . . . . . X . \n'
            + 'X X . X . . X . X X . . . . . X X . . . . . X . . . X \n'
            + 'X . . X . . . . . . X . . . X . X X X X X X X . . . X \n'
            + 'X . . X X . . X . . X X . . . . . X . . . . . X X X . \n'
            + '. . X X X X . X . . . . . X X X X X X . . . . . . X X \n'
            + 'X . . . X . X X X X X X . . X X X . X . X X X X X X . \n'
            + 'X . . X X X . X X X X X X X X X X X X X . . . X . X X \n'
            + '. . . . X X . . . X . . . . . . . X X . . . X X . X . \n'
            + '. . . X X X . . X X . X X X X X . X . . X . . . . . . \n'
            + 'X . . . . X . X . X . X . . . X . X . X X . X X . X X \n'
            + 'X . X . . X . X . X . X . X . X . X . . . . . X . X X \n'
            + 'X . X X X . . X . X . X . . . X . X . X X X . . . X X \n'
            + 'X X X X X X X X . X . X X X X X . X . X . X . X X X . \n'
            + '. . . . . . . X . X . . . . . . . X X X X . . . X X X \n'
            + 'X X . . X . . X . X X X X X X X X X X X X X . . X . X \n'
            + 'X X X . X X X X . . X X X X . . X . . . . X . . X X X \n'
            + '. . X X X X X . X . . . . X X X X . . X X X . X . X . \n'
            + '. . X X . X . X . . . X . X X . X X . . . . X X . . . \n'
            + 'X . . . X . X . X X X X X X . . X . X X X X X . X . . \n'
            + '. X . . . X X X . . . . . X . . . . . X X X X X . X . \n'
            + 'X . . X . X X X X . X . X . . . . X . X X . X . . X . \n'
            + 'X . . . X X . X . X X X X X X X X . X X X X . . X X . \n'
            + '. X X X X . . X . . X X X . X X . . X . . . . X X X . \n'
            + 'X X . . . X X . . X . X . . . . X X . X . . X . X . X \n',
            'X ', '. ');
        const r = new AztecDetectorResult(matrix, NO_POINTS, true, 16, 4);
        assertThrow(() => new AztecDecoder().decode(r), FormatException);
    });

    /**
     * @Test
     */
    it('testRawBytes', () => {
        let bool0: boolean[] = [];
        let bool1: boolean[] = [true];
        let bool7: boolean[] = [true, false, true, false, true, false, true];
        let bool8: boolean[] = [true, false, true, false, true, false, true, false];
        let bool9: boolean[] = [
            true, false, true, false, true, false, true, false,
            true];
        let bool16: boolean[] = [
            false, true, true, false, false, false, true, true,
            true, true, false, false, false, false, false, true];
        let byte0: /*byte[]*/Uint8Array = new Uint8Array([]);
        let byte1: /*byte[]*/Uint8Array = new Uint8Array([-128]);
        let byte7: /*byte[]*/ Uint8Array = new Uint8Array([- 86]);
        let byte8: /*byte[]*/ Uint8Array = new Uint8Array([- 86]);
        let byte9: /*byte[]*/ Uint8Array = new Uint8Array([- 86, -128]);
        let byte16: /*byte[]*/ Uint8Array = new Uint8Array([99, - 63]);

        assertArrayEquals(byte0, AztecDecoder.convertBoolArrayToByteArray(bool0));
        assertArrayEquals(byte1, AztecDecoder.convertBoolArrayToByteArray(bool1));
        assertArrayEquals(byte7, AztecDecoder.convertBoolArrayToByteArray(bool7));
        assertArrayEquals(byte8, AztecDecoder.convertBoolArrayToByteArray(bool8));
        assertArrayEquals(byte9, AztecDecoder.convertBoolArrayToByteArray(bool9));
        assertArrayEquals(byte16, AztecDecoder.convertBoolArrayToByteArray(bool16));
    });
});
