/**
 * Java Formatter class polyfill that works in the JS way.
 */
export default class Formatter {

  /**
   * The internal formatted value.
   */
  buffer: string;

  constructor() {
    this.buffer = '';
  }

  /**
   *
   * @see https://stackoverflow.com/a/13439711/4367683
   *
   * @param str
   * @param arr
   */
  private static form(str: string, arr: any[]) {

    let i = -1;

    function callback(exp: string | number, p0: any, p1: any, p2: any, p3: any, p4: any) {

      if (exp === '%%') return '%';
      if (arr[++i] === undefined) return undefined;

      exp = p2 ? parseInt(p2.substr(1)) : undefined;

      let base = p3 ? parseInt(p3.substr(1)) : undefined;
      let val: string;

      switch (p4) {
        case 's': val = arr[i]; break;
        case 'c': val = arr[i][0]; break;
        case 'f': val = parseFloat(arr[i]).toFixed(exp); break;
        case 'p': val = parseFloat(arr[i]).toPrecision(exp); break;
        case 'e': val = parseFloat(arr[i]).toExponential(exp); break;
        case 'x': val = parseInt(arr[i]).toString(base ? base : 16); break;
        case 'd': val = parseFloat(parseInt(arr[i], base ? base : 10).toPrecision(exp)).toFixed(0); break;
      }

      val = typeof val === 'object' ? JSON.stringify(val) : (+val).toString(base);
      let size = parseInt(p1); /* padding size */
      let ch = p1 && (p1[0] + '') === '0' ? '0' : ' '; /* isnull? */

      while (val.length < size) val = p0 !== undefined ? val + ch : ch + val; /* isminus? */

      return val;
    }

    let regex = /%(-)?(0?[0-9]+)?([.][0-9]+)?([#][0-9]+)?([scfpexd%])/g;

    return str.replace(regex, callback);
  }

  /**
   *
   * @param append The new string to append.
   * @param args Argumets values to be formated.
   */
  format(append: string, ...args: any) {
    this.buffer += Formatter.form(append, args);
  }

  /**
   * Returns the Formatter string value.
   */
  toString(): string {
    return this.buffer;
  }
}
