export class VideoElement extends EventTarget {
  public srcObject: MediaStream = null;
  public setAttribute: jest.Mock = jest.fn();
  public removeAttribute: jest.Mock = jest.fn();
  public play: jest.Mock = jest.fn(async () => {
    this.dispatchEvent(new Event('playing'));
  });
}
