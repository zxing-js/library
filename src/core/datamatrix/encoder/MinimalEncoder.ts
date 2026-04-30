import Charset from '../../util/Charset';
import { char } from '../../../customTypings';
import {
  MACRO_05_HEADER,
  MACRO_06_HEADER,
  MACRO_TRAILER,
  SymbolShapeHint,
} from './constants';

import HighLevelEncoder from './HighLevelEncoder';
import { MinimalECIInput } from '../../common/MinimalECIInput';
import Integer from '../../util/Integer';

enum Mode {
  ASCII,
  C40,
  TEXT,
  X12,
  EDF,
  B256,
}

const C40_SHIFT2_CHARS = [
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  ':',
  ';',
  '<',
  '=',
  '>',
  '?',
  '@',
  '[',
  '\\',
  ']',
  '^',
  '_',
];

export class MinimalEncoder {
  static isExtendedASCII(ch: char, fnc1: number): boolean {
    return ch !== fnc1 && ch >= 128 && ch <= 255;
  }

  static isInC40Shift1Set(ch: char): boolean {
    return ch <= 31;
  }

  static isInC40Shift2Set(ch: char, fnc1: number): boolean {
    for (const c40Shift2Char of C40_SHIFT2_CHARS) {
      if (c40Shift2Char.charCodeAt(0) === ch) {
        return true;
      }
    }
    return ch === fnc1;
  }

  static isInTextShift1Set(ch: char): boolean {
    return this.isInC40Shift1Set(ch);
  }

  static isInTextShift2Set(ch: char, fnc1: number): boolean {
    return this.isInC40Shift2Set(ch, fnc1);
  }

  /**
   * Performs message encoding of a DataMatrix message
   *
   * @param msg the message
   * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
   *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
   *   charset to encode any character in the input that can be encoded by it if the charset is among the
   *   supported charsets.
   * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not a GS1
   *   bar code. If the value is not -1 then a FNC1 is also prepended.
   * @param shape requested shape.
   * @return the encoded message (the char values range from 0 to 255)
   */
  static encodeHighLevel(
    msg: string,
    priorityCharset: Charset = null,
    fnc1 = -1,
    shape = SymbolShapeHint.FORCE_NONE
  ): string {
    let macroId = 0;
    if (msg.startsWith(MACRO_05_HEADER) && msg.endsWith(MACRO_TRAILER)) {
      macroId = 5;
      msg = msg.substring(MACRO_05_HEADER.length, msg.length - 2);
    } else if (msg.startsWith(MACRO_06_HEADER) && msg.endsWith(MACRO_TRAILER)) {
      macroId = 6;
      msg = msg.substring(MACRO_06_HEADER.length, msg.length - 2);
    }
    return decodeURIComponent(
      escape(
        String.fromCharCode(
          ...this.encode(msg, priorityCharset, fnc1, shape, macroId)
        )
      )
    );
  }

  /**
   * Encodes input minimally and returns an array of the codewords
   *
   * @param input The string to encode
   * @param priorityCharset The preferred {@link Charset}. When the value of the argument is null, the algorithm
   *   chooses charsets that leads to a minimal representation. Otherwise the algorithm will use the priority
   *   charset to encode any character in the input that can be encoded by it if the charset is among the
   *   supported charsets.
   * @param fnc1 denotes the character in the input that represents the FNC1 character or -1 if this is not a GS1
   *   bar code. If the value is not -1 then a FNC1 is also prepended.
   * @param shape requested shape.
   * @param macroId Prepends the specified macro function in case that a value of 5 or 6 is specified.
   * @return An array of bytes representing the codewords of a minimal encoding.
   */
  static encode(
    input: string,
    priorityCharset: Charset,
    fnc1: number,
    shape: SymbolShapeHint,
    macroId: number
  ): Uint8Array {
    return this.encodeMinimally(
      new Input(input, priorityCharset, fnc1, shape, macroId)
    ).getBytes();
  }

  static addEdge(edges: Edge[][], edge: Edge) {
    const vertexIndex = edge.fromPosition + edge.characterLength;
    if (
      edges[vertexIndex][edge.getEndMode()] === null ||
      edges[vertexIndex][edge.getEndMode()].cachedTotalSize >
        edge.cachedTotalSize
    ) {
      edges[vertexIndex][edge.getEndMode()] = edge;
    }
  }

  /** @return the number of words in which the string starting at from can be encoded in c40 or text mode.
   *  The number of characters encoded is returned in characterLength.
   *  The number of characters encoded is also minimal in the sense that the algorithm stops as soon
   *  as a character encoding fills a C40 word competely (three C40 values). An exception is at the
   *  end of the string where two C40 values are allowed (according to the spec the third c40 value
   *  is filled  with 0 (Shift 1) in this case).
   */
  static getNumberOfC40Words(
    input: Input,
    from: number,
    c40: boolean,
    characterLength: number[]
  ): number {
    let thirdsCount = 0;
    for (let i = from; i < input.length(); i++) {
      if (input.isECI(i)) {
        characterLength[0] = 0;
        return 0;
      }
      const ci = input.charAt(i);
      if (
        (c40 && HighLevelEncoder.isNativeC40(ci)) ||
        (!c40 && HighLevelEncoder.isNativeText(ci))
      ) {
        thirdsCount++; // native
      } else if (
        !MinimalEncoder.isExtendedASCII(ci, input.getFNC1Character())
      ) {
        thirdsCount += 2; // shift
      } else {
        const asciiValue = ci & 0xff;
        if (
          asciiValue >= 128 &&
          ((c40 && HighLevelEncoder.isNativeC40(asciiValue - 128)) ||
            (!c40 && HighLevelEncoder.isNativeText(asciiValue - 128)))
        ) {
          thirdsCount += 3; // shift, Upper shift
        } else {
          thirdsCount += 4; // shift, Upper shift, shift
        }
      }

      if (
        thirdsCount % 3 === 0 ||
        ((thirdsCount - 2) % 3 === 0 && i + 1 === input.length())
      ) {
        characterLength[0] = i - from + 1;
        return Math.ceil(thirdsCount / 3.0);
      }
    }
    characterLength[0] = 0;
    return 0;
  }

