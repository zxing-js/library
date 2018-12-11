import * as assert from 'assert';
import HybridBinarizer from '../../../core/common/HybridBinarizer';
import SharpImageLuminanceSource from '../SharpImageLuminanceSource';
import SharpImage from '../util/SharpImage';

const path = require('path');

describe('HybridBinarizer', () => {
    it('testHybridBinarizer', async done => {

        const pathString = path.resolve('src/test/core/resources/blackbox/common/simple.png');

        SharpImage.loadWithRotation(pathString, 0)
            .then(image => {


                const source = new SharpImageLuminanceSource(image);
                const test = new HybridBinarizer(source);
                const matrix = test.getBlackMatrix();

                assert.equal(0, matrix.get(13, 12));
                assert.equal(1, matrix.get(13, 13));

                done();
            })
            .catch(err => {
                assert.ok(false, err);
                done(err);
            });
    });
});
