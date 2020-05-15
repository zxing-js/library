/*
* Copyright 2012 ZXing authors
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

// package com.google.zxing.pdf417.decoder.ec;

// import com.google.zxing.ChecksumException;
import ChecksumException from '../../../ChecksumException';

import ModulusPoly from './ModulusPoly';
import ModulusGF from './ModulusGF';

import { int } from '../../../../customTypings';

/**
 * <p>PDF417 error correction implementation.</p>
 *
 * <p>This <a href="http://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction#Example">example</a>
 * is quite useful in understanding the algorithm.</p>
 *
 * @author Sean Owen
 * @see com.google.zxing.common.reedsolomon.ReedSolomonDecoder
 */
export default /*public final*/ class ErrorCorrection {

  private /*final*/ field: ModulusGF;

  public constructor() {
    this.field = ModulusGF.PDF417_GF;
  }

  /**
   * @param received received codewords
   * @param numECCodewords number of those codewords used for EC
   * @param erasures location of erasures
   * @return number of errors
   * @throws ChecksumException if errors cannot be corrected, maybe because of too many errors
   */
  public decode(received: Int32Array,
    numECCodewords: int,
    erasures: Int32Array): int {

    let poly: ModulusPoly = new ModulusPoly(this.field, received);
    let S: Int32Array = new Int32Array(numECCodewords);
    let error: boolean = false;
    for (let i /*int*/ = numECCodewords; i > 0; i--) {
      let evaluation: int = poly.evaluateAt(this.field.exp(i));
      S[numECCodewords - i] = evaluation;
      if (evaluation !== 0) {
        error = true;
      }
    }

    if (!error) {
      return 0;
    }

    let knownErrors: ModulusPoly = this.field.getOne();
    if (erasures != null) {
      for (const erasure of erasures) {
        let b: int = this.field.exp(received.length - 1 - erasure);
        // Add (1 - bx) term:
        let term: ModulusPoly = new ModulusPoly(this.field, new Int32Array([this.field.subtract(0, b), 1]));
        knownErrors = knownErrors.multiply(term);
      }
    }

    let syndrome: ModulusPoly = new ModulusPoly(this.field, S);
    // syndrome = syndrome.multiply(knownErrors);

    let sigmaOmega: ModulusPoly[] =
      this.runEuclideanAlgorithm(this.field.buildMonomial(numECCodewords, 1), syndrome, numECCodewords);
    let sigma: ModulusPoly = sigmaOmega[0];
    let omega: ModulusPoly = sigmaOmega[1];

    // sigma = sigma.multiply(knownErrors);

    let errorLocations: Int32Array = this.findErrorLocations(sigma);
    let errorMagnitudes: Int32Array = this.findErrorMagnitudes(omega, sigma, errorLocations);

    for (let i /*int*/ = 0; i < errorLocations.length; i++) {
      let position: int = received.length - 1 - this.field.log(errorLocations[i]);
      if (position < 0) {
        throw ChecksumException.getChecksumInstance();
      }
      received[position] = this.field.subtract(received[position], errorMagnitudes[i]);
    }
    return errorLocations.length;
  }

  /**
   *
   * @param ModulusPoly
   * @param a
   * @param ModulusPoly
   * @param b
   * @param int
   * @param R
   * @throws ChecksumException
   */
  private runEuclideanAlgorithm(a: ModulusPoly, b: ModulusPoly, R: int): ModulusPoly[] {
    // Assume a's degree is >= b's
    if (a.getDegree() < b.getDegree()) {
      let temp: ModulusPoly = a;
      a = b;
      b = temp;
    }

    let rLast: ModulusPoly = a;
    let r: ModulusPoly = b;
    let tLast: ModulusPoly = this.field.getZero();
    let t: ModulusPoly = this.field.getOne();

    // Run Euclidean algorithm until r's degree is less than R/2
    while (r.getDegree() >= Math.round(R / 2)) {
      let rLastLast: ModulusPoly = rLast;
      let tLastLast: ModulusPoly = tLast;
      rLast = r;
      tLast = t;

      // Divide rLastLast by rLast, with quotient in q and remainder in r
      if (rLast.isZero()) {
        // Oops, Euclidean algorithm already terminated?
        throw ChecksumException.getChecksumInstance();
      }
      r = rLastLast;
      let q: ModulusPoly = this.field.getZero();
      let denominatorLeadingTerm: int = rLast.getCoefficient(rLast.getDegree());
      let dltInverse: int = this.field.inverse(denominatorLeadingTerm);
      while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
        let degreeDiff: int = r.getDegree() - rLast.getDegree();
        let scale: int = this.field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
        q = q.add(this.field.buildMonomial(degreeDiff, scale));
        r = r.subtract(rLast.multiplyByMonomial(degreeDiff, scale));
      }

      t = q.multiply(tLast).subtract(tLastLast).negative();
    }

    let sigmaTildeAtZero: int = t.getCoefficient(0);
    if (sigmaTildeAtZero === 0) {
      throw ChecksumException.getChecksumInstance();
    }

    let inverse: int = this.field.inverse(sigmaTildeAtZero);
    let sigma: ModulusPoly = t.multiply(inverse);
    let omega: ModulusPoly = r.multiply(inverse);
    return [sigma, omega];
  }

  /**
   *
   * @param errorLocator
   * @throws ChecksumException
   */
  private findErrorLocations(errorLocator: ModulusPoly): Int32Array {
    // This is a direct application of Chien's search
    let numErrors: int = errorLocator.getDegree();
    let result: Int32Array = new Int32Array(numErrors);
    let e: int = 0;
    for (let i /*int*/ = 1; i < this.field.getSize() && e < numErrors; i++) {
      if (errorLocator.evaluateAt(i) === 0) {
        result[e] = this.field.inverse(i);
        e++;
      }
    }
    if (e !== numErrors) {
      throw ChecksumException.getChecksumInstance();
    }
    return result;
  }

  private findErrorMagnitudes(errorEvaluator: ModulusPoly,
    errorLocator: ModulusPoly,
    errorLocations: Int32Array): Int32Array {
    let errorLocatorDegree: int = errorLocator.getDegree();
    let formalDerivativeCoefficients: Int32Array = new Int32Array(errorLocatorDegree);
    for (let i /*int*/ = 1; i <= errorLocatorDegree; i++) {
      formalDerivativeCoefficients[errorLocatorDegree - i] =
        this.field.multiply(i, errorLocator.getCoefficient(i));
    }
    let formalDerivative: ModulusPoly = new ModulusPoly(this.field, formalDerivativeCoefficients);

    // This is directly applying Forney's Formula
    let s: int = errorLocations.length;
    let result: Int32Array = new Int32Array(s);
    for (let i /*int*/ = 0; i < s; i++) {
      let xiInverse: int = this.field.inverse(errorLocations[i]);
      let numerator: int = this.field.subtract(0, errorEvaluator.evaluateAt(xiInverse));
      let denominator: int = this.field.inverse(formalDerivative.evaluateAt(xiInverse));
      result[i] = this.field.multiply(numerator, denominator);
    }
    return result;
  }
}
