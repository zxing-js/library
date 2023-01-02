import { char } from 'src/customTypings';
import { ECIEncoderSet } from './ECIEncoderSet';
import Charset from '../util/Charset';
import Integer from '../util/Integer';
import StringBuilder from '../util/StringBuilder';
import ECIInput from './ECIInput';

const COST_PER_ECI = 3; // approximated (latch + 2 codewords)

export class MinimalECIInput implements ECIInput {
  private bytes: number[];
  private fnc1: number;

  /**
   * Constructs a minimal input
   *
   * @param stringToEncode the character string to encode
   * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
   *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
   *   charset to encode any character in the input that can be encoded by it if the charset is among the
   *   supported charsets.
   * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not GS1
   *   input.
   */
  constructor(stringToEncode: string, priorityCharset: Charset, fnc1: number) {
    this.fnc1 = fnc1;
    const encoderSet = new ECIEncoderSet(stringToEncode, priorityCharset, fnc1);

    if (encoderSet.length() === 1) {
      // optimization for the case when all can be encoded without ECI in ISO-8859-1
      for (let i = 0; i < this.bytes.length; i++) {
        const c = stringToEncode.charAt(i).charCodeAt(0);
        this.bytes[i] = c === fnc1 ? 1000 : c;
      }
    } else {
      this.bytes = this.encodeMinimally(stringToEncode, encoderSet, fnc1);
    }
  }

  public getFNC1Character(): number {
    return this.fnc1;
  }

  /**
   * Returns the length of this input.  The length is the number
   * of {@code byte}s, FNC1 characters or ECIs in the sequence.
   *
   * @return  the number of {@code char}s in this sequence
   */
  public length(): number {
    return this.bytes.length;
  }

  public haveNCharacters(index: number, n: number): boolean {
    if (index + n - 1 >= this.bytes.length) {
      return false;
    }
    for (let i = 0; i < n; i++) {
      if (this.isECI(index + i)) {
        return false;
      }
    }
    return true;
  }

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
  public charAt(index: number): number {
    if (index < 0 || index >= this.length()) {
      throw new Error('' + index);
    }
    if (this.isECI(index)) {
      throw new Error('value at ' + index + ' is not a character but an ECI');
    }
    return this.isFNC1(index) ? this.fnc1 : this.bytes[index];
  }

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
  public subSequence(start: number, end: number): string {
    if (start < 0 || start > end || end > this.length()) {
      throw new Error('' + start);
    }
    const result = new StringBuilder();
    for (let i = start; i < end; i++) {
      if (this.isECI(i)) {
        throw new Error('value at ' + i + ' is not a character but an ECI');
      }
      result.append(this.charAt(i));
    }
    return result.toString();
  }

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
  public isECI(index: number): boolean {
    if (index < 0 || index >= this.length()) {
      throw new Error('' + index);
    }
    return this.bytes[index] > 255 && this.bytes[index] <= 999;
  }

  /**
   * Determines if a value is the FNC1 character
   *
   * @param   index the index of the value
   *
   * @return  true if the value at position {@code index} is the FNC1 character
   *
   * @throws  IndexOutOfBoundsException
   *          if the {@code index} argument is negative or not less than
   *          {@code length()}
   */
  public isFNC1(index: number): boolean {
    if (index < 0 || index >= this.length()) {
      throw new Error('' + index);
    }
    return this.bytes[index] === 1000;
  }

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
  public getECIValue(index: number): number {
    if (index < 0 || index >= this.length()) {
      throw new Error('' + index);
    }
    if (!this.isECI(index)) {
      throw new Error('value at ' + index + ' is not an ECI but a character');
    }
    return this.bytes[index] - 256;
  }

  addEdge(edges: InputEdge[][], to: number, edge: InputEdge): void {
    if (
      edges[to][edge.encoderIndex] == null ||
      edges[to][edge.encoderIndex].cachedTotalSize > edge.cachedTotalSize
    ) {
      edges[to][edge.encoderIndex] = edge;
    }
  }

