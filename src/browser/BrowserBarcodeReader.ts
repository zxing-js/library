import MultiFormatOneDReader from '../core/oned/MultiFormatOneDReader';
import VideoInputDevice from './VideoInputDevice';
import BrowserCodeReader from './BrowserCodeReader';
import DecodeHintType from '../core/DecodeHintType';

/**
 * Barcode reader reader to use from browser.
 *
 * @class BrowserBarcodeReader
 * @extends {BrowserCodeReader}
 */
class BrowserBarcodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserBarcodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     * @param {Map<DecodeHintType, any>} hints
     * @memberOf BrowserBarcodeReader
     */
    public constructor(timeBetweenScansMillis: number = 500, hints?: Map<DecodeHintType, any>) {
        super(new MultiFormatOneDReader(hints), timeBetweenScansMillis, hints);
    }
}

export { VideoInputDevice, BrowserBarcodeReader };
