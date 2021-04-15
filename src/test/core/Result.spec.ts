import { BarcodeFormat, Result, ResultPoint } from '@zxing/library';
import { assertArrayEquals, assertEquals } from './util/AssertUtils';

describe('Result tests', () => {

  it('creates result by overload 1', () => {

    const expectedText = 'abc123';
    const expectedRawBytes = Uint8Array.from([1, 5, 3, 7]);
    const expectedResultPoints = [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)];
    const expecetdBarcodeFormat = BarcodeFormat.QR_CODE;

    const actual = new Result(
      'abc123',
      Uint8Array.from([1, 5, 3, 7]),
      [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)],
      BarcodeFormat.QR_CODE
    );

    assertEquals(actual.getText(), expectedText);
    assertArrayEquals(actual.getRawBytes(), expectedRawBytes);
    assertArrayEquals(actual.getResultPoints(), expectedResultPoints);
    assertEquals(actual.getBarcodeFormat(), expecetdBarcodeFormat);
  });

  it('creates result by overload 2', () => {

    const expectedText = 'abc123';
    const expectedRawBytes = Uint8Array.from([1, 5, 3, 7]);
    const expectedResultPoints = [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)];
    const expecetdBarcodeFormat = BarcodeFormat.QR_CODE;
    const expectedTimeStamp = 1234567890;

    const actual = new Result(
      'abc123',
      Uint8Array.from([1, 5, 3, 7]),
      [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)],
      BarcodeFormat.QR_CODE,
      1234567890
    );

    assertEquals(actual.getText(), expectedText);
    assertArrayEquals(actual.getRawBytes(), expectedRawBytes);
    assertArrayEquals(actual.getResultPoints(), expectedResultPoints);
    assertEquals(actual.getBarcodeFormat(), expecetdBarcodeFormat);
    assertEquals(actual.getTimestamp(), expectedTimeStamp);
  });

  it('creates result by overload 3', () => {

    const expectedText = 'abc123';
    const expectedRawBytes = Uint8Array.from([1, 5, 3, 7]);
    const expectedNumBits = 14;
    const expectedResultPoints = [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)];
    const expecetdBarcodeFormat = BarcodeFormat.QR_CODE;
    const expectedTimeStamp = 1234567890;

    const actual = new Result(
      'abc123',
      Uint8Array.from([1, 5, 3, 7]),
      14,
      [new ResultPoint(2, 2), new ResultPoint(4, 4), new ResultPoint(8, 8), new ResultPoint(10, 10)],
      BarcodeFormat.QR_CODE,
      1234567890
    );

    assertEquals(actual.getText(), expectedText);
    assertArrayEquals(actual.getRawBytes(), expectedRawBytes);
    assertEquals(actual.getNumBits(), expectedNumBits);
    assertArrayEquals(actual.getResultPoints(), expectedResultPoints);
    assertEquals(actual.getBarcodeFormat(), expecetdBarcodeFormat);
    assertEquals(actual.getTimestamp(), expectedTimeStamp);
  });

});
