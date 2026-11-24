import { CharacterSetECI, ZXingStringEncoding } from '@zxing/library';

describe('StringEncoding.decode', () => {
  const nullByte = 0x00;
  const asciiA = 0x41;
  const asciiDelete = 0x7f;
  const firstC1Byte = 0x80;
  const windowsQuoteByte = 0x82;
  const windowsLigatureByte = 0x9c;
  const lastC1Byte = 0x9f;
  const latin1EAcuteByte = 0xe9;
  const maxByte = 0xff;
  const bytes = Uint8Array.from([
    nullByte, asciiA, asciiDelete, firstC1Byte, windowsQuoteByte,
    windowsLigatureByte, lastC1Byte, latin1EAcuteByte, maxByte,
  ]);
  const latin1Text = '\x00A\x7f\x80\x82\x9c\x9f\xe9\xff';
  const utf8LeadByte = 0xc3;
  const utf8ContinuationByte = 0xa9;
  const utf8EAcuteBytes = [utf8LeadByte, utf8ContinuationByte];

  it('preserves all byte values for ISO-8859-1 ECI', () => {
    const firstCodeUnitIndex = 0;
    const allBytes = Uint8Array.from({ length: maxByte + 1 }, (_, index) => index);
    const text = ZXingStringEncoding.decode(allBytes, CharacterSetECI.ISO8859_1);

    expect(Array.from(text, (char) => char.charCodeAt(firstCodeUnitIndex))).toEqual(Array.from(allBytes));
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
      expect(ZXingStringEncoding.decode(Uint8Array.from(utf8EAcuteBytes), 'UTF-8')).toBe('\xe9');
    } finally {
      globalThis.TextDecoder = textDecoder;
    }
  });

  it('decodes empty buffers and large byte views', () => {
    const viewLength = 262_144;
    const sentinelBytes = 1;
    const backing = new Uint8Array(viewLength + 2 * sentinelBytes);
    const viewEnd = backing.length - sentinelBytes;
    backing.fill(windowsQuoteByte, sentinelBytes, viewEnd);
    const view = backing.subarray(sentinelBytes, viewEnd);

    const text = ZXingStringEncoding.decode(view, 'ISO-8859-1');

    expect(text === '\x82'.repeat(view.length)).toBe(true);
    expect(ZXingStringEncoding.decode(new Uint8Array(), 'ISO-8859-1')).toBe('');
  });

  it('keeps native Windows-1252 and UTF-8 decoding', () => {
    const windowsBytes = Uint8Array.from([windowsQuoteByte, windowsLigatureByte]);
    expect(ZXingStringEncoding.decode(windowsBytes, 'windows-1252')).toBe('\u201a\u0153');
    expect(ZXingStringEncoding.decode(windowsBytes, CharacterSetECI.Cp1252)).toBe('\u201a\u0153');
    expect(ZXingStringEncoding.decode(windowsBytes, 'us-ascii')).toBe(new TextDecoder('us-ascii').decode(windowsBytes));
    expect(ZXingStringEncoding.decode(Uint8Array.from(utf8EAcuteBytes), 'UTF-8')).toBe('\xe9');
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