  static addEdges(
    input: Input,
    edges: Edge[][],
    from: number,
    previous: Edge
  ): void {
    if (input.isECI(from)) {
      this.addEdge(edges, new Edge(input, Mode.ASCII, from, 1, previous));
      return;
    }

    const ch = input.charAt(from);
    if (previous === null || previous.getEndMode() !== Mode.EDF) {
      // not possible to unlatch a full EDF edge to something
      // else
      if (
        HighLevelEncoder.isDigit(ch) &&
        input.haveNCharacters(from, 2) &&
        HighLevelEncoder.isDigit(input.charAt(from + 1))
      ) {
        // two digits ASCII encoded
        this.addEdge(edges, new Edge(input, Mode.ASCII, from, 2, previous));
      } else {
        // one ASCII encoded character or an extended character via Upper Shift
        this.addEdge(edges, new Edge(input, Mode.ASCII, from, 1, previous));
      }

      const modes: Mode[] = [Mode.C40, Mode.TEXT];
      for (const mode of modes) {
        const characterLength: number[] = [];
        if (
          MinimalEncoder.getNumberOfC40Words(
            input,
            from,
            mode === Mode.C40,
            characterLength
          ) > 0
        ) {
          this.addEdge(
            edges,
            new Edge(input, mode, from, characterLength[0], previous)
          );
        }
      }

      if (
        input.haveNCharacters(from, 3) &&
        HighLevelEncoder.isNativeX12(input.charAt(from)) &&
        HighLevelEncoder.isNativeX12(input.charAt(from + 1)) &&
        HighLevelEncoder.isNativeX12(input.charAt(from + 2))
      ) {
        this.addEdge(edges, new Edge(input, Mode.X12, from, 3, previous));
      }

      this.addEdge(edges, new Edge(input, Mode.B256, from, 1, previous));
    }

    // We create 4 EDF edges,  with 1, 2 3 or 4 characters length. The fourth normally doesn't have a latch to ASCII
    // unless it is 2 characters away from the end of the input.
    let i;
    for (i = 0; i < 3; i++) {
      const pos = from + i;
      if (
        input.haveNCharacters(pos, 1) &&
        HighLevelEncoder.isNativeEDIFACT(input.charAt(pos))
      ) {
        this.addEdge(edges, new Edge(input, Mode.EDF, from, i + 1, previous));
      } else {
        break;
      }
    }
    if (
      i === 3 &&
      input.haveNCharacters(from, 4) &&
      HighLevelEncoder.isNativeEDIFACT(input.charAt(from + 3))
    ) {
      this.addEdge(edges, new Edge(input, Mode.EDF, from, 4, previous));
    }
  }

