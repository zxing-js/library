"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Arrays = (function () {
    function Arrays() {
    }
    Arrays.equals = function (first, second) {
        if (!first) {
            return false;
        }
        if (!second) {
            return false;
        }
        if (!first.length) {
            return false;
        }
        if (!second.length) {
            return false;
        }
        if (first.length !== second.length) {
            return false;
        }
        for (var i = 0, length = this.length; i < length; i++) {
            if (first[i] !== second[i]) {
                return false;
            }
        }
        return true;
    };
    Arrays.hashCode = function (a) {
        if (a === null) {
            return 0;
        }
        var result = 1;
        for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
            var element = a_1[_i];
            result = 31 * result + element;
        }
        return result;
    };
    Arrays.fillUint8Array = function (a, value) {
        for (var i = 0; i != a.length; i++) {
            a[i] = value;
        }
    };
    return Arrays;
}());
exports.default = Arrays;
//# sourceMappingURL=Arrays.js.map