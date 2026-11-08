import * as assert from 'assert';
import {
  BarcodeFormat,
  BinaryBitmap,
  DataMatrixDecodedBitStreamParser,
  DataMatrixReader,
  DataMatrixWriter,
  DecodeHintType,
  HybridBinarizer,
  RGBLuminanceSource,
  ZXingStringBuilder as StringBuilder,
} from '@zxing/library';
import { C40Encoder } from '../../../../core/datamatrix/encoder/C40Encoder';
import { TextEncoder } from '../../../../core/datamatrix/encoder/TextEncoder';
import { EncoderContext } from '../../../../core/datamatrix/encoder/EncoderContext';
import { C40_UNLATCH, LATCH_TO_C40, LATCH_TO_TEXT } from '../../../../core/datamatrix/encoder/constants';

describe('Data Matrix C40 and Text Upper Shift', () => {
  const maxByte = 255;
  const firstExtendedByte = 128;
  const upperShiftValue = 30;
  const spaceCharacter = 32;
  const firstCharacterIndex = 0;
  const noPendingValues = 0;

  for (const [name, encoder, latch] of [
    ['C40', new C40Encoder(), LATCH_TO_C40],
    ['Text', new TextEncoder(), LATCH_TO_TEXT],
  ] as const) {
    it(`round-trips every byte through ${name} codewords`, () => {
      for (let code = 0; code <= maxByte; code++) {
        const buffer = new StringBuilder();
        const length = encoder.encodeChar(code, buffer);
        assert.strictEqual(length, buffer.length());
        if (code >= firstExtendedByte) {
          assert.strictEqual(buffer.toString().charCodeAt(firstCharacterIndex), 1);
          assert.strictEqual(buffer.toString().charCodeAt(1), upperShiftValue);
        }
        let expected = String.fromCharCode(code);
        while (buffer.length() % 3 !== noPendingValues) {
          encoder.encodeChar(spaceCharacter, buffer);
          expected += ' ';
        }
        const context = new EncoderContext('');
        context.writeCodeword(latch);
        while (buffer.length() > noPendingValues) {
          encoder.writeNextTriplet(context, buffer);
        }
        context.writeCodeword(C40_UNLATCH);
        const bytes = Uint8Array.from(
          context.getCodewords().toString(), c => c.charCodeAt(firstCharacterIndex),
        );
        assert.strictEqual(
          DataMatrixDecodedBitStreamParser.decode(bytes).getText(), expected,
          `${name} character ${code}`,
        );
      }
    });
  }

  for (const input of [
    'ecblpkhf\u00d3', 'BKEjtxcz\u00d3co6', 'tzthyr\u00d3dc',
    'ECBLPKHF\u00d3', 'TZTHYR\u00d3DC',
  ]) {
    it(`round-trips a generated symbol for ${input}`, () => {
      const automaticSize = 0;
      const white = 255;
      const black = 0;
      const matrix = new DataMatrixWriter().encode(
        input, BarcodeFormat.DATA_MATRIX, automaticSize, automaticSize, new Map(),
      );
      const scale = 2;
      const width = (matrix.getWidth() + 2) * scale;
      const height = (matrix.getHeight() + 2) * scale;
      const pixels = new Uint8ClampedArray(width * height).fill(white);
      for (let y = 0; y < matrix.getHeight(); y++) {
        for (let x = 0; x < matrix.getWidth(); x++) {
          if (matrix.get(x, y)) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                pixels[((y + 1) * scale + dy) * width +
                  (x + 1) * scale + dx] = black;
              }
            }
          }
        }
      }
      const image = new BinaryBitmap(new HybridBinarizer(
        new RGBLuminanceSource(pixels, width, height),
      ));
      const hints = new Map([[DecodeHintType.PURE_BARCODE, true]]);
      assert.strictEqual(new DataMatrixReader().decode(image, hints).getText(), input);
    });
  }
});
