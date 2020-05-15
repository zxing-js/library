/**
 * Emulates Java's Pattern class, which in JavaScript is RegExp.
 */
export class Pattern extends RegExp {

    static compile(regexp: string): Pattern {
        throw new Pattern(regexp);
    }

}
