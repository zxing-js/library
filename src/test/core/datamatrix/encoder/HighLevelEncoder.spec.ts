import {
  ZXingStringBuilder as StringBuilder,
  DataMatrixHighLevelEncoder as HighLevelEncoder,
} from '@zxing/library';
import {
  assertEndsWith,
  assertEquals,
  assertStartsWith,
} from '../../util/AssertUtils';

export const encodeHighLevel = (message: string) => {
  return visualize(HighLevelEncoder.encodeHighLevel(message));
};

export const visualize = (encoded: string) => {
  return encoded
    .split('')
    .map(c => c.charCodeAt(0))
    .join(' ');
};

const createBinaryMessage = (len: number): string => {
  const sb = new StringBuilder();
  sb.append('\u00ABäöüéàá-');
  for (let i = 0; i < len - 9; i++) {
    sb.append('\u00B7');
  }
  sb.append('\u00BB');
  return sb.toString();
};

describe('HighLevelEncoderTest', () => {
  it('testASCIIEncoding', () => {
    let visualized = encodeHighLevel('123456');
    assertEquals(visualized, '142 164 186');

    visualized = encodeHighLevel('123456£');
    assertEquals(visualized, '142 164 186 235 36');

    visualized = encodeHighLevel('30Q324343430794<OQQ');
    assertEquals(visualized, '160 82 162 173 173 173 137 224 61 80 82 82');
  });

  it('testC40EncodingBasic1', () => {
    let visualized = encodeHighLevel('AIMAIMAIM');
    assertEquals(visualized, '230 91 11 91 11 91 11 254');
    //230 shifts to C40 encodation, 254 unlatches, "else" case
  });

  it('testC40EncodingBasic2', () => {
    let visualized = encodeHighLevel('AIMAIAB');
    assertEquals(visualized, '230 91 11 90 255 254 67 129');
    //"B" is normally encoded as "15" (one C40 value)
    //"else" case: "B" is encoded as ASCII

    visualized = encodeHighLevel('AIMAIAb');
    assertEquals(visualized, '66 74 78 66 74 66 99 129'); //Encoded as ASCII
    //Alternative solution:
    //assertEquals("230 91 11 90 255 254 99 129", visualized);
    //"b" is normally encoded as "Shift 3, 2" (two C40 values)
    //"else" case: "b" is encoded as ASCII

    visualized = encodeHighLevel('AIMAIMAIMË');
    assertEquals(visualized, '230 91 11 91 11 91 11 254 235 76');
    //Alternative solution:
    //assertEquals("230 91 11 91 11 91 11 11 9 254", visualized);
    //Expl: 230 = shift to C40, "91 11" = "AIM",
    //"11 9" = "�" = "Shift 2, UpperShift, <char>
    //"else" case

    visualized = encodeHighLevel('AIMAIMAIMë');
    assertEquals(visualized, '230 91 11 91 11 91 11 254 235 108'); //Activate when additional rectangulars are available
    //Expl: 230 = shift to C40, "91 11" = "AIM",
    //"�" in C40 encodes to: 1 30 2 11 which doesn't fit into a triplet
    //"10 243" =
    //254 = unlatch, 235 = Upper Shift, 108 = � = 0xEB/235 - 128 + 1
    //"else" case
  });

  it('testC40EncodingSpecExample', () => {
    //Example in Figure 1 in the spec
    let visualized = encodeHighLevel('A1B2C3D4E5F6G7H8I9J0K1L2');
    assertEquals(
      visualized,
      '230 88 88 40 8 107 147 59 67 126 206 78 126 144 121 35 47 254'
    );
  });

  it('testC40EncodingSpecialCases2', () => {
    let visualized = encodeHighLevel('AIMAIMAIMAIMAIMAIMAI');
    assertEquals(
      visualized,
      '230 91 11 91 11 91 11 91 11 91 11 91 11 254 66 74'
    );
    //available > 2, rest = 2 --> unlatch and encode as ASCII
  });

  it('testTextEncoding', () => {
    let visualized = encodeHighLevel('aimaimaim');
    assertEquals(visualized, '239 91 11 91 11 91 11 254');
    //239 shifts to Text encodation, 254 unlatches

    visualized = encodeHighLevel("aimaimaim'");
    assertEquals(visualized, '239 91 11 91 11 91 11 254 40 129');
    //assertEquals("239 91 11 91 11 91 11 7 49 254", visualized);
    //This is an alternative, but doesn't strictly follow the rules in the spec.

    visualized = encodeHighLevel('aimaimaIm');
    assertEquals(visualized, '239 91 11 91 11 87 218 110');

    visualized = encodeHighLevel('aimaimaimB');
    assertEquals(visualized, '239 91 11 91 11 91 11 254 67 129');

    visualized = encodeHighLevel('aimaimaim{txt}\u0004');
    assertEquals(
      visualized,
      '239 91 11 91 11 91 11 16 218 236 107 181 69 254 129 237'
    );
  });

  it('testX12Encoding', () => {
    //238 shifts to X12 encodation, 254 unlatches
    let visualized = encodeHighLevel('ABC>ABC123>AB');
    assertEquals(visualized, '238 89 233 14 192 100 207 44 31 67');

    visualized = encodeHighLevel('ABC>ABC123>ABC');
    assertEquals(visualized, '238 89 233 14 192 100 207 44 31 254 67 68');

    visualized = encodeHighLevel('ABC>ABC123>ABCD');
    assertEquals(visualized, '238 89 233 14 192 100 207 44 31 96 82 254');

    visualized = encodeHighLevel('ABC>ABC123>ABCDE');
    assertEquals(visualized, '238 89 233 14 192 100 207 44 31 96 82 70');

    visualized = encodeHighLevel('ABC>ABC123>ABCDEF');
    assertEquals(
      visualized,
      '238 89 233 14 192 100 207 44 31 96 82 254 70 71 129 237'
    );
  });

  it('testEdifactEncoding', () => {
    //240 shifts to EDIFACT encodation
    let visualized = encodeHighLevel('.A.C1.3.DATA.123DATA.123DATA');
    assertEquals(
      visualized,
      '240 184 27 131 198 236 238 16 21 1 187 28 179 16 21 1 187 28 179 16 21 1'
    );

    visualized = encodeHighLevel('.A.C1.3.X.X2..');
    assertEquals(visualized, '240 184 27 131 198 236 238 98 230 50 47 47');

    visualized = encodeHighLevel('.A.C1.3.X.X2.');
    assertEquals(visualized, '240 184 27 131 198 236 238 98 230 50 47 129');

    visualized = encodeHighLevel('.A.C1.3.X.X2');
    assertEquals(visualized, '240 184 27 131 198 236 238 98 230 50');

    visualized = encodeHighLevel('.A.C1.3.X.X');
    assertEquals(visualized, '240 184 27 131 198 236 238 98 230 31');

    visualized = encodeHighLevel('.A.C1.3.X.');
    assertEquals(visualized, '240 184 27 131 198 236 238 98 231 192');

    visualized = encodeHighLevel('.A.C1.3.X');
    assertEquals(visualized, '240 184 27 131 198 236 238 89');

    //Checking temporary unlatch from EDIFACT
    visualized = encodeHighLevel(
      '.XXX.XXX.XXX.XXX.XXX.XXX.üXX.XXX.XXX.XXX.XXX.XXX.XXX'
    );
    assertEquals(
      visualized,
      '240 185 134 24 185 134 24 185 134 24 185 134 24 185 134 24 185 134 24' +
        ' 124 47 235 125 240' + //<-- this is the temporary unlatch
        ' 97 139 152 97 139 152 97 139 152 97 139 152 97 139 152 97 139 152 89 89'
    );
  });

  it('testBase256Encoding', () => {
    //231 shifts to Base256 encodation
    let visualized = encodeHighLevel('\u00ABäöüé\u00BB');
    assertEquals(visualized, '231 44 108 59 226 126 1 104');
    visualized = encodeHighLevel('\u00ABäöüéà\u00BB');
    assertEquals(visualized, '231 51 108 59 226 126 1 141 254 129');
    visualized = encodeHighLevel('\u00ABäöüéàá\u00BB');
    assertEquals(visualized, '231 44 108 59 226 126 1 141 36 147');

    visualized = encodeHighLevel(' 23£'); //ASCII only (for reference)
    assertEquals(visualized, '33 153 235 36 129');

    visualized = encodeHighLevel('\u00ABäöüé\u00BB 234'); //Mixed Base256 + ASCII
    assertEquals(visualized, '231 50 108 59 226 126 1 104 33 153 53 129');

    visualized = encodeHighLevel('\u00ABäöüé\u00BB 23£ 1234567890123456789');
    assertEquals(
      visualized,
      '231 54 108 59 226 126 1 104 99 10 161 167 33 142 164 186 208' +
        ' 220 142 164 186 208 58 129 59 209 104 254 150 45'
    );

    visualized = encodeHighLevel(createBinaryMessage(20));
    assertEquals(
      visualized,
      '231 44 108 59 226 126 1 141 36 5 37 187 80 230 123 17 166 60 210 103 253 150'
    );
    visualized = encodeHighLevel(createBinaryMessage(19)); //padding necessary at the end
    assertEquals(
      visualized,
      '231 63 108 59 226 126 1 141 36 5 37 187 80 230 123 17 166 60 210 103 1 129'
    );

    //TODO
    visualized = encodeHighLevel(createBinaryMessage(276));

    assertStartsWith(visualized, '231 38 219 2 208 120 20 150 35');
    assertEndsWith(visualized, '146 40 194 129');

    visualized = encodeHighLevel(createBinaryMessage(277));
    assertStartsWith(visualized, '231 38 220 2 208 120 20 150 35');
    assertEndsWith(visualized, '146 40 190 87');
  });

  it('testUnlatchingFromC40', () => {
    let visualized = encodeHighLevel('AIMAIMAIMAIMaimaimaim');
    assertEquals(
      visualized,
      '230 91 11 91 11 91 11 254 66 74 78 239 91 11 91 11 91 11'
    );
  });

  it('testUnlatchingFromText', () => {
    let visualized = encodeHighLevel('aimaimaimaim12345678');
    assertEquals(
      visualized,
      '239 91 11 91 11 91 11 91 11 254 142 164 186 208 129 237'
    );
  });

  it('testHelloWorld', () => {
    let visualized = encodeHighLevel('Hello World!');
    assertEquals(visualized, '73 239 116 130 175 123 148 64 158 233 254 34');
  });

  it('testBug1664266', () => {
    //There was an exception and the encoder did not handle the unlatching from
    //EDIFACT encoding correctly
    let visualized = encodeHighLevel('CREX-TAN:h');
    assertEquals(visualized, '68 83 70 89 46 85 66 79 59 105');

    visualized = encodeHighLevel('CREX-TAN:hh');
    assertEquals(visualized, '68 83 70 89 46 85 66 79 59 105 105 129');

    visualized = encodeHighLevel('CREX-TAN:hhh');
    assertEquals(visualized, '68 83 70 89 46 85 66 79 59 105 105 105');
  });

  it('testX12Unlatch', () => {
    let visualized = encodeHighLevel('*DTCP01');
    assertEquals(visualized, '43 69 85 68 81 131 129 56');
  });

  it('testX12Unlatch2', () => {
    let visualized = encodeHighLevel('*DTCP0');
    assertEquals(visualized, '238 9 10 104 141');
  });

  it('testBug3048549', () => {
    //There was an IllegalArgumentException for an illegal character here because
    //of an encoding problem of the character 0x0060 in Java source code.
    let visualized = encodeHighLevel('fiykmj*Rh2`,e6');
    assertEquals(
      visualized,
      '239 122 87 154 40 7 171 115 207 12 130 71 155 254 129 237'
    );
  });

  it('testMacroCharacters', () => {
    let visualized = encodeHighLevel(
      '[)>\u001E05\u001D5555\u001C6666\u001E\u0004'
    );
    //assertEquals("92 42 63 31 135 30 185 185 29 196 196 31 5 129 87 237", visualized);
    assertEquals(visualized, '236 185 185 29 196 196 129 56');
  });

  //TODO
  /*it("testEncodingWithStartAsX12AndLatchToEDIFACTInTheMiddle", () => {
    let visualized = encodeHighLevel("*MEMANT-1F-MESTECH");
    assertEquals(visualized, 
      "240 168 209 77 4 229 45 196 107 77 21 53 5 12 135 192"
    );
  });*/

  //TODO
  it('testX12AndEDIFACTSpecErrors', () => {
    //X12 encoding error with spec conform float point comparisons in lookAheadTest()
    /*let visualized = encodeHighLevel(
      "AAAAAAAAAAA**\u00FCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    );
    assertEquals(visualized, 
      "230 89 191 89 191 89 191 89 178 56 114 10 243 177 63 89 191 89 191 89 191 89 191 89 191 89 191 89 191 89 191 89 191 254 66 129"
    );*/
    //X12 encoding error with integer comparisons in lookAheadTest()
    let visualized = encodeHighLevel(
      'AAAAAAAAAAAA0+****AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    assertEquals(
      visualized,
      '238 89 191 89 191 89 191 89 191 254 240 194 186 170 170 160 65 4 16 65 4 16 65 4 16 65 4 16 65 4 ' +
        '16 65 4 16 65 4 16 65 124 129 167 62 212 107'
    );
    //EDIFACT encoding error with spec conform float point comparisons in lookAheadTest()
    visualized = encodeHighLevel(
      'AAAAAAAAAAA++++\u00FCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    assertEquals(
      visualized,
      '230 89 191 89 191 89 191 254 66 66 44 44 44 44 235 125 230 89 191 89 191 89 191 89 191 89 191 89 ' +
        '191 89 191 89 191 89 191 89 191 254 129 17 167 62 212 107'
    );
    //EDIFACT encoding error with integer comparisons in lookAheadTest()
    visualized = encodeHighLevel(
      '++++++++++AAa0 0++++++++++++++++++++++++++++++'
    );
    assertEquals(
      visualized,
      '240 174 186 235 174 186 235 174 176 65 124 98 240 194 12 43 174 186 235 174 186 235 174 186 235 ' +
        '174 186 235 174 186 235 174 186 235 174 186 235 173 240 129 167 62 212 107'
    );
    visualized = encodeHighLevel(
      'AAAAAAAAAAAA*+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    assertEquals(
      visualized,
      '230 89 191 89 191 89 191 89 191 7 170 64 191 89 191 89 191 89 191 89 191 89 191 89 191 89 191 89 ' +
        '191 89 191 66'
    );
    visualized = encodeHighLevel(
      'AAAAAAAAAAA*0a0 *AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    assertEquals(
      visualized,
      '230 89 191 89 191 89 191 89 178 56 227 6 228 7 183 89 191 89 191 89 191 89 191 89 191 89 191 89 ' +
        '191 89 191 89 191 254 66 66'
    );
  });
});
