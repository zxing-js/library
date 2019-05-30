import { HTMLCanvasElementLuminanceSource } from './HTMLCanvasElementLuminanceSource';
import { VideoInputDevice } from './VideoInputDevice';
import Reader from '../core/Reader';
import BinaryBitmap from '../core/BinaryBitmap';
import HybridBinarizer from '../core/common/HybridBinarizer';
import Result from '../core/Result';
import NotFoundException from '../core/NotFoundException';
import ArgumentException from '../core/ArgumentException';
import DecodeHintType from '../core/DecodeHintType';
import ChecksumException from '../core/ChecksumException';
import FormatException from '../core/FormatException';

type HTMLVisualMediaElement = HTMLVideoElement | HTMLImageElement;

/**
 * @deprecated Moving to @zxing/browser
 *
 * Base class for browser code reader.
 */
export class BrowserCodeReader {

    /**
     * The HTML video element, used to display the camera stream.
     */
    protected videoElement: HTMLVideoElement;

    /**
     * The HTML image element, used as a fallback for the video element when decoding.
     */
    protected imageElement: HTMLImageElement;

    /**
     * The HTML canvas element, used to draw the video or image's frame for decoding.
     */
    protected canvasElement: HTMLCanvasElement;
    /**
     * The HTML canvas element context.
     */
    protected canvasElementContext: CanvasRenderingContext2D;

    protected timeoutHandler: number;

    /**
     * The stream output from camera.
     */
    protected stream: MediaStream;

    /**
     * Should contain the current registered listener for video loaded-metadata,
     * used to unregister that listener when needed.
     */
    protected videoLoadedMetadataEventListener: EventListener;

    /**
     * Should contain the current registered listener for video play-ended,
     * used to unregister that listener when needed.
     */
    protected videoPlayEndedEventListener: EventListener;

    /**
     * Should contain the current registered listener for video playing,
     * used to unregister that listener when needed.
     */
    protected videoPlayingEventListener: EventListener;

    /**
     * Should contain the current registered listener for image loading,
     * used to unregister that listener when needed.
     */
    protected imageLoadedEventListener: EventListener;

    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     *
     * @memberOf BrowserCodeReader
     */
    public constructor(protected readonly reader: Reader, protected timeBetweenScansMillis: number = 500, protected hints?: Map<DecodeHintType, any>) { }

    /**
     * Obtain the list of available devices with type 'videoinput'.
     *
     * @returns {Promise<VideoInputDevice[]>} an array of available video input devices
     *
     * @memberOf BrowserCodeReader
     */
    public getVideoInputDevices(): Promise<VideoInputDevice[]> {
        return new Promise<VideoInputDevice[]>((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices()
                .then((devices: MediaDeviceInfo[]) => {
                    const sources = new Array<VideoInputDevice>();
                    let c = 0;
                    for (let i = 0, length = devices.length; i !== length; i++) {
                        const device = devices[i];
                        if (device.kind === 'videoinput') {
                            sources.push(new VideoInputDevice(device.deviceId, device.label || `Video source ${c}`));
                            c++;
                        }
                    }
                    resolve(sources);
                })
                .catch((err: any) => {
                    reject(err);
                });
        });
    }

    /**
     * Decodes the barcode from the device specified by deviceId while showing the video in the specified video element.
     *
     * @param {string} [deviceId] the id of one of the devices obtained after calling getVideoInputDevices. Can be undefined, in this case it will decode from one of the available devices, preffering the main camera (environment facing) if available.
     * @param {(string|HTMLVideoElement)} [videoElement] the video element in page where to show the video while decoding. Can be either an element id or directly an HTMLVideoElement. Can be undefined, in which case no video will be shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    public decodeFromInputVideoDevice(deviceId?: string, videoElement?: string | HTMLVideoElement): Promise<Result> {
        this.reset();

        this.prepareVideoElement(videoElement);

        let constraints: MediaStreamConstraints;
        if (undefined === deviceId) {
            constraints = {
                video: { facingMode: 'environment' }
            };
        } else {
            constraints = {
                video: { deviceId: { exact: deviceId } }
            };
        }

        return new Promise<Result>((resolve, reject) => {

            const callback = () => {
                this.decodeOnceWithDelay(resolve, reject);
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then((stream: MediaStream) => this.startDecodeFromStream(stream, callback))
                .catch((error) => reject(error));
        });
    }

    /**
     * Sets the new stream and request a new decoding-with-delay.
     *
     * @param stream The stream to be shown in the video element.
     * @param callbackFn A callback for the decode method.
     *
     * @todo Return Promise<Result>
     */
    protected startDecodeFromStream(stream: MediaStream, callbackFn?: (...args: any[]) => any): void {
        this.stream = stream;
        if (!this.videoElement && this.stream.active) {
            return this.reset();
        }
        this.bindVideoSrc(this.videoElement, stream);
        this.bindEvents(this.videoElement, callbackFn);
    }

