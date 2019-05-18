export default abstract class DecodedObject {

  private readonly newPosition: number;

  constructor(newPosition: number) {
    this.newPosition = newPosition;
  }

  getNewPosition(): number {
    return this.newPosition;
  }

}
