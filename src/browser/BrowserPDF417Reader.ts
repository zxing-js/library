import { BrowserCodeReader } from './BrowserCodeReader';
import PDF417Reader from '../core/pdf417/PDF417Reader';

/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
export class BrowserPDF417Reader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserPDF417Reader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    public constructor(timeBetweenScansMillis: number = 500) {
        super(new PDF417Reader(), timeBetweenScansMillis);
    }
}
