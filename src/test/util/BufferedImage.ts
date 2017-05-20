import * as sharp from 'sharp'
import * as async from 'async'

export default class BufferedImage {
    
    public constructor(
        private wrapper: sharp.SharpInstance, 
        private buffer: Uint8Array, 
        private width: number, 
        private height: number) {}

    public static load(path: string, rotations: number[], done: (err: any, images?: Map<number, BufferedImage>) => any): void {
        const wrapper = sharp(path)./*grayscale().*/raw()
        wrapper.metadata((err, metadata) => {
            if (err) {
                done(err)
            } else {
                if (metadata.channels !== 3) {
                    //console.log(`Image ${path} has ${metadata.channels} channels and will be transformed to sRGB`)
                    wrapper.toColorspace("sRGB")
                }

                const images = new Map<number, BufferedImage>()
                async.eachSeries(rotations, (rotation, callback) => {
                    const wrapperClone = wrapper.clone()
                    wrapperClone.rotate(rotation).toBuffer((err, data, info) => {
                        if (err) {
                            callback(err)
                        } else {
                            const channels = info.channels
                            const width = info.width
                            const height = info.height
                            const grayscaleBuffer = BufferedImage.toGrayscaleBuffer(new Uint8Array(data.buffer), info.width, info.height, info.channels)
                            const image = new BufferedImage(wrapperClone, grayscaleBuffer, info.width, info.height)
                            images.set(rotation, image)
                            callback()
                        }
                    })
                }, (err) => {
                    if (err) {
                        done(err)
                    } else {
                        done(null, images)
                    }
                })
            }
        })
        
    }

    private static toGrayscaleBuffer(imageBuffer: Uint8Array, width: number, height: number, channels: number): Uint8Array {
        const grayscaleBuffer = new Uint8Array(width * height)
        for(let i = 0, j = 0, length = imageBuffer.length; i < length; i += channels, j++) {
            let gray = undefined
            if (channels > 3) {
                const alpha = imageBuffer[i + 4]
                // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
                // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
                // barcode image. Force any such pixel to be white:
                if (alpha === 0) {
                    gray = 0xFF
                }
            }
            if (gray === undefined) {
                const pixelR = imageBuffer[i]
                const pixelG = imageBuffer[i+1]
                const pixelB = imageBuffer[i+2]
                // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC), 
                // (306*R) >> 10 is approximately equal to R*0.299, and so on.
                // 0x200 >> 10 is 0.5, it implements rounding.
                gray = (306 * pixelR +
                    601 * pixelG +
                    117 * pixelB +
                    0x200) >> 10
            }
            grayscaleBuffer[j] = gray
        }
        return grayscaleBuffer
    }

    public save(path: string): void {
        this.wrapper.toFile(path, (err) => {
            console.error(err)
        })
    }

    public getWidth(): number {
        return this.width
    }

    public getHeight(): number {
        return this.height
    }

    // public crop(x: number, y: number, width: number, height: number) {
    //     this.jimpImage.crop(x, y, width, height)
    // }

    public getRow(y: number, row: Uint8Array): void {
        let j = 0
        for (let i = y * this.width, lenght = (y + 1) * this.width; i !== lenght; i++) {
            row[j++] = this.buffer[i]
        }
    }

    public getMatrix(): Uint8Array {        
        return this.buffer
    }

    private static getPixelIndex(width: number, height: number, x: number, y: number) {
        // round input
        x = Math.round(x)
        y = Math.round(y)

        let i = (width * y + x) << 2

        // if out of bounds index is -1
        if (x < 0 || x > width) i = -1
        if (y < 0 || y > height) i = -1

        return i
    }
}