"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Exception = (function () {
    function Exception(type, message) {
        this.type = type;
        this.message = message;
    }
    Exception.prototype.getType = function () {
        return this.type;
    };
    Exception.prototype.getMessage = function () {
        return this.message;
    };
    return Exception;
}());
exports.default = Exception;
//# sourceMappingURL=Exception.js.map