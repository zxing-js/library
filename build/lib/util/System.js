"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var System = (function () {
    function System() {
    }
    //public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    System.arraycopy = function (src, srcPos, dest, destPos, length) {
        var i = srcPos;
        var j = destPos;
        var c = length;
        while (c--) {
            dest[j++] = src[i++];
        }
    };
    System.currentTimeMillis = function () {
        return Date.now();
    };
    return System;
}());
exports.default = System;
//# sourceMappingURL=System.js.map