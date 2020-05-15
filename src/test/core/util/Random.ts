import * as seedrandom from 'seedrandom';

import { int } from '../../../customTypings';

export default class Random {
  private r: seedrandom.prng;
  public constructor(seed: string | number) {
    this.r = seedrandom('' + seed);
  }

  public next(max: int): int {
    return Math.floor(this.r() * max);
  }

  public nextInt(max: int): int {
    return this.next(max);
  }

  public nextBoolean(): boolean {
    return !Math.round(this.r()); // 0 or 1
  }
}
