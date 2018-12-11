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

/*namespace com.google.zxing.qrcode.encoder {*/

import ErrorCorrectionLevel from '../decoder/ErrorCorrectionLevel';
import Mode from '../decoder/Mode';
import Version from '../decoder/Version';
import StringBuilder from '../../util/StringBuilder';
import ByteMatrix from './ByteMatrix';

/**
 * @author satorux@google.com (Satoru Takabayashi) - creator
 * @author dswitkin@google.com (Daniel Switkin) - ported from C++
 */
export default class QRCode {

    public static NUM_MASK_PATTERNS = 8;

    private mode: Mode;
    private ecLevel: ErrorCorrectionLevel;
    private version: Version;
    private maskPattern: number; /*int*/
    private matrix: ByteMatrix;

    public constructor() {
        this.maskPattern = -1;
    }

    public getMode(): Mode {
        return this.mode;
    }

    public getECLevel(): ErrorCorrectionLevel {
        return this.ecLevel;
    }

    public getVersion(): Version {
        return this.version;
    }

    public getMaskPattern(): number /*int*/ {
        return this.maskPattern;
    }

    public getMatrix(): ByteMatrix {
        return this.matrix;
    }

    /*@Override*/
    public toString(): string {
        const result = new StringBuilder(); // (200)
        result.append('<<\n');
        result.append(' mode: ');
        result.append(this.mode ? this.mode.toString() : 'null');
        result.append('\n ecLevel: ');
        result.append(this.ecLevel ? this.ecLevel.toString() : 'null');
        result.append('\n version: ');
        result.append(this.version ? this.version.toString() : 'null');
        result.append('\n maskPattern: ');
        result.append(this.maskPattern.toString());
        if (this.matrix) {
            result.append('\n matrix:\n');
            result.append(this.matrix.toString());
        } else {
            result.append('\n matrix: null\n');
        }
        result.append('>>\n');
        return result.toString();
    }

    public setMode(value: Mode): void {
        this.mode = value;
    }

    public setECLevel(value: ErrorCorrectionLevel): void {
        this.ecLevel = value;
    }

    public setVersion(version: Version): void {
        this.version = version;
    }

    public setMaskPattern(value: number /*int*/): void {
        this.maskPattern = value;
    }

    public setMatrix(value: ByteMatrix): void {
        this.matrix = value;
    }

    // Check if "mask_pattern" is valid.
    public static isValidMaskPattern(maskPattern: number /*int*/): boolean {
        return maskPattern >= 0 && maskPattern < QRCode.NUM_MASK_PATTERNS;
    }

}
