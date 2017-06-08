export default class Arrays {
    public static equals(first: any, second: any): boolean {
        if (!first) {
            return false
        }
        if (!second) {
            return false
        }
        if (!first.length) {
            return false
        }
        if (!second.length) {
            return false
        }
        if (first.length !== second.length) {
            return false
        }
        for (let i = 0, length = first.length; i < length; i++) {
            if (first[i] !== second[i]) {
                return false
            }
        }
        return true
    }

    public static hashCode(a: any) {
        if (a === null) {
            return 0
        }
        let result = 1
        for (const element of a) {
            result = 31 * result + element
        }
        return result
    }

    public static fillUint8Array(a: Uint8Array, value: number) {
        for(let i = 0; i != a.length; i++) {
            a[i] = value
        }
    }
}