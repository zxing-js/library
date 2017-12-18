/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*package com.google.zxing.common;*/

/*import java.io.ByteArrayOutputStream;*/

/**
 * Class that lets one easily build an array of bytes by appending bits at a time.
 *
 * @author Sean Owen
 */
export default class BitSourceBuilder {

    private output: Array<number>;
    private nextByte: number; /*int*/
    private bitsLeftInNextByte: number; /*int*/

    public constructor() {
        this.output = new Array<number>();
        this.nextByte = 0;
        this.bitsLeftInNextByte = 8;
    }

    public write(value: number /*int*/, numBits: number /*int*/): void {
        if (numBits <= this.bitsLeftInNextByte) {
            const nb = (this.nextByte << numBits) & 0xFFFFFFFF;
            this.nextByte = nb | value;
            this.bitsLeftInNextByte -= numBits;
            if (this.bitsLeftInNextByte === 0) {
                const byte = this.nextByte & 0xFF;
                this.output.push(byte);
                this.nextByte = 0;
                this.bitsLeftInNextByte = 8;
            }
        } else {
            const bitsToWriteNow: number /*int*/ = this.bitsLeftInNextByte;
            const numRestOfBits: number /*int*/ = numBits - bitsToWriteNow;
            const mask: number /*int*/ = 0xFF >> (8 - bitsToWriteNow);
            const valueToWriteNow: number /*int*/ = (value >>> numRestOfBits) & mask;
            this.write(valueToWriteNow, bitsToWriteNow);
            this.write(value, numRestOfBits);
        }
    }

    public toByteArray(): Uint8Array {
        if (this.bitsLeftInNextByte < 8) {
            this.write(0, this.bitsLeftInNextByte);
        }
        return Uint8Array.from(this.output);
    }

}