  static encodeMinimally(input: Input): Result {
    /* The minimal encoding is computed by Dijkstra. The acyclic graph is modeled as follows:
     * A vertex represents a combination of a position in the input and an encoding mode where position 0
     * denotes the position left of the first character, 1 the position left of the second character and so on.
     * Likewise the end vertices are located after the last character at position input.length().
     * For any position there might be up to six vertices, one for each of the encoding types ASCII, C40, TEXT, X12,
     * EDF and B256.
     *
     * As an example consider the input string "ABC123" then at position 0 there is only one vertex with the default
     * ASCII encodation. At position 3 there might be vertices for the types ASCII, C40, X12, EDF and B256.
     *
     * An edge leading to such a vertex encodes one or more of the characters left of the position that the vertex
     * represents. It encodes the characters in the encoding mode of the vertex that it ends on. In other words,
     * all edges leading to a particular vertex encode the same characters (the length of the suffix can vary) using the same
     * encoding mode.
     * As an example consider the input string "ABC123" and the vertex (4,EDF). Possible edges leading to this vertex
     * are:
     *   (0,ASCII)  --EDF(ABC1)--> (4,EDF)
     *   (1,ASCII)  --EDF(BC1)-->  (4,EDF)
     *   (1,B256)   --EDF(BC1)-->  (4,EDF)
     *   (1,EDF)    --EDF(BC1)-->  (4,EDF)
     *   (2,ASCII)  --EDF(C1)-->   (4,EDF)
     *   (2,B256)   --EDF(C1)-->   (4,EDF)
     *   (2,EDF)    --EDF(C1)-->   (4,EDF)
     *   (3,ASCII)  --EDF(1)-->    (4,EDF)
     *   (3,B256)   --EDF(1)-->    (4,EDF)
     *   (3,EDF)    --EDF(1)-->    (4,EDF)
     *   (3,C40)    --EDF(1)-->    (4,EDF)
     *   (3,X12)    --EDF(1)-->    (4,EDF)
     *
     * The edges leading to a vertex are stored in such a way that there is a fast way to enumerate the edges ending
     * on a particular vertex.
     *
     * The algorithm processes the vertices in order of their position thereby performing the following:
     *
     * For every vertex at position i the algorithm enumerates the edges ending on the vertex and removes all but the
     * shortest from that list.
     * Then it processes the vertices for the position i+1. If i+1 == input.length() then the algorithm ends
     * and chooses the the edge with the smallest size from any of the edges leading to vertices at this position.
     * Otherwise the algorithm computes all possible outgoing edges for the vertices at the position i+1
     *
     * Examples:
     * The process is illustrated by showing the graph (edges) after each iteration from left to right over the input:
     * An edge is drawn as follows "(" + fromVertex + ") -- " + encodingMode + "(" + encodedInput + ") (" +
     * accumulatedSize + ") --> (" + toVertex + ")"
     *
     * Example 1 encoding the string "ABCDEFG":
     *
     *
     * Situation after adding edges to the start vertex (0,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF)
     * (0,ASCII) C40(ABC) (3) --> (3,C40)
     * (0,ASCII) TEXT(ABC) (5) --> (3,TEXT)
     * (0,ASCII) X12(ABC) (3) --> (3,X12)
     * (0,ASCII) EDF(ABC) (4) --> (3,EDF)
     * (0,ASCII) EDF(ABCD) (4) --> (4,EDF)
     *
     * Situation after adding edges to vertices at position 1
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF)
     * (0,ASCII) C40(ABC) (3) --> (3,C40)
     * (0,ASCII) TEXT(ABC) (5) --> (3,TEXT)
     * (0,ASCII) X12(ABC) (3) --> (3,X12)
     * (0,ASCII) EDF(ABC) (4) --> (3,EDF)
     * (0,ASCII) EDF(ABCD) (4) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) B256(B) (4) --> (2,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BC) (5) --> (3,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) C40(BCD) (4) --> (4,C40)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) TEXT(BCD) (6) --> (4,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) X12(BCD) (4) --> (4,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BCD) (5) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BCDE) (5) --> (5,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) ASCII(B) (4) --> (2,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BC) (6) --> (3,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) C40(BCD) (5) --> (4,C40)
     * (0,ASCII) B256(A) (3) --> (1,B256) TEXT(BCD) (7) --> (4,TEXT)
     * (0,ASCII) B256(A) (3) --> (1,B256) X12(BCD) (5) --> (4,X12)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BCD) (6) --> (4,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BCDE) (6) --> (5,EDF)
     *
     * Edge "(1,ASCII) ASCII(B) (2) --> (2,ASCII)" is minimal for the vertex (2,ASCII) so that edge "(1,B256) ASCII(B) (4) --> (2,ASCII)" is removed.
     * Edge "(1,B256) B256(B) (3) --> (2,B256)" is minimal for the vertext (2,B256) so that the edge "(1,ASCII) B256(B) (4) --> (2,B256)" is removed.
     *
     * Situation after adding edges to vertices at position 2
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF)
     * (0,ASCII) C40(ABC) (3) --> (3,C40)
     * (0,ASCII) TEXT(ABC) (5) --> (3,TEXT)
     * (0,ASCII) X12(ABC) (3) --> (3,X12)
     * (0,ASCII) EDF(ABC) (4) --> (3,EDF)
     * (0,ASCII) EDF(ABCD) (4) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BC) (5) --> (3,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) C40(BCD) (4) --> (4,C40)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) TEXT(BCD) (6) --> (4,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) X12(BCD) (4) --> (4,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BCD) (5) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BCDE) (5) --> (5,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BC) (6) --> (3,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) C40(BCD) (5) --> (4,C40)
     * (0,ASCII) B256(A) (3) --> (1,B256) TEXT(BCD) (7) --> (4,TEXT)
     * (0,ASCII) B256(A) (3) --> (1,B256) X12(BCD) (5) --> (4,X12)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BCD) (6) --> (4,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) EDF(BCDE) (6) --> (5,EDF)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) ASCII(C) (5) --> (3,ASCII)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) B256(C) (6) --> (3,B256)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) EDF(CD) (7) --> (4,EDF)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) C40(CDE) (6) --> (5,C40)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) TEXT(CDE) (8) --> (5,TEXT)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) X12(CDE) (6) --> (5,X12)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) EDF(CDE) (7) --> (5,EDF)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF) EDF(CDEF) (7) --> (6,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) B256(C) (5) --> (3,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) EDF(CD) (6) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) C40(CDE) (5) --> (5,C40)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) TEXT(CDE) (7) --> (5,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) X12(CDE) (5) --> (5,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) EDF(CDE) (6) --> (5,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) EDF(CDEF) (6) --> (6,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) ASCII(C) (4) --> (3,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) EDF(CD) (6) --> (4,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) C40(CDE) (5) --> (5,C40)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) TEXT(CDE) (7) --> (5,TEXT)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) X12(CDE) (5) --> (5,X12)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) EDF(CDE) (6) --> (5,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) EDF(CDEF) (6) --> (6,EDF)
     *
     * Edge "(2,ASCII) ASCII(C) (3) --> (3,ASCII)" is minimal for the vertex (3,ASCII) so that edges "(2,EDF) ASCII(C) (5) --> (3,ASCII)"
     * and "(2,B256) ASCII(C) (4) --> (3,ASCII)" can be removed.
     * Edge "(0,ASCII) EDF(ABC) (4) --> (3,EDF)" is minimal for the vertex (3,EDF) so that edges "(1,ASCII) EDF(BC) (5) --> (3,EDF)"
     * and "(1,B256) EDF(BC) (6) --> (3,EDF)" can be removed.
     * Edge "(2,B256) B256(C) (4) --> (3,B256)" is minimal for the vertex (3,B256) so that edges "(2,ASCII) B256(C) (5) --> (3,B256)"
     * and "(2,EDF) B256(C) (6) --> (3,B256)" can be removed.
     *
     * This continues for vertices 3 thru 7
     *
     * Situation after adding edges to vertices at position 7
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256)
     * (0,ASCII) EDF(AB) (4) --> (2,EDF)
     * (0,ASCII) C40(ABC) (3) --> (3,C40)
     * (0,ASCII) TEXT(ABC) (5) --> (3,TEXT)
     * (0,ASCII) X12(ABC) (3) --> (3,X12)
     * (0,ASCII) EDF(ABC) (4) --> (3,EDF)
     * (0,ASCII) EDF(ABCD) (4) --> (4,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) C40(BCD) (4) --> (4,C40)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) TEXT(BCD) (6) --> (4,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) X12(BCD) (4) --> (4,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) EDF(BCDE) (5) --> (5,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256)
     * (0,ASCII) C40(ABC) (3) --> (3,C40) C40(DEF) (5) --> (6,C40)
     * (0,ASCII) X12(ABC) (3) --> (3,X12) X12(DEF) (5) --> (6,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) C40(CDE) (5) --> (5,C40)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) TEXT(CDE) (7) --> (5,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) X12(CDE) (5) --> (5,X12)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) EDF(CDEF) (6) --> (6,EDF)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) C40(BCD) (4) --> (4,C40) C40(EFG) (6) --> (7,C40)    //Solution 1
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) X12(BCD) (4) --> (4,X12) X12(EFG) (6) --> (7,X12)    //Solution 2
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) ASCII(D) (4) --> (4,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) TEXT(DEF) (8) --> (6,TEXT)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) EDF(DEFG) (7) --> (7,EDF)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256) B256(D) (5) --> (4,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) ASCII(D) (4) --> (4,ASCII) ASCII(E) (5) --> (5,ASCII)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) ASCII(D) (4) --> (4,ASCII) TEXT(EFG) (9) --> (7,TEXT)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256) B256(D) (5) --> (4,B256) B256(E) (6) --> (5,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) ASCII(D) (4) --> (4,ASCII) ASCII(E) (5) --> (5,ASCII) ASCII(F) (6) --> (6,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256) B256(D) (5) --> (4,B256) B256(E) (6) --> (5,B256) B256(F) (7) --> (6,B256)
     * (0,ASCII) ASCII(A) (1) --> (1,ASCII) ASCII(B) (2) --> (2,ASCII) ASCII(C) (3) --> (3,ASCII) ASCII(D) (4) --> (4,ASCII) ASCII(E) (5) --> (5,ASCII) ASCII(F) (6) --> (6,ASCII) ASCII(G) (7) --> (7,ASCII)
     * (0,ASCII) B256(A) (3) --> (1,B256) B256(B) (3) --> (2,B256) B256(C) (4) --> (3,B256) B256(D) (5) --> (4,B256) B256(E) (6) --> (5,B256) B256(F) (7) --> (6,B256) B256(G) (8) --> (7,B256)
     *
     * Hence a minimal encoding of "ABCDEFG" is either ASCII(A),C40(BCDEFG) or ASCII(A), X12(BCDEFG) with a size of 5 bytes.
     */

    const inputLength = input.length();

    // Array that represents vertices. There is a vertex for every character and mode.
    // The last dimension in the array below encodes the 6 modes ASCII, C40, TEXT, X12, EDF and B256
    const edges: Edge[][] = Array(inputLength + 1)
      .fill(null)
      .map(() => Array(6).fill(0));
    this.addEdges(input, edges, 0, null);

    for (let i = 1; i <= inputLength; i++) {
      for (let j = 0; j < 6; j++) {
        if (edges[i][j] !== null && i < inputLength) {
          this.addEdges(input, edges, i, edges[i][j]);
        }
      }
      // optimize memory by removing edges that have been passed.
      for (let j = 0; j < 6; j++) {
        edges[i - 1][j] = null;
      }
    }

    let minimalJ = -1;
    let minimalSize = Integer.MAX_VALUE;
    for (let j = 0; j < 6; j++) {
      if (edges[inputLength][j] !== null) {
        const edge: Edge = edges[inputLength][j];
        const size =
          j >= 1 && j <= 3 ? edge.cachedTotalSize + 1 : edge.cachedTotalSize; // C40, TEXT and X12 need an
        // extra unlatch at the end
        if (size < minimalSize) {
          minimalSize = size;
          minimalJ = j;
        }
      }
    }

    if (minimalJ < 0) {
      throw new Error('Failed to encode "' + input + '"');
    }

    return new Result(edges[inputLength][minimalJ]);
  }
}

