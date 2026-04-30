import StringUtils from '../../common/StringUtils';
import StringBuilder from '../../util/StringBuilder';
import { char } from '../../../customTypings';
import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
import HighLevelEncoder from './HighLevelEncoder';
import { BASE256_ENCODATION, ASCII_ENCODATION } from './constants';

export class Base256Encoder implements Encoder {
  public getEncodingMode() {
    return BASE256_ENCODATION;
  }

  public encode(context: EncoderContext) {
    const buffer = new StringBuilder();
    buffer.append(0o0); // Initialize length field
    while (context.hasMoreCharacters()) {
      const c = context.getCurrentChar();
      buffer.append(c);

      context.pos++;

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
    const dataCount = buffer.length() - 1;
    const lengthFieldSize = 1;
    const currentSize =
      context.getCodewordCount() + dataCount + lengthFieldSize;
    context.updateSymbolInfo(currentSize);
    const mustPad = context.getSymbolInfo().getDataCapacity() - currentSize > 0;
    if (context.hasMoreCharacters() || mustPad) {
      if (dataCount <= 249) {
        buffer.setCharAt(0, StringUtils.getCharAt(dataCount));
      } else if (dataCount <= 1555) {
        buffer.setCharAt(
          0,
          StringUtils.getCharAt(Math.floor(dataCount / 250) + 249)
        );
        buffer.insert(1, StringUtils.getCharAt(dataCount % 250));
      } else {
        throw new Error('Message length not in valid ranges: ' + dataCount);
      }
    }
    for (let i = 0, c = buffer.length(); i < c; i++) {
      context.writeCodeword(
        this.randomize255State(
          buffer.charAt(i).charCodeAt(0),
          context.getCodewordCount() + 1
        )
      );
    }
  }

  private randomize255State(ch: char, codewordPosition: number): number {
    const pseudoRandom = ((149 * codewordPosition) % 255) + 1;
    const tempVariable = ch + pseudoRandom;
    if (tempVariable <= 255) {
      return tempVariable;
    } else {
      return tempVariable - 256;
    }
  }
}
