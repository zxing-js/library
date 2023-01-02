/*
 * Copyright 2013 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AztecCode } from '@zxing/library';
import {
  assertEquals,
  assertTrue,
  assertFalse,
  assertArrayEquals,
} from '../../util/AssertUtils';
import { BitMatrix } from '@zxing/library';
import {
  BarcodeFormat,
  DecoderResult,
  EncodeHintType,
  BitArray,
  StringUtils,
} from '@zxing/library';
import { AztecEncoder } from '@zxing/library';
import { ZXingStandardCharsets } from '@zxing/library';
import { ZXingStringBuilder } from '@zxing/library';
import { fail } from 'assert';
import { AztecDetectorResult } from '@zxing/library';
import { AztecDecoder } from '@zxing/library';
import Random from '../../../core/util/Random';
import { AztecHighLevelEncoder } from '@zxing/library';
import { AztecCodeWriter } from '@zxing/library';
import { ResultPoint } from '@zxing/library';
import { ZXingStringEncoding } from '@zxing/library';
import { ZXingCharset } from '@zxing/library';
import '@zxing/text-encoding/cjs/encoding-indexes';
import { TextEncoder, TextDecoder } from '@zxing/text-encoding';

ZXingStringEncoding.customEncoder = (b, e) =>
  new TextEncoder(e, { NONSTANDARD_allowLegacyEncoding: true }).encode(b);
ZXingStringEncoding.customDecoder = (s, e) => new TextDecoder(e).decode(s);

/**
 * Aztec 2D generator unit tests.
 *
 * @author Rustam Abdullaev
 * @author Frank Yellin
 */