class Result {
  private bytes: Uint8Array;

  constructor(solution: Edge) {
    const input = solution.input;
    let size = 0;
    let bytesAL: number[] = [];
    const randomizePostfixLength = [];
    const randomizeLengths = [];
    if (
      (solution.mode === Mode.C40 ||
        solution.mode === Mode.TEXT ||
        solution.mode === Mode.X12) &&
      solution.getEndMode() !== Mode.ASCII
    ) {
      size += this.prepend(Edge.getBytes(254), bytesAL);
    }
    let current = solution;
    while (current !== null) {
      size += this.prepend(current.getDataBytes(), bytesAL);

      if (
        current.previous === null ||
        current.getPreviousStartMode() !== current.getMode()
      ) {
        if (current.getMode() === Mode.B256) {
          if (size <= 249) {
            bytesAL.unshift(size);
            size++;
          } else {
            bytesAL.unshift(size % 250);
            bytesAL.unshift(size / 250 + 249);
            size += 2;
          }
          randomizePostfixLength.push(bytesAL.length);
          randomizeLengths.push(size);
        }
        this.prepend(current.getLatchBytes(), bytesAL);
        size = 0;
      }

      current = current.previous;
    }
    if (input.getMacroId() === 5) {
      size += this.prepend(Edge.getBytes(236), bytesAL);
    } else if (input.getMacroId() === 6) {
      size += this.prepend(Edge.getBytes(237), bytesAL);
    }

    if (input.getFNC1Character() > 0) {
      size += this.prepend(Edge.getBytes(232), bytesAL);
    }
    for (let i = 0; i < randomizePostfixLength.length; i++) {
      this.applyRandomPattern(
        bytesAL,
        bytesAL.length - randomizePostfixLength[i],
        randomizeLengths[i]
      );
    }
    // add padding
    const capacity = solution.getMinSymbolSize(bytesAL.length);
    if (bytesAL.length < capacity) {
      bytesAL.push(129);
    }
    while (bytesAL.length < capacity) {
      bytesAL.push(this.randomize253State(bytesAL.length + 1));
    }

    this.bytes = new Uint8Array(bytesAL.length);
    for (let i = 0; i < this.bytes.length; i++) {
      this.bytes[i] = bytesAL[i];
    }
  }

