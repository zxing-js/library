import { CharacterSetECI, ZXingStringEncoding } from '@zxing/library';

describe('StringEncoding.decode', () => {
  const bytes = Uint8Array.from([0x00, 0x41, 0x7f, 0x80, 0x82, 0x9c, 0x9f, 0xe9, 0xff]);
  const latin1Text = '\x00A\x7f\x80\x82\x9c\x9f\xe9\xff';

  it('preserves all byte values for ISO-8859-1 ECI', () => {
    const allBytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    const text = ZXingStringEncoding.decode(allBytes, CharacterSetECI.ISO8859_1);

    expect(Array.from(text, (char) => char.charCodeAt(0))).toEqual(Array.from(allBytes));
  });

  it.each([
    'ISO-8859-1',
    'ISO8859_1',
    'ISO88591',
    'iso8859-1',
    'iso_8859-1',
    'iso_8859-1:1987',
    'iso-ir-100',
    'cp819',
    'csisolatin1',
    'ibm819',
    'l1',
    ' \tLaTiN1\r\n',
  ])('preserves ISO-8859-1 bytes for label %j', (label) => {
    expect(ZXingStringEncoding.decode(bytes, label)).toBe(latin1Text);
  });

  it('decodes ISO-8859-1 without TextDecoder', () => {
    const textDecoder = globalThis.TextDecoder;
    try {
      globalThis.TextDecoder = undefined;
      expect(ZXingStringEncoding.decode(bytes, CharacterSetECI.ISO8859_1)).toBe(latin1Text);
      expect(ZXingStringEncoding.decode(bytes, 'latin1')).toBe(latin1Text);
      expect(ZXingStringEncoding.decode(Uint8Array.from([0xc3, 0xa9]), 'UTF-8')).toBe('\xe9');
    } finally {
      globalThis.TextDecoder = textDecoder;
    }
  });

  it('decodes empty buffers and large byte views', () => {
    const backing = new Uint8Array(256 * 1024 + 2);
    backing.fill(0x82, 1, backing.length - 1);
    const view = backing.subarray(1, -1);

    const text = ZXingStringEncoding.decode(view, 'ISO-8859-1');

    expect(text === '\x82'.repeat(view.length)).toBe(true);
    expect(ZXingStringEncoding.decode(new Uint8Array(), 'ISO-8859-1')).toBe('');
  });

  it('keeps native Windows-1252 and UTF-8 decoding', () => {
    const windowsBytes = Uint8Array.from([0x82, 0x9c]);
    expect(ZXingStringEncoding.decode(windowsBytes, 'windows-1252')).toBe('\u201a\u0153');
    expect(ZXingStringEncoding.decode(windowsBytes, CharacterSetECI.Cp1252)).toBe('\u201a\u0153');
    expect(ZXingStringEncoding.decode(windowsBytes, 'us-ascii')).toBe(new TextDecoder('us-ascii').decode(windowsBytes));
    expect(ZXingStringEncoding.decode(Uint8Array.from([0xc3, 0xa9]), 'UTF-8')).toBe('\xe9');
  });

  it('passes the encoding name and bytes unchanged to a custom decoder', () => {
    const previousDecoder = ZXingStringEncoding.customDecoder;
    const customDecoder = jest.fn(() => 'custom');
    try {
      ZXingStringEncoding.customDecoder = customDecoder;
      expect(ZXingStringEncoding.decode(bytes, CharacterSetECI.ISO8859_1)).toBe('custom');
      expect(ZXingStringEncoding.decode(bytes, 'Latin1')).toBe('custom');
      expect(customDecoder.mock.calls).toEqual([[bytes, 'ISO-8859-1'], [bytes, 'Latin1']]);
    } finally {
      ZXingStringEncoding.customDecoder = previousDecoder;
    }
  });
});
