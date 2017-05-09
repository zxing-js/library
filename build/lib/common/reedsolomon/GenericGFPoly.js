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
var Exception_1 = require("./../../Exception");
var System_1 = require("./../../util/System");
/**
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */
var GenericGFPoly = (function () {
    /**
     * @param field the {@link GenericGF} instance representing the field to use
     * to perform computations
     * @param coefficients coefficients as ints representing elements of GF(size), arranged
     * from most significant (highest-power term) coefficient to least significant
     * @throws IllegalArgumentException if argument is null or empty,
     * or if leading coefficient is 0 and this is not a
     * constant polynomial (that is, it is not the monomial "0")
     */
    function GenericGFPoly(field, coefficients) {
        if (coefficients.length === 0) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        this.field = field;
        var coefficientsLength = coefficients.length;
        if (coefficientsLength > 1 && coefficients[0] == 0) {
            // Leading term must be non-zero for anything except the constant polynomial "0"
            var firstNonZero = 1;
            while (firstNonZero < coefficientsLength && coefficients[firstNonZero] == 0) {
                firstNonZero++;
            }
            if (firstNonZero == coefficientsLength) {
                this.coefficients = Int32Array.from([0]);
            }
            else {
                this.coefficients = new Int32Array(coefficientsLength - firstNonZero);
                System_1.default.arraycopy(coefficients, firstNonZero, this.coefficients, 0, this.coefficients.length);
            }
        }
        else {
            this.coefficients = coefficients;
        }
    }
    GenericGFPoly.prototype.getCoefficients = function () {
        return this.coefficients;
    };
    /**
     * @return degree of this polynomial
     */
    GenericGFPoly.prototype.getDegree = function () {
        return this.coefficients.length - 1;
    };
    /**
     * @return true iff this polynomial is the monomial "0"
     */
    GenericGFPoly.prototype.isZero = function () {
        return this.coefficients[0] === 0;
    };
    /**
     * @return coefficient of x^degree term in this polynomial
     */
    GenericGFPoly.prototype.getCoefficient = function (degree /*int*/) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    };
    /**
     * @return evaluation of this polynomial at a given point
     */
    GenericGFPoly.prototype.evaluateAt = function (a /*int*/) {
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        if (a === 1) {
            // Just the sum of the coefficients
            var result_1 = 0;
            var coefficients_1 = this.coefficients;
            for (var i = 0, length = coefficients_1.length; i != length; i++) {
                var coefficient = coefficients_1[i];
                result_1 = GenericGF_1.default.addOrSubtract(result_1, coefficient);
            }
            return result_1;
        }
        var coefficients = this.coefficients;
        var result = coefficients[0];
        var size = coefficients.length;
        var field = this.field;
        for (var i = 1; i < size; i++) {
            result = GenericGF_1.default.addOrSubtract(field.multiply(a, result), coefficients[i]);
        }
        return result;
    };
    GenericGFPoly.prototype.addOrSubtract = function (other) {
        if (!this.field.equals(other.field)) {
            throw new Exception_1.default("IllegalArgumentException", "GenericGFPolys do not have same GenericGF field");
        }
        if (this.isZero()) {
            return other;
        }
        if (other.isZero()) {
            return this;
        }
        var smallerCoefficients = this.coefficients;
        var largerCoefficients = other.coefficients;
        if (smallerCoefficients.length > largerCoefficients.length) {
            var temp = smallerCoefficients;
            smallerCoefficients = largerCoefficients;
            largerCoefficients = temp;
        }
        var sumDiff = new Int32Array(largerCoefficients.length);
        var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
        // Copy high-order terms only found in higher-degree polynomial's coefficients
        System_1.default.arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
        for (var i = lengthDiff; i < largerCoefficients.length; i++) {
            sumDiff[i] = GenericGF_1.default.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
        }
        return new GenericGFPoly(this.field, sumDiff);
    };
    GenericGFPoly.prototype.multiply = function (other) {
        if (!this.field.equals(other.field)) {
            throw new Exception_1.default("IllegalArgumentException", "GenericGFPolys do not have same GenericGF field");
        }
        if (this.isZero() || other.isZero()) {
            return this.field.getZero();
        }
        var aCoefficients = this.coefficients;
        var aLength = aCoefficients.length;
        var bCoefficients = other.coefficients;
        var bLength = bCoefficients.length;
        var product = new Int32Array(aLength + bLength - 1);
        var field = this.field;
        for (var i = 0; i < aLength; i++) {
            var aCoeff = aCoefficients[i];
            for (var j = 0; j < bLength; j++) {
                product[i + j] = GenericGF_1.default.addOrSubtract(product[i + j], field.multiply(aCoeff, bCoefficients[j]));
            }
        }
        return new GenericGFPoly(field, product);
    };
    GenericGFPoly.prototype.multiplyScalar = function (scalar /*int*/) {
        if (scalar === 0) {
            return this.field.getZero();
        }
        if (scalar === 1) {
            return this;
        }
        var size = this.coefficients.length;
        var field = this.field;
        var product = new Int32Array(size);
        var coefficients = this.coefficients;
        for (var i = 0; i < size; i++) {
            product[i] = field.multiply(coefficients[i], scalar);
        }
        return new GenericGFPoly(field, product);
    };
    GenericGFPoly.prototype.multiplyByMonomial = function (degree /*int*/, coefficient /*int*/) {
        if (degree < 0) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        if (coefficient === 0) {
            return this.field.getZero();
        }
        var coefficients = this.coefficients;
        var size = coefficients.length;
        var product = new Int32Array(size + degree);
        var field = this.field;
        for (var i = 0; i < size; i++) {
            product[i] = field.multiply(coefficients[i], coefficient);
        }
        return new GenericGFPoly(field, product);
    };
    GenericGFPoly.prototype.divide = function (other) {
        if (!this.field.equals(other.field)) {
            throw new Exception_1.default("IllegalArgumentException", "GenericGFPolys do not have same GenericGF field");
        }
        if (other.isZero()) {
            throw new Exception_1.default("IllegalArgumentException", "Divide by 0");
        }
        var field = this.field;
        var quotient = field.getZero();
        var remainder = this;
        var denominatorLeadingTerm = other.getCoefficient(other.getDegree());
        var inverseDenominatorLeadingTerm = field.inverse(denominatorLeadingTerm);
        while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
            var degreeDifference = remainder.getDegree() - other.getDegree();
            var scale = field.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
            var term = other.multiplyByMonomial(degreeDifference, scale);
            var iterationQuotient = field.buildMonomial(degreeDifference, scale);
            quotient = quotient.addOrSubtract(iterationQuotient);
            remainder = remainder.addOrSubtract(term);
        }
        return [quotient, remainder];
    };
    /*@Override*/
    GenericGFPoly.prototype.toString = function () {
        var result = "";
        for (var degree = this.getDegree(); degree >= 0; degree--) {
            var coefficient = this.getCoefficient(degree);
            if (coefficient != 0) {
                if (coefficient < 0) {
                    result += " - ";
                    coefficient = -coefficient;
                }
                else {
                    if (result.length > 0) {
                        result += " + ";
                    }
                }
                if (degree == 0 || coefficient != 1) {
                    var alphaPower = this.field.log(coefficient);
                    if (alphaPower == 0) {
                        result += '1';
                    }
                    else if (alphaPower == 1) {
                        result += 'a';
                    }
                    else {
                        result += "a^";
                        result += alphaPower;
                    }
                }
                if (degree != 0) {
                    if (degree == 1) {
                        result += 'x';
                    }
                    else {
                        result += "x^";
                        result += degree;
                    }
                }
            }
        }
        return result;
    };
    return GenericGFPoly;
}());
exports.default = GenericGFPoly;
//# sourceMappingURL=GenericGFPoly.js.map