  prepend(bytes: Uint8Array, into: number[]): number {
    for (let i = bytes.length - 1; i >= 0; i--) {
      into.unshift(bytes[i]);
    }
    return bytes.length;
  }

  randomize253State(codewordPosition: number): number {
    const pseudoRandom = ((149 * codewordPosition) % 253) + 1;
    const tempVariable = 129 + pseudoRandom;
    return tempVariable <= 254 ? tempVariable : tempVariable - 254;
  }

  applyRandomPattern(
    bytesAL: number[],
    startPosition: number,
    length: number
  ): void {
    for (let i = 0; i < length; i++) {
      // See "B.1 253-state algorithm
      const Pad_codeword_position = startPosition + i;
      const Pad_codeword_value = bytesAL[Pad_codeword_position] & 0xff;
      const pseudo_random_number =
        ((149 * (Pad_codeword_position + 1)) % 255) + 1;
      const temp_variable = Pad_codeword_value + pseudo_random_number;
      bytesAL[Pad_codeword_position] =
        temp_variable <= 255 ? temp_variable : temp_variable - 256;
    }
  }

  public getBytes(): Uint8Array {
    return this.bytes;
  }
}

class Edge {
  private allCodewordCapacities: number[] = [
    3, 5, 8, 10, 12, 16, 18, 22, 30, 32, 36, 44, 49, 62, 86, 114, 144, 174, 204,
    280, 368, 456, 576, 696, 816, 1050, 1304, 1558,
  ];
  private squareCodewordCapacities: number[] = [
    3, 5, 8, 12, 18, 22, 30, 36, 44, 62, 86, 114, 144, 174, 204, 280, 368, 456,
    576, 696, 816, 1050, 1304, 1558,
  ];
  private rectangularCodewordCapacities: number[] = [5, 10, 16, 33, 32, 49];
  public cachedTotalSize: number;

  constructor(
    public readonly input: Input,
    public readonly mode: Mode,
    public readonly fromPosition: number,
    public readonly characterLength: number,
    public readonly previous: Edge
  ) {
    if (!(fromPosition + characterLength <= input.length())) {
      throw new Error('Invalid edge');
    }

    let size = previous !== null ? previous.cachedTotalSize : 0;

    const previousMode = this.getPreviousMode();

    /*
     * Switching modes
     * ASCII -> C40: latch 230
     * ASCII -> TEXT: latch 239
     * ASCII -> X12: latch 238
     * ASCII -> EDF: latch 240
     * ASCII -> B256: latch 231
     * C40 -> ASCII: word(c1,c2,c3), 254
     * TEXT -> ASCII: word(c1,c2,c3), 254
     * X12 -> ASCII: word(c1,c2,c3), 254
     * EDIFACT -> ASCII: Unlatch character,0,0,0 or c1,Unlatch character,0,0 or c1,c2,Unlatch character,0 or
     * c1,c2,c3,Unlatch character
     * B256 -> ASCII: without latch after n bytes
     */
    switch (mode) {
      case Mode.ASCII:
        size++;
        if (
          input.isECI(fromPosition) ||
          MinimalEncoder.isExtendedASCII(
            input.charAt(fromPosition),
            input.getFNC1Character()
          )
        ) {
          size++;
        }
        if (
          previousMode === Mode.C40 ||
          previousMode === Mode.TEXT ||
          previousMode === Mode.X12
        ) {
          size++; // unlatch 254 to ASCII
        }
        break;
      case Mode.B256:
        size++;
        if (previousMode !== Mode.B256) {
          size++; // byte count
        } else if (this.getB256Size() === 250) {
          size++; // extra byte count
        }
        if (previousMode === Mode.ASCII) {
          size++; // latch to B256
        } else if (
          previousMode === Mode.C40 ||
          previousMode === Mode.TEXT ||
          previousMode === Mode.X12
        ) {
          size += 2; // unlatch to ASCII, latch to B256
        }
        break;
      case Mode.C40:
      case Mode.TEXT:
      case Mode.X12:
        if (mode === Mode.X12) {
          size += 2;
        } else {
          let charLen: number[] = [];
          size +=
            MinimalEncoder.getNumberOfC40Words(
              input,
              fromPosition,
              mode === Mode.C40,
              charLen
            ) * 2;
        }

        if (previousMode === Mode.ASCII || previousMode === Mode.B256) {
          size++; // additional byte for latch from ASCII to this mode
        } else if (
          previousMode !== mode &&
          (previousMode === Mode.C40 ||
            previousMode === Mode.TEXT ||
            previousMode === Mode.X12)
        ) {
          size += 2; // unlatch 254 to ASCII followed by latch to this mode
        }
        break;
      case Mode.EDF:
        size += 3;
        if (previousMode === Mode.ASCII || previousMode === Mode.B256) {
          size++; // additional byte for latch from ASCII to this mode
        } else if (
          previousMode === Mode.C40 ||
          previousMode === Mode.TEXT ||
          previousMode === Mode.X12
        ) {
          size += 2; // unlatch 254 to ASCII followed by latch to this mode
        }
        break;
    }
    this.cachedTotalSize = size;
  }

