enum State {
  NUMERIC,
  ALPHA,
  ISO_IEC_646
}

export default class CurrentParsingState {
  private position: number;
  private encoding: State;
  constructor() {
    this.position = 0;
    this.encoding = State.NUMERIC;
  }
  getPosition(): number {
    return this.position;
  }
  setPosition(position: number): void {
    this.position = position;
  }
  incrementPosition(delta: number): void {
    this.position += delta;
  }

  isAlpha(): boolean {
    return this.encoding === State.ALPHA;
  }

  isNumeric(): boolean {
    return this.encoding === State.NUMERIC;
  }

  isIsoIec646(): boolean {
    return this.encoding === State.ISO_IEC_646;
  }

  setNumeric(): void {
    this.encoding = State.NUMERIC;
  }

  setAlpha(): void {
    this.encoding = State.ALPHA;
  }

  setIsoIec646(): void {
    this.encoding = State.ISO_IEC_646;
  }
}
