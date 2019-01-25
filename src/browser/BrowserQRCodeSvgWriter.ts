import EncodeHintType from '../core/EncodeHintType';
import Encoder from '../core/qrcode/encoder/Encoder';
import QRCode from '../core/qrcode/encoder/QRCode';
import ErrorCorrectionLevel from '../core/qrcode/decoder/ErrorCorrectionLevel';
import IllegalArgumentException from '../core/IllegalArgumentException';
import IllegalStateException from '../core/IllegalStateException';

/**
 * @deprecated Moving to @zxing/browser
 */
class BrowserQRCodeSvgWriter {

    private static readonly QUIET_ZONE_SIZE = 4;

    /**
     * SVG markup NameSpace
     */
    private static readonly SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * Writes and renders a QRCode SVG element.
     *
     * @param contents
     * @param width
     * @param height
     * @param hints
     */
    public write(
        contents: string,
        width: number,
        height: number,
        hints: Map<EncodeHintType, any> = null
    ): SVGSVGElement {

        if (contents.length === 0) {
            throw new IllegalArgumentException('Found empty contents');
        }

        // if (format != BarcodeFormat.QR_CODE) {
        //   throw new IllegalArgumentException("Can only encode QR_CODE, but got " + format)
        // }

        if (width < 0 || height < 0) {
            throw new IllegalArgumentException('Requested dimensions are too small: ' + width + 'x' + height);
        }

        let errorCorrectionLevel = ErrorCorrectionLevel.L;
        let quietZone = BrowserQRCodeSvgWriter.QUIET_ZONE_SIZE;

        if (hints !== null) {

            if (undefined !== hints.get(EncodeHintType.ERROR_CORRECTION)) {
                errorCorrectionLevel = ErrorCorrectionLevel.fromString(hints.get(EncodeHintType.ERROR_CORRECTION).toString());
            }

            if (undefined !== hints.get(EncodeHintType.MARGIN)) {
                quietZone = Number.parseInt(hints.get(EncodeHintType.MARGIN).toString(), 10);
            }
        }

        const code = Encoder.encode(contents, errorCorrectionLevel, hints);

        return this.renderResult(code, width, height, quietZone);
    }

    /**
     * Renders the result and then appends it to the DOM.
     */
    public writeToDom(
        containerElement: string | HTMLElement,
        contents: string,
        width: number,
        height: number,
        hints: Map<EncodeHintType, any> = null
    ): void {

        if (typeof containerElement === 'string') {
            containerElement = document.querySelector<HTMLElement>(containerElement);
        }

        const svgElement = this.write(contents, width, height, hints);

        if (containerElement)
            containerElement.appendChild(svgElement);
    }

    /**
     * Note that the input matrix uses 0 == white, 1 == black.
     * The output matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
     */
    private renderResult(code: QRCode, width: number /*int*/, height: number /*int*/, quietZone: number /*int*/): SVGSVGElement {

        const input = code.getMatrix();

        if (input === null) {
            throw new IllegalStateException();
        }

        const inputWidth = input.getWidth();
        const inputHeight = input.getHeight();
        const qrWidth = inputWidth + (quietZone * 2);
        const qrHeight = inputHeight + (quietZone * 2);
        const outputWidth = Math.max(width, qrWidth);
        const outputHeight = Math.max(height, qrHeight);

        const multiple = Math.min(Math.floor(outputWidth / qrWidth), Math.floor(outputHeight / qrHeight));

        // Padding includes both the quiet zone and the extra white pixels to accommodate the requested
        // dimensions. For example, if input is 25x25 the QR will be 33x33 including the quiet zone.
        // If the requested size is 200x160, the multiple will be 4, for a QR of 132x132. These will
        // handle all the padding from 100x100 (the actual QR) up to 200x160.
        const leftPadding = Math.floor((outputWidth - (inputWidth * multiple)) / 2);
        const topPadding = Math.floor((outputHeight - (inputHeight * multiple)) / 2);

        const svgElement = this.createSVGElement(outputWidth, outputHeight);

        for (let inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++ , outputY += multiple) {
            // Write the contents of this row of the barcode
            for (let inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++ , outputX += multiple) {
                if (input.get(inputX, inputY) === 1) {
                    const svgRectElement = this.createSvgRectElement(outputX, outputY, multiple, multiple);
                    svgElement.appendChild(svgRectElement);
                }
            }
        }

        return svgElement;
    }

    /**
     * Creates a SVG element.
     *
     * @param w SVG's width attribute
     * @param h SVG's height attribute
     */
    private createSVGElement(w: number, h: number): SVGSVGElement {

        const svgElement = document.createElementNS(BrowserQRCodeSvgWriter.SVG_NS, 'svg');

        svgElement.setAttributeNS(null, 'height', w.toString());
        svgElement.setAttributeNS(null, 'width', h.toString());

        return svgElement;
    }

    /**
     * Creates a SVG rect element.
     *
     * @param x Element's x coordinate
     * @param y Element's y coordinate
     * @param w Element's width attribute
     * @param h Element's height attribute
     */
    private createSvgRectElement(x: number, y: number, w: number, h: number): SVGRectElement {

        const rect = document.createElementNS(BrowserQRCodeSvgWriter.SVG_NS, 'rect');

        rect.setAttributeNS(null, 'x', x.toString());
        rect.setAttributeNS(null, 'y', y.toString());
        rect.setAttributeNS(null, 'height', w.toString());
        rect.setAttributeNS(null, 'width', h.toString());
        rect.setAttributeNS(null, 'fill', '#000000');

        return rect;
    }
}

export { BrowserQRCodeSvgWriter };
