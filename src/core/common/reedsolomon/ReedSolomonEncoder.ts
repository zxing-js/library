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

/*namespace com.google.zxing.common.reedsolomon {*/

/*import java.util.ArrayList;*/
/*import java.util.List;*/

import GenericGF from './GenericGF';
import GenericGFPoly from './GenericGFPoly';

import System from '../../util/System';
import IllegalArgumentException from '../../IllegalArgumentException';

/**
 * <p>Implements Reed-Solomon encoding, as the name implies.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 */
export default class ReedSolomonEncoder {

    private field: GenericGF;
    private cachedGenerators: GenericGFPoly[];

    /**
     * A reed solomon error-correcting encoding constructor is created by
     * passing as Galois Field with of size equal to the number of code
     * words (symbols) in the alphabet (the number of values in each
     * element of arrays that are encoded/decoded).
     * @param field A galois field with a number of elements equal to the size
     * of the alphabet of symbols to encode.
     */
    public constructor(field: GenericGF) {
        this.field = field;
        this.cachedGenerators = [];
        this.cachedGenerators.push(new GenericGFPoly(field, Int32Array.from([1])));
    }

    private buildGenerator(degree: number /*int*/): GenericGFPoly {
        const cachedGenerators = this.cachedGenerators;
        if (degree >= cachedGenerators.length) {
            let lastGenerator = cachedGenerators[cachedGenerators.length - 1];
            const field = this.field;
            for (let d = cachedGenerators.length; d <= degree; d++) {
                const nextGenerator = lastGenerator.multiply(
                    new GenericGFPoly(field, Int32Array.from([1, field.exp(d - 1 + field.getGeneratorBase())])));
                cachedGenerators.push(nextGenerator);
                lastGenerator = nextGenerator;
            }
        }
        return cachedGenerators[degree];
    }

    /**
     * <p>Encode a sequence of code words (symbols) using Reed-Solomon to allow decoders
     * to detect and correct errors that may have been introduced when the resulting
     * data is stored or transmitted.</p>
     *
     * @param toEncode array used for both and output. Caller initializes the array with
     * the code words (symbols) to be encoded followed by empty elements allocated to make
     * space for error-correction code words in the encoded output. The array contains
     * the encdoded output when encode returns. Code words are encoded as numbers from
     * 0 to n-1, where n is the number of possible code words (symbols), as determined
     * by the size of the Galois Field passed in the constructor of this object.
     * @param ecBytes the number of elements reserved in the array (first parameter)
     * to store error-correction code words. Thus, the number of code words (symbols)
     * to encode in the first parameter is thus toEncode.length - ecBytes.
     * Note, the use of "bytes" in the name of this parameter is misleading, as there may
     * be more or fewer than 256 symbols being encoded, as determined by the number of
     * elements in the Galois Field passed as a constructor to this object.
     * @throws IllegalArgumentException thrown in response to validation errros.
     */
    public encode(toEncode: Int32Array, ecBytes: number /*int*/): void {
        if (ecBytes === 0) {
            throw new IllegalArgumentException('No error correction bytes');
        }
        const dataBytes = toEncode.length - ecBytes;
        if (dataBytes <= 0) {
            throw new IllegalArgumentException('No data bytes provided');
        }
        const generator = this.buildGenerator(ecBytes);
        const infoCoefficients: Int32Array = new Int32Array(dataBytes);
        System.arraycopy(toEncode, 0, infoCoefficients, 0, dataBytes);
        let info = new GenericGFPoly(this.field, infoCoefficients);
        info = info.multiplyByMonomial(ecBytes, 1);
        const remainder = info.divide(generator)[1];
        const coefficients = remainder.getCoefficients();
        const numZeroCoefficients = ecBytes - coefficients.length;
        for (let i = 0; i < numZeroCoefficients; i++) {
            toEncode[dataBytes + i] = 0;
        }
        System.arraycopy(coefficients, 0, toEncode, dataBytes + numZeroCoefficients, coefficients.length);
    }

}
