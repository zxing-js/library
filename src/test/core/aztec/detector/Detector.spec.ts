/*
* Copyright 2013 ZXing authors
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

// package com.google.zxing.aztec.detector;

// import com.google.zxing.NotFoundException;
import { NotFoundException } from '@zxing/library';
// import com.google.zxing.aztec.AztecDetectorResult;
import { AztecDetectorResult } from '@zxing/library';
// import com.google.zxing.aztec.decoder.Decoder;
import { AztecDecoder } from '@zxing/library';
// import com.google.zxing.aztec.detector.Detector.AztecPoint;
import { AztecDetector, AztecPoint } from '@zxing/library';
// import com.google.zxing.aztec.encoder.AztecCode;
import { AztecCode } from '@zxing/library';
// import com.google.zxing.aztec.encoder.AztecEncoder;
import { AztecEncoder } from '@zxing/library';
// import { AztecEncoder } from '@zxing/library';
// import com.google.zxing.common.BitMatrix;
import { BitMatrix } from '@zxing/library';
// import com.google.zxing.common.DecoderResult;
import { DecoderResult } from '@zxing/library';
// import org.junit.Assert;
import { assertEquals, assertNotNull, assertThrow } from '../../util/AssertUtils';
import { fail } from 'assert';
// import org.junit.Test;

// import java.nio.charset.ZXingStandardCharsets;
// import java.util.ArrayList;
// import java.util.ZXingArrays;
import { ZXingArrays } from '@zxing/library';
// import java.util.Collection;
// import java.util.List;
// import java.util.Random;
import Random from '../../../core/util/Random';
import { StringUtils } from '@zxing/library';
import { ZXingStandardCharsets } from '@zxing/library';
import { ZXingInteger } from '@zxing/library';
// import java.util.TreeSet;

/**
 * Tests for the Detector
 *
 * @author Frank Yellin
 */
