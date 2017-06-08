import QRCodeReader from './../core/qrcode/QRCodeReader'
import VideoInputDevice from './VideoInputDevice'
import BrowserCodeReader from './BrowserCodeReader'

class BrowserQRCodeReader extends BrowserCodeReader {
    public constructor(timeBetweenScansMillis: number = 500) {
        super(new QRCodeReader(), timeBetweenScansMillis)
    }
}

export { VideoInputDevice, BrowserQRCodeReader }