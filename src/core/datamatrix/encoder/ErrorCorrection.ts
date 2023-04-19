import StringBuilder from '../../util/StringBuilder';
import { ALOG, FACTORS, FACTOR_SETS, LOG } from './constants';
import SymbolInfo from './SymbolInfo';

/**
 * Error Correction Code for ECC200.
 */
class ErrorCorrection {
  /**
   * Creates the ECC200 error correction for an encoded message.
   *
   * @param codewords  the codewords
   * @param symbolInfo information about the symbol to be encoded
   * @return the codewords with interleaved error correction.
   */
  public static encodeECC200(codewords: string, symbolInfo: SymbolInfo) {
    if (codewords.length !== symbolInfo.getDataCapacity()) {
      throw new Error(
        'The number of codewords does not match the selected symbol'
      );
    }
    const sb = new StringBuilder();
    sb.append(codewords);
    const blockCount = symbolInfo.getInterleavedBlockCount();
    if (blockCount === 1) {
      const ecc = this.createECCBlock(
        codewords,
        symbolInfo.getErrorCodewords()
      );
      sb.append(ecc);
    } else {
      // sb.setLength(sb.capacity());
      const dataSizes: number[] = [];
      const errorSizes: number[] = [];
      for (let i = 0; i < blockCount; i++) {
        dataSizes[i] = symbolInfo.getDataLengthForInterleavedBlock(i + 1);
        errorSizes[i] = symbolInfo.getErrorLengthForInterleavedBlock(i + 1);
      }
      for (let block = 0; block < blockCount; block++) {
        const temp = new StringBuilder();
        for (let d = block; d < symbolInfo.getDataCapacity(); d += blockCount) {
          temp.append(codewords.charAt(d));
        }
        const ecc = this.createECCBlock(temp.toString(), errorSizes[block]);
        let pos = 0;
        for (
          let e = block;
          e < errorSizes[block] * blockCount;
          e += blockCount
        ) {
          sb.setCharAt(symbolInfo.getDataCapacity() + e, ecc.charAt(pos++));
        }
      }
    }
    return sb.toString();
  }

  private static createECCBlock(codewords: string, numECWords: number): string {
    let table = -1;
    for (let i = 0; i < FACTOR_SETS.length; i++) {
      if (FACTOR_SETS[i] === numECWords) {
        table = i;
        break;
      }
    }
    if (table < 0) {
      throw new Error(
        'Illegal number of error correction codewords specified: ' + numECWords
      );
    }
    const poly: number[] = FACTORS[table];
    const ecc: number[] = [];
    for (let i = 0; i < numECWords; i++) {
      ecc[i] = 0;
    }

    for (let i = 0; i < codewords.length; i++) {
      let m = ecc[numECWords - 1] ^ codewords.charAt(i).charCodeAt(0);
      for (let k = numECWords - 1; k > 0; k--) {
        if (m !== 0 && poly[k] !== 0) {
          ecc[k] = ecc[k - 1] ^ ALOG[(LOG[m] + LOG[poly[k]]) % 255];
        } else {
          ecc[k] = ecc[k - 1];
        }
      }
      if (m !== 0 && poly[0] !== 0) {
        ecc[0] = ALOG[(LOG[m] + LOG[poly[0]]) % 255];
      } else {
        ecc[0] = 0;
      }
    }
    const eccReversed: number[] = [];
    for (let i = 0; i < numECWords; i++) {
      eccReversed[i] = ecc[numECWords - i - 1];
    }

    return eccReversed.map(c => String.fromCharCode(c)).join('');
  }
}

export default ErrorCorrection;
