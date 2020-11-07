import InvertedLuminanceSource from '../core/InvertedLuminanceSource';
import LuminanceSource from '../core/LuminanceSource';
import IllegalArgumentException from '../core/IllegalArgumentException';

/**
* Used instead of HTMLCanvasElementLuminanceSource in cases where DOM is not available e.g. web workers.
*/
export default class ImageDataLuminanceSource extends LuminanceSource {
    private buffer: Uint8ClampedArray;

    public constructor(imageData: ImageData) {
        super(imageData.width, imageData.height);
        this.buffer = ImageDataLuminanceSource.toGrayscaleBuffer(imageData.data, imageData.width, imageData.height);
    }

    private static toGrayscaleBuffer(imageBuffer: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
        const grayscaleBuffer = new Uint8ClampedArray(width * height);
        for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
            let gray;
            const alpha = imageBuffer[i + 3];
            // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
            // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
            // barcode image. Force any such pixel to be white:
            if (alpha === 0) {
                gray = 0xFF;
            } else {
                const pixelR = imageBuffer[i];
                const pixelG = imageBuffer[i + 1];
                const pixelB = imageBuffer[i + 2];
                // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
                // (306*R) >> 10 is approximately equal to R*0.299, and so on.
                // 0x200 >> 10 is 0.5, it implements rounding.
                gray = (306 * pixelR +
                    601 * pixelG +
                    117 * pixelB +
                    0x200) >> 10;
            }
            grayscaleBuffer[j] = gray;
        }
        return grayscaleBuffer;
    }

    public getRow(y: number, row: Uint8ClampedArray): Uint8ClampedArray {
        if (y < 0 || y >= this.getHeight()) {
            throw new IllegalArgumentException('Requested row is outside the image: ' + y);
        }
        const width: number = this.getWidth();
        const start = y * width;
        if (row === null) {
            row = this.buffer.slice(start, start + width);
        } else {
            if (row.length < width) {
                row = new Uint8ClampedArray(width);
            }
            // The underlying raster of image consists of bytes with the luminance values
            // TODO: can avoid set/slice?
            row.set(this.buffer.slice(start, start + width));
        }

        return row;
    }

    public getMatrix(): Uint8ClampedArray {
        return this.buffer;
    }

    public isCropSupported(): boolean {
        return true;
    }

    public crop(left: number, top: number, width: number, height: number): LuminanceSource {
        super.crop(left, top, width, height);
        return this;
    }

    /**
    * This is always true, since the image is a gray-scale image.
    *
    * @return true
    */
    public isRotateSupported(): boolean {
        return true;
    }

    public rotateCounterClockwise(): LuminanceSource {
        this.rotate(-90);
        return this;
    }

    public rotateCounterClockwise45(): LuminanceSource {
        this.rotate(-45);
        return this;
    }

    private rotate(angle: number) {
        const length = this.buffer.length;
        const width = this.getWidth();
        const height = this.getHeight();
        const radians = ImageDataLuminanceSource.degreesToRadians(angle);
        const { width: newWidth, height: newHeight } = ImageDataLuminanceSource.expandBuffer(width, height, radians);
        const newBuffer = new Uint8ClampedArray(newWidth * newHeight * 4);

        // Loop through original buffer length
        for (let i = 0; i < length; i += 4) {
            // Convert index to coordinate
            let { x, y } = ImageDataLuminanceSource.indexToCoordinate(i, width);
            // Translate center of image to 0,0
            x -= width / 2;
            y -= height / 2;
            // Rotate coordinate around 0,0 by given radians
            let { x: rx, y: ry } = ImageDataLuminanceSource.rotateCoordinate(x, y, radians);
            // Translate new coordinates back to new center
            rx = Math.round(rx + newWidth / 2);
            ry = Math.round(ry + newHeight / 2);
            // Convert new coordinates to new index
            const j = ImageDataLuminanceSource.coordinateToIndex(rx, ry, newWidth);
            newBuffer[j + 0] = this.buffer[i + 0];
            newBuffer[j + 1] = this.buffer[i + 1];
            newBuffer[j + 2] = this.buffer[i + 2];
            newBuffer[j + 3] = this.buffer[i + 3];
        }

        this.buffer = newBuffer;
        return this;
    }

    public invert(): LuminanceSource {
        return new InvertedLuminanceSource(this);
    }

    /* HELPERS */

    static degreesToRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    static indexToCoordinate(index: number, width: number) {
        return {
            x: (index / 4) % width,
            y: (index / 4 / width) << 0
        };
    }

    static coordinateToIndex(x: number, y: number, width: number) {
        return (x + y * width) * 4;
    }

    static expandBuffer(width: number, height: number, radians: number) {
        return {
            width: Math.ceil(Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height),
            height: Math.ceil(Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height)
        };
    }

    static rotateCoordinate(x: number, y: number, radians: number) {
        x = ImageDataLuminanceSource.shearHorizontal(x, y, radians);
        y = ImageDataLuminanceSource.shearVertical(x, y, radians);
        x = ImageDataLuminanceSource.shearHorizontal(x, y, radians);
        return { x, y };
    }

    static shearHorizontal(x: number, y: number, radians: number) {
        return Math.round(x + -y * Math.tan(radians / 2));
    }

    static shearVertical(x: number, y: number, radians: number) {
        return Math.round(x * Math.sin(radians) + y);
    }
}
