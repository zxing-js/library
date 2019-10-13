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

// package com.google.zxing.pdf417.decoder;

// import com.google.zxing.pdf417.PDF417Common;
import PDF417Common from '../PDF417Common';

// import java.util.ArrayList;
// import java.util.Collection;
// import java.util.HashMap;
// import java.util.Map;
// import java.util.Map.Entry;

/**
 * @author Guenther Grau
 */
export default /*final*/ class BarcodeValue {
  private /*final*/ values = new Map<number/*Interger*/, number/*Interger*/>();

  /**
   * Add an occurrence of a value
   */
   setValue(value: int): void {
    let confidence: int = this.values.get(value);
    if (confidence == null) {
      confidence = 0;
    }
    confidence++;
    this.values.set(value, confidence);
  }

  /**
   * Determines the maximum occurrence of a set value and returns all values which were set with this occurrence.
   * @return an array of int, containing the values with the highest occurrence, or null, if no value was set
   */
   getValue(): Int32Array {
    let maxConfidence: int /*int*/ = -1;
    let result: /*Collection<Integer>*/int[] = new Array<int>();
    for (const entry of this.values.entries()) {

      const entryApi = {
        getValue: () => entry[1],
        getKey: () => entry[0],
      };

      if (entryApi.getValue() > maxConfidence) {
        maxConfidence = entryApi.getValue();
        result = [];
        result.push(entryApi.getKey());
      } else if (entryApi.getValue() === maxConfidence) {
        result.push(entryApi.getKey());
      }
    }
    return PDF417Common.toIntArray(result);
  }

   getConfidence(value: int): number/*Integer*/ {
    return this.values.get(value);
  }

}