    /**
     * Binds listeners and callbacks to the videoElement.
     *
     * @param videoElement
     * @param callbackFn
     */
    protected bindEvents(videoElement: HTMLVideoElement, listener: EventListener): void {

        this.videoPlayingEventListener = listener;

        videoElement.addEventListener('playing', this.videoPlayingEventListener);

        this.videoLoadedMetadataEventListener = () => videoElement.play();

        videoElement.addEventListener('loadedmetadata', this.videoLoadedMetadataEventListener);
    }

    /**
     * Decodes a barcode form a video url.
     *
     * @param {string} videoUrl The video url to decode from, required.
     * @param {(string|HTMLVideoElement)} [videoElement] The video element where to play the video while decoding. Can be undefined in which case no video is shown.
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    public decodeFromVideoSource(videoUrl: string, videoElement?: string | HTMLVideoElement): Promise<Result> {
        this.reset();

        this.prepareVideoElement(videoElement);

        return new Promise<Result>((resolve, reject) => {

            this.videoPlayEndedEventListener = () => {
                this.stopStreams();
                reject(new NotFoundException());
            };

            this.videoElement.addEventListener('ended', this.videoPlayEndedEventListener);

            this.videoPlayingEventListener = () => {
                this.decodeOnceWithDelay(resolve, reject);
            };
            this.videoElement.addEventListener('playing', this.videoPlayingEventListener);

            this.videoElement.setAttribute('autoplay', 'true');
            this.videoElement.setAttribute('src', videoUrl);
        });
    }

    /**
     * Sets a HTMLVideoElement for scanning or creates a new one.
     *
     * @param videoElement The HTMLVideoElement to be set.
     */
    protected prepareVideoElement(videoElement?: HTMLVideoElement | string): void {

        if (!videoElement && typeof document !== 'undefined') {
            videoElement = document.createElement('video');
            videoElement.width = 200;
            videoElement.height = 200;
        }

        if (typeof videoElement === 'string') {
            videoElement = <HTMLVideoElement>this.getMediaElement(videoElement, 'video');
        }

        // Needed for iOS 11
        videoElement.setAttribute('autoplay', 'true');
        videoElement.setAttribute('muted', 'true');
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('autofocus', 'true');

        this.videoElement = videoElement;
    }

    /**
     * Searches and validates a media element.
     */
    protected getMediaElement(mediaElementId: string, type: string): HTMLVisualMediaElement {

        const mediaElement = document.getElementById(mediaElementId);

        if (!mediaElement) {
            throw new ArgumentException(`element with id '${mediaElementId}' not found`);
        }

        if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase()) {
            throw new ArgumentException(`element with id '${mediaElementId}' must be an ${type} element`);
        }

