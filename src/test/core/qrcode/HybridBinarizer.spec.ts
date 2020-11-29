import * as assert from 'assert';
import { HybridBinarizer } from '@zxing/library';
import SharpImageLuminanceSource from '../SharpImageLuminanceSource';
import SharpImage from '../util/SharpImage';

const path = require('path');

describe('HybridBinarizer', () => {
    it('testHybridBinarizer', async () => {

        const pathString = path.resolve('src/test/resources/blackbox/common/simple.png');

        const image = await SharpImage.loadWithRotation(pathString, 0);

        const source = new SharpImageLuminanceSource(image);
        const test = new HybridBinarizer(source);
        const matrix = test.getBlackMatrix();

        assert.equal(0, matrix.get(13, 12));
        assert.equal(1, matrix.get(13, 13));
    });
});
