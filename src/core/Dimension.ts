/*
 * Copyright 2009 ZXing authors
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

import IllegalArgumentException from './IllegalArgumentException';

/*namespace com.google.zxing {*/

/**
 * Simply encapsulates a width and height.
 */
export default class Dimension {
    public constructor(private width: number /*int*/, private height: number /*int*/) {
        if (width < 0 || height < 0) {
            throw new IllegalArgumentException();
        }
    }

    public getWidth(): number /*int*/ {
        return this.width;
    }

    public getHeight(): number /*int*/ {
        return this.height;
    }

    /*@Override*/
    public equals(other: any): boolean {
        if (other instanceof Dimension) {
            const d = <Dimension>other;
            return this.width === d.width && this.height === d.height;
        }
        return false;
    }

    /*@Override*/
    public hashCode(): number /*int*/ {
        return this.width * 32713 + this.height;
    }

    /*@Override*/
    public toString(): string {
        return this.width + 'x' + this.height;
    }

}
