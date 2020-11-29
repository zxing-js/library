import Random from '../../../core/util/Random';
import BitSet from '../../../core/util/BitSet';

/**
 * This function was part of ReedSolomonTestCase, but as it's used
 * by other tests, it had to be separated in order to not trigger
 * ReedSolomon spec when imported.
 *
 * @param received
 * @param howMany
 * @param random
 * @param max
 */
export function corrupt(received: Int32Array, howMany: number /*int*/, random: Random, max: number /*int*/): void {
  const corrupted: BitSet = new Map<number, boolean>( /*received.length*/);
  for (let j: number /*int*/ = 0; j < howMany; j++) {
    const location: number /*int*/ = random.next(received.length);
    const value: number /*int*/ = random.next(max);
    if (corrupted.get(location) === true || received[location] === value) {
      j--;
    }
    else {
      corrupted.set(location, true);
      received[location] = value;
    }
  }
}
