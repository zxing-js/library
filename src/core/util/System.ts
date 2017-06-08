export default class System {
    //public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    public static arraycopy(src: any, srcPos: number, dest: any, destPos: number, length: number) {
        // TODO: better use split or set?
        let i = srcPos
        let j = destPos
        let c = length
        while(c--) { 
            dest[j++] = src[i++]
        }
    }

    public static currentTimeMillis() {
        return Date.now()
    }
}