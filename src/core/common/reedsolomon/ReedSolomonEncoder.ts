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
     * @param encodingBlock array used for both and output. Caller initializs the array with
     * the code words (symbols) to be encoded followed by empty elements to be used
     * to store the error-correction code words.
     * @param numberOfEcCodeWords the number of elements reserved to store code words
     * in the array passed as the first parameter. The number of code words (symbols)
     * to encode is thus encodingBlock.length - numberOfEcCodeWords.
     * @throws IllegalArgumentException if there are
     */
    public encode(encodingBlock: Int32Array, numberOfEcCodeWords: number /*int*/): void {
        if (numberOfEcCodeWords <= 0) {
            throw new IllegalArgumentException('No error correction bytes');
        }
        const dataBytes = encodingBlock.length - numberOfEcCodeWords;
        if (dataBytes <= 0) {
            throw new IllegalArgumentException('No data bytes provided');
        }
        const generator = this.buildGenerator(numberOfEcCodeWords);
        const infoCoefficients: Int32Array = new Int32Array(dataBytes);
        System.arraycopy(encodingBlock, 0, infoCoefficients, 0, dataBytes);
        let info = new GenericGFPoly(this.field, infoCoefficients);
        info = info.multiplyByMonomial(numberOfEcCodeWords, 1);
        const remainder = info.divide(generator)[1];
        const coefficients = remainder.getCoefficients();
        const numZeroCoefficients = numberOfEcCodeWords - coefficients.length;
        for (let i = 0; i < numZeroCoefficients; i++) {
            encodingBlock[dataBytes + i] = 0;
        }
        System.arraycopy(coefficients, 0, encodingBlock, dataBytes + numZeroCoefficients, coefficients.length);
    }

}
