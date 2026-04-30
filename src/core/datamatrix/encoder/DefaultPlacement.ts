import Arrays from '../../util/Arrays';

/**
 * Symbol Character Placement Program. Adapted from Annex M.1 in ISO/IEC 16022:2000(E).
 */
class DefaultPlacement {
  private bits: Uint8Array;

  /**
   * Main constructor
   *
   * @param codewords the codewords to place
   * @param numcols   the number of columns
   * @param numrows   the number of rows
   */
  constructor(
    private readonly codewords: string,
    private readonly numcols: number,
    private readonly numrows: number
  ) {
    this.bits = new Uint8Array(numcols * numrows);
    Arrays.fill(this.bits, 2); // Initialize with "not set" value
  }

  getNumrows() {
    return this.numrows;
  }

  getNumcols() {
    return this.numcols;
  }

  getBits() {
    return this.bits;
  }

  public getBit(col: number, row: number): boolean {
    return this.bits[row * this.numcols + col] === 1;
  }

  private setBit(col: number, row: number, bit: boolean): void {
    this.bits[row * this.numcols + col] = bit ? 1 : 0;
  }

  private noBit(col: number, row: number): boolean {
    return this.bits[row * this.numcols + col] === 2;
  }

  public place(): void {
    let pos = 0;
    let row = 4;
    let col = 0;

    do {
      // repeatedly first check for one of the special corner cases, then...
      if (row === this.numrows && col === 0) {
        this.corner1(pos++);
      }
      if (row === this.numrows - 2 && col === 0 && this.numcols % 4 !== 0) {
        this.corner2(pos++);
      }
      if (row === this.numrows - 2 && col === 0 && this.numcols % 8 === 4) {
        this.corner3(pos++);
      }
      if (row === this.numrows + 4 && col === 2 && this.numcols % 8 === 0) {
        this.corner4(pos++);
      }
      // sweep upward diagonally, inserting successive characters...
      do {
        if (row < this.numrows && col >= 0 && this.noBit(col, row)) {
          this.utah(row, col, pos++);
        }
        row -= 2;
        col += 2;
      } while (row >= 0 && col < this.numcols);
      row++;
      col += 3;

      // and then sweep downward diagonally, inserting successive characters, ...
      do {
        if (row >= 0 && col < this.numcols && this.noBit(col, row)) {
          this.utah(row, col, pos++);
        }
        row += 2;
        col -= 2;
      } while (row < this.numrows && col >= 0);
      row += 3;
      col++;

      // ...until the entire array is scanned
    } while (row < this.numrows || col < this.numcols);

    // Lastly, if the lower right-hand corner is untouched, fill in fixed pattern
    if (this.noBit(this.numcols - 1, this.numrows - 1)) {
      this.setBit(this.numcols - 1, this.numrows - 1, true);
      this.setBit(this.numcols - 2, this.numrows - 2, true);
    }
  }

  private module(row: number, col: number, pos: number, bit: number): void {
    if (row < 0) {
      row += this.numrows;
      col += 4 - ((this.numrows + 4) % 8);
    }
    if (col < 0) {
      col += this.numcols;
      row += 4 - ((this.numcols + 4) % 8);
    }
    // Note the conversion:
    let v = this.codewords.charCodeAt(pos);
    v &= 1 << (8 - bit);
    this.setBit(col, row, v !== 0);
  }

  /**
   * Places the 8 bits of a utah-shaped symbol character in ECC200.
   *
   * @param row the row
   * @param col the column
   * @param pos character position
   */
  private utah(row: number, col: number, pos: number): void {
    this.module(row - 2, col - 2, pos, 1);
    this.module(row - 2, col - 1, pos, 2);
    this.module(row - 1, col - 2, pos, 3);
    this.module(row - 1, col - 1, pos, 4);
    this.module(row - 1, col, pos, 5);
    this.module(row, col - 2, pos, 6);
    this.module(row, col - 1, pos, 7);
    this.module(row, col, pos, 8);
  }

  private corner1(pos: number): void {
    this.module(this.numrows - 1, 0, pos, 1);
    this.module(this.numrows - 1, 1, pos, 2);
    this.module(this.numrows - 1, 2, pos, 3);
    this.module(0, this.numcols - 2, pos, 4);
    this.module(0, this.numcols - 1, pos, 5);
    this.module(1, this.numcols - 1, pos, 6);
    this.module(2, this.numcols - 1, pos, 7);
    this.module(3, this.numcols - 1, pos, 8);
  }

  private corner2(pos: number): void {
    this.module(this.numrows - 3, 0, pos, 1);
    this.module(this.numrows - 2, 0, pos, 2);
    this.module(this.numrows - 1, 0, pos, 3);
    this.module(0, this.numcols - 4, pos, 4);
    this.module(0, this.numcols - 3, pos, 5);
    this.module(0, this.numcols - 2, pos, 6);
    this.module(0, this.numcols - 1, pos, 7);
    this.module(1, this.numcols - 1, pos, 8);
  }

  private corner3(pos: number): void {
    this.module(this.numrows - 3, 0, pos, 1);
    this.module(this.numrows - 2, 0, pos, 2);
    this.module(this.numrows - 1, 0, pos, 3);
    this.module(0, this.numcols - 2, pos, 4);
    this.module(0, this.numcols - 1, pos, 5);
    this.module(1, this.numcols - 1, pos, 6);
    this.module(2, this.numcols - 1, pos, 7);
    this.module(3, this.numcols - 1, pos, 8);
  }

  private corner4(pos: number): void {
    this.module(this.numrows - 1, 0, pos, 1);
    this.module(this.numrows - 1, this.numcols - 1, pos, 2);
    this.module(0, this.numcols - 3, pos, 3);
    this.module(0, this.numcols - 2, pos, 4);
    this.module(0, this.numcols - 1, pos, 5);
    this.module(1, this.numcols - 3, pos, 6);
    this.module(1, this.numcols - 2, pos, 7);
    this.module(1, this.numcols - 1, pos, 8);
  }
}

export default DefaultPlacement;