// public final class DetectorTest extends Assert {
describe('DetectorTest', () => {


    /**
     * @Test
     * @throws Exception
     */
    // public void testErrorInParameterLocatorZeroZero() throws Exception {
    it('testErrorInParameterLocatorZeroZero', () => {
        // Layers=1, CodeWords=1.  So the parameter info and its Reed-Solomon info
        // will be completely zero!
        testErrorInParameterLocator('X');
    });

    /**
     * @Test
     * @throws Exception
     */
    //   public void testErrorInParameterLocatorCompact() throws Exception {
    it('testErrorInParameterLocatorCompact', () => {
        testErrorInParameterLocator('This is an example Aztec symbol for Wikipedia.');
    });

    /**
     * @Test
     */
    // public void testErrorInParameterLocatorNotCompact() throws Exception {
    it('testErrorInParameterLocatorNotCompact', () => {
        const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYabcdefghijklmnopqrstuvwxyz';
        testErrorInParameterLocator(alphabet + alphabet + alphabet);
    });

    /**
     * @throws Exception
     */
    // Test that we can tolerate errors in the parameter locator bits
    function testErrorInParameterLocator(data: string): void {
        let aztec: AztecCode = AztecEncoder.encode(StringUtils.getBytes(data, ZXingStandardCharsets.ISO_8859_1), 25, AztecEncoder.DEFAULT_AZTEC_LAYERS);
        let random: Random = new Random(aztec.getMatrix().hashCode().toString());   // pseudo-random, but deterministic
        let layers: /*int*/ number = aztec.getLayers();
        let compact: boolean = aztec.isCompact();
        let orientationPoints: AztecPoint[] = getOrientationPoints(aztec);
        for (const isMirror of [false, true]) {
            for (const matrix of getRotations(aztec.getMatrix())) {
                // Systematically try every possible 1- and 2-bit error.
                for (let error1 = 0; error1 < orientationPoints.length; error1++) {
                    for (let error2 = error1; error2 < orientationPoints.length; error2++) {
                        let copy: BitMatrix = isMirror ? transpose(matrix) : clone(matrix);
                        copy.flip(orientationPoints[error1].getX(), orientationPoints[error1].getY());
                        if (error2 > error1) {
                            // if error2 == error1, we only test a single error
                            copy.flip(orientationPoints[error2].getX(), orientationPoints[error2].getY());
                        }
                        // The detector doesn't seem to work when matrix bits are only 1x1.  So magnify.
                        let r: AztecDetectorResult = new AztecDetector(makeLarger(copy, 3)).detectMirror(isMirror);
                        assertNotNull(r);
                        assertEquals(r.getNbLayers(), layers);
                        assertEquals(r.isCompact(), compact);
                        let res: DecoderResult = new AztecDecoder().decode(r);
                        assertEquals(data, res.getText());
                    }
                }
                // Try a few random three-bit errors;
                for (let i = 0; i < 5; i++) {
                    let copy: BitMatrix = clone(matrix);
                    let errors: /* Collection<Integer> */ Set<number> = /* new TreeSet<>() */ new Set();
                    while (errors.size < 3) {
                        // Quick and dirty way of getting three distinct integers between 1 and n.
                        errors.add(random.nextInt(orientationPoints.length));
                    }
                    for (const error of errors) {
                        copy.flip(orientationPoints[error].getX(), orientationPoints[error].getY());
                    }
                    try {
                        new AztecDetector(makeLarger(copy, 3)).detectMirror(false);
                        fail('Should not reach here');
                    } catch (expected) {
                        // continue
                        if (!(expected instanceof NotFoundException)) {
                            throw expected;
                        }
                    }
                }
            }
        }
    }

    // Zooms a bit matrix so that each bit is factor x factor
    function makeLarger(input: BitMatrix, factor: /*int*/ number): BitMatrix {
        let width: number = input.getWidth();
        let output: BitMatrix = new BitMatrix(width * factor);
        for (let inputY: number = 0; inputY < width; inputY++) {
            for (let inputX: number = 0; inputX < width; inputX++) {
                if (input.get(inputX, inputY)) {
                    output.setRegion(inputX * factor, inputY * factor, factor, factor);
                }
            }
        }
        return output;
    }

    // Returns a list of the four rotations of the BitMatrix.
    function getRotations(matrix0: BitMatrix): BitMatrix[] {
        let matrix90: BitMatrix = rotateRight(matrix0);
        let matrix180: BitMatrix = rotateRight(matrix90);
        let matrix270: BitMatrix = rotateRight(matrix180);
        return ZXingArrays.asList(matrix0, matrix90, matrix180, matrix270);
    }

    // Rotates a square BitMatrix to the right by 90 degrees
    function rotateRight(input: BitMatrix): BitMatrix {
        let width: number = input.getWidth();
        let result: BitMatrix = new BitMatrix(width);
        for (let x /*int*/ = 0; x < width; x++) {
            for (let y /*int*/ = 0; y < width; y++) {
                if (input.get(x, y)) {
                    result.set(y, width - x - 1);
                }
            }
        }
        return result;
    }

    // Returns the transpose of a bit matrix, which is equivalent to rotating the
    // matrix to the right, and then flipping it left-to-right
    function transpose(input: BitMatrix): BitMatrix {
        let width: number = input.getWidth();
        let result: BitMatrix = new BitMatrix(width);
        for (let x: number = 0; x < width; x++) {
            for (let y: number = 0; y < width; y++) {
                if (input.get(x, y)) {
                    result.set(y, x);
                }
            }
        }
        return result;
    }

    function clone(input: BitMatrix): BitMatrix {
        let width: number = input.getWidth();
        let result: BitMatrix = new BitMatrix(width);
        for (let x: number = 0; x < width; x++) {
            for (let y: number = 0; y < width; y++) {
                if (input.get(x, y)) {
                    result.set(x, y);
                }
            }
        }
        return result;
    }

    function getOrientationPoints(code: AztecCode): AztecPoint[] {
        let center: number = ZXingInteger.truncDivision(code.getMatrix().getWidth(), 2);
        let offset: number = code.isCompact() ? 5 : 7;
        let result: AztecPoint[] = [];
        for (let xSign: number = -1; xSign <= 1; xSign += 2) {
            for (let ySign: number = -1; ySign <= 1; ySign += 2) {
                result.push(new AztecPoint(center + xSign * offset, center + ySign * offset));
                result.push(new AztecPoint(center + xSign * (offset - 1), center + ySign * offset));
                result.push(new AztecPoint(center + xSign * offset, center + ySign * (offset - 1)));
            }
        }
        return result;
    }

});