  addEdges(
    stringToEncode: string,
    encoderSet: ECIEncoderSet,
    edges: InputEdge[][],
    from: number,
    previous: InputEdge,
    fnc1: number
  ): void {
    const ch = stringToEncode.charAt(from).charCodeAt(0);

    let start = 0;
    let end = encoderSet.length();
    if (
      encoderSet.getPriorityEncoderIndex() >= 0 &&
      (ch === fnc1 ||
        encoderSet.canEncode(ch, encoderSet.getPriorityEncoderIndex()))
    ) {
      start = encoderSet.getPriorityEncoderIndex();
      end = start + 1;
    }

    for (let i = start; i < end; i++) {
      if (ch === fnc1 || encoderSet.canEncode(ch, i)) {
        this.addEdge(
          edges,
          from + 1,
          new InputEdge(ch, encoderSet, i, previous, fnc1)
        );
      }
    }
  }

  encodeMinimally(
    stringToEncode: string,
    encoderSet: ECIEncoderSet,
    fnc1: number
  ): number[] {
    const inputLength = stringToEncode.length;

    // Array that represents vertices. There is a vertex for every character and encoding.
    const edges = new InputEdge[inputLength + 1][encoderSet.length()]();
    this.addEdges(stringToEncode, encoderSet, edges, 0, null, fnc1);

    for (let i = 1; i <= inputLength; i++) {
      for (let j = 0; j < encoderSet.length(); j++) {
        if (edges[i][j] != null && i < inputLength) {
          this.addEdges(
            stringToEncode,
            encoderSet,
            edges,
            i,
            edges[i][j],
            fnc1
          );
        }
      }
      // optimize memory by removing edges that have been passed.
      for (let j = 0; j < encoderSet.length(); j++) {
        edges[i - 1][j] = null;
      }
    }
    let minimalJ = -1;
    let minimalSize = Integer.MAX_VALUE;
    for (let j = 0; j < encoderSet.length(); j++) {
      if (edges[inputLength][j] != null) {
        const edge = edges[inputLength][j];
        if (edge.cachedTotalSize < minimalSize) {
          minimalSize = edge.cachedTotalSize;
          minimalJ = j;
        }
      }
    }
    if (minimalJ < 0) {
      throw new Error('Failed to encode "' + stringToEncode + '"');
    }
    const intsAL: number[] = [];
    let current: InputEdge = edges[inputLength][minimalJ];
    while (current != null) {
      if (current.isFNC1()) {
        intsAL.unshift(1000);
      } else {
        const bytes = encoderSet.encode(current.c, current.encoderIndex);
        for (let i = bytes.length - 1; i >= 0; i--) {
          intsAL.unshift(bytes[i] & 0xff);
        }
      }
      const previousEncoderIndex =
        current.previous === null ? 0 : current.previous.encoderIndex;
      if (previousEncoderIndex !== current.encoderIndex) {
        intsAL.unshift(256 + encoderSet.getECIValue(current.encoderIndex));
      }
      current = current.previous;
    }
    const ints: number[] = [];
    for (let i = 0; i < ints.length; i++) {
      ints[i] = intsAL[i];
    }
    return ints;
  }
}

class InputEdge {
  public readonly cachedTotalSize: number;

  constructor(
    public readonly c: char,
    public readonly encoderSet: ECIEncoderSet,
    public readonly encoderIndex: number,
    public readonly previous: InputEdge,
    public readonly fnc1: number
  ) {
    this.c = c === fnc1 ? 1000 : c;

    let size = this.isFNC1() ? 1 : encoderSet.encode(c, encoderIndex).length;
    const previousEncoderIndex = previous === null ? 0 : previous.encoderIndex;
    if (previousEncoderIndex !== encoderIndex) {
      size += COST_PER_ECI;
    }
    if (previous != null) {
      size += previous.cachedTotalSize;
    }
    this.cachedTotalSize = size;
  }

  isFNC1(): boolean {
    return this.c === 1000;
  }
}
