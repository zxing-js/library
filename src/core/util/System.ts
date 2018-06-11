export default class System {

    // public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    /**
     * Makes a copy of a array.
     */
    public static arraycopy(src: any, srcPos: number, dest: any, destPos: number, length: number): void {
        // TODO: better use split or set?
        while (length--) {
            dest[destPos++] = src[srcPos++];
        }
    }

    /**
     * Returns the current time in milliseconds.
     */
    public static currentTimeMillis(): number {
        return Date.now();
    }
}
