import StringUtils from '../../common/StringUtils';
import StringBuilder from '../../util/StringBuilder';
import { EDIFACT_ENCODATION, ASCII_ENCODATION } from './constants';
import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
import HighLevelEncoder from './HighLevelEncoder';

export class EdifactEncoder implements Encoder {
  public getEncodingMode() {
    return EDIFACT_ENCODATION;
  }

  public encode(context: EncoderContext) {
    // step F
    const buffer = new StringBuilder();
    while (context.hasMoreCharacters()) {
      const c = context.getCurrentChar();
      this.encodeChar(c, buffer);
      context.pos++;

      const count = buffer.length();
      if (count >= 4) {
        context.writeCodewords(this.encodeToCodewords(buffer.toString()));

        const test = buffer.toString().substring(4);
        buffer.setLengthToZero();
        buffer.append(test);

        // buffer.delete(0, 4);
        // for (let i = 0; i < 4; i++) {
        //  buffer.deleteCharAt(i);
        // }

        const newMode = HighLevelEncoder.lookAheadTest(
          context.getMessage(),
          context.pos,
          this.getEncodingMode()
        );
        if (newMode !== this.getEncodingMode()) {
          // Return to ASCII encodation, which will actually handle latch to new mode
          context.signalEncoderChange(ASCII_ENCODATION);
          break;
        }
      }
    }
    buffer.append(StringUtils.getCharAt(31)); // Unlatch
    this.handleEOD(context, buffer);
  }

  /**
   * Handle "end of data" situations
   *
   * @param context the encoder context
   * @param buffer  the buffer with the remaining encoded characters
   */
  private handleEOD(context: EncoderContext, buffer: StringBuilder) {
    try {
      const count = buffer.length();
      if (count === 0) {
        return; // Already finished
      }
      if (count === 1) {
        // Only an unlatch at the end
        context.updateSymbolInfo();
        let available =
          context.getSymbolInfo().getDataCapacity() -
          context.getCodewordCount();
        const remaining = context.getRemainingCharacters();
        // The following two lines are a hack inspired by the 'fix' from https://sourceforge.net/p/barcode4j/svn/221/
        if (remaining > available) {
          context.updateSymbolInfo(context.getCodewordCount() + 1);
          available =
            context.getSymbolInfo().getDataCapacity() -
            context.getCodewordCount();
        }
        if (remaining <= available && available <= 2) {
          return; // No unlatch
        }
      }

      if (count > 4) {
        throw new Error('Count must not exceed 4');
      }
      const restChars = count - 1;
      const encoded = this.encodeToCodewords(buffer.toString());
      const endOfSymbolReached = !context.hasMoreCharacters();
      let restInAscii = endOfSymbolReached && restChars <= 2;

      if (restChars <= 2) {
        context.updateSymbolInfo(context.getCodewordCount() + restChars);
        const available =
          context.getSymbolInfo().getDataCapacity() -
          context.getCodewordCount();
        if (available >= 3) {
          restInAscii = false;
          context.updateSymbolInfo(context.getCodewordCount() + encoded.length);
          // available = context.symbolInfo.dataCapacity - context.getCodewordCount();
        }
      }

      if (restInAscii) {
        context.resetSymbolInfo();
        context.pos -= restChars;
      } else {
        context.writeCodewords(encoded);
      }
    } finally {
      context.signalEncoderChange(ASCII_ENCODATION);
    }
  }

  private encodeChar(c: number, sb: StringBuilder) {
    if (c >= ' '.charCodeAt(0) && c <= '?'.charCodeAt(0)) {
      sb.append(c);
    } else if (c >= '@'.charCodeAt(0) && c <= '^'.charCodeAt(0)) {
      sb.append(StringUtils.getCharAt(c - 64));
    } else {
      HighLevelEncoder.illegalCharacter(StringUtils.getCharAt(c));
    }
  }

  private encodeToCodewords(sb: string): string {
    const len = sb.length;
    if (len === 0) {
      throw new Error('StringBuilder must not be empty');
    }
    const c1 = sb.charAt(0).charCodeAt(0);
    const c2 = len >= 2 ? sb.charAt(1).charCodeAt(0) : 0;
    const c3 = len >= 3 ? sb.charAt(2).charCodeAt(0) : 0;
    const c4 = len >= 4 ? sb.charAt(3).charCodeAt(0) : 0;

    const v = (c1 << 18) + (c2 << 12) + (c3 << 6) + c4;
    const cw1 = (v >> 16) & 255;
    const cw2 = (v >> 8) & 255;
    const cw3 = v & 255;
    const res = new StringBuilder();
    res.append(cw1);
    if (len >= 2) {
      res.append(cw2);
    }
    if (len >= 3) {
      res.append(cw3);
    }
    return res.toString();
  }
}
