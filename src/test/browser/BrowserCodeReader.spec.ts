import { BrowserCodeReader } from '../../browser/BrowserCodeReader';
import MultiFormatReader from '../../core/MultiFormatReader';

class VideoElement {
  videoWidth = 4;
  videoHeight = 3;
}

describe('BrowserCodeReader canvas hooks', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'HTMLVideoElement', {
      configurable: true,
      value: VideoElement,
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'HTMLVideoElement');
  });

  function readerWithCanvas() {
    const context = {
      drawImage: jest.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(4 * 3 * 4) }),
    };
    const canvas = { width: 4, height: 3, getContext: () => context };
    const reader = new BrowserCodeReader(new MultiFormatReader());
    jest.spyOn(reader, 'createCaptureCanvas').mockReturnValue(canvas as unknown as HTMLCanvasElement);
    return { reader, context };
  }

  it('passes video dimensions and the capture context to a frame override', () => {
    const { reader, context } = readerWithCanvas();
    const video = new VideoElement() as unknown as HTMLVideoElement;
    const draw = jest.spyOn(reader, 'drawFrameOnCanvas');

    reader.createBinaryBitmap(video);

    expect(draw).toHaveBeenCalledWith(video, {
      sx: 0, sy: 0, sWidth: 4, sHeight: 3,
      dx: 0, dy: 0, dWidth: 4, dHeight: 3,
    }, context);
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 0, 4, 3, 0, 0, 4, 3);
  });

  it('passes natural image dimensions and the capture context to an image override', () => {
    const { reader, context } = readerWithCanvas();
    const image = { naturalWidth: 4, naturalHeight: 3, width: 8, height: 6 } as HTMLImageElement;
    const draw = jest.spyOn(reader, 'drawImageOnCanvas');

    reader.createBinaryBitmap(image);

    expect(draw).toHaveBeenCalledWith(image, {
      sx: 0, sy: 0, sWidth: 4, sHeight: 3,
      dx: 0, dy: 0, dWidth: 4, dHeight: 3,
    }, context);
    expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 4, 3, 0, 0, 4, 3);
  });
});