  // does not count beyond 250
  getB256Size(): number {
    let cnt = 0;
    let current: Edge = this;
    while (current !== null && current.mode === Mode.B256 && cnt <= 250) {
      cnt++;
      current = current.previous;
    }
    return cnt;
  }

  getPreviousStartMode(): Mode {
    return this.previous === null ? Mode.ASCII : this.previous.mode;
  }

  getPreviousMode(): Mode {
    return this.previous === null ? Mode.ASCII : this.previous.getEndMode();
  }

  /** Returns Mode.ASCII in case that:
   *  - Mode is EDIFACT and characterLength is less than 4 or the remaining characters can be encoded in at most 2
   *    ASCII bytes.
   *  - Mode is C40, TEXT or X12 and the remaining characters can be encoded in at most 1 ASCII byte.
   *  Returns mode in all other cases.
   * */
  getEndMode(): Mode {
    if (this.mode === Mode.EDF) {
      if (this.characterLength < 4) {
        return Mode.ASCII;
      }
      const lastASCII = this.getLastASCII(); // see 5.2.8.2 EDIFACT encodation Rules
      if (
        lastASCII > 0 &&
        this.getCodewordsRemaining(this.cachedTotalSize + lastASCII) <=
          2 - lastASCII
      ) {
        return Mode.ASCII;
      }
    }
    if (
      this.mode === Mode.C40 ||
      this.mode === Mode.TEXT ||
      this.mode === Mode.X12
    ) {
      // see 5.2.5.2 C40 encodation rules and 5.2.7.2 ANSI X12 encodation rules
      if (
        this.fromPosition + this.characterLength >= this.input.length() &&
        this.getCodewordsRemaining(this.cachedTotalSize) === 0
      ) {
        return Mode.ASCII;
      }
      const lastASCII = this.getLastASCII();
      if (
        lastASCII === 1 &&
        this.getCodewordsRemaining(this.cachedTotalSize + 1) === 0
      ) {
        return Mode.ASCII;
      }
    }
    return this.mode;
  }

  getMode(): Mode {
    return this.mode;
  }

  /** Peeks ahead and returns 1 if the postfix consists of exactly two digits, 2 if the postfix consists of exactly
   *  two consecutive digits and a non extended character or of 4 digits.
   *  Returns 0 in any other case
   **/
  getLastASCII(): number {
    const length = this.input.length();
    const from = this.fromPosition + this.characterLength;
    if (length - from > 4 || from >= length) {
      return 0;
    }
    if (length - from === 1) {
      if (
        MinimalEncoder.isExtendedASCII(
          this.input.charAt(from),
          this.input.getFNC1Character()
        )
      ) {
        return 0;
      }
      return 1;
    }
    if (length - from === 2) {
      if (
        MinimalEncoder.isExtendedASCII(
          this.input.charAt(from),
          this.input.getFNC1Character()
        ) ||
        MinimalEncoder.isExtendedASCII(
          this.input.charAt(from + 1),
          this.input.getFNC1Character()
        )
      ) {
        return 0;
      }
      if (
        HighLevelEncoder.isDigit(this.input.charAt(from)) &&
        HighLevelEncoder.isDigit(this.input.charAt(from + 1))
      ) {
        return 1;
      }
      return 2;
    }
    if (length - from === 3) {
      if (
        HighLevelEncoder.isDigit(this.input.charAt(from)) &&
        HighLevelEncoder.isDigit(this.input.charAt(from + 1)) &&
        !MinimalEncoder.isExtendedASCII(
          this.input.charAt(from + 2),
          this.input.getFNC1Character()
        )
      ) {
        return 2;
      }
      if (
        HighLevelEncoder.isDigit(this.input.charAt(from + 1)) &&
        HighLevelEncoder.isDigit(this.input.charAt(from + 2)) &&
        !MinimalEncoder.isExtendedASCII(
          this.input.charAt(from),
          this.input.getFNC1Character()
        )
      ) {
        return 2;
      }
      return 0;
    }
    if (
      HighLevelEncoder.isDigit(this.input.charAt(from)) &&
      HighLevelEncoder.isDigit(this.input.charAt(from + 1)) &&
      HighLevelEncoder.isDigit(this.input.charAt(from + 2)) &&
      HighLevelEncoder.isDigit(this.input.charAt(from + 3))
    ) {
      return 2;
    }
    return 0;
  }

