import StringBuilder from '../../util/StringBuilder';
import { char } from '../../../customTypings';
import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
import HighLevelEncoder from './HighLevelEncoder';
import {
  C40_ENCODATION,
  LATCH_TO_C40,
  ASCII_ENCODATION,
  C40_UNLATCH,
} from './constants';

export class C40Encoder implements Encoder {
  public getEncodingMode() {
    return C40_ENCODATION;
  }

  encodeMaximal(context: EncoderContext): void {
    const buffer = new StringBuilder();
    let lastCharSize = 0;
    let backtrackStartPosition = context.pos;
    let backtrackBufferLength = 0;
    while (context.hasMoreCharacters()) {
      const c = context.getCurrentChar();
      context.pos++;
      lastCharSize = this.encodeChar(c, buffer);
      if (buffer.length() % 3 === 0) {
        backtrackStartPosition = context.pos;
        backtrackBufferLength = buffer.length();
      }
    }
    if (backtrackBufferLength !== buffer.length()) {
      const unwritten = Math.floor((buffer.length() / 3) * 2);

      const curCodewordCount = Math.floor(
        context.getCodewordCount() + unwritten + 1
      ); // +1 for the latch to C40
      context.updateSymbolInfo(curCodewordCount);
      const available =
        context.getSymbolInfo().getDataCapacity() - curCodewordCount;
      const rest = Math.floor(buffer.length() % 3);
      if (
        (rest === 2 && available !== 2) ||
        (rest === 1 && (lastCharSize > 3 || available !== 1))
      ) {
        // buffer.setLength(backtrackBufferLength);
        context.pos = backtrackStartPosition;
      }
    }
    if (buffer.length() > 0) {
      context.writeCodeword(LATCH_TO_C40);
    }

    this.handleEOD(context, buffer);
  }

  public encode(context: EncoderContext): void {
    // step C
    const buffer = new StringBuilder();
    while (context.hasMoreCharacters()) {
      const c = context.getCurrentChar();
      context.pos++;

      let lastCharSize = this.encodeChar(c, buffer);

      const unwritten = Math.floor(buffer.length() / 3) * 2;

      const curCodewordCount = context.getCodewordCount() + unwritten;
      context.updateSymbolInfo(curCodewordCount);
      const available =
        context.getSymbolInfo().getDataCapacity() - curCodewordCount;

      if (!context.hasMoreCharacters()) {
        // Avoid having a single C40 value in the last triplet
        const removed = new StringBuilder();
        if (buffer.length() % 3 === 2 && available !== 2) {
          lastCharSize = this.backtrackOneCharacter(
            context,
            buffer,
            removed,
            lastCharSize
          );
        }
        while (
          buffer.length() % 3 === 1 &&
          (lastCharSize > 3 || available !== 1)
        ) {
          lastCharSize = this.backtrackOneCharacter(
            context,
            buffer,
            removed,
            lastCharSize
          );
        }
        break;
      }

      const count = buffer.length();
      if (count % 3 === 0) {
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
    this.handleEOD(context, buffer);
  }

  backtrackOneCharacter(
    context: EncoderContext,
    buffer: StringBuilder,
    removed: StringBuilder,
    lastCharSize: number
  ): number {
    const count = buffer.length();

    const test = buffer.toString().substring(0, count - lastCharSize);
    buffer.setLengthToZero();
    buffer.append(test);

    // buffer.delete(count - lastCharSize, count);
    /*for (let i = count - lastCharSize; i < count; i++) {
      buffer.deleteCharAt(i);
    }*/

    context.pos--;
    const c = context.getCurrentChar();
    lastCharSize = this.encodeChar(c, removed);
    context.resetSymbolInfo(); // Deal with possible reduction in symbol size
    return lastCharSize;
  }

  writeNextTriplet(context: EncoderContext, buffer: StringBuilder) {
    context.writeCodewords(this.encodeToCodewords(buffer.toString()));

    const test = buffer.toString().substring(3);
    buffer.setLengthToZero();
    buffer.append(test);

    // buffer.delete(0, 3);
    /*for (let i = 0; i < 3; i++) {
      buffer.deleteCharAt(i);
    }*/
  }

  /**
   * Handle "end of data" situations
   *
   * @param context the encoder context
   * @param buffer  the buffer with the remaining encoded characters
   */
  handleEOD(context: EncoderContext, buffer: StringBuilder): void {
    const unwritten = Math.floor((buffer.length() / 3) * 2);
    const rest = buffer.length() % 3;

    const curCodewordCount = context.getCodewordCount() + unwritten;

    context.updateSymbolInfo(curCodewordCount);
    const available =
      context.getSymbolInfo().getDataCapacity() - curCodewordCount;

    if (rest === 2) {
      buffer.append('\0'); // Shift 1
      while (buffer.length() >= 3) {
        this.writeNextTriplet(context, buffer);
      }
      if (context.hasMoreCharacters()) {
        context.writeCodeword(C40_UNLATCH);
      }
    } else if (available === 1 && rest === 1) {
      while (buffer.length() >= 3) {
        this.writeNextTriplet(context, buffer);
      }
      if (context.hasMoreCharacters()) {
        context.writeCodeword(C40_UNLATCH);
      }
      // else no unlatch
      context.pos--;
    } else if (rest === 0) {
      while (buffer.length() >= 3) {
        this.writeNextTriplet(context, buffer);
      }
      if (available > 0 || context.hasMoreCharacters()) {
        context.writeCodeword(C40_UNLATCH);
      }
    } else {
      throw new Error('Unexpected case. Please report!');
    }
    context.signalEncoderChange(ASCII_ENCODATION);
  }

  encodeChar(c: char, sb: StringBuilder): number {
    if (c === ' '.charCodeAt(0)) {
      sb.append(0o3);
      return 1;
    }
    if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
      sb.append(c - 48 + 4);
      return 1;
    }
    if (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0)) {
      sb.append(c - 65 + 14);
      return 1;
    }
    if (c < ' '.charCodeAt(0)) {
      sb.append(0o0); // Shift 1 Set
      sb.append(c);
      return 2;
    }
    if (c <= '/'.charCodeAt(0)) {
      sb.append(0o1); // Shift 2 Set
      sb.append(c - 33);
      return 2;
    }
    if (c <= '@'.charCodeAt(0)) {
      sb.append(0o1); // Shift 2 Set
      sb.append(c - 58 + 15);
      return 2;
    }
    if (c <= '_'.charCodeAt(0)) {
      sb.append(0o1); // Shift 2 Set
      sb.append(c - 91 + 22);
      return 2;
    }
    if (c <= 127) {
      sb.append(0o2); // Shift 3 Set
      sb.append(c - 96);
      return 2;
    }
    sb.append(`${0o1}\u001e`); // Shift 2, Upper Shift
    let len = 2;
    len += this.encodeChar(c - 128, sb);
    return len;
  }

  private encodeToCodewords(sb: string): string {
    const v =
      1600 * sb.charCodeAt(0) + 40 * sb.charCodeAt(1) + sb.charCodeAt(2) + 1;
    const cw1 = v / 256;
    const cw2 = v % 256;

    const result = new StringBuilder();
    result.append(cw1);
    result.append(cw2);

    return result.toString();
  }
}
