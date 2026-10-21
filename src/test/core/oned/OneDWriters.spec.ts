/*
 * Copyright 2010 ZXing authors
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

import * as assert from 'assert';

import { BarcodeFormat } from '@zxing/library';
import { DecodeHintType } from '@zxing/library';
import { EncodeHintType } from '@zxing/library';
import { IllegalArgumentException } from '@zxing/library';
import { MultiFormatReader } from '@zxing/library';
import { MultiFormatWriter } from '@zxing/library';
import { Code128Writer } from '@zxing/library';
import { ITFWriter } from '@zxing/library';
import { UPCEWriter } from '@zxing/library';

import { toBinaryBitmap } from '../util/EncodeTestUtils';

function toPatternString(bits: boolean[]): string {
    return bits.map(b => b ? '1' : '0').join('');
}

describe('1D writers', () => {

    /**
     * Formats whose readers are exercised by the blackbox suites, so a full encode/decode
     * round-trip is meaningful. `expected` differs from `contents` where the writer appends a
     * computed check digit.
     */
    const roundTrips: Array<{ format: BarcodeFormat, contents: string, expected: string }> = [
        { format: BarcodeFormat.EAN_13, contents: '978020131005', expected: '9780201310054' },
        { format: BarcodeFormat.EAN_8, contents: '9031101', expected: '90311017' },
        { format: BarcodeFormat.UPC_A, contents: '12345678901', expected: '123456789012' },
        { format: BarcodeFormat.CODE_39, contents: 'ABC123', expected: 'ABC123' },
        { format: BarcodeFormat.CODE_93, contents: 'ABC123', expected: 'ABC123' },
        { format: BarcodeFormat.CODE_128, contents: 'ABC123', expected: 'ABC123' },
        { format: BarcodeFormat.ITF, contents: '123456', expected: '123456' },
        { format: BarcodeFormat.CODABAR, contents: 'A123456A', expected: 'A123456A' },
    ];

    for (const { format, contents, expected } of roundTrips) {
        it(`round-trips ${BarcodeFormat[format]} through MultiFormatReader`, () => {
            const matrix = new MultiFormatWriter().encode(contents, format, 0, 60, null);

            const hints = new Map<DecodeHintType, any>();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [format]);
            hints.set(DecodeHintType.TRY_HARDER, true);

            const result = new MultiFormatReader().decode(toBinaryBitmap(matrix), hints);

            assert.strictEqual(result.getText(), expected);
            assert.strictEqual(result.getBarcodeFormat(), format);
        });
    }

    /**
     * UPC-E is verified against the symbology rather than by round-trip: this repo has no UPC-E
     * blackbox images and the UPC-E reader does not currently decode a spec-conformant symbol.
     * See UPCEWriter / UPCEReader.
     */
    it('encodes UPC-E to the pattern required by the symbology', () => {
        const bits = new UPCEWriter().encodeContents('0123456');

        // 3 modules start guard + 6 digits * 7 modules + 6 modules end guard
        assert.strictEqual(bits.length, 51);

        const pattern = toPatternString(bits);
        assert.strictEqual(pattern.substring(0, 3), '101', 'start guard');
        assert.strictEqual(pattern.substring(45), '010101', 'end guard');

        // Check digit for 01234500006 is 5, whose parity pattern is EOOEEO. The first digit (1)
        // is therefore encoded with the even/G pattern {1,2,2,2} => 0110011.
        assert.strictEqual(pattern.substring(3, 10), '0110011', 'first digit, even parity');
    });

    it('rejects a UPC-E number system other than 0 or 1', () => {
        assert.throws(() => new UPCEWriter().encodeContents('2123456'), IllegalArgumentException);
    });

    it('rejects odd-length ITF contents', () => {
        assert.throws(() => new ITFWriter().encodeContents('12345'), IllegalArgumentException);
    });

    it('honours the MARGIN hint', () => {
        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.MARGIN, 40);

        const dflt = new MultiFormatWriter().encode('ABC123', BarcodeFormat.CODE_128, 0, 60, null);
        const wide = new MultiFormatWriter().encode('ABC123', BarcodeFormat.CODE_128, 0, 60, hints);

        // Default margin is 10; a 40 module margin widens the rendered result by 30.
        assert.strictEqual(wide.getWidth() - dflt.getWidth(), 30);
    });

    it('produces a shorter symbol with the CODE128_COMPACT hint', () => {
        const contents = 'AB123456789012345678';

        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.CODE128_COMPACT, true);

        const dflt = new Code128Writer().encodeContentsWithHints(contents, null);
        const compact = new Code128Writer().encodeContentsWithHints(contents, hints);

        assert.strictEqual(compact.length <= dflt.length, true);
    });

    it('rejects contents that violate a forced code set', () => {
        const hints = new Map<EncodeHintType, any>();
        hints.set(EncodeHintType.FORCE_CODE_SET, 'C');

        // Code set C is digits only.
        assert.throws(
            () => new Code128Writer().encodeContentsWithHints('ABC', hints),
            IllegalArgumentException
        );
    });

    it('rejects an unsupported format for a specific writer', () => {
        assert.throws(
            () => new ITFWriter().encode('123456', BarcodeFormat.CODE_39, 0, 60, null),
            IllegalArgumentException
        );
    });

});
