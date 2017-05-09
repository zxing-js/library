"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringBuilder = (function () {
    function StringBuilder(value) {
        if (value === void 0) { value = ""; }
        this.value = value;
    }
    StringBuilder.prototype.append = function (s) {
        this.value += s;
        return this;
    };
    StringBuilder.prototype.length = function () {
        return this.value.length;
    };
    StringBuilder.prototype.charAt = function (n) {
        return this.value.charAt(n);
    };
    StringBuilder.prototype.deleteCharAt = function (n) {
        this.value = this.value.substr(0, n) + this.value.substring(n + 1);
    };
    StringBuilder.prototype.setCharAt = function (n, c) {
        this.value = this.value.substr(0, n) + c + this.value.substr(n + 1);
    };
    StringBuilder.prototype.toString = function () {
        return this.value;
    };
    return StringBuilder;
}());
exports.default = StringBuilder;
//# sourceMappingURL=StringBuilder.js.map