import * as sharp from 'sharp'
import * as async from 'async'

export default class BufferedImage {
    
    public constructor(
        private wrapper: sharp.SharpInstance, 
        private buffer: Uint8Array, 
        private width: number, 
        private height: number) {}

    public static load(path: string, rotations: number[], done: (err: any, images?: Map<number, BufferedImage>) => any): void {
        const me = this
        const wrapper = sharp(path).grayscale().raw()
        const images = new Map<number, BufferedImage>()
        async.eachSeries(rotations, (rotation, callback) => {
            wrapper.rotate(rotation).toBuffer((err, data, info) => {
                if (err) {
                    callback(err)
                } else {
                    const channels = info.channels
                    const width = info.width
                    const height = info.height
                    const grayscaleBuffer = new Uint8Array(data.buffer)
                    const image = new BufferedImage(wrapper, grayscaleBuffer, info.width, info.height)
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