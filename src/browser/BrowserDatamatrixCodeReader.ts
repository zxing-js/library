import { BrowserCodeReader } from './BrowserCodeReader';
import DataMatrixReader from '../core/datamatrix/DataMatrixReader';

/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
export class BrowserDatamatrixCodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserQRCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    public constructor(timeBetweenScansMillis: number = 500) {
        super(new DataMatrixReader(), timeBetweenScansMillis);
    }
}
