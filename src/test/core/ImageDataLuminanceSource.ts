import * as assert from 'assert';
import AssertUtils from './util/AssertUtils';
import { LuminanceSource } from '@zxing/library';
import { ImageDataLuminanceSource } from '@zxing/library';

describe('ImageDataLuminanceSource', () => {

    // ImageData is RGBA with each being in an interval of 0-255
    const SOURCE = new ImageDataLuminanceSource(new ImageData(Uint8ClampedArray.from([
        255, 0, 0, 255, /**/ 0, 255, 255, 255, /**/ 0, 0, 0, 255,
        0, 255, 0, 255, /**/ 255, 0, 255, 255, /**/ 0, 0, 0, 255,
        0, 0, 255, 255, /**/ 255, 255, 0, 255, /**/ 0, 0, 0, 255]), 3, 3));

    it('testCrop', () => {
        assert.strictEqual(SOURCE.isCropSupported(), true);
        const cropped: LuminanceSource = SOURCE.crop(1, 1, 1, 1);
        assert.strictEqual(cropped.getHeight(), 1);
        assert.strictEqual(cropped.getWidth(), 1);
        assert.strictEqual(AssertUtils.typedArraysAreEqual(Uint8ClampedArray.from([255, 0, 255, 255]), cropped.getRow(0, null)), true);
    });
});