        return <HTMLVisualMediaElement>mediaElement;
    }

    /**
     * Decodes the barcode from an image.
     *
     * @param {(string|HTMLImageElement)} [imageElement] The image element that can be either an element id or the element itself. Can be undefined in which case the decoding will be done from the imageUrl parameter.
     * @param {string} [imageUrl]
     * @returns {Promise<Result>} The decoding result.
     *
     * @memberOf BrowserCodeReader
     */
    public decodeFromImage(imageElement?: string | HTMLImageElement, imageUrl?: string): Promise<Result> {

        if (undefined === imageElement && undefined === imageUrl) {
            throw new ArgumentException('either imageElement with a src set or an url must be provided');
        }

        if (imageUrl && !imageElement) {
            return this.decodeFromImageUrl(imageUrl);
        }

        return this.decodeFromImageElement(imageElement, imageUrl);
    }

    /**
     * Decodes something from an image HTML element.
     */
    public decodeFromImageElement(imageElement: string | HTMLImageElement, imageUrl: string) {
        return new Promise<Result>((resolve, reject) => this._decodeFromImageElement(imageElement, resolve, reject));
    }

    /**
     * Promise constructor.
     */
    private _decodeFromImageElement(imageElement: string | HTMLImageElement, resolve: (value?: Result | PromiseLike<Result>) => void, reject: (reason?: any) => void) {

        if (!imageElement) {
            throw new ArgumentException('An image element must be provided.');
        }

        this.reset();

        const image = this.prepareImageElement(imageElement);

        if (this.isImageLoaded(image)) {
            this.decodeOnce(resolve, reject, false, true);
        } else {
            this._decodeOnLoadImage(image, resolve, reject);
        }

        this.imageElement = image;
    }

    /**
     * Decodes an image from a URL.
     */
    public decodeFromImageUrl(imageUrl?: string): Promise<Result> {
        return new Promise<Result>((resolve, reject) => this._decodeFromImageUrl(imageUrl, resolve, reject));
    }

    /**
     * Promise constructor.
     */
    private _decodeFromImageUrl(imageUrl: string, resolve: (value?: Result | PromiseLike<Result>) => void, reject: (reason?: any) => void) {

        if (!imageUrl) {
            throw new ArgumentException('An URL must be provided.');
        }

        this.reset();

        const image = this.prepareImageElement();

        this._decodeOnLoadImage(image, resolve, reject);

        image.src = imageUrl;

        this.imageElement = image;
    }

    private _decodeOnLoadImage(imageElement: HTMLImageElement, resolve: (value?: Result | PromiseLike<Result>) => void, reject: (reason?: any) => void) {
        this.imageLoadedEventListener = () => this.decodeOnce(resolve, reject, false, true);
        imageElement.addEventListener('load', this.imageLoadedEventListener);
    }

    protected isImageLoaded(img: HTMLImageElement) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false;
        }

        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.

        if (img.naturalWidth === 0) {
            return false;
        }

        // No other way of checking: assume it’s ok.
        return true;
    }

    protected prepareImageElement(imageElement?: string | HTMLImageElement): HTMLImageElement {

        if (typeof imageElement === 'undefined') {
            imageElement = document.createElement('img');
            imageElement.width = 200;
            imageElement.height = 200;
        }

        if (typeof imageElement === 'string') {
            imageElement = <HTMLImageElement>this.getMediaElement(imageElement, 'img');
        }

        return imageElement;
    }

    protected decodeOnceWithDelay(resolve: (result: Result) => any, reject: (error: any) => any): void {
        this.timeoutHandler = window.setTimeout(this.decodeOnce.bind(this, resolve, reject), this.timeBetweenScansMillis);
    }

    protected decodeOnce(resolve: (result: Result) => any, reject: (error: any) => any, retryIfNotFound: boolean = true, retryIfChecksumOrFormatError: boolean = true): void {

        try {
            const result = this.decode();
            resolve(result);
        } catch (re) {
            if (retryIfNotFound && re instanceof NotFoundException) {
                // Not found, trying again
                this.decodeOnceWithDelay(resolve, reject);
            } else if (retryIfChecksumOrFormatError && (re instanceof ChecksumException || re instanceof FormatException)) {
                // checksum or format error, trying again
                this.decodeOnceWithDelay(resolve, reject);
            } else {
                reject(re);
            }
        }
    }

    /**
     * Gets the BinaryBitmap for ya! (and decodes it)
     */
    protected decode(element?: HTMLVisualMediaElement): Result {

        const mediaElement = element || this.videoElement || this.imageElement;

        // get binary bitmap for decode function
        const binaryBitmap = this.createBinaryBitmap(mediaElement);

        return this.decodeBitmap(binaryBitmap);
    }

    /**
     * Creates a binaryBitmap based in some image source.
     *
     * @param mediaElement HTML element containing drawable image source.
     */
    protected createBinaryBitmap(mediaElement: HTMLVisualMediaElement): BinaryBitmap {

        if (undefined === this.canvasElementContext) {
            this.prepareCaptureCanvas();
        }

        this.drawImageOnCanvas(this.canvasElementContext, mediaElement);

        const luminanceSource = new HTMLCanvasElementLuminanceSource(this.canvasElement);
        const hybridBinarizer = new HybridBinarizer(luminanceSource);

        return new BinaryBitmap(hybridBinarizer);
    }

    /**
     * Ovewriting this allows you to manipulate the snapshot image in anyway you want before decode.
     */
    protected drawImageOnCanvas(canvasElementContext: CanvasRenderingContext2D, srcElement: HTMLVisualMediaElement) {
        canvasElementContext.drawImage(srcElement, 0, 0);
    }

    /**
     * Call the encapsulated readers decode
     */
    protected decodeBitmap(binaryBitmap: BinaryBitmap): Result {
        return this.reader.decode(binaryBitmap, this.hints);
    }

    /**
     * 🖌 Prepares the canvas for capture and scan frames.
     */
    protected prepareCaptureCanvas(): void {

        if (typeof document === 'undefined') {

            this.canvasElement = undefined;
            this.canvasElementContext = undefined;

            return;
        }

        const canvasElement = document.createElement('canvas');

        let width: number;
        let height: number;

        if (typeof this.videoElement !== 'undefined') {
            width = this.videoElement.videoWidth;
            height = this.videoElement.videoHeight;
        }

        if (!width && !height && typeof this.imageElement !== 'undefined') {
            width = this.imageElement.naturalWidth || this.imageElement.width;
            height = this.imageElement.naturalHeight || this.imageElement.height;
        }

        canvasElement.style.width = width + 'px';
        canvasElement.style.height = height + 'px';
        canvasElement.width = width;
        canvasElement.height = height;

        this.canvasElement = canvasElement;
        this.canvasElementContext = canvasElement.getContext('2d');
    }

    /**
     * Stops the continuous scan and cleans the stream.
     */
    protected stopStreams(): void {
        if (this.stream) {
            this.stream.getVideoTracks().forEach(t => t.stop());
            this.stream = undefined;
        }
    }

    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     *
     * @memberOf BrowserCodeReader
     */
    public reset() {

        window.clearTimeout(this.timeoutHandler);

        // stops the camera, preview and scan 🔴

        this.stopStreams();

        // clean and forget about HTML elements

        this._destroyVideoElement();
        this._destroyImageElement();
        this._destroyCanvasElement();
    }

    private _destroyVideoElement(): void {

        if (!this.videoElement) {
            return;
        }

        // first gives freedon to the element 🕊

        if (typeof this.videoPlayEndedEventListener !== 'undefined') {
            this.videoElement.removeEventListener('ended', this.videoPlayEndedEventListener);
        }

        if (typeof this.videoPlayingEventListener !== 'undefined') {
            this.videoElement.removeEventListener('playing', this.videoPlayingEventListener);
        }

        if (typeof this.videoLoadedMetadataEventListener !== 'undefined') {
            this.videoElement.removeEventListener('loadedmetadata', this.videoLoadedMetadataEventListener);
        }

        // then forgets about that element 😢

        this.unbindVideoSrc(this.videoElement);

        this.videoElement.removeAttribute('src');
        this.videoElement = undefined;
    }

    private _destroyImageElement(): void {

        if (!this.imageElement) {
            return;
        }

        // first gives freedon to the element 🕊

        if (undefined !== this.imageLoadedEventListener) {
            this.imageElement.removeEventListener('load', this.imageLoadedEventListener);
        }

        // then forget about that element 😢

        this.imageElement.src = undefined;
        this.imageElement.removeAttribute('src');
        this.imageElement = undefined;
    }

    /**
     * Cleans canvas references 🖌
     */
    private _destroyCanvasElement(): void {

        // then forget about that element 😢

        this.canvasElementContext = undefined;
        this.canvasElement = undefined;
    }

    /**
     * Defines what the videoElement src will be.
     *
     * @param videoElement
     * @param stream
     */
    public bindVideoSrc(videoElement: HTMLVideoElement, stream: MediaStream): void {
        // Older browsers may not have `srcObject`
        try {
            // @NOTE Throws Exception if interrupted by a new loaded request
            videoElement.srcObject = stream;
        } catch (err) {
            // @NOTE Avoid using this in new browsers, as it is going away.
            videoElement.src = window.URL.createObjectURL(stream);
        }
    }

    /**
     * Unbinds a HTML video src property.
     *
     * @param videoElement
     */
    public unbindVideoSrc(videoElement: HTMLVideoElement): void {
        try {
            videoElement.srcObject = null;
        } catch (err) {
            videoElement.src = '';
        }
    }
}
