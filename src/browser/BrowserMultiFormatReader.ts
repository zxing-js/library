import { BrowserCodeReader } from './BrowserCodeReader';
import MultiFormatReader from '../core/MultiFormatReader';
import BinaryBitmap from '../core/BinaryBitmap';
import Result from '../core/Result';
import DecodeHintType from '../core/DecodeHintType';

export class BrowserMultiFormatReader extends BrowserCodeReader {

  protected readonly reader: MultiFormatReader;

  public constructor(
    hints: Map<DecodeHintType, any> = null,
    timeBetweenScansMillis: number = 500
  ) {
    const reader = new MultiFormatReader();
    reader.setHints(hints);
    super(reader, timeBetweenScansMillis);
  }

  /**
   * Overwrite decodeBitmap to call decodeWithState, which will pay
   * attention to the hints set in the constructor function
   */
  public decodeBitmap(binaryBitmap: BinaryBitmap): Result {
    return this.reader.decodeWithState(binaryBitmap);
  }
}
