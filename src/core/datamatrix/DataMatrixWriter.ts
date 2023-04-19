import BarcodeFormat from '../BarcodeFormat';
import BitMatrix from '../common/BitMatrix';
import Dimension from '../Dimension';
import EncodeHintType from '../EncodeHintType';
import ByteMatrix from '../qrcode/encoder/ByteMatrix';
import Charset from '../util/Charset';
import Writer from '../Writer';
import {
  DefaultPlacement,
  ErrorCorrection,
  HighLevelEncoder,
  MinimalEncoder,
  SymbolInfo,
} from './encoder';
import { SymbolShapeHint } from './encoder/constants';

export default class DataMatrixWriter implements Writer {
  public encode(
    contents: string,
    format: BarcodeFormat,
    width: number,
    height: number,
    hints: Map<EncodeHintType, unknown> = null
  ): BitMatrix {
    if (contents.trim() === '') {
      throw new Error('Found empty contents');
    }

    if (format !== BarcodeFormat.DATA_MATRIX) {
      throw new Error('Can only encode DATA_MATRIX, but got ' + format);
    }

    if (width < 0 || height < 0) {
      throw new Error(
        'Requested dimensions can\'t be negative: ' + width + 'x' + height
      );
    }

    // Try to get force shape & min / max size
    let shape = SymbolShapeHint.FORCE_NONE;
    let minSize: Dimension = null;
    let maxSize: Dimension = null;
    if (hints != null) {
      const requestedShape = hints.get(
        EncodeHintType.DATA_MATRIX_SHAPE
      ) as SymbolShapeHint;
      if (requestedShape != null) {
        shape = requestedShape;
      }

      const requestedMinSize = hints.get(EncodeHintType.MIN_SIZE) as Dimension;
      if (requestedMinSize != null) {
        minSize = requestedMinSize;
      }

      const requestedMaxSize = hints.get(EncodeHintType.MAX_SIZE) as Dimension;
      if (requestedMaxSize != null) {
        maxSize = requestedMaxSize;
      }
    }

    // 1. step: Data encodation
    let encoded: string;

    const hasCompactionHint =
      hints != null &&
      hints.has(EncodeHintType.DATA_MATRIX_COMPACT) &&
      Boolean(hints.get(EncodeHintType.DATA_MATRIX_COMPACT).toString());
    if (hasCompactionHint) {
      const hasGS1FormatHint =
        hints.has(EncodeHintType.GS1_FORMAT) &&
        Boolean(hints.get(EncodeHintType.GS1_FORMAT).toString());

      let charset: Charset = null;
      const hasEncodingHint = hints.has(EncodeHintType.CHARACTER_SET);
      if (hasEncodingHint) {
        charset = Charset.forName(
          hints.get(EncodeHintType.CHARACTER_SET).toString()
        );
      }
      encoded = MinimalEncoder.encodeHighLevel(
        contents,
        charset,
        hasGS1FormatHint ? 0x1d : -1,
        shape
      );
    } else {
      const hasForceC40Hint =
        hints != null &&
        hints.has(EncodeHintType.FORCE_C40) &&
        Boolean(hints.get(EncodeHintType.FORCE_C40).toString());
      encoded = HighLevelEncoder.encodeHighLevel(
        contents,
        shape,
        minSize,
        maxSize,
        hasForceC40Hint
      );
    }

    const symbolInfo = SymbolInfo.lookup(
      encoded.length,
      shape,
      minSize,
      maxSize,
      true
    );

    // 2. step: ECC generation
    const codewords = ErrorCorrection.encodeECC200(encoded, symbolInfo);

    // 3. step: Module placement in Matrix
    const placement = new DefaultPlacement(
      codewords,
      symbolInfo.getSymbolDataWidth(),
      symbolInfo.getSymbolDataHeight()
    );
    placement.place();

    // 4. step: low-level encoding
    return this.encodeLowLevel(placement, symbolInfo, width, height);
  }

