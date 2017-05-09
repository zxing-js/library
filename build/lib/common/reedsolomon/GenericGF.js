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
var GenericGFPoly_1 = require("./GenericGFPoly");
var Exception_1 = require("./../../Exception");
var Integer_1 = require("./../../util/Integer");
/**
 * <p>This class contains utility methods for performing mathematical operations over
 * the Galois Fields. Operations use a given primitive polynomial in calculations.</p>
 *
 * <p>Throughout this package, elements of the GF are represented as an {@code int}
 * for convenience and speed (but at the cost of memory).
 * </p>
 *
 * @author Sean Owen
 * @author David Olivier
 */
var GenericGF = (function () {
    /**
     * Create a representation of GF(size) using the given primitive polynomial.
     *
     * @param primitive irreducible polynomial whose coefficients are represented by
     *  the bits of an int, where the least-significant bit represents the constant
     *  coefficient
     * @param size the size of the field
     * @param b the factor b in the generator polynomial can be 0- or 1-based
     *  (g(x) = (x+a^b)(x+a^(b+1))...(x+a^(b+2t-1))).
     *  In most cases it should be 1, but for QR code it is 0.
     */
    function GenericGF(primitive /*int*/, size /*int*/, generatorBase /*int*/) {
        this.primitive = primitive; /*int*/
        this.size = size; /*int*/
        this.generatorBase = generatorBase; /*int*/
        var expTable = new Int32Array(size);
        var x = 1;
        for (var i = 0; i < size; i++) {
            expTable[i] = x;
            x *= 2; // we're assuming the generator alpha is 2
            if (x >= size) {
                x ^= primitive;
                x &= size - 1;
            }
        }
        this.expTable = expTable;
        var logTable = new Int32Array(size);
        for (var i = 0; i < size - 1; i++) {
            logTable[expTable[i]] = i;
        }
        this.logTable = logTable;
        // logTable[0] == 0 but this should never be used
        this.zero = new GenericGFPoly_1.default(this, Int32Array.from([0]));
        this.one = new GenericGFPoly_1.default(this, Int32Array.from([1]));
    }
    GenericGF.prototype.getZero = function () {
        return this.zero;
    };
    GenericGF.prototype.getOne = function () {
        return this.one;
    };
    /**
     * @return the monomial representing coefficient * x^degree
     */
    GenericGF.prototype.buildMonomial = function (degree /*int*/, coefficient /*int*/) {
        if (degree < 0) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        if (coefficient === 0) {
            return this.zero;
        }
        var coefficients = new Int32Array(degree + 1);
        coefficients[0] = coefficient;
        return new GenericGFPoly_1.default(this, coefficients);
    };
    /**
     * Implements both addition and subtraction -- they are the same in GF(size).
     *
     * @return sum/difference of a and b
     */
    GenericGF.addOrSubtract = function (a /*int*/, b /*int*/) {
        return a ^ b;
    };
    /**
     * @return 2 to the power of a in GF(size)
     */
    GenericGF.prototype.exp = function (a /*int*/) {
        return this.expTable[a];
    };
    /**
     * @return base 2 log of a in GF(size)
     */
    GenericGF.prototype.log = function (a /*int*/) {
        if (a === 0) {
            throw new Exception_1.default("IllegalArgumentException");
        }
        return this.logTable[a];
    };
    /**
     * @return multiplicative inverse of a
     */
    GenericGF.prototype.inverse = function (a /*int*/) {
        if (a === 0) {
            throw new Exception_1.default("ArithmeticException");
        }
        return this.expTable[this.size - this.logTable[a] - 1];
    };
    /**
     * @return product of a and b in GF(size)
     */
    GenericGF.prototype.multiply = function (a /*int*/, b /*int*/) {
        if (a === 0 || b === 0) {
            return 0;
        }
        return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
    };
    GenericGF.prototype.getSize = function () {
        return this.size;
    };
    GenericGF.prototype.getGeneratorBase = function () {
        return this.generatorBase;
    };
    /*@Override*/
    GenericGF.prototype.toString = function () {
        return "GF(0x" + Integer_1.default.toHexString(this.primitive) + ',' + this.size + ')';
    };
    GenericGF.prototype.equals = function (o) {
        return o == this;
    };
    return GenericGF;
}());
GenericGF.AZTEC_DATA_12 = new GenericGF(0x1069, 4096, 1); // x^12 + x^6 + x^5 + x^3 + 1
GenericGF.AZTEC_DATA_10 = new GenericGF(0x409, 1024, 1); // x^10 + x^3 + 1
GenericGF.AZTEC_DATA_6 = new GenericGF(0x43, 64, 1); // x^6 + x + 1
GenericGF.AZTEC_PARAM = new GenericGF(0x13, 16, 1); // x^4 + x + 1
GenericGF.QR_CODE_FIELD_256 = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
GenericGF.DATA_MATRIX_FIELD_256 = new GenericGF(0x012D, 256, 1); // x^8 + x^5 + x^3 + x^2 + 1
GenericGF.AZTEC_DATA_8 = GenericGF.DATA_MATRIX_FIELD_256;
GenericGF.MAXICODE_FIELD_64 = GenericGF.AZTEC_DATA_6;
exports.default = GenericGF;
//# sourceMappingURL=GenericGF.js.map