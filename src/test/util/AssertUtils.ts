export default class AssertUtils {
    public static int32ArraysAreEqual(left: Int32Array, right: Int32Array, size?: number): boolean {
        if (undefined === size) {
            size = Math.max(left.length, right.length)
        }
        for (let i = 0; i < size; i++) {
            if (left[i] !== right[i]) {
                return false
            }
        }
        return true
    }
}