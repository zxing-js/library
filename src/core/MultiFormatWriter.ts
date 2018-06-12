/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*namespace com.google.zxing {*/

import BitMatrix from './common/BitMatrix';
// import DataMatrixWriter from './datamatrix/DataMatrixWriter'
// import CodaBarWriter from './oned/CodaBarWriter'
// import Code128Writer from './oned/Code128Writer'
// import Code39Writer from './oned/Code39Writer'
// import Code93Writer from './oned/Code93Writer'
// import EAN13Writer from './oned/EAN13Writer'
// import EAN8Writer from './oned/EAN8Writer'
// import ITFWriter from './oned/ITFWriter'
// import UPCAWriter from './oned/UPCAWriter'
// import UPCEWriter from './oned/UPCEWriter'
// import PDF417Writer from './pdf417/PDF417Writer'
import QRCodeWriter from './qrcode/QRCodeWriter';
import Writer from './Writer';
import BarcodeFormat from './BarcodeFormat';
import EncodeHintType from './EncodeHintType';

import IllegalArgumentException from './IllegalArgumentException';

/*import java.util.Map;*/

/**
 * This is a factory class which finds the appropriate Writer subclass for the BarcodeFormat
 * requested and encodes the barcode with the supplied contents.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
export default class MultiFormatWriter implements Writer {

    /*@Override*/
    // public encode(contents: string,
    //                         format: BarcodeFormat,
    //                         width: number /*int*/,
    //                         height: number /*int*/): BitMatrix /*throws WriterException */ {
    //   return encode(contents, format, width, height, null)
    // }

    /*@Override*/
    public encode(contents: string,
        format: BarcodeFormat,
        width: number /*int*/, height: number /*int*/,
        hints: Map<EncodeHintType, any>): BitMatrix /*throws WriterException */ {

        let writer: Writer;
        switch (format) {
            // case BarcodeFormat.EAN_8:
            //   writer = new EAN8Writer()
            //   break
            // case BarcodeFormat.UPC_E:
            //   writer = new UPCEWriter()
            //   break
            // case BarcodeFormat.EAN_13:
            //   writer = new EAN13Writer()
            //   break
            // case BarcodeFormat.UPC_A:
            //   writer = new UPCAWriter()
            //   break
            case BarcodeFormat.QR_CODE:
                writer = new QRCodeWriter();
                break;
            // case BarcodeFormat.CODE_39:
            //   writer = new Code39Writer()
            //   break
            // case BarcodeFormat.CODE_93:
            //   writer = new Code93Writer()
            //   break
            // case BarcodeFormat.CODE_128:
            //   writer = new Code128Writer()
            //   break
            // case BarcodeFormat.ITF:
            //   writer = new ITFWriter()
            //   break
            // case BarcodeFormat.PDF_417:
            //   writer = new PDF417Writer()
            //   break
            // case BarcodeFormat.CODABAR:
            //   writer = new CodaBarWriter()
            //   break
            // case BarcodeFormat.DATA_MATRIX:
            //   writer = new DataMatrixWriter()
            //   break
            // case BarcodeFormat.AZTEC:
            //   writer = new AztecWriter()
            //   break
            default:
                throw new IllegalArgumentException('No encoder available for format ' + format);
        }
        return writer.encode(contents, format, width, height, hints);
    }

}
