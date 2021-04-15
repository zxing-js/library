
import StringBuilder from '../../../core/util/StringBuilder';
import { assertEquals } from './AssertUtils';

describe('StringBuilder tests', () => {

  it('initializes empty strings', () => {

    const expected = '';
    const sb = new StringBuilder();

    assertEquals(sb.toString(), expected);
  });

  it('initializes strings', () => {

    const expected = 'xyz';
    const sb = new StringBuilder('xyz');

    assertEquals(sb.toString(), expected);
  });

  it('appends strings', () => {

    const expected1 = 'abcdef';
    const sb1 = new StringBuilder();
    const expected2 = '-abcdef';
    const sb2 = new StringBuilder('-');

    sb1.append('abc');
    sb1.append('def');

    sb2.append('abc');
    sb2.append('def');

    assertEquals(sb1.toString(), expected1);
    assertEquals(sb2.toString(), expected2);
  });

  it('apends chars', () => {

    const expected = '-&8xyzxy';
    const sb = new StringBuilder('-&8');

    sb.appendChars([120, 121, 122], 0, 1);
    sb.appendChars([120, 121, 122], 1, 1);
    sb.appendChars([120, 121, 122], 2, 1);
    sb.appendChars([120, 121, 122], 0, 2);

    assertEquals(sb.toString(), expected);
  });

  it('correctly normalizes UTF8 strings', () => {

    const expected120 = 'x';
    const input120 = 120;

    const expected54 = '6';
    const input54 = 54;

    const expected80 = 'P';
    const input80 = 80;

    const expected37 = '%';
    const input37 = 37;

    const expected64 = '@';
    const input64 = 64;

    const sb = new StringBuilder();

    const actual120 = sb.normalizeString(input120);
    assertEquals(actual120, expected120);

    const actual54 = sb.normalizeString(input54);
    assertEquals(actual54, expected54);

    const actual80 = sb.normalizeString(input80);
    assertEquals(actual80, expected80);

    const actual37 = sb.normalizeString(input37);
    assertEquals(actual37, expected37);

    const actual64 = sb.normalizeString(input64);
    assertEquals(actual64, expected64);
  });

  it('correctly returns lentgh', () => {
    const expected = 10;
    const sb = new StringBuilder('----------');
    assertEquals(sb.length(), expected);
  });

  it('sets lentgh to zero', () => {
    const expected = 0;
    const sb = new StringBuilder('----------');

    sb.setLengthToZero();

    assertEquals(sb.length(), expected);
  });

  it('returns the char at index', () => {
    const expected = 'a';
    const sb = new StringBuilder('----a----');
    assertEquals(sb.charAt(4), expected);
  });

  it('changes the char at index', () => {
    const expected = 'a';
    const sb = new StringBuilder('---------');

    sb.setCharAt(4, 'a');

    assertEquals(sb.charAt(4), expected);
  });

  it('inserts and replaces chars', () => {
    const expected1 = '----aaaa-----';
    const expected2 = '----bbbb-----';
    const expected3 = '----cccc-----';
    const sb = new StringBuilder('---------');

    sb.insert(4, 'aaaa');
    assertEquals(sb.toString(), expected1);

    sb.insert(4, 'bbbb', 4);
    assertEquals(sb.toString(), expected2);

    sb.insert(4, 'cccc', null);
    assertEquals(sb.toString(), expected3);
  });

});
