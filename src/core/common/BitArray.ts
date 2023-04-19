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

/*namespace com.google.zxing.common {*/

/*import java.util.Arrays;*/

import IllegalArgumentException from '../IllegalArgumentException';
import Arrays from '../util/Arrays';
import Integer from '../util/Integer';
import System from '../util/System';


/**
 * <p>A simple, fast array of bits, represented compactly by an array of ints internally.</p>
 *
 * @author Sean Owen
 */
export default class BitArray /*implements Cloneable*/ {

  private size: number;
  private bits: Int32Array;

  // public constructor() {
  //   this.size = 0
  //   this.bits = new Int32Array(1)
  // }

  // public constructor(size?: number /*int*/) {
  //   if (undefined === size) {
  //     this.size = 0
  //   } else {
  //     this.size = size
  //   }
  //   this.bits = this.makeArray(size)
  // }

  // For testing only
  public constructor(size?: number /*int*/, bits?: Int32Array) {
    if (undefined === size) {
      this.size = 0;
      this.bits = new Int32Array(1);
    } else {
      this.size = size;
      if (undefined === bits || null === bits) {
        this.bits = BitArray.makeArray(size);
      } else {
        this.bits = bits;
      }
    }
  }

  public getSize(): number /*int*/ {
    return this.size;
  }

  public getSizeInBytes(): number /*int*/ {
    return Math.floor((this.size + 7) / 8);
  }

  private ensureCapacity(size: number /*int*/): void {
    if (size > this.bits.length * 32) {
      const newBits = BitArray.makeArray(size);
      System.arraycopy(this.bits, 0, newBits, 0, this.bits.length);
      this.bits = newBits;
    }
  }

  /**
   * @param i bit to get
   * @return true iff bit i is set
   */
  public get(i: number /*int*/): boolean {
    return (this.bits[Math.floor(i / 32)] & (1 << (i & 0x1F))) !== 0;
  }

  /**
   * Sets bit i.
   *
   * @param i bit to set
   */
  public set(i: number /*int*/): void {
    this.bits[Math.floor(i / 32)] |= 1 << (i & 0x1F);
  }

  /**
   * Flips bit i.
   *
   * @param i bit to set
   */
  public flip(i: number /*int*/): void {
    this.bits[Math.floor(i / 32)] ^= 1 << (i & 0x1F);
  }

  /**
   * @param from first bit to check
   * @return index of first bit that is set, starting from the given index, or size if none are set
   *  at or beyond this given index
   * @see #getNextUnset(int)
   */
  public getNextSet(from: number /*int*/): number /*int*/ {
    const size = this.size;
    if (from >= size) {
      return size;
    }
    const bits = this.bits;
    let bitsOffset = Math.floor(from / 32);
    let currentBits = bits[bitsOffset];
    // mask off lesser bits first
    currentBits &= ~((1 << (from & 0x1F)) - 1);
    const length = bits.length;
    while (currentBits === 0) {
      if (++bitsOffset === length) {
        return size;
      }
      currentBits = bits[bitsOffset];
    }
    const result = (bitsOffset * 32) + Integer.numberOfTrailingZeros(currentBits);
    return result > size ? size : result;
  }

  /**
   * @param from index to start looking for unset bit
   * @return index of next unset bit, or {@code size} if none are unset until the end
   * @see #getNextSet(int)
   */
  public getNextUnset(from: number /*int*/): number /*int*/ {
    const size = this.size;
    if (from >= size) {
      return size;
    }
    const bits = this.bits;
    let bitsOffset = Math.floor(from / 32);
    let currentBits = ~bits[bitsOffset];
    // mask off lesser bits first
    currentBits &= ~((1 << (from & 0x1F)) - 1);
    const length = bits.length;
    while (currentBits === 0) {
      if (++bitsOffset === length) {
        return size;
      }
      currentBits = ~bits[bitsOffset];
    }
    const result = (bitsOffset * 32) + Integer.numberOfTrailingZeros(currentBits);
    return result > size ? size : result;
  }

