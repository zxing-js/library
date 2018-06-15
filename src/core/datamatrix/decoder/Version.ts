
import FormatException from '../../FormatException';

/*
 * Copyright 2007 ZXing authors
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


  /**
   * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
   * use blocks of differing sizes within one version, so, this encapsulates the parameters for
   * each set of blocks. It also holds the number of error-correction codewords per block since it
   * will be the same across all blocks within one version.</p>
   */
  export class ECBlocks {
    private ecCodewords: number;
    private ecBlocks: ECB[];

    constructor(ecCodewords: number, ecBlocks1: ECB, ecBlocks2?: ECB) {
      this.ecCodewords = ecCodewords;
      this.ecBlocks = [ ecBlocks1 ];
      ecBlocks2 && this.ecBlocks.push(ecBlocks2);
    }

    getECCodewords(): number {
      return this.ecCodewords;
    }

    getECBlocks(): ECB[] {
      return this.ecBlocks;
    }
  }

  /**
   * <p>Encapsulates the parameters for one error-correction block in one symbol version.
   * This includes the number of data codewords, and the number of times a block with these
   * parameters is used consecutively in the Data Matrix code version's format.</p>
   */
export class ECB {
    private count: number;
    private dataCodewords: number;

    constructor(count: number, dataCodewords: number) {
      this.count = count;
      this.dataCodewords = dataCodewords;
    }

    getCount(): number {
      return this.count;
    }

    getDataCodewords(): number {
      return this.dataCodewords;
    }
  }

/**
 * The Version object encapsulates attributes about a particular
 * size Data Matrix Code.
 *
 * @author bbrown@google.com (Brian Brown)
 */
export default class Version {

  private static VERSIONS: Version[] = Version.buildVersions();

  private versionNumber: number;
  private symbolSizeRows: number;
  private symbolSizeColumns: number;
  private dataRegionSizeRows: number;
  private dataRegionSizeColumns: number;
  private ecBlocks: ECBlocks;
  private totalCodewords: number;

  constructor(versionNumber,
                  symbolSizeRows,
                  symbolSizeColumns,
                  dataRegionSizeRows,
                  dataRegionSizeColumns,
                  ecBlocks: ECBlocks) {
    this.versionNumber = versionNumber;
    this.symbolSizeRows = symbolSizeRows;
    this.symbolSizeColumns = symbolSizeColumns;
    this.dataRegionSizeRows = dataRegionSizeRows;
    this.dataRegionSizeColumns = dataRegionSizeColumns;
    this.ecBlocks = ecBlocks;

    // Calculate the total number of codewords
    let total = 0;
    const ecCodewords = ecBlocks.getECCodewords();
    const ecbArray = ecBlocks.getECBlocks();
    for (let ecBlock of ecbArray) {
      total += ecBlock.getCount() * (ecBlock.getDataCodewords() + ecCodewords);
    }
    this.totalCodewords = total;
  }

  public getVersionNumber(): number {
    return this.versionNumber;
  }

  public getSymbolSizeRows(): number {
    return this.symbolSizeRows;
  }

  public getSymbolSizeColumns(): number {
    return this.symbolSizeColumns;
  }

  public getDataRegionSizeRows(): number {
    return this.dataRegionSizeRows;
  }

  public getDataRegionSizeColumns(): number {
    return this.dataRegionSizeColumns;
  }

  public getTotalCodewords(): number {
    return this.totalCodewords;
  }

  public getECBlocks(): ECBlocks {
    return this.ecBlocks;
  }

  /**
   * <p>Deduces version information from Data Matrix dimensions.</p>
   *
   * @param numRows Number of rows in modules
   * @param numColumns Number of columns in modules
   * @return Version for a Data Matrix Code of those dimensions
   * @throws FormatException if dimensions do correspond to a valid Data Matrix size
   */
  public static getVersionForDimensions(numRows: number, numColumns: number): Version {
    if ((numRows & 0x01) !== 0 || (numColumns & 0x01) !== 0) {
      throw new FormatException();
    }

    for (let version of Version.VERSIONS) {
      if (version.symbolSizeRows === numRows && version.symbolSizeColumns === numColumns) {
        return version;
      }
    }

    throw new FormatException();
  }

//  @Override
  public toString(): string {
    return '' + this.versionNumber;
  }

  /**
   * See ISO 16022:2006 5.5.1 Table 7
   */
  private static buildVersions(): Version[] {
    return [
        new Version(1, 10, 10, 8, 8,
            new ECBlocks(5, new ECB(1, 3))),
        new Version(2, 12, 12, 10, 10,
            new ECBlocks(7, new ECB(1, 5))),
        new Version(3, 14, 14, 12, 12,
            new ECBlocks(10, new ECB(1, 8))),
        new Version(4, 16, 16, 14, 14,
            new ECBlocks(12, new ECB(1, 12))),
        new Version(5, 18, 18, 16, 16,
            new ECBlocks(14, new ECB(1, 18))),
        new Version(6, 20, 20, 18, 18,
            new ECBlocks(18, new ECB(1, 22))),
        new Version(7, 22, 22, 20, 20,
            new ECBlocks(20, new ECB(1, 30))),
        new Version(8, 24, 24, 22, 22,
            new ECBlocks(24, new ECB(1, 36))),
        new Version(9, 26, 26, 24, 24,
            new ECBlocks(28, new ECB(1, 44))),
        new Version(10, 32, 32, 14, 14,
            new ECBlocks(36, new ECB(1, 62))),
        new Version(11, 36, 36, 16, 16,
            new ECBlocks(42, new ECB(1, 86))),
        new Version(12, 40, 40, 18, 18,
            new ECBlocks(48, new ECB(1, 114))),
        new Version(13, 44, 44, 20, 20,
            new ECBlocks(56, new ECB(1, 144))),
        new Version(14, 48, 48, 22, 22,
            new ECBlocks(68, new ECB(1, 174))),
        new Version(15, 52, 52, 24, 24,
            new ECBlocks(42, new ECB(2, 102))),
        new Version(16, 64, 64, 14, 14,
            new ECBlocks(56, new ECB(2, 140))),
        new Version(17, 72, 72, 16, 16,
            new ECBlocks(36, new ECB(4, 92))),
        new Version(18, 80, 80, 18, 18,
            new ECBlocks(48, new ECB(4, 114))),
        new Version(19, 88, 88, 20, 20,
            new ECBlocks(56, new ECB(4, 144))),
        new Version(20, 96, 96, 22, 22,
            new ECBlocks(68, new ECB(4, 174))),
        new Version(21, 104, 104, 24, 24,
            new ECBlocks(56, new ECB(6, 136))),
        new Version(22, 120, 120, 18, 18,
            new ECBlocks(68, new ECB(6, 175))),
        new Version(23, 132, 132, 20, 20,
            new ECBlocks(62, new ECB(8, 163))),
        new Version(24, 144, 144, 22, 22,
            new ECBlocks(62, new ECB(8, 156), new ECB(2, 155))),
        new Version(25, 8, 18, 6, 16,
            new ECBlocks(7, new ECB(1, 5))),
        new Version(26, 8, 32, 6, 14,
            new ECBlocks(11, new ECB(1, 10))),
        new Version(27, 12, 26, 10, 24,
            new ECBlocks(14, new ECB(1, 16))),
        new Version(28, 12, 36, 10, 16,
            new ECBlocks(18, new ECB(1, 22))),
        new Version(29, 16, 36, 14, 16,
            new ECBlocks(24, new ECB(1, 32))),
        new Version(30, 16, 48, 14, 22,
            new ECBlocks(28, new ECB(1, 49)))
        ];
  }

}
