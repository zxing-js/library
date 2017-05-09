"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * <p>Encapsulates the parameters for one error-correction block in one symbol version.
 * This includes the number of data codewords, and the number of times a block with these
 * parameters is used consecutively in the QR code version's format.</p>
 */
var ECB = (function () {
    function ECB(count /*int*/, dataCodewords /*int*/) {
        this.count = count;
        this.dataCodewords = dataCodewords;
    }
    ECB.prototype.getCount = function () {
        return this.count;
    };
    ECB.prototype.getDataCodewords = function () {
        return this.dataCodewords;
    };
    return ECB;
}());
exports.default = ECB;
//# sourceMappingURL=ECB.js.map