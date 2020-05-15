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

// import java.util.Formatter;
import Formatter from '../../util/Formatter';

import Codeword from './Codeword';
import BoundingBox from './BoundingBox';

import { int } from '../../../customTypings';

/**
 * @author Guenther Grau
 */
export default class DetectionResultColumn {

    private static /*final*/ MAX_NEARBY_DISTANCE: int = 5;

    private /*final*/ boundingBox: BoundingBox;
    private /*final*/ codewords: Codeword[];

    constructor(boundingBox: BoundingBox) {
        this.boundingBox = new BoundingBox(boundingBox);
        // this.codewords = new Codeword[boundingBox.getMaxY() - boundingBox.getMinY() + 1];
        this.codewords = new Array<Codeword>(boundingBox.getMaxY() - boundingBox.getMinY() + 1);
    }

    /*final*/  getCodewordNearby(imageRow: int): Codeword {
        let codeword = this.getCodeword(imageRow);
        if (codeword != null) {
            return codeword;
        }
        for (let i = 1; i < DetectionResultColumn.MAX_NEARBY_DISTANCE; i++) {
            let nearImageRow = this.imageRowToCodewordIndex(imageRow) - i;
            if (nearImageRow >= 0) {
                codeword = this.codewords[nearImageRow];
                if (codeword != null) {
                    return codeword;
                }
            }
            nearImageRow = this.imageRowToCodewordIndex(imageRow) + i;
            if (nearImageRow < this.codewords.length) {
                codeword = this.codewords[nearImageRow];
                if (codeword != null) {
                    return codeword;
                }
            }
        }
        return null;
    }

    /*final int*/ imageRowToCodewordIndex(imageRow: int): int {
        return imageRow - this.boundingBox.getMinY();
    }

    /*final void*/ setCodeword(imageRow: int, codeword: Codeword): void {
        this.codewords[this.imageRowToCodewordIndex(imageRow)] = codeword;
    }

/*final*/ getCodeword(imageRow: int): Codeword {
        return this.codewords[this.imageRowToCodewordIndex(imageRow)];
    }

/*final*/ getBoundingBox(): BoundingBox {
        return this.boundingBox;
    }

/*final*/ getCodewords(): Codeword[] {
        return this.codewords;
    }

    // @Override
    public toString(): string {
        const formatter = new Formatter();
        let row = 0;
        for (const codeword of this.codewords) {
            if (codeword == null) {
                formatter.format('%3d:    |   %n', row++);
                continue;
            }
            formatter.format('%3d: %3d|%3d%n', row++, codeword.getRowNumber(), codeword.getValue());
        }
        return formatter.toString();

    }

}
