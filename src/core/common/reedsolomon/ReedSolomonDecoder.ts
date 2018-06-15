/*
 * Copyright 2007 ZXing authors
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

/*namespace com.google.zxing.common.reedsolomon {*/

import GenericGF from './GenericGF';
import GenericGFPoly from './GenericGFPoly';

import ReedSolomonException from '../../ReedSolomonException';
import IllegalStateException from '../../IllegalStateException';

/**
 * <p>Implements Reed-Solomon decoding, as the name implies.</p>
 *
 * <p>The algorithm will not be explained here, but the following references were helpful
 * in creating this implementation:</p>
 *
 * <ul>
 * <li>Bruce Maggs.
 * <a href="http://www.cs.cmu.edu/afs/cs.cmu.edu/project/pscico-guyb/realworld/www/rs_decode.ps">
 * "Decoding Reed-Solomon Codes"</a> (see discussion of Forney's Formula)</li>
 * <li>J.I. Hall. <a href="www.mth.msu.edu/~jhall/classes/codenotes/GRS.pdf">
 * "Chapter 5. Generalized Reed-Solomon Codes"</a>
 * (see discussion of Euclidean algorithm)</li>
 * </ul>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 * @author sanfordsquires
 */
export default class ReedSolomonDecoder {

    public constructor(private field: GenericGF) { }

    /**
     * <p>Decodes given set of received codewords, which include both data and error-correction
     * codewords. Really, this means it uses Reed-Solomon to detect and correct errors, in-place,
     * in the input.</p>
     *
     * @param received data and error-correction codewords
     * @param twoS number of error-correction codewords available
     * @throws ReedSolomonException if decoding fails for any reason
     */
    public decode(received: Int32Array, twoS: number /*int*/): void /*throws ReedSolomonException*/ {
        const field = this.field;
        const poly = new GenericGFPoly(field, received);
        const syndromeCoefficients = new Int32Array(twoS);
        let noError: boolean = true;
        for (let i = 0; i < twoS; i++) {
            const evalResult = poly.evaluateAt(field.exp(i + field.getGeneratorBase()));
            syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalResult;
            if (evalResult !== 0) {
                noError = false;
            }
        }
        if (noError) {
            return;
        }
        const syndrome = new GenericGFPoly(field, syndromeCoefficients);
        const sigmaOmega = this.runEuclideanAlgorithm(field.buildMonomial(twoS, 1), syndrome, twoS);
        const sigma = sigmaOmega[0];
        const omega = sigmaOmega[1];
        const errorLocations = this.findErrorLocations(sigma);
        const errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
        for (let i = 0; i < errorLocations.length; i++) {
            const position = received.length - 1 - field.log(errorLocations[i]);
            if (position < 0) {
                throw new ReedSolomonException('Bad error location');
            }
            received[position] = GenericGF.addOrSubtract(received[position], errorMagnitudes[i]);
        }
    }

    private runEuclideanAlgorithm(a: GenericGFPoly, b: GenericGFPoly, R: number /*int*/): GenericGFPoly[] {
        // Assume a's degree is >= b's
        if (a.getDegree() < b.getDegree()) {
            const temp = a;
            a = b;
            b = temp;
        }

        const field = this.field;

        let rLast = a;
        let r = b;
        let tLast = field.getZero();
        let t = field.getOne();

        // Run Euclidean algorithm until r's degree is less than R/2
        while (r.getDegree() >= (R / 2 | 0)) {
            let rLastLast = rLast;
            let tLastLast = tLast;
            rLast = r;
            tLast = t;

            // Divide rLastLast by rLast, with quotient in q and remainder in r
            if (rLast.isZero()) {
                // Oops, Euclidean algorithm already terminated?
                throw new ReedSolomonException('r_{i-1} was zero');
            }
            r = rLastLast;
            let q = field.getZero();
            const denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
            const dltInverse = field.inverse(denominatorLeadingTerm);
            while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
                const degreeDiff = r.getDegree() - rLast.getDegree();
                const scale = field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
                q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
                r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }

            t = q.multiply(tLast).addOrSubtract(tLastLast);

            if (r.getDegree() >= rLast.getDegree()) {
                throw new IllegalStateException('Division algorithm failed to reduce polynomial?');
            }
        }

        const sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero === 0) {
            throw new ReedSolomonException('sigmaTilde(0) was zero');
        }

        const inverse = field.inverse(sigmaTildeAtZero);
        const sigma = t.multiplyScalar(inverse);
        const omega = r.multiplyScalar(inverse);
        return [sigma, omega];
    }

    private findErrorLocations(errorLocator: GenericGFPoly): Int32Array /*throws ReedSolomonException*/ {
        // This is a direct application of Chien's search
        const numErrors = errorLocator.getDegree();
        if (numErrors === 1) { // shortcut
            return Int32Array.from([errorLocator.getCoefficient(1)]);
        }
        const result = new Int32Array(numErrors);
        let e = 0;
        const field = this.field;
        for (let i = 1; i < field.getSize() && e < numErrors; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                result[e] = field.inverse(i);
                e++;
            }
        }
        if (e !== numErrors) {
            throw new ReedSolomonException('Error locator degree does not match number of roots');
        }
        return result;
    }

    private findErrorMagnitudes(errorEvaluator: GenericGFPoly, errorLocations: Int32Array): Int32Array {
        // This is directly applying Forney's Formula
        const s = errorLocations.length;
        const result = new Int32Array(s);
        const field = this.field;
        for (let i = 0; i < s; i++) {
            const xiInverse = field.inverse(errorLocations[i]);
            let denominator = 1;
            for (let j = 0; j < s; j++) {
                if (i !== j) {
                    // denominator = field.multiply(denominator,
                    //    GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)))
                    // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
                    // Below is a funny-looking workaround from Steven Parkes
                    const term = field.multiply(errorLocations[j], xiInverse);
                    const termPlus1 = (term & 0x1) === 0 ? term | 1 : term & ~1;
                    denominator = field.multiply(denominator, termPlus1);
                }
            }
            result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse),
                field.inverse(denominator));
            if (field.getGeneratorBase() !== 0) {
                result[i] = field.multiply(result[i], xiInverse);
            }
        }
        return result;
    }

}