  /** Returns the capacity in codewords of the smallest symbol that has enough capacity to fit the given minimal
   * number of codewords.
   **/
  getMinSymbolSize(minimum: number): number {
    switch (this.input.getShapeHint()) {
      case SymbolShapeHint.FORCE_SQUARE:
        for (const capacity of this.squareCodewordCapacities) {
          if (capacity >= minimum) {
            return capacity;
          }
        }
        break;
      case SymbolShapeHint.FORCE_RECTANGLE:
        for (const capacity of this.rectangularCodewordCapacities) {
          if (capacity >= minimum) {
            return capacity;
          }
        }
        break;
    }
    for (const capacity of this.allCodewordCapacities) {
      if (capacity >= minimum) {
        return capacity;
      }
    }
    return this.allCodewordCapacities[this.allCodewordCapacities.length - 1];
  }

  /** Returns the remaining capacity in codewords of the smallest symbol that has enough capacity to fit the given
   * minimal number of codewords.
   **/
  getCodewordsRemaining(minimum: number): number {
    return this.getMinSymbolSize(minimum) - minimum;
  }

  static getBytes(c1: number, c2?: number): Uint8Array {
    const result = new Uint8Array(c2 ? 2 : 1);
    result[0] = c1;
    if (c2) {
      result[1] = c2;
    }
    return result;
  }

  setC40Word(
    bytes: Uint8Array,
    offset: number,
    c1: number,
    c2: number,
    c3: number
  ): void {
    const val16 = 1600 * (c1 & 0xff) + 40 * (c2 & 0xff) + (c3 & 0xff) + 1;
    bytes[offset] = val16 / 256;
    bytes[offset + 1] = val16 % 256;
  }

  getX12Value(c: number): number {
    return c === 13
      ? 0
      : c === 42
      ? 1
      : c === 62
      ? 2
      : c === 32
      ? 3
      : c >= 48 && c <= 57
      ? c - 44
      : c >= 65 && c <= 90
      ? c - 51
      : c;
  }

  getX12Words(): Uint8Array {
    if (!(this.characterLength % 3 === 0)) {
      throw new Error('X12 words must be a multiple of 3');
    }
    const result = new Uint8Array((this.characterLength / 3) * 2);
    for (let i = 0; i < result.length; i += 2) {
      this.setC40Word(
        result,
        i,
        this.getX12Value(this.input.charAt(this.fromPosition + (i / 2) * 3)),
        this.getX12Value(
          this.input.charAt(this.fromPosition + (i / 2) * 3 + 1)
        ),
        this.getX12Value(this.input.charAt(this.fromPosition + (i / 2) * 3 + 2))
      );
    }
    return result;
  }

  getShiftValue(c: number, c40: boolean, fnc1: number): number {
    return (c40 && MinimalEncoder.isInC40Shift1Set(c)) ||
      (!c40 && MinimalEncoder.isInTextShift1Set(c))
      ? 0
      : (c40 && MinimalEncoder.isInC40Shift2Set(c, fnc1)) ||
        (!c40 && MinimalEncoder.isInTextShift2Set(c, fnc1))
      ? 1
      : 2;
  }

  getC40Value(c40: boolean, setIndex: number, c: number, fnc1: number): number {
    if (c === fnc1) {
      if (!(setIndex === 2)) {
        throw new Error('FNC1 cannot be used in C40 shift 2');
      }
      return 27;
    }
    if (c40) {
      return c <= 31
        ? c
        : c === 32
        ? 3
        : c <= 47
        ? c - 33
        : c <= 57
        ? c - 44
        : c <= 64
        ? c - 43
        : c <= 90
        ? c - 51
        : c <= 95
        ? c - 69
        : c <= 127
        ? c - 96
        : c;
    } else {
      return c === 0
        ? 0
        : setIndex === 0 && c <= 3
        ? c - 1 // is this a bug in the spec?
        : setIndex === 1 && c <= 31
        ? c
        : c === 32
        ? 3
        : c >= 33 && c <= 47
        ? c - 33
        : c >= 48 && c <= 57
        ? c - 44
        : c >= 58 && c <= 64
        ? c - 43
        : c >= 65 && c <= 90
        ? c - 64
        : c >= 91 && c <= 95
        ? c - 69
        : c === 96
        ? 0
        : c >= 97 && c <= 122
        ? c - 83
        : c >= 123 && c <= 127
        ? c - 96
        : c;
    }
  }

