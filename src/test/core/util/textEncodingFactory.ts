import { TextEncoder,  TextDecoder } from '@zxing/text-encoding';

export function createCustomEncoder(e: string) {
  return new TextEncoder(e, { NONSTANDARD_allowLegacyEncoding: true });
}

export function createCustomDecoder(e: string) {
  return new TextDecoder(e);
}
