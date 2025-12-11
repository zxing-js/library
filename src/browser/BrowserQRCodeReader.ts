import { BrowserCodeReader } from './BrowserCodeReader';
import QRCodeReader from '../core/qrcode/QRCodeReader';
import BinaryBitmap from '../core/BinaryBitmap';
import Result from '../core/Result';
import FormatException from '../core/FormatException';
import ChecksumException from '../core/ChecksumException';
import NotFoundException from '../core/NotFoundException';
import { HTMLVisualMediaElement } from './HTMLVisualMediaElement';
import { HTMLCanvasElementLuminanceSource } from './HTMLCanvasElementLuminanceSource';
import HybridBinarizer from '../core/common/HybridBinarizer';
import GlobalHistogramBinarizer from '../core/common/GlobalHistogramBinarizer';

/**
 * @deprecated Moving to @zxing/browser
 *
 * QR Code reader to use from browser.
 */
export class BrowserQRCodeReader extends BrowserCodeReader {
    /**
     * Creates an instance of BrowserQRCodeReader.
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     */
    public constructor(timeBetweenScansMillis: number = 500) {
        super(new QRCodeReader(), timeBetweenScansMillis);
        // Reduce time between decoding attempts for faster retries
        this.timeBetweenDecodingAttempts = 50; // Faster retry on errors
    }

    /**
     * Optimized createBinaryBitmap that tries multiple binarization strategies
     * for better detection of dense QR codes from camera input.
     */
    public createBinaryBitmap(mediaElement: HTMLVisualMediaElement): BinaryBitmap {
        const ctx = this.getCaptureCanvasContext(mediaElement);
        let doAutoInvert = false;
        if (mediaElement instanceof HTMLVideoElement) {
            this.drawFrameOnCanvas(<HTMLVideoElement>mediaElement);
            doAutoInvert = true;
        } else {
            this.drawImageOnCanvas(<HTMLImageElement>mediaElement);
        }
        const canvas = this.getCaptureCanvas(mediaElement);

        // Try HybridBinarizer first (default, better for complex images)
        const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas, doAutoInvert);
        const hybridBinarizer = new HybridBinarizer(luminanceSource);
        return new BinaryBitmap(hybridBinarizer);
    }

    /**
     * Optimized decode method that tries multiple strategies:
     * 1. Multiple binarization strategies (for FormatException/ChecksumException)
     * 2. Multiple rotations (for NotFoundException - distorted/rotated QR codes)
     */
    public decode(element: HTMLVisualMediaElement): Result {
        // Get binary bitmap using default strategy
        const binaryBitmap = this.createBinaryBitmap(element);
        
        // Get canvas for alternative strategies
        const canvas = this.getCaptureCanvas(element);
        const isVideo = element instanceof HTMLVideoElement;

        // Strategy 1: Try default HybridBinarizer
        try {
            return this.decodeBitmap(binaryBitmap);
        } catch (e) {
            // If NotFoundException, try rotations (for distorted/rotated QR codes)
            if (e instanceof NotFoundException && binaryBitmap.isRotateSupported()) {
                // Try 90, 180, 270 degree rotations
                const rotations = [90, 180, 270];
                for (const rotation of rotations) {
                    try {
                        let rotatedBitmap = binaryBitmap;
                        // Apply rotation (90 degrees counter-clockwise each time)
                        for (let i = 0; i < rotation / 90; i++) {
                            rotatedBitmap = rotatedBitmap.rotateCounterClockwise();
                        }
                        return this.reader.decode(rotatedBitmap, this._hints);
                    } catch (rotError) {
                        // Try next rotation
                        continue;
                    }
                }
            }
            
            // If FormatException or ChecksumException, try alternative binarization strategies
            if (e instanceof FormatException || e instanceof ChecksumException) {
                // Strategy 2: Try GlobalHistogramBinarizer (sometimes better for camera frames)
                try {
                    const globalSource = new HTMLCanvasElementLuminanceSource(canvas, false);
                    const globalBinarizer = new GlobalHistogramBinarizer(globalSource);
                    const globalBitmap = new BinaryBitmap(globalBinarizer);
                    return this.reader.decode(globalBitmap, this._hints);
                } catch (e2) {
                    // Strategy 3: Try inverted luminance with HybridBinarizer
                    if (e2 instanceof FormatException || e2 instanceof ChecksumException) {
                        try {
                            const invertedSource = new HTMLCanvasElementLuminanceSource(canvas, true);
                            const invertedBinarizer = new HybridBinarizer(invertedSource);
                            const invertedBitmap = new BinaryBitmap(invertedBinarizer);
                            return this.reader.decode(invertedBitmap, this._hints);
                        } catch (e3) {
                            // Strategy 4: Try inverted luminance with GlobalHistogramBinarizer
                            if (e3 instanceof FormatException || e3 instanceof ChecksumException) {
                                try {
                                    const invertedGlobalSource = new HTMLCanvasElementLuminanceSource(canvas, true);
                                    const invertedGlobalBinarizer = new GlobalHistogramBinarizer(invertedGlobalSource);
                                    const invertedGlobalBitmap = new BinaryBitmap(invertedGlobalBinarizer);
                                    return this.reader.decode(invertedGlobalBitmap, this._hints);
                                } catch (e4) {
                                    // Strategy 5: Try rotations with alternative binarization
                                    if (e4 instanceof NotFoundException || e4 instanceof FormatException || e4 instanceof ChecksumException) {
                                        // Try rotations with GlobalHistogramBinarizer
                                        const globalSource = new HTMLCanvasElementLuminanceSource(canvas, false);
                                        const globalBinarizer = new GlobalHistogramBinarizer(globalSource);
                                        let rotatedGlobalBitmap = new BinaryBitmap(globalBinarizer);
                                        
                                        if (rotatedGlobalBitmap.isRotateSupported()) {
                                            for (const rotation of [90, 180, 270]) {
                                                try {
                                                    let rotated = rotatedGlobalBitmap;
                                                    for (let i = 0; i < rotation / 90; i++) {
                                                        rotated = rotated.rotateCounterClockwise();
                                                    }
                                                    return this.reader.decode(rotated, this._hints);
                                                } catch (rotError) {
                                                    continue;
                                                }
                                            }
                                        }
                                    }
                                    // All strategies failed, throw original error
                                    throw e;
                                }
                            }
                            throw e;
                        }
                    }
                    throw e;
                }
            }
            // For other errors, just throw
            throw e;
        } finally {
            // Readers need to be reset before being reused on another bitmap.
            this.reader.reset();
        }
    }

    /**
     * Optimized decodeBitmap - faster retries help with detection
     */
    public decodeBitmap(binaryBitmap: BinaryBitmap): Result {
        try {
            return this.reader.decode(binaryBitmap, this._hints);
        } finally {
            // Readers need to be reset before being reused on another bitmap.
            this.reader.reset();
        }
    }
}
