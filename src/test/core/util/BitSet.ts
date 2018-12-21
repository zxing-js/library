// @note Extending Map is not supported by TypeScript at the time of writing.

type BitSet = Map<number, boolean>;

export default BitSet;

// export default class BitSet extends Map<number, boolean> {
//   constructor(size: number) {
//     super();
//   }

//   /**
//    * Sets the bit at the specified index to true.
//    * Sets the bit at the specified index to the specified value.
//    */
//   set(bitIndex: number/*int*/, value: boolean = true): this {
//     return super.set(bitIndex, value);
//   }

//   // Sets the bits from the specified fromIndex (inclusive) to the specified toIndex (exclusive) to true.
//   // void set(int fromIndex, int toIndex)
//   // set(int fromIndex, int toIndex, boolean value):void {}
//   // Sets the bits from the specified fromIndex (inclusive) to the specified toIndex (exclusive) to the specified value.
// }
