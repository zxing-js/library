/**
 * Lookup table which factors to use for which number of error correction codewords.
 * See FACTORS.
 */
export const FACTOR_SETS: number[] = [
  5, 7, 10, 11, 12, 14, 18, 20, 24, 28, 36, 42, 48, 56, 62, 68,
];

/**
 * Precomputed polynomial factors for ECC 200.
 */
export const FACTORS: number[][] = [
  [228, 48, 15, 111, 62],
  [23, 68, 144, 134, 240, 92, 254],
  [28, 24, 185, 166, 223, 248, 116, 255, 110, 61],
  [175, 138, 205, 12, 194, 168, 39, 245, 60, 97, 120],
  [41, 153, 158, 91, 61, 42, 142, 213, 97, 178, 100, 242],
  [156, 97, 192, 252, 95, 9, 157, 119, 138, 45, 18, 186, 83, 185],
  [
    83, 195, 100, 39, 188, 75, 66, 61, 241, 213, 109, 129, 94, 254, 225, 48, 90,
    188,
  ],
  [
    15, 195, 244, 9, 233, 71, 168, 2, 188, 160, 153, 145, 253, 79, 108, 82, 27,
    174, 186, 172,
  ],
  [
    52, 190, 88, 205, 109, 39, 176, 21, 155, 197, 251, 223, 155, 21, 5, 172,
    254, 124, 12, 181, 184, 96, 50, 193,
  ],
  [
    211, 231, 43, 97, 71, 96, 103, 174, 37, 151, 170, 53, 75, 34, 249, 121, 17,
    138, 110, 213, 141, 136, 120, 151, 233, 168, 93, 255,
  ],
  [
    245, 127, 242, 218, 130, 250, 162, 181, 102, 120, 84, 179, 220, 251, 80,
    182, 229, 18, 2, 4, 68, 33, 101, 137, 95, 119, 115, 44, 175, 184, 59, 25,
    225, 98, 81, 112,
  ],
  [
    77, 193, 137, 31, 19, 38, 22, 153, 247, 105, 122, 2, 245, 133, 242, 8, 175,
    95, 100, 9, 167, 105, 214, 111, 57, 121, 21, 1, 253, 57, 54, 101, 248, 202,
    69, 50, 150, 177, 226, 5, 9, 5,
  ],
  [
    245, 132, 172, 223, 96, 32, 117, 22, 238, 133, 238, 231, 205, 188, 237, 87,
    191, 106, 16, 147, 118, 23, 37, 90, 170, 205, 131, 88, 120, 100, 66, 138,
    186, 240, 82, 44, 176, 87, 187, 147, 160, 175, 69, 213, 92, 253, 225, 19,
  ],
  [
    175, 9, 223, 238, 12, 17, 220, 208, 100, 29, 175, 170, 230, 192, 215, 235,
    150, 159, 36, 223, 38, 200, 132, 54, 228, 146, 218, 234, 117, 203, 29, 232,
    144, 238, 22, 150, 201, 117, 62, 207, 164, 13, 137, 245, 127, 67, 247, 28,
    155, 43, 203, 107, 233, 53, 143, 46,
  ],
  [
    242, 93, 169, 50, 144, 210, 39, 118, 202, 188, 201, 189, 143, 108, 196, 37,
    185, 112, 134, 230, 245, 63, 197, 190, 250, 106, 185, 221, 175, 64, 114, 71,
    161, 44, 147, 6, 27, 218, 51, 63, 87, 10, 40, 130, 188, 17, 163, 31, 176,
    170, 4, 107, 232, 7, 94, 166, 224, 124, 86, 47, 11, 204,
  ],
  [
    220, 228, 173, 89, 251, 149, 159, 56, 89, 33, 147, 244, 154, 36, 73, 127,
    213, 136, 248, 180, 234, 197, 158, 177, 68, 122, 93, 213, 15, 160, 227, 236,
    66, 139, 153, 185, 202, 167, 179, 25, 220, 232, 96, 210, 231, 136, 223, 239,
    181, 241, 59, 52, 172, 25, 49, 232, 211, 189, 64, 54, 108, 153, 132, 63, 96,
    103, 82, 186,
  ],
];

export const /*final*/ MODULO_VALUE: number = 0x12d;

const static_LOG = (LOG: number[], ALOG: number[]) => {
  let p = 1;

  for (let i = 0; i < 255; i++) {
    ALOG[i] = p;
    LOG[p] = i;
    p *= 2;
    if (p >= 256) {
      p ^= MODULO_VALUE;
    }
  }

  return {
    LOG,
    ALOG,
  };
};

export const { LOG, ALOG } = static_LOG([], []);

export const enum SymbolShapeHint {
  FORCE_NONE,
  FORCE_SQUARE,
  FORCE_RECTANGLE,
}

/**
 * Padding character
 */
export const PAD = 129;
/**
 * mode latch to C40 encodation mode
 */
export const LATCH_TO_C40 = 230;
/**
 * mode latch to Base 256 encodation mode
 */
export const LATCH_TO_BASE256 = 231;
/**
 * FNC1 Codeword
 */
// private static FNC1 = 232;
/**
 * Structured Append Codeword
 */
// private static STRUCTURED_APPEND = 233;
/**
 * Reader Programming
 */
// private static READER_PROGRAMMING = 234;
/**
 * Upper Shift
 */
export const UPPER_SHIFT = 235;
/**
 * 05 Macro
 */
export const MACRO_05 = 236;
/**
 * 06 Macro
 */
export const MACRO_06 = 237;
/**
 * mode latch to ANSI X.12 encodation mode
 */
export const LATCH_TO_ANSIX12 = 238;
/**
 * mode latch to Text encodation mode
 */
export const LATCH_TO_TEXT = 239;
/**
 * mode latch to EDIFACT encodation mode
 */
export const LATCH_TO_EDIFACT = 240;
/**
 * ECI character (Extended Channel Interpretation)
 */
// private export const ECI = 241;

/**
 * Unlatch from C40 encodation
 */
export const C40_UNLATCH = 254;
/**
 * Unlatch from X12 encodation
 */
export const X12_UNLATCH = 254;

/**
 * 05 Macro header
 */
export const MACRO_05_HEADER = '[)>\u001E05\u001D';
/**
 * 06 Macro header
 */
export const MACRO_06_HEADER = '[)>\u001E06\u001D';
/**
 * Macro trailer
 */
export const MACRO_TRAILER = '\u001E\u0004';

export const ASCII_ENCODATION = 0;
export const C40_ENCODATION = 1;
export const TEXT_ENCODATION = 2;
export const X12_ENCODATION = 3;
export const EDIFACT_ENCODATION = 4;
export const BASE256_ENCODATION = 5;
