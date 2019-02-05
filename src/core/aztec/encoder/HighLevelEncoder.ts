/*
* Copyright 2013 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

// package com.google.zxing.aztec.encoder;

// import com.google.zxing.common.BitArray;
import BitArray from '../../common/BitArray';

// import java.util.Arrays;
import Arrays from '../../util/Arrays';
// import java.util.Collection;
// import java.util.Collections;
import Collections from '../../util/Collections';
// import java.util.Comparator;
// import java.util.Iterator;
// import java.util.LinkedList;

import State from './State';
import StringUtils from '../../common/StringUtils';


const MODE_UPPER = 0;
const MODE_LOWER = 1;
const MODE_DIGIT = 2;
const MODE_MIXED = 3;
const MODE_PUNCT = 4;

function static_SHIFT_TABLE(SHIFT_TABLE: Int32Array[]): Int32Array[] {

  for (let table /*Int32Array*/ of SHIFT_TABLE) {
    Arrays.fill(table, -1);
  }

  SHIFT_TABLE[MODE_UPPER][MODE_PUNCT] = 0;

  SHIFT_TABLE[MODE_LOWER][MODE_PUNCT] = 0;
  SHIFT_TABLE[MODE_LOWER][MODE_UPPER] = 28;

  SHIFT_TABLE[MODE_MIXED][MODE_PUNCT] = 0;

  SHIFT_TABLE[MODE_DIGIT][MODE_PUNCT] = 0;
  SHIFT_TABLE[MODE_DIGIT][MODE_UPPER] = 15;

  return SHIFT_TABLE;
}

function static_CHAR_MAP(CHAR_MAP: Int32Array[]): Int32Array[] {

  CHAR_MAP[MODE_UPPER][' '] = 1;
  const zUpperCharCode = StringUtils.getCharCode('Z');
  const aUpperCharCode = StringUtils.getCharCode('A');
  for (let c: int = aUpperCharCode; c <= zUpperCharCode; c++) {
    CHAR_MAP[MODE_UPPER][c] = c - aUpperCharCode + 2;
  }
  CHAR_MAP[MODE_LOWER][' '] = 1;
  const zLowerCharCode = StringUtils.getCharCode('z');
  const aLowerCharCode = StringUtils.getCharCode('a');
  for (let c: int = aLowerCharCode; c <= zLowerCharCode; c++) {
    CHAR_MAP[MODE_LOWER][c] = c - aLowerCharCode + 2;
  }
  CHAR_MAP[MODE_DIGIT][' '] = 1;
  const nineCharCode = StringUtils.getCharCode('9');
  const zeroCharCode = StringUtils.getCharCode('0');
  for (let c: int = zeroCharCode; c <= nineCharCode; c++) {
    CHAR_MAP[MODE_DIGIT][c] = c - zeroCharCode + 2;
  }
  CHAR_MAP[MODE_DIGIT][','] = 12;
  CHAR_MAP[MODE_DIGIT]['.'] = 13;
  const mixedTable = [
    '\0', ' ', '\1', '\2', '\3', '\4', '\5', '\6', '\7', '\b', '\t', '\n',
    '\13', '\f', '\r', '\33', '\34', '\35', '\36', '\37', '@', '\\', '^',
    '_', '`', '|', '~', '\177'
  ];
  for (let i: int = 0; i < mixedTable.length; i++) {
    CHAR_MAP[MODE_MIXED][mixedTable[i]] = i;
  }
  const punctTable = [
    '\0', '\r', '\0', '\0', '\0', '\0', '!', '\'', '#', '$', '%', '&', '\'',
    '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?',
    '[', ']', '{', '}'
  ];

  for (let i: int = 0; i < punctTable.length; i++) {
    if (StringUtils.getCharCode(punctTable[i]) > 0) {
      CHAR_MAP[MODE_PUNCT][punctTable[i]] = i;
    }
  }

  return CHAR_MAP;
}

/**
 * This produces nearly optimal encodings of text into the first-level of
 * encoding used by Aztec code.
 *
 * It uses a dynamic algorithm.  For each prefix of the string, it determines
 * a set of encodings that could lead to this prefix.  We repeatedly add a
 * character and generate a new set of optimal encodings until we have read
 * through the entire input.
 *
 * @author Frank Yellin
 * @author Rustam Abdullaev
 */
