/** Used to determine how to calculate luminance from a given source. In JavaScript `0xFF` is identical to `255`. */
enum ColorFormat {
  /** Luminance represented as a hexadecimal in the range `0x00 - 0xFF`. */
  Luminance,
  /** Color is formatted as `[R, G, B]` where numeric range is `0x00 - 0xFF`. */
  RGBMatrix,
  /** Color is formatted as `[R, G, B, A]` where numeric range is `0x00 - 0xFF`. */
  RGBAMatrix,
  /** Color is formatted as `0xRRGGBB` where hexadecimal range is `0x00 - 0xFF`. */
  RGBHex,
  /** Color is formatted as `0xAARRGGBB` where hexadecimal range is `0x00 - 0xFF`. */
  RGBAStartHex,
  /** Color is formatted as `0xRRGGBBAA` where hexadecimal range is `0x00 - 0xFF`. */
  RGBAEndHex,
  /** Color is formatted as `[H, S, L]` where numeric range of L is `0 - 100`. */
  HSLMatrix,
  /** Color is formatted as `[H, S, L, A]` where numeric range of L is `0 - 100`. */
  HSLAMatrix,
}

export default ColorFormat;