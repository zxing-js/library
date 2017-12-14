export default class AssertUtils {
    public static typedArraysAreEqual(left: Int32Array | Uint8ClampedArray, right: Int32Array | Uint8ClampedArray, size?: number): boolean {
        if (undefined === size) {
            size = Math.max(left.length, right.length);
        }
        for (let i = 0; i < size; i++) {
            if (left[i] !== right[i]) {
                return false;
            }
        }
        return true;
    }
}