export default /*public final*/ class HighLevelEncoder {

  static /*final*/ MODE_NAMES: String[] = ['UPPER', 'LOWER', 'DIGIT', 'MIXED', 'PUNCT'];

  static /*final*/ MODE_UPPER: int = MODE_UPPER; // 5 bits
  static /*final*/ MODE_LOWER: int = MODE_LOWER; // 5 bits
  static /*final*/ MODE_DIGIT: int = MODE_DIGIT; // 4 bits
  static /*final*/ MODE_MIXED: int = MODE_MIXED; // 5 bits
  static /*final*/ MODE_PUNCT: int = MODE_PUNCT; // 5 bits

  // The Latch Table shows, for each pair of Modes, the optimal method for
  // getting from one mode to another.  In the worst possible case, this can
  // be up to 14 bits.  In the best possible case, we are already there!
  // The high half-word of each entry gives the number of bits.
  // The low half-word of each entry are the actual bits necessary to change
  static /*final*/ LATCH_TABLE: Int32Array[] = [
    Int32Array.from([
      0,
      (5 << 16) + 28,              // UPPER -> LOWER
      (5 << 16) + 30,              // UPPER -> DIGIT
      (5 << 16) + 29,              // UPPER -> MIXED
      (10 << 16) + (29 << 5) + 30, // UPPER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
      (9 << 16) + (30 << 4) + 14,  // LOWER -> DIGIT -> UPPER
      0,
      (5 << 16) + 30,              // LOWER -> DIGIT
      (5 << 16) + 29,              // LOWER -> MIXED
      (10 << 16) + (29 << 5) + 30, // LOWER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
      (4 << 16) + 14,              // DIGIT -> UPPER
      (9 << 16) + (14 << 5) + 28,  // DIGIT -> UPPER -> LOWER
      0,
      (9 << 16) + (14 << 5) + 29,  // DIGIT -> UPPER -> MIXED
      (14 << 16) + (14 << 10) + (29 << 5) + 30,
      // DIGIT -> UPPER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
      (5 << 16) + 29,              // MIXED -> UPPER
      (5 << 16) + 28,              // MIXED -> LOWER
      (10 << 16) + (29 << 5) + 30, // MIXED -> UPPER -> DIGIT
      0,
      (5 << 16) + 30,              // MIXED -> PUNCT
    ]),
    Int32Array.from([
      (5 << 16) + 31,              // PUNCT -> UPPER
      (10 << 16) + (31 << 5) + 28, // PUNCT -> UPPER -> LOWER
      (10 << 16) + (31 << 5) + 30, // PUNCT -> UPPER -> DIGIT
      (10 << 16) + (31 << 5) + 29, // PUNCT -> UPPER -> MIXED
      0,
    ]),
  ];

  // A reverse mapping from [mode][char] to the encoding for that character
  // in that mode.  An entry of 0 indicates no mapping exists.
  private static /*final*/ CHAR_MAP: Int32Array[] = static_CHAR_MAP(Arrays.createInt32Array(5, 256));

  // A map showing the available shift codes.  (The shifts to BINARY are not
  // shown
  static /*final*/ SHIFT_TABLE: Int32Array[] = static_SHIFT_TABLE(Arrays.createInt32Array(6, 6)); // mode shift codes, per table
  private /*final*/ text: Uint8Array;

  public constructor(text: Uint8Array) {
    this.text = text;
  }

  /**
   * @return text represented by this encoder encoded as a {@link BitArray}
   */
  public encode(): BitArray {

    const spaceCharCode = StringUtils.getCharCode(' ');
    const lineBreakCharCode = StringUtils.getCharCode('\n');

    let states = Collections.singletonList(State.INITIAL_STATE);
    for (let index: int = 0; index < this.text.length; index++) {
      let pairCode: int;
      let nextChar: int = index + 1 < this.text.length ? this.text[index + 1] : 0;
      switch (this.text[index]) {
        case StringUtils.getCharCode('\r'):
          pairCode = nextChar === lineBreakCharCode ? 2 : 0;
          break;
        case StringUtils.getCharCode('.'):
          pairCode = nextChar === spaceCharCode ? 3 : 0;
          break;
        case StringUtils.getCharCode(','):
          pairCode = nextChar === spaceCharCode ? 4 : 0;
          break;
        case StringUtils.getCharCode(':'):
          pairCode = nextChar === spaceCharCode ? 5 : 0;
          break;
        default:
          pairCode = 0;
      }
      if (pairCode > 0) {
        // We have one of the four special PUNCT pairs.  Treat them specially.
        // Get a new set of states for the two new characters.
        states = HighLevelEncoder.updateStateListForPair(states, index, pairCode);
        index++;
      } else {
        // Get a new set of states for the new character.
        states = this.updateStateListForChar(states, index);
      }
    }
    // We are left with a set of states.  Find the shortest one.
    const minState: State = Collections.min(states, (a: State, b: State) => {
      return a.getBitCount() - b.getBitCount();
    });

    // Convert it to a bit array, and return.
    return minState.toBitArray(this.text);
  }

  // We update a set of states for a new character by updating each state
  // for the new character, merging the results, and then removing the
  // non-optimal states.
  private updateStateListForChar(states: State[], index: int): Collection<State> {
    const result: State[] = [];
    for (let state /*State*/ of states) {
      this.updateStateForChar(state, index, result);
    }
    return HighLevelEncoder.simplifyStates(result);
  }

  // Return a set of states that represent the possible ways of updating this
  // state for the next character.  The resulting set of states are added to
  // the "result" list.
  private updateStateForChar(state: State, index: int, result: Collection<State>): void {
    let ch: char = <char>(this.text[index] & 0xFF);
    let charInCurrentTable: boolean = HighLevelEncoder.CHAR_MAP[state.getMode()][ch] > 0;
    let stateNoBinary: State = null;
    for (let mode /*int*/ = 0; mode <= MODE_PUNCT; mode++) {
      let charInMode: int = HighLevelEncoder.CHAR_MAP[mode][ch];
      if (charInMode > 0) {
        if (stateNoBinary == null) {
          // Only create stateNoBinary the first time it's required.
          stateNoBinary = state.endBinaryShift(index);
        }
        // Try generating the character by latching to its mode
        if (!charInCurrentTable || mode === state.getMode() || mode === MODE_DIGIT) {
          // If the character is in the current table, we don't want to latch to
          // any other mode except possibly digit (which uses only 4 bits).  Any
          // other latch would be equally successful *after* this character, and
          // so wouldn't save any bits.
          const latchState: State = stateNoBinary.latchAndAppend(mode, charInMode);
          result.push(latchState);
        }
        // Try generating the character by switching to its mode.
        if (!charInCurrentTable && HighLevelEncoder.SHIFT_TABLE[state.getMode()][mode] >= 0) {
          // It never makes sense to temporarily shift to another mode if the
          // character exists in the current mode.  That can never save bits.
          const shiftState: State = stateNoBinary.shiftAndAppend(mode, charInMode);
          result.push(shiftState);
        }
      }
    }
    if (state.getBinaryShiftByteCount() > 0 || HighLevelEncoder.CHAR_MAP[state.getMode()][ch] === 0) {
      // It's never worthwhile to go into binary shift mode if you're not already
      // in binary shift mode, and the character exists in your current mode.
      // That can never save bits over just outputting the char in the current mode.
      let binaryState: State = state.addBinaryShiftChar(index);
      result.push(binaryState);
    }
  }

  private static updateStateListForPair(states: State[], index: int, pairCode: int): Collection<State> {
    const result: State[] = [];
    for (let state /*State*/ of states) {
      this.updateStateForPair(state, index, pairCode, result);
    }
    return this.simplifyStates(result);
  }

  private static updateStateForPair(state: State, index: int, pairCode: int, result: Collection<State>): void {
    let stateNoBinary: State = state.endBinaryShift(index);
    // Possibility 1.  Latch to MODE_PUNCT, and then append this code
    result.push(stateNoBinary.latchAndAppend(MODE_PUNCT, pairCode));
    if (state.getMode() !== MODE_PUNCT) {
      // Possibility 2.  Shift to MODE_PUNCT, and then append this code.
      // Every state except MODE_PUNCT (handled above) can shift
      result.push(stateNoBinary.shiftAndAppend(MODE_PUNCT, pairCode));
    }
    if (pairCode === 3 || pairCode === 4) {
      // both characters are in DIGITS.  Sometimes better to just add two digits
      let digitState: State = stateNoBinary
        .latchAndAppend(MODE_DIGIT, 16 - pairCode)  // period or comma in DIGIT
        .latchAndAppend(MODE_DIGIT, 1);             // space in DIGIT
      result.push(digitState);
    }
    if (state.getBinaryShiftByteCount() > 0) {
      // It only makes sense to do the characters as binary if we're already
      // in binary mode.
      let binaryState: State = state.addBinaryShiftChar(index).addBinaryShiftChar(index + 1);
      result.push(binaryState);
    }
  }

  private static simplifyStates(states: State[]): Collection<State> {
    let result: Collection<State> = [];
    for (const newState of states) {
      let add: boolean = true;
      for (let iterator = result[Symbol.iterator](); !iterator/*hasNext*/.return().done;) {
        let oldState: State = iterator.next().value;
        if (oldState.isBetterThanOrEqualTo(newState)) {
          add = false;
          break;
        }
        if (newState.isBetterThanOrEqualTo(oldState)) {
          // iterator.remove();
          result = result.filter(x => x !== oldState); // remove old state
        }
      }
      if (add) {
        result.push(newState);
      }
    }
    return result;
  }

}
