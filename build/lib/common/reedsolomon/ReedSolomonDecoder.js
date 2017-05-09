"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.common.reedsolomon {*/
var GenericGF_1 = require("./GenericGF");
var GenericGFPoly_1 = require("./GenericGFPoly");
var Exception_1 = require("./../../Exception");
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
var ReedSolomonDecoder = (function () {
    function ReedSolomonDecoder(field) {
        this.field = field;
    }
    /**
     * <p>Decodes given set of received codewords, which include both data and error-correction
     * codewords. Really, this means it uses Reed-Solomon to detect and correct errors, in-place,
     * in the input.</p>
     *
     * @param received data and error-correction codewords
     * @param twoS number of error-correction codewords available
     * @throws ReedSolomonException if decoding fails for any reason
     */
    ReedSolomonDecoder.prototype.decode = function (received, twoS /*int*/) {
        var field = this.field;
        var poly = new GenericGFPoly_1.default(field, received);
        var syndromeCoefficients = new Int32Array(twoS);
        var noError = true;
        for (var i = 0; i < twoS; i++) {
            var evalResult = poly.evaluateAt(field.exp(i + field.getGeneratorBase()));
            syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalResult;
            if (evalResult !== 0) {
                noError = false;
            }
        }
        if (noError) {
            return;
        }
        var syndrome = new GenericGFPoly_1.default(field, syndromeCoefficients);
        var sigmaOmega = this.runEuclideanAlgorithm(field.buildMonomial(twoS, 1), syndrome, twoS);
        var sigma = sigmaOmega[0];
        var omega = sigmaOmega[1];
        var errorLocations = this.findErrorLocations(sigma);
        var errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
        for (var i = 0; i < errorLocations.length; i++) {
            var position = received.length - 1 - field.log(errorLocations[i]);
            if (position < 0) {
                throw new Exception_1.default("ReedSolomonException", "Bad error location");
            }
            received[position] = GenericGF_1.default.addOrSubtract(received[position], errorMagnitudes[i]);
        }
    };
    ReedSolomonDecoder.prototype.runEuclideanAlgorithm = function (a, b, R /*int*/) {
        // Assume a's degree is >= b's
        if (a.getDegree() < b.getDegree()) {
            var temp = a;
            a = b;
            b = temp;
        }
        var field = this.field;
        var rLast = a;
        var r = b;
        var tLast = field.getZero();
        var t = field.getOne();
        // Run Euclidean algorithm until r's degree is less than R/2
        while (r.getDegree() >= R / 2) {
            var rLastLast = rLast;
            var tLastLast = tLast;
            rLast = r;
            tLast = t;
            // Divide rLastLast by rLast, with quotient in q and remainder in r
            if (rLast.isZero()) {
                // Oops, Euclidean algorithm already terminated?
                throw new Exception_1.default("ReedSolomonException", "r_{i-1} was zero");
            }
            r = rLastLast;
            var q = field.getZero();
            var denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
            var dltInverse = field.inverse(denominatorLeadingTerm);
            while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
                var degreeDiff = r.getDegree() - rLast.getDegree();
                var scale = field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
                q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
                r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }
            t = q.multiply(tLast).addOrSubtract(tLastLast);
            if (r.getDegree() >= rLast.getDegree()) {
                throw new Exception_1.default("IllegalStateException", "Division algorithm failed to reduce polynomial?");
            }
        }
        var sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero === 0) {
            throw new Exception_1.default("ReedSolomonException", "sigmaTilde(0) was zero");
        }
        var inverse = field.inverse(sigmaTildeAtZero);
        var sigma = t.multiplyScalar(inverse);
        var omega = r.multiplyScalar(inverse);
        return [sigma, omega];
    };
    ReedSolomonDecoder.prototype.findErrorLocations = function (errorLocator) {
        // This is a direct application of Chien's search
        var numErrors = errorLocator.getDegree();
        if (numErrors === 1) {
            return Int32Array.from([errorLocator.getCoefficient(1)]);
        }
        var result = new Int32Array(numErrors);
        var e = 0;
        var field = this.field;
        for (var i = 1; i < field.getSize() && e < numErrors; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                result[e] = field.inverse(i);
                e++;
            }
        }
        if (e !== numErrors) {
            throw new Exception_1.default("ReedSolomonException", "Error locator degree does not match number of roots");
        }
        return result;
    };
    ReedSolomonDecoder.prototype.findErrorMagnitudes = function (errorEvaluator, errorLocations) {
        // This is directly applying Forney's Formula
        var s = errorLocations.length;
        var result = new Int32Array(s);
        var field = this.field;
        for (var i = 0; i < s; i++) {
            var xiInverse = field.inverse(errorLocations[i]);
            var denominator = 1;
            for (var j = 0; j < s; j++) {
                if (i !== j) {
                    //denominator = field.multiply(denominator,
                    //    GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)))
                    // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
                    // Below is a funny-looking workaround from Steven Parkes
                    var term = field.multiply(errorLocations[j], xiInverse);
                    var termPlus1 = (term & 0x1) == 0 ? term | 1 : term & ~1;
                    denominator = field.multiply(denominator, termPlus1);
                }
            }
            result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
            if (field.getGeneratorBase() != 0) {
                result[i] = field.multiply(result[i], xiInverse);
            }
        }
        return result;
    };
    return ReedSolomonDecoder;
}());
exports.default = ReedSolomonDecoder;
//# sourceMappingURL=ReedSolomonDecoder.js.map