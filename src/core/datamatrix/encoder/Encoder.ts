import { EncoderContext } from './EncoderContext';

export interface Encoder {
  getEncodingMode(): number;

  encode(context: EncoderContext): void;
}
