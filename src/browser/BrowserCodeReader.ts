import Reader from "./../core/Reader"
import BinaryBitmap from './../core/BinaryBitmap'
import HybridBinarizer from './../core/common/HybridBinarizer'
import Result from './../core/Result'
import Exception from './../core/Exception'
import HTMLCanvasElementLuminanceSource from './HTMLCanvasElementLuminanceSource'
import VideoInputDevice from './VideoInputDevice'

/**
 * Base class for browser code reader.
 * 
 * @export
 * @class BrowserCodeReader
 */
export default class BrowserCodeReader {
    private videoElement: HTMLVideoElement
    private imageElement: HTMLImageElement
    private canvasElement: HTMLCanvasElement
    private canvasElementContext: CanvasRenderingContext2D
    private timeoutHandler: number
    private stream: MediaStream
    private videoPlayEndedEventListener: EventListener
    private videoPlayingEventListener: EventListener
    private imageLoadedEventListener: EventListener

    /**
     * Creates an instance of BrowserCodeReader.
     * @param {Reader} reader The reader instance to decode the barcode
     * @param {number} [timeBetweenScansMillis=500] the time delay between subsequent decode tries
     * 
     * @memberOf BrowserCodeReader
     */
    public constructor(private reader: Reader, private timeBetweenScansMillis: number = 500) {}

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
                    const sources = new Array<VideoInputDevice>()
                    let c = 0
                    for(let i = 0, length = devices.length; i != length; i++) {
                        const device = devices[i]
                        if (device.kind === 'videoinput') {
                            sources.push(new VideoInputDevice(device.deviceId, device.label || `Video source ${c}`))
                            c++
                        }
                    }
                    resolve(sources)
                })
                .catch((err: any) => {
                    reject(err)
                })
        })
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
    public decodeFromInputVideoDevice(deviceId?: string, videoElement?: string|HTMLVideoElement): Promise<Result> {
        this.reset()

        this.prepareVideoElement(videoElement)

        let constraints: MediaStreamConstraints
        if (undefined === deviceId) {
            constraints = {
                video: { facingMode: "environment" }
            }
        } else {
            constraints = {
                video: { deviceId: { exact: deviceId } }
            }
        }

        const me = this
        return new Promise<Result>((resolve, reject) => {
            
            navigator.mediaDevices.getUserMedia(constraints)
            .then((stream: MediaStream) => {
                me.stream = stream
                me.videoElement.srcObject = stream

                me.videoPlayingEventListener = () => {
                    me.decodeOnceWithDelay(resolve, reject)
                }
                me.videoElement.addEventListener('playing', me.videoPlayingEventListener)
                me.videoElement.play()
            })
            .catch((error) => {
                reject(error)
            })
        })
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
    public decodeFromVideoSource(videoUrl: string, videoElement?: string|HTMLVideoElement): Promise<Result> {
        this.reset()

        this.prepareVideoElement(videoElement)

        const me = this
        return new Promise<Result>((resolve, reject) => {
            me.videoPlayEndedEventListener = () => {
                me.stop()
                reject(new Exception(Exception.NotFoundException))
            }
            me.videoElement.addEventListener('ended', me.videoPlayEndedEventListener)

            me.videoPlayingEventListener = () => {
                me.decodeOnceWithDelay(resolve, reject)
            }
            me.videoElement.addEventListener('playing', me.videoPlayingEventListener)

            me.videoElement.setAttribute('autoplay', 'true')
            me.videoElement.setAttribute('src', videoUrl)
        })
    }
    
    private prepareVideoElement(videoElement?: string|HTMLVideoElement) {
        if (undefined === videoElement) {
            this.videoElement = document.createElement('video')
            this.videoElement.width = 200
            this.videoElement.height = 200
        } else if (typeof videoElement === 'string') {
            this.videoElement = <HTMLVideoElement>this.getMediaElement(videoElement, 'video')
        } else {
            this.videoElement = videoElement
        }
    }

    private getMediaElement(mediaElementId: string, type: string) {
        const mediaElement = document.getElementById(mediaElementId)
        if (null === mediaElement) {
            throw new Exception(Exception.ArgumentException, `element with id '${mediaElementId}' not found`)
        }
        if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase()) {
            console.log(mediaElement.nodeName)
            throw new Exception(Exception.ArgumentException, `element with id '${mediaElementId}' must be an ${type} element`)
        }
        return mediaElement
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
    public decodeFromImage(imageElement?: string|HTMLImageElement, imageUrl?: string): Promise<Result> {
        this.reset()

        if (undefined === imageElement && undefined === imageUrl) {
            throw new Exception(Exception.ArgumentException, 'either imageElement with a src set or an url must be provided')
        }

        this.prepareImageElement(imageElement)

        const me = this
        return new Promise<Result>((resolve, reject) => {
            if (undefined !== imageUrl) {
                me.imageLoadedEventListener = () => {
                    me.decodeOnce(resolve, reject, false, true)
                }
                me.imageElement.addEventListener('load', me.imageLoadedEventListener)
                
                me.imageElement.src = imageUrl
            } else if (this.isImageLoaded(this.imageElement)) {
                me.decodeOnce(resolve, reject, false, true)
            } else {
                throw new Exception(Exception.ArgumentException, `either src or a loaded img should be provided`)
            }
        })
    }

    private isImageLoaded(img: HTMLImageElement) {
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false
        }

        // However, they do have two very useful properties: naturalWidth and
        // naturalHeight. These give the true size of the image. If it failed
        // to load, either of these should be zero.

        if (img.naturalWidth === 0) {
            return false
        }

        // No other way of checking: assume it’s ok.
        return true
    }

    private prepareImageElement(imageElement?: string|HTMLImageElement) {
        if (undefined === imageElement) {
            this.imageElement = document.createElement('img')
            this.imageElement.width = 200
            this.imageElement.height = 200
        } else if (typeof imageElement === 'string') {
            this.imageElement = <HTMLImageElement>this.getMediaElement(imageElement, 'img')
        } else {
            this.imageElement = imageElement
        }
    }

    private decodeOnceWithDelay(resolve: (result: Result) => any, reject: (error: any) => any): void {
        this.timeoutHandler = window.setTimeout(this.decodeOnce.bind(this, resolve, reject), this.timeBetweenScansMillis)
    }

    private decodeOnce(resolve: (result: Result) => any, reject: (error: any) => any, retryIfNotFound: boolean = true, retryIfChecksumOrFormatError: boolean = true): void {
        if (undefined === this.canvasElementContext) {
            this.prepareCaptureCanvas()
        }

        this.canvasElementContext.drawImage(this.videoElement||this.imageElement, 0, 0)

        const luminanceSource = new HTMLCanvasElementLuminanceSource(this.canvasElement)
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource))
        try {
            const result = this.readerDecode(binaryBitmap)
            resolve(result)
        } catch(re) {
            console.log(retryIfChecksumOrFormatError, re)
            if (retryIfNotFound && Exception.isOfType(re, Exception.NotFoundException)) {
                console.log('not found, trying again...')
                this.decodeOnceWithDelay(resolve, reject)
            } else if (retryIfChecksumOrFormatError && ( Exception.isOfType(re, Exception.ChecksumException) || Exception.isOfType(re, Exception.FormatException) ) ) {
                console.log('checksum or format error, trying again...', re)
                this.decodeOnceWithDelay(resolve, reject)
            } else {
                reject(re)
            }
        }
    }

    protected readerDecode(binaryBitmap: BinaryBitmap): Result {
        return this.reader.decode(binaryBitmap)
    }

    private prepareCaptureCanvas() {
        const canvasElement = document.createElement('canvas')
        let width, height
        if (undefined !== this.videoElement) {
            width = this.videoElement.videoWidth
            height = this.videoElement.videoHeight
        } else {
            width = this.imageElement.naturalWidth || this.imageElement.width
            height = this.imageElement.naturalHeight || this.imageElement.height
        }
        canvasElement.style.width = `${width}px`
        canvasElement.style.height = `${height}px`
        canvasElement.width = width
        canvasElement.height = height

        this.canvasElement = canvasElement
        this.canvasElementContext = canvasElement.getContext('2d')
        
        //this.videoElement.parentElement.appendChild(this.canvasElement)
    }

    private stop() {
        if (undefined !== this.timeoutHandler) {
            window.clearTimeout(this.timeoutHandler)
            this.timeoutHandler = undefined
        }
        if (undefined !== this.stream) {
            this.stream.getTracks()[0].stop()
            this.stream = undefined
        }
    }

    /**
     * Resets the code reader to the initial state. Cancels any ongoing barcode scanning from video or camera.
     * 
     * @memberOf BrowserCodeReader
     */
    public reset() {
        this.stop()

        if (undefined !== this.videoPlayEndedEventListener && undefined !== this.videoElement) {
            this.videoElement.removeEventListener('ended', this.videoPlayEndedEventListener)
        }
        if (undefined !== this.videoPlayingEventListener && undefined !== this.videoElement) {
            this.videoElement.removeEventListener('playing', this.videoPlayingEventListener)
        }
        if (undefined !== this.videoElement) {
            this.videoElement.srcObject = undefined
            this.videoElement.removeAttribute('src')
            this.videoElement = undefined
        }
        if (undefined !== this.videoPlayEndedEventListener && undefined !== this.imageElement) {
            this.imageElement.removeEventListener('load', this.imageLoadedEventListener)
        }
        if (undefined !== this.imageElement) {
            this.imageElement.src = undefined
            this.imageElement.removeAttribute('src')
            this.imageElement = undefined
        }
        this.canvasElementContext = undefined
        this.canvasElement = undefined
    }
}