  /**
   * Sets a block of 32 bits, starting at bit i.
   *
   * @param i first bit to set
   * @param newBits the new value of the next 32 bits. Note again that the least-significant bit
   * corresponds to bit i, the next-least-significant to i+1, and so on.
   */
  public setBulk(i: number /*int*/, newBits: number /*int*/): void {
    this.bits[Math.floor(i / 32)] = newBits;
  }

  /**
   * Sets a range of bits.
   *
   * @param start start of range, inclusive.
   * @param end end of range, exclusive
   */
  public setRange(start: number /*int*/, end: number /*int*/): void {
    if (end < start || start < 0 || end > this.size) {
      throw new IllegalArgumentException();
    }
    if (end === start) {
      return;
    }
    end--; // will be easier to treat this as the last actually set bit -- inclusive
    const firstInt = Math.floor(start / 32);
    const lastInt = Math.floor(end / 32);
    const bits = this.bits;
    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      // Ones from firstBit to lastBit, inclusive
      const mask = (2 << lastBit) - (1 << firstBit);
      bits[i] |= mask;
    }
  }

  /**
   * Clears all bits (sets to false).
   */
  public clear(): void {
    const max = this.bits.length;
    const bits = this.bits;
    for (let i = 0; i < max; i++) {
      bits[i] = 0;
    }
  }

  /**
   * Efficient method to check if a range of bits is set, or not set.
   *
   * @param start start of range, inclusive.
   * @param end end of range, exclusive
   * @param value if true, checks that bits in range are set, otherwise checks that they are not set
   * @return true iff all bits are set or not set in range, according to value argument
   * @throws IllegalArgumentException if end is less than start or the range is not contained in the array
   */
  public isRange(start: number /*int*/, end: number /*int*/, value: boolean): boolean {
    if (end < start || start < 0 || end > this.size) {
      throw new IllegalArgumentException();
    }
    if (end === start) {
      return true; // empty range matches
    }
    end--; // will be easier to treat this as the last actually set bit -- inclusive
    const firstInt = Math.floor(start / 32);
    const lastInt = Math.floor(end / 32);
    const bits = this.bits;
    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      // Ones from firstBit to lastBit, inclusive
      const mask = (2 << lastBit) - (1 << firstBit) & 0xFFFFFFFF;
      // TYPESCRIPTPORT: & 0xFFFFFFFF added to discard anything after 32 bits, as ES has 53 bits
      // Return false if we're looking for 1s and the masked bits[i] isn't all 1s (is: that,
      // equals the mask, or we're looking for 0s and the masked portion is not all 0s
      if ((bits[i] & mask) !== (value ? mask : 0)) {
        return false;
      }
    }
    return true;
  }

  public appendBit(bit: boolean): void {
    this.ensureCapacity(this.size + 1);
    if (bit) {
      this.bits[Math.floor(this.size / 32)] |= 1 << (this.size & 0x1F);
    }
    this.size++;
  }

  /**
   * Appends the least-significant bits, from value, in order from most-significant to
   * least-significant. For example, appending 6 bits from 0x000001E will append the bits
   * 0, 1, 1, 1, 1, 0 in that order.
   *
   * @param value {@code int} containing bits to append
   * @param numBits bits from value to append
   */
  public appendBits(value: number /*int*/, numBits: number /*int*/): void {
    if (numBits < 0 || numBits > 32) {
      throw new IllegalArgumentException('Num bits must be between 0 and 32');
    }
    this.ensureCapacity(this.size + numBits);
    // const appendBit = this.appendBit;
    for (let numBitsLeft = numBits; numBitsLeft > 0; numBitsLeft--) {
      this.appendBit(((value >> (numBitsLeft - 1)) & 0x01) === 1);
    }
  }

  public appendBitArray(other: BitArray): void {
    const otherSize = other.size;
    this.ensureCapacity(this.size + otherSize);
    // const appendBit = this.appendBit;
    for (let i = 0; i < otherSize; i++) {
      this.appendBit(other.get(i));
    }
  }

  public xor(other: BitArray): void {
    if (this.size !== other.size) {
      throw new IllegalArgumentException('Sizes don\'t match');
    }
    const bits = this.bits;
    for (let i = 0, length = bits.length; i < length; i++) {
      // The last int could be incomplete (i.e. not have 32 bits in
      // it) but there is no problem since 0 XOR 0 == 0.
      bits[i] ^= other.bits[i];
    }
  }

  /**
   *
   * @param bitOffset first bit to start writing
   * @param array array to write into. Bytes are written most-significant byte first. This is the opposite
   *  of the internal representation, which is exposed by {@link #getBitArray()}
   * @param offset position in array to start writing
   * @param numBytes how many bytes to write
   */
  public toBytes(bitOffset: number /*int*/, array: Uint8Array, offset: number /*int*/, numBytes: number /*int*/): void {
    for (let i = 0; i < numBytes; i++) {
      let theByte = 0;
      for (let j = 0; j < 8; j++) {
        if (this.get(bitOffset)) {
          theByte |= 1 << (7 - j);
        }
        bitOffset++;
      }
      array[offset + i] = /*(byte)*/ theByte;
    }
  }

  /**
   * @return underlying array of ints. The first element holds the first 32 bits, and the least
   *         significant bit is bit 0.
   */
  public getBitArray(): Int32Array {
    return this.bits;
  }

  /**
   * Reverses all bits in the array.
   */
  public reverse(): void {
    const newBits = new Int32Array(this.bits.length);
    // reverse all int's first
    const len = Math.floor((this.size - 1) / 32);
    const oldBitsLen = len + 1;
    const bits = this.bits;
    for (let i = 0; i < oldBitsLen; i++) {
      let x = bits[i];
      x = ((x >> 1) & 0x55555555) | ((x & 0x55555555) << 1);
      x = ((x >> 2) & 0x33333333) | ((x & 0x33333333) << 2);
      x = ((x >> 4) & 0x0f0f0f0f) | ((x & 0x0f0f0f0f) << 4);
      x = ((x >> 8) & 0x00ff00ff) | ((x & 0x00ff00ff) << 8);
      x = ((x >> 16) & 0x0000ffff) | ((x & 0x0000ffff) << 16);
      newBits[len - i] = /*(int)*/ x;
    }
    // now correct the int's if the bit size isn't a multiple of 32
    if (this.size !== oldBitsLen * 32) {
      const leftOffset = oldBitsLen * 32 - this.size;
      let currentInt = newBits[0] >>> leftOffset;
      for (let i = 1; i < oldBitsLen; i++) {
        const nextInt = newBits[i];
        currentInt |= nextInt << (32 - leftOffset);
        newBits[i - 1] = currentInt;
        currentInt = nextInt >>> leftOffset;
      }
      newBits[oldBitsLen - 1] = currentInt;
    }
    this.bits = newBits;
  }

  private static makeArray(size: number /*int*/): Int32Array {
    return new Int32Array(Math.floor((size + 31) / 32));
  }

  /*@Override*/
  public equals(o: any): boolean {
    if (!(o instanceof BitArray)) {
      return false;
    }
    const other = <BitArray>o;
    return this.size === other.size && Arrays.equals(this.bits, other.bits);
  }

  /*@Override*/
  public hashCode(): number /*int*/ {
    return 31 * this.size + Arrays.hashCode(this.bits);
  }

  /*@Override*/
  public toString(): string {
    let result = '';
    for (let i = 0, size = this.size; i < size; i++) {
      if ((i & 0x07) === 0) {
        result += ' ';
      }
      result += this.get(i) ? 'X' : '.';
    }
    return result;
  }

  /*@Override*/
  public clone(): BitArray {
    return new BitArray(this.size, this.bits.slice());
  }

    /**
     * converts to boolean array.
     */
    public toArray(): Array<boolean> {
        let result = [];
        for (let i = 0, size = this.size; i < size; i++) {
            result.push(this.get(i));
        }
        return result;
    }

}
