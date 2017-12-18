/**
 * <p>Encapsulates the parameters for one error-correction block in one symbol version.
 * This includes the number of data codewords, and the number of times a block with these
 * parameters is used consecutively in the QR code version's format.</p>
 */
export default class ECB {
    private count: number; /*int*/
    private dataCodewords: number; /*int*/

    public constructor(count: number /*int*/, dataCodewords: number /*int*/) {
        this.count = count;
        this.dataCodewords = dataCodewords;
    }

    public getCount(): number /*int*/ {
        return this.count;
    }

    public getDataCodewords(): number /*int*/ {
        return this.dataCodewords;
    }
}
