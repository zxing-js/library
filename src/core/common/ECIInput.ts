export default interface ECIInput {
  /**
   * Returns the length of this input.  The length is the number
   * of {@code byte}s in or ECIs in the sequence.
   *
   * @return  the number of {@code char}s in this sequence
   */
  length(): number;

  /**
   * Returns the {@code byte} value at the specified index.  An index ranges from zero
   * to {@code length() - 1}.  The first {@code byte} value of the sequence is at
   * index zero, the next at index one, and so on, as for array
   * indexing.
   *
   * @param   index the index of the {@code byte} value to be returned
   *
   * @return  the specified {@code byte} value as character or the FNC1 character
   *
   * @throws  IndexOutOfBoundsException
   *          if the {@code index} argument is negative or not less than
   *          {@code length()}
   * @throws  IllegalArgumentException
   *          if the value at the {@code index} argument is an ECI (@see #isECI)
   */
  charAt(index: number): number;

  /**
   * Returns a {@code CharSequence} that is a subsequence of this sequence.
   * The subsequence starts with the {@code char} value at the specified index and
   * ends with the {@code char} value at index {@code end - 1}.  The length
   * (in {@code char}s) of the
   * returned sequence is {@code end - start}, so if {@code start == end}
   * then an empty sequence is returned.
   *
   * @param   start   the start index, inclusive
   * @param   end     the end index, exclusive
   *
   * @return  the specified subsequence
   *
   * @throws  IndexOutOfBoundsException
   *          if {@code start} or {@code end} are negative,
   *          if {@code end} is greater than {@code length()},
   *          or if {@code start} is greater than {@code end}
   * @throws  IllegalArgumentException
   *          if a value in the range {@code start}-{@code end} is an ECI (@see #isECI)
   */
  subSequence(start: number, end: number): string;

  /**
   * Determines if a value is an ECI
   *
   * @param   index the index of the value
   *
   * @return  true if the value at position {@code index} is an ECI
   *
   * @throws  IndexOutOfBoundsException
   *          if the {@code index} argument is negative or not less than
   *          {@code length()}
   */
  isECI(index: number): boolean;

  /**
   * Returns the {@code int} ECI value at the specified index.  An index ranges from zero
   * to {@code length() - 1}.  The first {@code byte} value of the sequence is at
   * index zero, the next at index one, and so on, as for array
   * indexing.
   *
   * @param   index the index of the {@code int} value to be returned
   *
   * @return  the specified {@code int} ECI value.
   *          The ECI specified the encoding of all bytes with a higher index until the
   *          next ECI or until the end of the input if no other ECI follows.
   *
   * @throws  IndexOutOfBoundsException
   *          if the {@code index} argument is negative or not less than
   *          {@code length()}
   * @throws  IllegalArgumentException
   *          if the value at the {@code index} argument is not an ECI (@see #isECI)
   */
  getECIValue(index: number): number;
  haveNCharacters(index: number, n: number): boolean;
}