// public final class EncoderTest extends Assert {
describe('EncoderTest', () => {
  const DOTX = new RegExp('[^.X]', 'g');
  const SPACES: RegExp = new RegExp('\\s+', 'g');
  const NO_POINTS: ResultPoint[] = [];

  // real life tests

  // @Test
  // public void testEncode1() {

  it('testEncode1', () => {
    testEncode(
      'This is an example Aztec symbol for Wikipedia.',
      true,
      3,
      'X     X X       X     X X     X     X         \n' +
        'X         X     X X     X   X X   X X       X \n' +
        'X X   X X X X X   X X X                 X     \n' +
        'X X                 X X   X       X X X X X X \n' +
        '    X X X   X   X     X X X X         X X     \n' +
        '  X X X   X X X X   X     X   X     X X   X   \n' +
        '        X X X X X     X X X X   X   X     X   \n' +
        'X       X   X X X X X X X X X X X     X   X X \n' +
        'X   X     X X X               X X X X   X X   \n' +
        'X     X X   X X   X X X X X   X X   X   X X X \n' +
        'X   X         X   X       X   X X X X       X \n' +
        'X       X     X   X   X   X   X   X X   X     \n' +
        '      X   X X X   X       X   X     X X X     \n' +
        '    X X X X X X   X X X X X   X X X X X X   X \n' +
        '  X X   X   X X               X X X   X X X X \n' +
        '  X   X       X X X X X X X X X X X X   X X   \n' +
        '  X X   X       X X X   X X X       X X       \n' +
        '  X               X   X X     X     X X X     \n' +
        '  X   X X X   X X   X   X X X X   X   X X X X \n' +
        '    X   X   X X X   X   X   X X X X     X     \n' +
        '        X               X                 X   \n' +
        '        X X     X   X X   X   X   X       X X \n' +
        '  X   X   X X       X   X         X X X     X \n'
    );
  });

  // @Test
  // public void testEncode2() {
  it('testEncode2', () => {
    testEncode(
      'Aztec Code is a public domain 2D matrix barcode symbology' +
        ' of nominally square symbols built on a square grid with a ' +
        'distinctive square bullseye pattern at their center.',
      false,
      6,
      '        X X     X X     X     X     X   X X X         X   X         X   X X       \n' +
        '  X       X X     X   X X   X X       X             X     X   X X   X           X \n' +
        '  X   X X X     X   X   X X     X X X   X   X X               X X       X X     X \n' +
        'X X X             X   X         X         X     X     X   X     X X       X   X   \n' +
        'X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X \n' +
        '    X X   X   X   X X X               X       X       X X     X X   X X       X   \n' +
        'X X     X       X       X X X X   X   X X       X   X X   X       X X   X X   X   \n' +
        '  X       X   X     X X   X   X X   X X   X X X X X X   X X           X   X   X X \n' +
        'X X   X X   X   X X X X   X X X X X X X X   X   X       X X   X X X X   X X X     \n' +
        '  X       X   X     X       X X     X X   X   X   X     X X   X X X   X     X X X \n' +
        '  X   X X X   X X       X X X         X X           X   X   X   X X X   X X     X \n' +
        '    X     X   X X     X X X X     X   X     X X X X   X X   X X   X X X     X   X \n' +
        'X X X   X             X         X X X X X   X   X X   X   X   X X   X   X   X   X \n' +
        '          X       X X X   X X     X   X           X   X X X X   X X               \n' +
        '  X     X X   X   X       X X X X X X X X X X X X X X X   X   X X   X   X X X     \n' +
        '    X X                 X   X                       X X   X       X         X X X \n' +
        '        X   X X   X X X X X X   X X X X X X X X X   X     X X           X X X X   \n' +
        '          X X X   X     X   X   X               X   X X     X X X   X X           \n' +
        'X X     X     X   X   X   X X   X   X X X X X   X   X X X X X X X       X   X X X \n' +
        'X X X X       X       X   X X   X   X       X   X   X     X X X     X X       X X \n' +
        'X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X \n' +
        '    X     X       X         X   X   X       X   X   X     X   X X                 \n' +
        '        X X     X X X X X   X   X   X X X X X   X   X X X     X X X X   X         \n' +
        'X     X   X   X         X   X   X               X   X X   X X   X X X     X   X   \n' +
        '  X   X X X   X   X X   X X X   X X X X X X X X X   X X         X X     X X X X   \n' +
        '    X X   X   X   X X X     X                       X X X   X X   X   X     X     \n' +
        '    X X X X   X         X   X X X X X X X X X X X X X X   X       X X   X X   X X \n' +
        '            X   X   X X       X X X X X     X X X       X       X X X         X   \n' +
        'X       X         X   X X X X   X     X X     X X     X X           X   X       X \n' +
        'X     X       X X X X X     X   X X X X   X X X     X       X X X X   X   X X   X \n' +
        '  X X X X X               X     X X X   X       X X   X X   X X X X     X X       \n' +
        'X             X         X   X X   X X     X     X     X   X   X X X X             \n' +
        '    X   X X       X     X       X   X X X X X X   X X   X X X X X X X X X   X   X \n' +
        '    X         X X   X       X     X   X   X       X     X X X     X       X X X X \n' +
        'X     X X     X X X X X X             X X X   X               X   X     X     X X \n' +
        'X   X X     X               X X X X X     X X     X X X X X X X X     X   X   X X \n' +
        'X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X   X \n' +
        'X           X     X X X X     X     X         X         X   X       X X   X X X   \n' +
        'X   X   X X   X X X   X         X X     X X X X     X X   X   X     X   X       X \n' +
        '      X     X     X     X X     X   X X   X X   X         X X       X       X   X \n' +
        'X       X           X   X   X     X X   X               X     X     X X X         \n'
    );
  });

  // @Test
  // public void testAztecWriter() throws Exception {

  it('testAztecWriter', () => {
    // this char is not officially present on ISO-8859-1
    // testWriter('\u20AC 1 sample data.', 'ISO-8859-1', 25, true, 2);
    // using windows-1252 instead
    testWriter('\u20AC 1 sample data.', 'windows-1252', 25, true, 2);
    testWriter('\u20AC 1 sample data.', 'ISO-8859-15', 25, true, 2);
    testWriter('\u20AC 1 sample data.', 'UTF-8', 25, true, 2);
    testWriter('\u20AC 1 sample data.', 'UTF-8', 100, true, 3);
    testWriter('\u20AC 1 sample data.', 'UTF-8', 300, true, 4);
    testWriter('\u20AC 1 sample data.', 'UTF-8', 500, false, 5);
    // Test AztecCodeWriter defaults
    const data: string = 'In ut magna vel mauris malesuada';
    const writer: AztecCodeWriter = new AztecCodeWriter();
    const matrix: BitMatrix = writer.encode(data, BarcodeFormat.AZTEC, 0, 0);
    const aztec: AztecCode = AztecEncoder.encode(
      StringUtils.getBytes(data, ZXingStandardCharsets.ISO_8859_1),
      AztecEncoder.DEFAULT_EC_PERCENT,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    const expectedMatrix: BitMatrix = aztec.getMatrix();
    // TYPESCRIPTPORT: here we have to compare each property
    // since assertEquals would strictly compare two different
    // objects with same values and fail
    assertEquals(matrix.getHeight(), expectedMatrix.getHeight());
    assertEquals(matrix.getRowSize(), expectedMatrix.getRowSize());
    assertEquals(matrix.getWidth(), expectedMatrix.getWidth());
    // since bits is private we have to access it this way
    assertArrayEquals(matrix['bits'], expectedMatrix['bits']);
  });

  // synthetic tests (encode-decode round-trip)

  // @Test
  // public void testEncodeDecode1() throws Exception {
  it('testEncodeDecode1', () => {
    testEncodeDecode('Abc123!', true, 1);
  });

  // @Test
  // public void testEncodeDecode2() throws Exception {
  it('testEncodeDecode2', () => {
    testEncodeDecode('Lorem ipsum. http://test/', true, 2);
  });

  // @Test
  // public void testEncodeDecode3() throws Exception {
  it('testEncodeDecode3', () => {
    testEncodeDecode(
      'AAAANAAAANAAAANAAAANAAAANAAAANAAAANAAAANAAAANAAAAN',
      true,
      3
    );
  });

  // @Test
  // public void testEncodeDecode4() throws Exception {
  it('testEncodeDecode4', () => {
    testEncodeDecode(
      'http://test/~!@#*^%&)__ ;:\'"[]{}\\|-+-=`1029384',
      true,
      4
    );
  });

  // @Test
  // public void testEncodeDecode5() throws Exception {
  it('testEncodeDecode5', () => {
    testEncodeDecode(
      'http://test/~!@#*^%&)__ ;:\'"[]{}\\|-+-=`1029384756<>/?abc' +
        'Four score and seven our forefathers brought forth',
      false,
      5
    );
  });

  // @Test
  // public void testEncodeDecode10() throws Exception {
  it('testEncodeDecode10', () => {
    testEncodeDecode(
      'In ut magna vel mauris malesuada dictum. Nulla ullamcorper metus quis diam' +
        ' cursus facilisis. Sed mollis quam id justo rutrum sagittis. Donec laoreet rutrum' +
        ' est, nec convallis mauris condimentum sit amet. Phasellus gravida, justo et congue' +
        ' auctor, nisi ipsum viverra erat, eget hendrerit felis turpis nec lorem. Nulla' +
        ' ultrices, elit pellentesque aliquet laoreet, justo erat pulvinar nisi, id' +
        ' elementum sapien dolor et diam.',
      false,
      10
    );
  });

  // @Test
  // public void testEncodeDecode23() throws Exception {
  it('testEncodeDecode23', () => {
    testEncodeDecode(
      'In ut magna vel mauris malesuada dictum. Nulla ullamcorper metus quis diam' +
        ' cursus facilisis. Sed mollis quam id justo rutrum sagittis. Donec laoreet rutrum' +
        ' est, nec convallis mauris condimentum sit amet. Phasellus gravida, justo et congue' +
        ' auctor, nisi ipsum viverra erat, eget hendrerit felis turpis nec lorem. Nulla' +
        ' ultrices, elit pellentesque aliquet laoreet, justo erat pulvinar nisi, id' +
        ' elementum sapien dolor et diam. Donec ac nunc sodales elit placerat eleifend.' +
        ' Sed ornare luctus ornare. Vestibulum vehicula, massa at pharetra fringilla, risus' +
        ' justo faucibus erat, nec porttitor nibh tellus sed est. Ut justo diam, lobortis eu' +
        ' tristique ac, p.In ut magna vel mauris malesuada dictum. Nulla ullamcorper metus' +
        ' quis diam cursus facilisis. Sed mollis quam id justo rutrum sagittis. Donec' +
        ' laoreet rutrum est, nec convallis mauris condimentum sit amet. Phasellus gravida,' +
        ' justo et congue auctor, nisi ipsum viverra erat, eget hendrerit felis turpis nec' +
        ' lorem. Nulla ultrices, elit pellentesque aliquet laoreet, justo erat pulvinar' +
        ' nisi, id elementum sapien dolor et diam. Donec ac nunc sodales elit placerat' +
        ' eleifend. Sed ornare luctus ornare. Vestibulum vehicula, massa at pharetra' +
        ' fringilla, risus justo faucibus erat, nec porttitor nibh tellus sed est. Ut justo' +
        ' diam, lobortis eu tristique ac, p. In ut magna vel mauris malesuada dictum. Nulla' +
        ' ullamcorper metus quis diam cursus facilisis. Sed mollis quam id justo rutrum' +
        ' sagittis. Donec laoreet rutrum est, nec convallis mauris condimentum sit amet.' +
        ' Phasellus gravida, justo et congue auctor, nisi ipsum viverra erat, eget hendrerit' +
        ' felis turpis nec lorem. Nulla ultrices, elit pellentesque aliquet laoreet, justo' +
        ' erat pulvinar nisi, id elementum sapien dolor et diam.',
      false,
      23
    );
  });

  // @Test
  // public void testEncodeDecode31() throws Exception {
  it('testEncodeDecode31', () => {
    testEncodeDecode(
      'In ut magna vel mauris malesuada dictum. Nulla ullamcorper metus quis diam' +
        ' cursus facilisis. Sed mollis quam id justo rutrum sagittis. Donec laoreet rutrum' +
        ' est, nec convallis mauris condimentum sit amet. Phasellus gravida, justo et congue' +
        ' auctor, nisi ipsum viverra erat, eget hendrerit felis turpis nec lorem. Nulla' +
        ' ultrices, elit pellentesque aliquet laoreet, justo erat pulvinar nisi, id' +
        ' elementum sapien dolor et diam. Donec ac nunc sodales elit placerat eleifend.' +
        ' Sed ornare luctus ornare. Vestibulum vehicula, massa at pharetra fringilla, risus' +
        ' justo faucibus erat, nec porttitor nibh tellus sed est. Ut justo diam, lobortis eu' +
        ' tristique ac, p.In ut magna vel mauris malesuada dictum. Nulla ullamcorper metus' +
        ' quis diam cursus facilisis. Sed mollis quam id justo rutrum sagittis. Donec' +
        ' laoreet rutrum est, nec convallis mauris condimentum sit amet. Phasellus gravida,' +
        ' justo et congue auctor, nisi ipsum viverra erat, eget hendrerit felis turpis nec' +
        ' lorem. Nulla ultrices, elit pellentesque aliquet laoreet, justo erat pulvinar' +
        ' nisi, id elementum sapien dolor et diam. Donec ac nunc sodales elit placerat' +
        ' eleifend. Sed ornare luctus ornare. Vestibulum vehicula, massa at pharetra' +
        ' fringilla, risus justo faucibus erat, nec porttitor nibh tellus sed est. Ut justo' +
        ' diam, lobortis eu tristique ac, p. In ut magna vel mauris malesuada dictum. Nulla' +
        ' ullamcorper metus quis diam cursus facilisis. Sed mollis quam id justo rutrum' +
        ' sagittis. Donec laoreet rutrum est, nec convallis mauris condimentum sit amet.' +
        ' Phasellus gravida, justo et congue auctor, nisi ipsum viverra erat, eget hendrerit' +
        ' felis turpis nec lorem. Nulla ultrices, elit pellentesque aliquet laoreet, justo' +
        ' erat pulvinar nisi, id elementum sapien dolor et diam. Donec ac nunc sodales elit' +
        ' placerat eleifend. Sed ornare luctus ornare. Vestibulum vehicula, massa at' +
        ' pharetra fringilla, risus justo faucibus erat, nec porttitor nibh tellus sed est.' +
        ' Ut justo diam, lobortis eu tristique ac, p.In ut magna vel mauris malesuada' +
        ' dictum. Nulla ullamcorper metus quis diam cursus facilisis. Sed mollis quam id' +
        ' justo rutrum sagittis. Donec laoreet rutrum est, nec convallis mauris condimentum' +
        ' sit amet. Phasellus gravida, justo et congue auctor, nisi ipsum viverra erat,' +
        ' eget hendrerit felis turpis nec lorem. Nulla ultrices, elit pellentesque aliquet' +
        ' laoreet, justo erat pulvinar nisi, id elementum sapien dolor et diam. Donec ac' +
        ' nunc sodales elit placerat eleifend. Sed ornare luctus ornare. Vestibulum vehicula,' +
        ' massa at pharetra fringilla, risus justo faucibus erat, nec porttitor nibh tellus' +
        ' sed est. Ut justo diam, lobortis eu tris. In ut magna vel mauris malesuada dictum.' +
        ' Nulla ullamcorper metus quis diam cursus facilisis. Sed mollis quam id justo rutrum' +
        ' sagittis. Donec laoreet rutrum est, nec convallis mauris condimentum sit amet.' +
        ' Phasellus gravida, justo et congue auctor, nisi ipsum viverra erat, eget' +
        ' hendrerit felis turpis nec lorem.',
      false,
      31
    );
  });

  // @Test
  // public void testGenerateModeMessage() {
  it('testGenerateModeMessage', () => {
    testModeMessage(true, 2, 29, '.X .XXX.. ...X XX.. ..X .XX. .XX.X');
    testModeMessage(true, 4, 64, 'XX XXXXXX .X.. ...X ..XX .X.. XX..');
    testModeMessage(
      false,
      21,
      660,
      'X.X.. .X.X..X..XX .XXX ..X.. .XXX. .X... ..XXX'
    );
    testModeMessage(
      false,
      32,
      4096,
      'XXXXX XXXXXXXXXXX X.X. ..... XXX.X ..X.. X.XXX'
    );
  });

  // @Test
  // public void testStuffBits() {
  it('testStuffBits', () => {
    testStuffBits(5, '.X.X. X.X.X .X.X.', '.X.X. X.X.X .X.X.');
    testStuffBits(5, '.X.X. ..... .X.X', '.X.X. ....X ..X.X');
    testStuffBits(
      3,
      'XX. ... ... ..X XXX .X. ..',
      'XX. ..X ..X ..X ..X .XX XX. .X. ..X'
    );
    testStuffBits(6, '.X.X.. ...... ..X.XX', '.X.X.. .....X. ..X.XX XXXX.');
    testStuffBits(
      6,
      '.X.X.. ...... ...... ..X.X.',
      '.X.X.. .....X .....X ....X. X.XXXX'
    );
    testStuffBits(
      6,
      '.X.X.. XXXXXX ...... ..X.XX',
      '.X.X.. XXXXX. X..... ...X.X XXXXX.'
    );
    testStuffBits(
      6,
      '...... ..XXXX X..XX. .X.... .X.X.X .....X .X.... ...X.X .....X ....XX ..X... ....X. X..XXX X.XX.X',
      '.....X ...XXX XX..XX ..X... ..X.X. X..... X.X... ....X. X..... X....X X..X.. .....X X.X..X XXX.XX .XXXXX'
    );
  });

  // @Test
  // public void testHighLevelEncode() {
  it('testHighLevelEncode', () => {
    testHighLevelEncodeString(
      'A. b.',
      // 'A'  P/S   '. ' L/L    b    D/L    '.'
      '...X. ..... ...XX XXX.. ...XX XXXX. XX.X'
    );
    testHighLevelEncodeString(
      'Lorem ipsum.',
      // 'L'  L/L   'o'   'r'   'e'   'm'   ' '   'i'   'p'   's'   'u'   'm'   D/L   '.'
      '.XX.X XXX.. X.... X..XX ..XX. .XXX. ....X .X.X. X...X X.X.. X.XX. .XXX. XXXX. XX.X'
    );
    testHighLevelEncodeString(
      'Lo. Test 123.',
      // 'L'  L/L   'o'   P/S   '. '  U/S   'T'   'e'   's'   't'    D/L   ' '  '1'  '2'  '3'  '.'
      '.XX.X XXX.. X.... ..... ...XX XXX.. X.X.X ..XX. X.X.. X.X.X  XXXX. ...X ..XX .X.. .X.X XX.X'
    );
    testHighLevelEncodeString(
      'Lo...x',
      // 'L'  L/L   'o'   D/L   '.'  '.'  '.'  U/L  L/L   'x'
      '.XX.X XXX.. X.... XXXX. XX.X XX.X XX.X XXX. XXX.. XX..X'
    );
    testHighLevelEncodeString(
      '. x://abc/.',
      // P/S   '. '  L/L   'x'   P/S   ':'   P/S   '/'   P/S   '/'   'a'   'b'   'c'   P/S   '/'   D/L   '.'
      '..... ...XX XXX.. XX..X ..... X.X.X ..... X.X.. ..... X.X.. ...X. ...XX ..X.. ..... X.X.. XXXX. XX.X'
    );
    // Uses Binary/Shift rather than Lower/Shift to save two bits.
    testHighLevelEncodeString(
      'ABCdEFG',
      // 'A'   'B'   'C'   B/S    =1    'd'     'E'   'F'   'G'
      '...X. ...XX ..X.. XXXXX ....X .XX..X.. ..XX. ..XXX .X...'
    );

    testHighLevelEncodeString(
      // Found on an airline boarding pass.  Several stretches of Binary shift are
      // necessary to keep the bitcount so low.
      '09  UAG    ^160MEUCIQC0sYS/HpKxnBELR1uB85R20OoqqwFGa0q2uEi' +
        'Ygh6utAIgLl1aBVM4EOTQtMQQYH9M2Z3Dp4qnA/fwWuQ+M8L3V8U=',
      823
    );
  });

  // @Test
  // public void testHighLevelEncodeBinary() {
  // binary short form single byte
  // @todo enable and fix this test for AztecEncoder release
  it('testHighLevelEncodeBinary', () => {
    testHighLevelEncodeString(
      'N\0N',
      // 'N'  B/S    =1   '\0'      N
      '.XXXX XXXXX ....X ........ .XXXX'
    ); // Encode "N" in UPPER

    testHighLevelEncodeString(
      'N\0n',
      // 'N'  B/S    =2   '\0'       'n'
      '.XXXX XXXXX ...X. ........ .XX.XXX.'
    ); // Encode "n" in BINARY

    // binary short form consecutive bytes
    testHighLevelEncodeString(
      'N\0\u0080 A',
      // 'N'  B/S    =2    '\0'    \u0080   ' '  'A'
      '.XXXX XXXXX ...X. ........ X....... ....X ...X.'
    );

    // binary skipping over single character
    testHighLevelEncodeString(
      '\0a\u00FF\u0080 A',
      // B/S  =4    '\0'      'a'     '\3ff'   '\200'   ' '   'A'
      'XXXXX ..X.. ........ .XX....X XXXXXXXX X....... ....X ...X.'
    );

    // getting into binary mode from digit mode
    testHighLevelEncodeString(
      '1234\0',
      // D/L   '1'  '2'  '3'  '4'  U/L  B/S    =1    \0
      'XXXX. ..XX .X.. .X.X .XX. XXX. XXXXX ....X ........'
    );

    // Create a string in which every character requires binary
    let sb: ZXingStringBuilder = new ZXingStringBuilder();
    for (let i = 0; i <= 3000; i++) {
      sb.append(128 + (i % 30));
    }
    // Test the output generated by Binary/Switch, particularly near the
    // places where the encoding changes: 31, 62, and 2047+31=2078
    for (let i of [
      1, 2, 3, 10, 29, 30, 31, 32, 33, 60, 61, 62, 63, 64, 2076, 2077, 2078,
      2079, 2080, 2100,
    ]) {
      // This is the expected length of a binary string of length "i"
      const expectedLength =
        8 * i + (i <= 31 ? 10 : i <= 62 ? 20 : i <= 2078 ? 21 : 31);
      // Verify that we are correct about the length.
      testHighLevelEncodeString(sb.substring(0, i), expectedLength);
      if (i !== 1 && i !== 32 && i !== 2079) {
        // The addition of an 'a' at the beginning or end gets merged into the binary code
        // in those cases where adding another binary character only adds 8 or 9 bits to the result.
        // So we exclude the border cases i=1,32,2079
        // A lower case letter at the beginning will be merged into binary mode
        testHighLevelEncodeString('a' + sb.substring(0, i - 1), expectedLength);
        // A lower case letter at the end will also be merged into binary mode
        testHighLevelEncodeString(sb.substring(0, i - 1) + 'a', expectedLength);
      }
      // A lower case letter at both ends will enough to latch us into LOWER.
      testHighLevelEncodeString(
        'a' + sb.substring(0, i) + 'b',
        expectedLength + 15
      );
    }

    sb = new ZXingStringBuilder();
    for (let i = 0; i < 32; i++) {
      sb.append('§'); // § forces binary encoding
    }
    sb.setCharAt(1, 'A');
    // expect B/S(1) A B/S(30)
    testHighLevelEncodeString(sb.toString(), 5 + 20 + 31 * 8);

    sb = new ZXingStringBuilder();
    for (let i = 0; i < 31; i++) {
      sb.append('§');
    }
    sb.setCharAt(1, 'A');
    // expect B/S(31)
    testHighLevelEncodeString(sb.toString(), 10 + 31 * 8);

    sb = new ZXingStringBuilder();
    for (let i = 0; i < 34; i++) {
      sb.append('§');
    }
    sb.setCharAt(1, 'A');
    // expect B/S(31) B/S(3)
    testHighLevelEncodeString(sb.toString(), 20 + 34 * 8);

    sb = new ZXingStringBuilder();
    for (let i = 0; i < 64; i++) {
      sb.append('§');
    }
    sb.setCharAt(30, 'A');
    // expect B/S(64)
    testHighLevelEncodeString(sb.toString(), 21 + 64 * 8);
  });

  // @Test
  // public void testHighLevelEncodePairs() {
  // Typical usage
  // @todo enable and fix this test for AztecEncoder release
  it('testHighLevelEncodePairs', () => {
    testHighLevelEncodeString(
      'ABC. DEF\r\n',
      //  A     B    C    P/S   .<sp>   D    E     F    P/S   \r\n
      '...X. ...XX ..X.. ..... ...XX ..X.X ..XX. ..XXX ..... ...X.'
    );

    // We should latch to PUNCT mode, rather than shift.  Also check all pairs
    testHighLevelEncodeString(
      'A. : , \r\n',
      // 'A'    M/L   P/L   ". "  ": "   ", " "\r\n"
      '...X. XXX.X XXXX. ...XX ..X.X  ..X.. ...X.'
    );

    // Latch to DIGIT rather than shift to PUNCT
    testHighLevelEncodeString(
      'A. 1234',
      // 'A'  D/L   '.'  ' '  '1' '2'   '3'  '4'
      '...X. XXXX. XX.X ...X ..XX .X.. .X.X .X X.'
    );
    // Don't bother leaving Binary Shift.
    testHighLevelEncodeString(
      'A\x80. \x80',
      // 'A'  B/S    =2    \200      "."     " "     \200
      '...X. XXXXX ..X.. X....... ..X.XXX. ..X..... X.......'
    );
  });

  // @Test
  // public void testUserSpecifiedLayers() {
  it('testUserSpecifiedLayers', () => {
    const alphabet: Uint8Array = StringUtils.getBytes(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ZXingStandardCharsets.ISO_8859_1
    );
    let aztec = AztecEncoder.encode(alphabet, 25, -2);
    assertEquals(2, aztec.getLayers());
    assertTrue(aztec.isCompact());

    aztec = AztecEncoder.encode(alphabet, 25, 32);
    assertEquals(32, aztec.getLayers());
    assertFalse(aztec.isCompact());

    try {
      AztecEncoder.encode(alphabet, 25, 33);
      fail('Encode should have failed.  No such thing as 33 layers');
    } catch (expected) {
      // continue
    }

    try {
      AztecEncoder.encode(alphabet, 25, -1);
      fail('Encode should have failed.  Text can\'t fit in 1-layer compact');
    } catch (expected) {
      // continue
    }
  });

  // @Test
  // public void testBorderCompact4Case() {
  it('testBorderCompact4Case', () => {
    // Compact(4) con hold 608 bits of information, but at most 504 can be data.  Rest must
    // be error correction
    const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // encodes as 26 * 5 * 4 = 520 bits of data
    const alphabet4: string = alphabet + alphabet + alphabet + alphabet;
    const data: Uint8Array = StringUtils.getBytes(
      alphabet4,
      ZXingStandardCharsets.ISO_8859_1
    );
    try {
      AztecEncoder.encode(data, 0, -4);
      fail('Encode should have failed.  Text can\'t fit in 1-layer compact');
    } catch (expected) {
      // continue
    }

    // If we just try to encode it normally, it will go to a non-compact 4 layer
    let aztecCode: AztecCode = AztecEncoder.encode(
      data,
      0,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    assertFalse(aztecCode.isCompact());
    assertEquals(4, aztecCode.getLayers());

    // But shortening the string to 100 bytes (500 bits of data), compact works fine, even if we
    // include more error checking.
    aztecCode = AztecEncoder.encode(
      StringUtils.getBytes(
        alphabet4.substring(0, 100),
        ZXingStandardCharsets.ISO_8859_1
      ),
      10,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    assertTrue(aztecCode.isCompact());
    assertEquals(4, aztecCode.getLayers());
  });

  // Helper routines

  function testEncode(
    data: string,
    compact: boolean,
    layers: number,
    expected: string
  ) {
    const aztec: AztecCode = AztecEncoder.encode(
      StringUtils.getBytes(data, ZXingStandardCharsets.ISO_8859_1),
      33,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    assertEquals(compact, aztec.isCompact());
    assertEquals(layers, aztec.getLayers());
    const matrix: BitMatrix = aztec.getMatrix();
    assertEquals(expected, matrix.toString());
  }

  function testEncodeDecode(data: string, compact: boolean, layers: number) {
    const aztec = AztecEncoder.encode(
      StringUtils.getBytes(data, ZXingStandardCharsets.ISO_8859_1),
      25,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    assertEquals(compact, aztec.isCompact());
    assertEquals(layers, aztec.getLayers());
    const matrix = aztec.getMatrix();
    let r: AztecDetectorResult = new AztecDetectorResult(
      matrix,
      NO_POINTS,
      aztec.isCompact(),
      aztec.getCodeWords(),
      aztec.getLayers()
    );
    let res: DecoderResult = new AztecDecoder().decode(r);
    assertEquals(data, res.getText());
    // Check error correction by introducing a few minor errors
    const random = getPseudoRandom();
    matrix.flip(random.nextInt(matrix.getWidth()), random.nextInt(2));
    matrix.flip(
      random.nextInt(matrix.getWidth()),
      matrix.getHeight() - 2 + random.nextInt(2)
    );
    matrix.flip(random.nextInt(2), random.nextInt(matrix.getHeight()));
    matrix.flip(
      matrix.getWidth() - 2 + random.nextInt(2),
      random.nextInt(matrix.getHeight())
    );
    r = new AztecDetectorResult(
      matrix,
      NO_POINTS,
      aztec.isCompact(),
      aztec.getCodeWords(),
      aztec.getLayers()
    );
    res = new AztecDecoder().decode(r);
    assertEquals(data, res.getText());
  }

  function testWriter(
    data: string,
    charset: string,
    eccPercent: number,
    compact: boolean,
    layers: number
  ) {
    // 1. Perform an encode-decode round-trip because it can be lossy.
    // 2. Aztec AztecDecoder currently always decodes the data with a LATIN-1 charset:
    const expectedData = ZXingStringEncoding.decode(
      StringUtils.getBytes(data, ZXingCharset.forName(charset)),
      ZXingStandardCharsets.ISO_8859_1
    );
    const hints: Map<EncodeHintType, any> = new Map<EncodeHintType, any>();
    hints.set(EncodeHintType.CHARACTER_SET, charset);
    hints.set(EncodeHintType.ERROR_CORRECTION, eccPercent);
    const writer = new AztecCodeWriter();
    const matrix = writer.encodeWithHints(
      data,
      BarcodeFormat.AZTEC,
      0,
      0,
      hints
    );
    const aztec = AztecEncoder.encode(
      StringUtils.getBytes(data, ZXingCharset.forName(charset)),
      eccPercent,
      AztecEncoder.DEFAULT_AZTEC_LAYERS
    );
    assertEquals(compact, aztec.isCompact());
    assertEquals(layers, aztec.getLayers());
    const matrix2 = aztec.getMatrix();
    assertEquals(matrix.toString(), matrix2.toString());
    let r = new AztecDetectorResult(
      matrix,
      NO_POINTS,
      aztec.isCompact(),
      aztec.getCodeWords(),
      aztec.getLayers()
    );
    let res = new AztecDecoder().decode(r);
    assertEquals(expectedData, res.getText());
    // Check error correction by introducing up to eccPercent/2 errors
    const ecWords = (aztec.getCodeWords() * eccPercent) / 100 / 2;
    const random = getPseudoRandom();
    for (let i = 0; i < ecWords; i++) {
      // don't touch the core
      const x = random.nextBoolean()
        ? random.nextInt(aztec.getLayers() * 2)
        : matrix.getWidth() - 1 - random.nextInt(aztec.getLayers() * 2);
      const y = random.nextBoolean()
        ? random.nextInt(aztec.getLayers() * 2)
        : matrix.getHeight() - 1 - random.nextInt(aztec.getLayers() * 2);
      matrix.flip(x, y);
    }
    r = new AztecDetectorResult(
      matrix,
      NO_POINTS,
      aztec.isCompact(),
      aztec.getCodeWords(),
      aztec.getLayers()
    );
    res = new AztecDecoder().decode(r);
    assertEquals(expectedData, res.getText());
  }

  function getPseudoRandom() {
    return new Random(0xdeadbeef);
  }

  function testModeMessage(
    compact: boolean,
    layers: number,
    words: number,
    expected: string
  ) {
    const inArr: BitArray = AztecEncoder.generateModeMessage(
      compact,
      layers,
      words
    );
    assertEquals(stripSpace(expected), stripSpace(inArr.toString()));
  }

  function testStuffBits(wordSize: number, bits: string, expected: string) {
    const inArr = toBitArray(bits);
    const stuffed: BitArray = AztecEncoder.stuffBits(inArr, wordSize);
    assertEquals(stripSpace(expected), stripSpace(stuffed.toString()));
  }

  function toBitArray(bits: string): BitArray {
    const inArr = new BitArray();
    const str: string[] = bits.replace(DOTX, '').split('');
    for (let aStr of str) {
      inArr.appendBit(aStr === 'X');
    }
    return inArr;
  }

  function toBooleanArray(bitArray: BitArray) {
    const result: boolean[] = new Array<boolean>(bitArray.getSize());
    for (let i = 0; i < result.length; i++) {
      result[i] = bitArray.get(i);
    }
    return result;
  }

  function testHighLevelEncodeString(s: string, expectedBits: string | number) {
    const bits: BitArray = new AztecHighLevelEncoder(
      StringUtils.getBytes(s, ZXingStandardCharsets.ISO_8859_1)
    ).encode();

    if (typeof expectedBits === 'number') {
      const receivedBitCount: number = stripSpace(bits.toString()).length;
      assertEquals(receivedBitCount, expectedBits);
      assertEquals(AztecDecoder.highLevelDecode(toBooleanArray(bits)), s);
    } else {
      const receivedBits: string = stripSpace(bits.toString());
      assertEquals(receivedBits, stripSpace(expectedBits));
      assertEquals(AztecDecoder.highLevelDecode(toBooleanArray(bits)), s);
    }
  }

  /*   function testHighLevelEncodeString(s: string, expectedReceivedBits: number) {
    const bits: BitArray = new AztecHighLevelEncoder(StringUtils.getBytes(s, ZXingStandardCharsets.ISO_8859_1)).encode();
    const receivedBitCount: number = stripSpace(bits.toString()).length;
    assertEquals("highLevelEncode() failed for input string: " + s,
                 expectedReceivedBits, receivedBitCount);
    assertEquals(s, AztecDecoder.highLevelDecode(toBooleanArray(bits)));
  } */

  function stripSpace(s: string): string {
    return s.replace(SPACES, '');
  }
});
