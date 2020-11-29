import DecodedInformation from './DecodedInformation';

export default class BlockParsedResult {

  private readonly decodedInformation: DecodedInformation;
  private readonly finished: boolean;

  constructor(finished: boolean, decodedInformation?: DecodedInformation) {
    if (decodedInformation) {
      this.decodedInformation = null;
    } else {
      this.finished = finished;
      this.decodedInformation = decodedInformation;
    }
  }

  getDecodedInformation(): DecodedInformation {
    return this.decodedInformation;
  }

  isFinished(): boolean {
    return this.finished;
  }

}