  /**
   * Encode the given symbol info to a bit matrix.
   *
   * @param placement  The DataMatrix placement.
   * @param symbolInfo The symbol info to encode.
   * @return The bit matrix generated.
   */
  private encodeLowLevel(
    placement: DefaultPlacement,
    symbolInfo: SymbolInfo,
    width: number,
    height: number
  ): BitMatrix {
    const symbolWidth = symbolInfo.getSymbolDataWidth();
    const symbolHeight = symbolInfo.getSymbolDataHeight();

    const matrix = new ByteMatrix(
      symbolInfo.getSymbolWidth(),
      symbolInfo.getSymbolHeight()
    );

    let matrixY = 0;

    for (let y = 0; y < symbolHeight; y++) {
      // Fill the top edge with alternate 0 / 1
      let matrixX;
      if (y % symbolInfo.matrixHeight === 0) {
        matrixX = 0;
        for (let x = 0; x < symbolInfo.getSymbolWidth(); x++) {
          matrix.setBoolean(matrixX, matrixY, x % 2 === 0);
          matrixX++;
        }
        matrixY++;
      }
      matrixX = 0;
      for (let x = 0; x < symbolWidth; x++) {
        // Fill the right edge with full 1
        if (x % symbolInfo.matrixWidth === 0) {
          matrix.setBoolean(matrixX, matrixY, true);
          matrixX++;
        }
        matrix.setBoolean(matrixX, matrixY, placement.getBit(x, y));
        matrixX++;
        // Fill the right edge with alternate 0 / 1
        if (x % symbolInfo.matrixWidth === symbolInfo.matrixWidth - 1) {
          matrix.setBoolean(matrixX, matrixY, y % 2 === 0);
          matrixX++;
        }
      }
      matrixY++;
      // Fill the bottom edge with full 1
      if (y % symbolInfo.matrixHeight === symbolInfo.matrixHeight - 1) {
        matrixX = 0;
        for (let x = 0; x < symbolInfo.getSymbolWidth(); x++) {
          matrix.setBoolean(matrixX, matrixY, true);
          matrixX++;
        }
        matrixY++;
      }
    }

    return this.convertByteMatrixToBitMatrix(matrix, width, height);
  }

  /**
   * Convert the ByteMatrix to BitMatrix.
   *
   * @param reqHeight The requested height of the image (in pixels) with the Datamatrix code
   * @param reqWidth The requested width of the image (in pixels) with the Datamatrix code
   * @param matrix The input matrix.
   * @return The output matrix.
   */
  private convertByteMatrixToBitMatrix(
    matrix: ByteMatrix,
    reqWidth: number,
    reqHeight: number
  ): BitMatrix {
    const matrixWidth = matrix.getWidth();
    const matrixHeight = matrix.getHeight();
    const outputWidth = Math.max(reqWidth, matrixWidth);
    const outputHeight = Math.max(reqHeight, matrixHeight);

    const multiple = Math.min(
      outputWidth / matrixWidth,
      outputHeight / matrixHeight
    );

    let leftPadding = (outputWidth - matrixWidth * multiple) / 2;
    let topPadding = (outputHeight - matrixHeight * multiple) / 2;

    let output: BitMatrix;

    // remove padding if requested width and height are too small
    if (reqHeight < matrixHeight || reqWidth < matrixWidth) {
      leftPadding = 0;
      topPadding = 0;
      output = new BitMatrix(matrixWidth, matrixHeight);
    } else {
      output = new BitMatrix(reqWidth, reqHeight);
    }

    output.clear();
    for (
      let inputY = 0, outputY = topPadding;
      inputY < matrixHeight;
      inputY++, outputY += multiple
    ) {
      // Write the contents of this row of the bytematrix
      for (
        let inputX = 0, outputX = leftPadding;
        inputX < matrixWidth;
        inputX++, outputX += multiple
      ) {
        if (matrix.get(inputX, inputY) === 1) {
          output.setRegion(outputX, outputY, multiple, multiple);
        }
      }
    }

    return output;
  }
}
