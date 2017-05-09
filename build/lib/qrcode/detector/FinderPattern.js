"use strict";
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.qrcode.detector {*/
var ResultPoint_1 = require("./../../ResultPoint");
/**
 * <p>Encapsulates a finder pattern, which are the three square patterns found in
 * the corners of QR Codes. It also encapsulates a count of similar finder patterns,
 * as a convenience to the finder's bookkeeping.</p>
 *
 * @author Sean Owen
 */
var FinderPattern = (function (_super) {
    __extends(FinderPattern, _super);
    // FinderPattern(posX: number/*float*/, posY: number/*float*/, estimatedModuleSize: number/*float*/) {
    //   this(posX, posY, estimatedModuleSize, 1)
    // }
    function FinderPattern(posX /*float*/, posY /*float*/, estimatedModuleSize /*float*/, count /*int*/) {
        var _this = _super.call(this, posX, posY) || this;
        _this.estimatedModuleSize = estimatedModuleSize; /*float*/
        _this.count = count; /*int*/
        if (undefined === count) {
            _this.count = 1;
        }
        return _this;
    }
    FinderPattern.prototype.getEstimatedModuleSize = function () {
        return this.estimatedModuleSize;
    };
    FinderPattern.prototype.getCount = function () {
        return this.count;
    };
    /*
    void incrementCount() {
      this.count++
    }
     */
    /**
     * <p>Determines if this finder pattern "about equals" a finder pattern at the stated
     * position and size -- meaning, it is at nearly the same center with nearly the same size.</p>
     */
    FinderPattern.prototype.aboutEquals = function (moduleSize /*float*/, i /*float*/, j /*float*/) {
        if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) <= moduleSize) {
            var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
        }
        return false;
    };
    /**
     * Combines this object's current estimate of a finder pattern position and module size
     * with a new estimate. It returns a new {@code FinderPattern} containing a weighted average
     * based on count.
     */
    FinderPattern.prototype.combineEstimate = function (i /*float*/, j /*float*/, newModuleSize /*float*/) {
        var combinedCount = this.count + 1;
        var combinedX = (this.count * this.getX() + j) / combinedCount;
        var combinedY = (this.count * this.getY() + i) / combinedCount;
        var combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
        return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
    };
    return FinderPattern;
}(ResultPoint_1.default));
exports.default = FinderPattern;
//# sourceMappingURL=FinderPattern.js.map