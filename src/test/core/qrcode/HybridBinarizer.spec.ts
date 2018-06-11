import * as assert from 'assert';
import 'mocha';
import HybridBinarizer from '../../../core/common/HybridBinarizer';
import SharpImageLuminanceSource from '../SharpImageLuminanceSource';
import SharpImage from '../util/SharpImage';
import Exception from '../../../core/Exception';

const path = require('path');

describe('HybridBinarizer', () => {
    it('testHybridBinarizer', async (done) => {

        let images: Map<number, SharpImage>;

        try {
            images = await SharpImage.loadWithRotations(path.resolve('src/test/core/resources/blackbox/common/simple.png'), [0]);
        } catch (ex) {
            assert.ok(false, (<Exception>ex).message);
            done(ex);
        }

        const image = images.get(0);
        const source = new SharpImageLuminanceSource(image);
        const test = new HybridBinarizer(source);
        const matrix = test.getBlackMatrix();

        assert.equal(0, matrix.get(13, 12));
        assert.equal(1, matrix.get(13, 13));

        done();
    });
});
