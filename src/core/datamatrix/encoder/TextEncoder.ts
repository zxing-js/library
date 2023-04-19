import StringBuilder from '../../util/StringBuilder';
import { char } from '../../../customTypings';
import { C40Encoder } from './C40Encoder';
import { TEXT_ENCODATION } from './constants';

export class TextEncoder extends C40Encoder {
  public getEncodingMode() {
    return TEXT_ENCODATION;
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
    if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
      sb.append(c - 97 + 14);
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
    if (c >= '['.charCodeAt(0) && c <= '_'.charCodeAt(0)) {
      sb.append(0o1); // Shift 2 Set
      sb.append(c - 91 + 22);
      return 2;
    }
    if (c === '`'.charCodeAt(0)) {
      sb.append(0o2); // Shift 3 Set
      sb.append(0); // '`' - 96 == 0
      return 2;
    }
    if (c <= 'Z'.charCodeAt(0)) {
      sb.append(0o2); // Shift 3 Set
      sb.append(c - 65 + 1);
      return 2;
    }
    if (c <= 127) {
      sb.append(0o2); // Shift 3 Set
      sb.append(c - 123 + 27);
      return 2;
    }
    sb.append(`${0o1}\u001e`); // Shift 2, Upper Shift
    let len = 2;
    len += this.encodeChar(c - 128, sb);
    return len;
  }
}
