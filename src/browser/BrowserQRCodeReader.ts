import { BrowserCodeReader } from './BrowserCodeReader';
import QRCodeReader from '../core/qrcode/QRCodeReader';

/**
 * QR Code reader to use from browser.
 *
 * @class BrowserQRCodeReader
 * @extends {BrowserCodeReader}
 */
export class BrowserQRCodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserQRCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     *
     * @memberOf BrowserQRCodeReader
     */
    public constructor(timeBetweenScansMillis: number = 500) {
        super(new QRCodeReader(), timeBetweenScansMillis);
    }
}
