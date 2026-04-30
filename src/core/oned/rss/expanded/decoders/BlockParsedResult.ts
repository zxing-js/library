import DecodedInformation from './DecodedInformation';

export default class BlockParsedResult {

  private readonly decodedInformation: DecodedInformation | null;
  private readonly finished: boolean;

  constructor(decodedInformation?: DecodedInformation | null, finished?: boolean) {
    this.decodedInformation = decodedInformation ? decodedInformation : null;
    this.finished = !!finished;
  }

  getDecodedInformation(): DecodedInformation | null {
    return this.decodedInformation;
  }

  isFinished(): boolean {
    return this.finished;
  }

}