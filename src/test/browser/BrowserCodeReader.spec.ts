import { getEventListeners } from 'events';
import { BrowserMultiFormatReader } from '../../browser/BrowserMultiFormatReader';

class VideoElement extends EventTarget {
  public srcObject: MediaStream = null;
  public setAttribute: jest.Mock = jest.fn();
  public removeAttribute: jest.Mock = jest.fn();
  public play: jest.Mock = jest.fn(async () => {
    this.dispatchEvent(new Event('playing'));
  });
}

class TestReader extends BrowserMultiFormatReader {
  // Exercise stream setup and cleanup without starting the decoding loop.
  public decodeContinuously: jest.Mock = jest.fn();

  public listen(video: HTMLVideoElement, callback: EventListener): void {
    this.videoElement = video;
    this.playVideoOnLoad(video, callback);
  }
}

describe('BrowserCodeReader video lifecycle', () => {
  let reader: TestReader;
  let stopTracks: jest.Mock[];
  let originalNavigator: PropertyDescriptor;
  let originalVideoElement: PropertyDescriptor;
  let originalDocument: PropertyDescriptor;

  const cameraCount = 4;
  const noCalls = 0;
  const noListeners = [noCalls, noCalls, noCalls];
  const firstTrackIndex = 0;

  const asVideo = (video: VideoElement) => video as unknown as HTMLVideoElement;
  const listenerCounts = (video: VideoElement) =>
    ['ended', 'canplay', 'playing'].map(type => getEventListeners(video, type).length);

  beforeEach(() => {
    reader = new TestReader();
    stopTracks = [];
    originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    originalVideoElement = Object.getOwnPropertyDescriptor(globalThis, 'HTMLVideoElement');
    originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        mediaDevices: {
          getUserMedia: jest.fn(async () => {
            const stop = jest.fn();
            stopTracks.push(stop);
            return { getVideoTracks: () => [{ stop }] };
          }),
        },
      },
    });
    Object.defineProperty(globalThis, 'HTMLVideoElement', {
      configurable: true,
      value: VideoElement,
    });
  });

  afterEach(() => {
    reader.reset();
    const originals: [string, PropertyDescriptor][] = [
      ['navigator', originalNavigator],
      ['HTMLVideoElement', originalVideoElement],
      ['document', originalDocument],
    ];
    originals.forEach(([name, descriptor]) => {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    });
  });

  it('replaces listeners on each camera switch and removes them on reset', async () => {
    const video = new VideoElement();
    for (let camera = 0; camera < cameraCount; camera++) {
      await reader.decodeFromVideoDevice(`camera-${camera}`, asVideo(video), jest.fn());
      expect(listenerCounts(video)).toEqual([1, 1, 1]);
      stopTracks.forEach((stop, index) => {
        expect(stop).toHaveBeenCalledTimes(index < camera ? 1 : noCalls);
      });
      const playCalls = video.play.mock.calls.length;
      video.dispatchEvent(new Event('canplay'));
      expect(video.play).toHaveBeenCalledTimes(playCalls + 1);
    }

    reader.reset();
    expect(listenerCounts(video)).toEqual(noListeners);
    expect(video.srcObject).toBeNull();
    expect(video.removeAttribute).toHaveBeenCalledWith('src');
    const playCalls = video.play.mock.calls.length;
    video.dispatchEvent(new Event('canplay'));
    video.dispatchEvent(new Event('ended'));
    expect(video.play).toHaveBeenCalledTimes(playCalls);
    reader.reset();
    stopTracks.forEach(stop => expect(stop).toHaveBeenCalledTimes(1));
  });

  it('detaches the old video when changing to a different element', async () => {
    const oldVideo = new VideoElement();
    const newVideo = new VideoElement();
    await reader.decodeFromVideoDevice('first', asVideo(oldVideo), jest.fn());
    await reader.decodeFromVideoDevice('second', asVideo(newVideo), jest.fn());

    expect(listenerCounts(oldVideo)).toEqual(noListeners);
    expect(listenerCounts(newVideo)).toEqual([1, 1, 1]);
    expect(oldVideo.srcObject).toBeNull();
    oldVideo.dispatchEvent(new Event('ended'));
    expect(stopTracks[1]).not.toHaveBeenCalled();
    newVideo.dispatchEvent(new Event('ended'));
    expect(stopTracks[1]).toHaveBeenCalledTimes(1);
  });

  it('removes the playing callback so events after reset do not invoke it', () => {
    const video = new VideoElement();
    const callback = jest.fn();
    reader.listen(asVideo(video), callback);
    expect(callback).toHaveBeenCalledTimes(1);

    reader.reset();
    video.dispatchEvent(new Event('playing'));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(listenerCounts(video)).toEqual(noListeners);
  });

  it('cleans up an internally created video when no video source is provided', async () => {
    const video = new VideoElement();
    const createElement = jest.fn(() => video);
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { createElement },
    });
    await reader.decodeFromVideoDevice('camera', undefined, jest.fn());
    expect(createElement).toHaveBeenCalledWith('video');
    expect(listenerCounts(video)).toEqual([1, 1, 1]);

    reader.reset();
    expect(listenerCounts(video)).toEqual(noListeners);
    expect(video.srcObject).toBeNull();
    expect(stopTracks[firstTrackIndex]).toHaveBeenCalledTimes(1);
  });
});
