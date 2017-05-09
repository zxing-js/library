"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var text_encoding_1 = require("text-encoding");
var StringEncoding = (function () {
    function StringEncoding() {
    }
    StringEncoding.decode = function (bytes, encoding) {
        return new text_encoding_1.TextDecoder(encoding).decode(bytes);
    };
    StringEncoding.encode = function (s, encoding) {
        return new TextEncoder(encoding).encode(s);
    };
    StringEncoding.getDigit = function (singleCharacter) {
        return singleCharacter.charCodeAt(0) - 48;
    };
    StringEncoding.isDigit = function (singleCharacter) {
        var cn = StringEncoding.getDigit(singleCharacter);
        return cn >= 0 && cn <= 9;
    };
    return StringEncoding;
}());
exports.default = StringEncoding;
//# sourceMappingURL=StringEncoding.js.map