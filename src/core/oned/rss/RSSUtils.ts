/**
 * RSS util functions.
 */
export default class RSSUtils {

  private constructor() { }

  public static getRSSvalue(widths: number[], maxWidth: number, noNarrow: boolean): number {
    let n = 0;
    for (let width of widths) {
      n += width;
    }
    let val = 0;
    let narrowMask = 0;
    let elements = widths.length;
    for (let bar = 0; bar < elements - 1; bar++) {
      let elmWidth: number;
      for (elmWidth = 1, narrowMask |= 1 << bar; elmWidth < widths[bar]; elmWidth++ , narrowMask &= ~(1 << bar)) {
        let subVal = RSSUtils.combins(n - elmWidth - 1, elements - bar - 2);
        if (noNarrow && (narrowMask === 0) && (n - elmWidth - (elements - bar - 1) >= elements - bar - 1)) {
          subVal -= RSSUtils.combins(n - elmWidth - (elements - bar), elements - bar - 2);
        }
        if (elements - bar - 1 > 1) {
          let lessVal = 0;
          for (let mxwElement = n - elmWidth - (elements - bar - 2); mxwElement > maxWidth; mxwElement--) {
            lessVal += RSSUtils.combins(n - elmWidth - mxwElement - 1, elements - bar - 3);
          }
          subVal -= lessVal * (elements - 1 - bar);
        } else if (n - elmWidth > maxWidth) {
          subVal--;
        }
        val += subVal;
      }
      n -= elmWidth;
    }
    return val;
  }

  private static combins(n: number /* int */, r: number /* int */): number /* int */ {
    let maxDenom /* int */ = 0;
    let minDenom /* int */ = 0;
    if (n - r > r) {
      minDenom = r;
      maxDenom = n - r;
    } else {
      minDenom = n - r;
      maxDenom = r;
    }
    let val /* int */ = 1;
    let j /* int */ = 1;
    for (let i = n; i > maxDenom; i--) {
      val *= i;
      if (j <= minDenom) {
        val = Math.trunc(val / j);
        j++;
      }
    }
    while (j <= minDenom) {
      val = Math.trunc(val / j);
      j++;
    }
    return val;
  }
}
