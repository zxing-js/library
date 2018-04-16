import * as assert from 'assert';
import 'mocha';
import HybridBinarizer from '../../../core/common/HybridBinarizer';
import SharpImageLuminanceSource from '../SharpImageLuminanceSource';
import SharpImage from '../util/SharpImage';

const path = require('path');

describe('HybridBinarizer', () => {
    it('testHybridBinarizer', (done) => {
        SharpImage.loadWithRotations(path.resolve('src/test/core/resources/blackbox/common/simple.png'),
            [0],
            (err, images: Map<number, SharpImage>) => {
                if (err) {
                    assert.ok(false, err);
                    done(err);
                    // console.error(err)
                } else {
                    const image = images.get(0);
                    const source = new SharpImageLuminanceSource(image);
                    const test = new HybridBinarizer(source);
                    const matrix = test.getBlackMatrix();

                    assert.equal(0, matrix.get(13, 12));
                    assert.equal(1, matrix.get(13, 13));

                    done();
                }
            });
    },
    );
});
