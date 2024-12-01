import { BrowserCodeReader } from './BrowserCodeReader';
import MultiFormatReader from '../core/MultiFormatReader';
import BinaryBitmap from '../core/BinaryBitmap';
import Result from '../core/Result';
import DecodeHintType from '../core/DecodeHintType';

export class BrowserMultiFormatReader extends BrowserCodeReader {

  protected readonly reader: MultiFormatReader;

  set hints(hints: Map<DecodeHintType, any>) {
    this._hints = hints || null;

    // Since we don't pass the hints in `decodeBitmap` as other Browser readers do, we need to set them here.
    this.reader.setHints(hints);
  }

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
    try {
      return this.reader.decodeWithState(binaryBitmap);
    } finally {
      // Readers need to be reset before being reused on another bitmap.
      this.reader.reset();
    }
  }
}
