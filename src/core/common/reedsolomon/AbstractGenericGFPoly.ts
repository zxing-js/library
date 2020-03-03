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

// import GenericGF from './GenericGF';
import AbstractGenericGF from './AbstractGenericGF';

/**
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */
export default abstract class AbstractGenericGFPoly {

    protected field: AbstractGenericGF;
    protected coefficients: Int32Array;

    public getCoefficients(): Int32Array {
        return this.coefficients;
    }

    /**
     * @return degree of this polynomial
     */
    public getDegree(): number {
        return this.coefficients.length - 1;
    }

    /**
     * @return true iff this polynomial is the monomial "0"
     */
    public isZero(): boolean {
        return this.coefficients[0] === 0;
    }

    /**
     * @return coefficient of x^degree term in this polynomial
     */
    public getCoefficient(degree: number /*int*/): number {
        return this.coefficients[this.coefficients.length - 1 - degree];
    }

    /**
     * @return evaluation of this polynomial at a given point
     */
    public evaluateAt(a: number /*int*/): number {
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        const coefficients = this.coefficients;
        let result: number;
        if (a === 1) {
            // Just the sum of the coefficients
            result = 0;
            for (let i = 0, length = coefficients.length; i !== length; i++) {
                const coefficient = coefficients[i];
                result = AbstractGenericGF.addOrSubtract(result, coefficient);
            }
            return result;
        }
        result = coefficients[0];
        const size = coefficients.length;
        const field = this.field;
        for (let i = 1; i < size; i++) {
            result = AbstractGenericGF.addOrSubtract(field.multiply(a, result), coefficients[i]);
        }
        return result;
    }

    public abstract addOrSubtract(other: AbstractGenericGFPoly): AbstractGenericGFPoly;

    public abstract multiply(other: AbstractGenericGFPoly): AbstractGenericGFPoly;

    public abstract multiplyScalar(scalar: number /*int*/): AbstractGenericGFPoly;

    public abstract multiplyByMonomial(degree: number /*int*/, coefficient: number /*int*/): AbstractGenericGFPoly;

    public abstract divide(other: AbstractGenericGFPoly): AbstractGenericGFPoly[];

    /*@Override*/
    public toString(): string {
        let result = '';
        for (let degree = this.getDegree(); degree >= 0; degree--) {
            let coefficient = this.getCoefficient(degree);
            if (coefficient !== 0) {
                if (coefficient < 0) {
                    result += ' - ';
                    coefficient = -coefficient;
                } else {
                    if (result.length > 0) {
                        result += ' + ';
                    }
                }
                if (degree === 0 || coefficient !== 1) {
                    const alphaPower = this.field.log(coefficient);
                    if (alphaPower === 0) {
                        result += '1';
                    } else if (alphaPower === 1) {
                        result += 'a';
                    } else {
                        result += 'a^';
                        result += alphaPower;
                    }
                }
                if (degree !== 0) {
                    if (degree === 1) {
                        result += 'x';
                    } else {
                        result += 'x^';
                        result += degree;
                    }
                }
            }
        }
        return result;
    }

}
