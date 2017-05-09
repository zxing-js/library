"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
var ECBlocks = (function () {
    function ECBlocks(ecCodewordsPerBlock /*int*/) {
        var ecBlocks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            ecBlocks[_i - 1] = arguments[_i];
        }
        this.ecCodewordsPerBlock = ecCodewordsPerBlock; /*int*/
        this.ecBlocks = ecBlocks;
    }
    ECBlocks.prototype.getECCodewordsPerBlock = function () {
        return this.ecCodewordsPerBlock;
    };
    ECBlocks.prototype.getNumBlocks = function () {
        var total = 0;
        var ecBlocks = this.ecBlocks;
        for (var _i = 0, ecBlocks_1 = ecBlocks; _i < ecBlocks_1.length; _i++) {
            var ecBlock = ecBlocks_1[_i];
            total += ecBlock.getCount();
        }
        return total;
    };
    ECBlocks.prototype.getTotalECCodewords = function () {
        return this.ecCodewordsPerBlock * this.getNumBlocks();
    };
    ECBlocks.prototype.getECBlocks = function () {
        return this.ecBlocks;
    };
    return ECBlocks;
}());
exports.default = ECBlocks;
//# sourceMappingURL=ECBlocks.js.map