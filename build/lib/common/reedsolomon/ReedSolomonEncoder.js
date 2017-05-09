"use strict";
/*
 * Copyright 2008 ZXing authors
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
var GenericGFPoly_1 = require("./GenericGFPoly");
var Exception_1 = require("./../../Exception");
var System_1 = require("./../../util/System");
/**
 * <p>Implements Reed-Solomon encoding, as the name implies.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 */
var ReedSolomonEncoder = (function () {
    function ReedSolomonEncoder(field) {
        this.field = field;
        this.cachedGenerators = [];
        this.cachedGenerators.push(new GenericGFPoly_1.default(field, Int32Array.from([1])));
    }
    ReedSolomonEncoder.prototype.buildGenerator = function (degree /*int*/) {
        var cachedGenerators = this.cachedGenerators;
        if (degree >= cachedGenerators.length) {
            var lastGenerator = cachedGenerators[cachedGenerators.length - 1];
            var field = this.field;
            for (var d = cachedGenerators.length; d <= degree; d++) {
                var nextGenerator = lastGenerator.multiply(new GenericGFPoly_1.default(field, Int32Array.from([1, field.exp(d - 1 + field.getGeneratorBase())])));
                cachedGenerators.push(nextGenerator);
                lastGenerator = nextGenerator;
            }
        }
        return cachedGenerators[degree];
    };
    ReedSolomonEncoder.prototype.encode = function (toEncode, ecBytes /*int*/) {
        if (ecBytes === 0) {
            throw new Exception_1.default("IllegalArgumentException", "No error correction bytes");
        }
        var dataBytes = toEncode.length - ecBytes;
        if (dataBytes <= 0) {
            throw new Exception_1.default("IllegalArgumentException", "No data bytes provided");
        }
        var generator = this.buildGenerator(ecBytes);
        var infoCoefficients = new Int32Array(dataBytes);
        System_1.default.arraycopy(toEncode, 0, infoCoefficients, 0, dataBytes);
        var info = new GenericGFPoly_1.default(this.field, infoCoefficients);
        info = info.multiplyByMonomial(ecBytes, 1);
        var remainder = info.divide(generator)[1];
        var coefficients = remainder.getCoefficients();
        var numZeroCoefficients = ecBytes - coefficients.length;
        for (var i = 0; i < numZeroCoefficients; i++) {
            toEncode[dataBytes + i] = 0;
        }
        System_1.default.arraycopy(coefficients, 0, toEncode, dataBytes + numZeroCoefficients, coefficients.length);
    };
    return ReedSolomonEncoder;
}());
exports.default = ReedSolomonEncoder;
//# sourceMappingURL=ReedSolomonEncoder.js.map