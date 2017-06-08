import Reader from "./../core/Reader"
import BinaryBitmap from './../core/BinaryBitmap'
import HybridBinarizer from './../core/common/HybridBinarizer'
import Result from './../core/Result'
import Exception from './../core/Exception'
import HTMLCanvasElementLuminanceSource from './HTMLCanvasElementLuminanceSource'
import VideoInputDevice from './VideoInputDevice'

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

    public constructor(private reader: Reader, private timeBetweenScansMillis: number = 500) {}

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

    public decodeFromInputVideoDevice(deviceId?: string, videoElementId?: string): Promise<Result> {
        this.reset()

        this.prepareVideoElement(videoElementId)

        let constraints: MediaStreamConstraints
        if (undefined === deviceId) {
            constraints = {
                video: { facingMode: "environment" }
            }
        } else {
            constraints = {
                video: { deviceId }
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

    public decodeFromVideoSource(src: string, videoElementId?: string): Promise<Result> {
        this.reset()

        this.prepareVideoElement(videoElementId)

        const me = this
        me.videoElement.setAttribute('autoplay', 'true')
        me.videoElement.setAttribute('src', src)
        return new Promise<Result>((resolve, reject) => {
            me.videoPlayEndedEventListener = () => {
                me.stop()
                reject(new Exception(Exception.NotFoundException))
            }
            me.videoElement.addEventListener('ended', me.videoPlayEndedEventListener)
            me.decodeOnceWithDelay(resolve, reject)
        })
    }
    
    private prepareVideoElement(videoElementId?: string) {
        if (undefined !== videoElementId) {
            this.videoElement = <HTMLVideoElement>this.getMediaElement(videoElementId, 'video')
        } else {
            this.videoElement = document.createElement('video')
            this.videoElement.width = 200
            this.videoElement.height = 200
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

    public decodeFromImage(imageElement?: string|HTMLImageElement, src?: string): Promise<Result> {
        this.reset()

        if (undefined === imageElement) {
            this.prepareImageElement()
        } else if (typeof imageElement === 'string') {
            this.prepareImageElement(imageElement)
        } else {
            this.imageElement = imageElement
        }

        const me = this
        return new Promise<Result>((resolve, reject) => {
            if (undefined !== src) {
                me.imageLoadedEventListener = () => {
                    me.decodeOnce(resolve, reject, false)
                }
                me.imageElement.addEventListener('load', me.imageLoadedEventListener)
                
                me.imageElement.src = src
            } else if (this.isImageLoaded(this.imageElement)) {
                me.decodeOnce(resolve, reject, false)
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

    private prepareImageElement(imageElementId?: string) {
        if (undefined !== imageElementId) {
            this.imageElement = <HTMLImageElement>this.getMediaElement(imageElementId, 'img')
        } else {
            this.imageElement = document.createElement('img')
            this.imageElement.width = 200
            this.imageElement.height = 200
        }
    }

    private decodeOnceWithDelay(resolve: (result: Result) => any, reject: (error: any) => any): void {
        this.timeoutHandler = window.setTimeout(this.decodeOnce.bind(this, resolve, reject), this.timeBetweenScansMillis)
    }

    private decodeOnce(resolve: (result: Result) => any, reject: (error: any) => any, retryIfNotFound: boolean = true): void {
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
            if (retryIfNotFound && Exception.isOfType(re, Exception.NotFoundException)) {
                console.log('not found, trying again...')
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
