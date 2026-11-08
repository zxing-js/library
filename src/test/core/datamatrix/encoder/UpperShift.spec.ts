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

describe('Data Matrix C40 and Text Upper Shift', () => {
  for (const [name, encoder, latch] of [
    ['C40', new C40Encoder(), 230],
    ['Text', new TextEncoder(), 239],
  ] as const) {
    it(`round-trips every byte through ${name} codewords`, () => {
      for (let code = 0; code <= 255; code++) {
        const buffer = new StringBuilder();
        const length = encoder.encodeChar(code, buffer);
        assert.strictEqual(length, buffer.length());
        if (code >= 128) {
          assert.strictEqual(buffer.toString().charCodeAt(0), 1);
          assert.strictEqual(buffer.toString().charCodeAt(1), 30);
        }
        let expected = String.fromCharCode(code);
        while (buffer.length() % 3 !== 0) {
          encoder.encodeChar(32, buffer);
          expected += ' ';
        }
        const context = new EncoderContext('');
        context.writeCodeword(latch);
        while (buffer.length() > 0) {
          encoder.writeNextTriplet(context, buffer);
        }
        context.writeCodeword(254);
        const bytes = Uint8Array.from(
          context.getCodewords().toString(), c => c.charCodeAt(0)
        );
        assert.strictEqual(
          DataMatrixDecodedBitStreamParser.decode(bytes).getText(), expected,
          `${name} character ${code}`
        );
      }
    });
  }

  for (const input of [
    'ecblpkhf\u00d3', 'BKEjtxcz\u00d3co6', 'tzthyr\u00d3dc',
    'ECBLPKHF\u00d3', 'TZTHYR\u00d3DC',
  ]) {
    it(`round-trips a generated symbol for ${input}`, () => {
      const matrix = new DataMatrixWriter().encode(
        input, BarcodeFormat.DATA_MATRIX, 0, 0, new Map()
      );
      const scale = 2;
      const width = (matrix.getWidth() + 2) * scale;
      const height = (matrix.getHeight() + 2) * scale;
      const pixels = new Uint8ClampedArray(width * height).fill(255);
      for (let y = 0; y < matrix.getHeight(); y++) {
        for (let x = 0; x < matrix.getWidth(); x++) {
          if (matrix.get(x, y)) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                pixels[((y + 1) * scale + dy) * width +
                  (x + 1) * scale + dx] = 0;
              }
            }
          }
        }
      }
      const image = new BinaryBitmap(new HybridBinarizer(
        new RGBLuminanceSource(pixels, width, height)
      ));
      const hints = new Map([[DecodeHintType.PURE_BARCODE, true]]);
      assert.strictEqual(new DataMatrixReader().decode(image, hints).getText(), input);
    });
  }
});