  getC40Words(c40: boolean, fnc1: number): Uint8Array {
    const c40Values = [];
    for (let i = 0; i < this.characterLength; i++) {
      const ci = this.input.charAt(this.fromPosition + i);
      if (
        (c40 && HighLevelEncoder.isNativeC40(ci)) ||
        (!c40 && HighLevelEncoder.isNativeText(ci))
      ) {
        c40Values.push(this.getC40Value(c40, 0, ci, fnc1));
      } else if (!MinimalEncoder.isExtendedASCII(ci, fnc1)) {
        const shiftValue = this.getShiftValue(ci, c40, fnc1);
        c40Values.push(shiftValue); // Shift[123]
        c40Values.push(this.getC40Value(c40, shiftValue, ci, fnc1));
      } else {
        const asciiValue = (ci & 0xff) - 128;
        if (
          (c40 && HighLevelEncoder.isNativeC40(asciiValue)) ||
          (!c40 && HighLevelEncoder.isNativeText(asciiValue))
        ) {
          c40Values.push(1); // Shift 2
          c40Values.push(30); // Upper Shift
          c40Values.push(this.getC40Value(c40, 0, asciiValue, fnc1));
        } else {
          c40Values.push(1); // Shift 2
          c40Values.push(30); // Upper Shift
          const shiftValue = this.getShiftValue(asciiValue, c40, fnc1);
          c40Values.push(shiftValue); // Shift[123]
          c40Values.push(this.getC40Value(c40, shiftValue, asciiValue, fnc1));
        }
      }
    }

    if (c40Values.length % 3 !== 0) {
      if (
        !(
          (c40Values.length - 2) % 3 === 0 &&
          this.fromPosition + this.characterLength === this.input.length()
        )
      ) {
        throw new Error('C40 words must be a multiple of 3');
      }
      c40Values.push(0); // pad with 0 (Shift 1)
    }

    const result = new Uint8Array((c40Values.length / 3) * 2);
    let byteIndex = 0;
    for (let i = 0; i < c40Values.length; i += 3) {
      this.setC40Word(
        result,
        byteIndex,
        c40Values[i] & 0xff,
        c40Values[i + 1] & 0xff,
        c40Values[i + 2] & 0xff
      );
      byteIndex += 2;
    }
    return result;
  }

  getEDFBytes(): Uint8Array {
    const numberOfThirds = Math.ceil(this.characterLength / 4.0);
    const result = new Uint8Array(numberOfThirds * 3);
    let pos = this.fromPosition;
    const endPos = Math.min(
      this.fromPosition + this.characterLength - 1,
      this.input.length() - 1
    );
    for (let i = 0; i < numberOfThirds; i += 3) {
      const edfValues = [];
      for (let j = 0; j < 4; j++) {
        if (pos <= endPos) {
          edfValues[j] = this.input.charAt(pos++) & 0x3f;
        } else {
          edfValues[j] = pos === endPos + 1 ? 0x1f : 0;
        }
      }
      let val24 = edfValues[0] << 18;
      val24 |= edfValues[1] << 12;
      val24 |= edfValues[2] << 6;
      val24 |= edfValues[3];
      result[i] = (val24 >> 16) & 0xff;
      result[i + 1] = (val24 >> 8) & 0xff;
      result[i + 2] = val24 & 0xff;
    }
    return result;
  }

  getLatchBytes(): Uint8Array {
    switch (this.getPreviousMode()) {
      case Mode.ASCII:
      case Mode.B256: // after B256 ends (via length) we are back to ASCII
        switch (this.mode) {
          case Mode.B256:
            return Edge.getBytes(231);
          case Mode.C40:
            return Edge.getBytes(230);
          case Mode.TEXT:
            return Edge.getBytes(239);
          case Mode.X12:
            return Edge.getBytes(238);
          case Mode.EDF:
            return Edge.getBytes(240);
        }
        break;
      case Mode.C40:
      case Mode.TEXT:
      case Mode.X12:
        if (this.mode !== this.getPreviousMode()) {
          switch (this.mode) {
            case Mode.ASCII:
              return Edge.getBytes(254);
            case Mode.B256:
              return Edge.getBytes(254, 231);
            case Mode.C40:
              return Edge.getBytes(254, 230);
            case Mode.TEXT:
              return Edge.getBytes(254, 239);
            case Mode.X12:
              return Edge.getBytes(254, 238);
            case Mode.EDF:
              return Edge.getBytes(254, 240);
          }
        }
        break;
      case Mode.EDF:
        // The rightmost EDIFACT edge always contains an unlatch character
        if (this.mode !== Mode.EDF) {
          throw new Error('Cannot switch from EDF to ' + this.mode);
        }
        break;
    }
    return new Uint8Array(0);
  }

  // Important: The function does not return the length bytes (one or two) in case of B256 encoding
  getDataBytes(): Uint8Array {
    switch (this.mode) {
      case Mode.ASCII:
        if (this.input.isECI(this.fromPosition)) {
          return Edge.getBytes(
            241,
            this.input.getECIValue(this.fromPosition) + 1
          );
        } else if (
          MinimalEncoder.isExtendedASCII(
            this.input.charAt(this.fromPosition),
            this.input.getFNC1Character()
          )
        ) {
          return Edge.getBytes(235, this.input.charAt(this.fromPosition) - 127);
        } else if (this.characterLength === 2) {
          return Edge.getBytes(
            this.input.charAt(this.fromPosition) * 10 +
              this.input.charAt(this.fromPosition + 1) +
              130
          );
        } else if (this.input.isFNC1(this.fromPosition)) {
          return Edge.getBytes(232);
        } else {
          return Edge.getBytes(this.input.charAt(this.fromPosition) + 1);
        }
      case Mode.B256:
        return Edge.getBytes(this.input.charAt(this.fromPosition));
      case Mode.C40:
        return this.getC40Words(true, this.input.getFNC1Character());
      case Mode.TEXT:
        return this.getC40Words(false, this.input.getFNC1Character());
      case Mode.X12:
        return this.getX12Words();
      case Mode.EDF:
        return this.getEDFBytes();
    }
  }
}

class Input extends MinimalECIInput {
  constructor(
    stringToEncode: string,
    priorityCharset: Charset,
    fnc1: number,
    private readonly shape: SymbolShapeHint,
    private readonly macroId: number
  ) {
    super(stringToEncode, priorityCharset, fnc1);
  }

  getMacroId(): number {
    return this.macroId;
  }

  getShapeHint(): SymbolShapeHint {
    return this.shape;
  }
}
