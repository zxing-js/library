import BarcodeFormat from '../BarcodeFormat';
import BinaryBitmap from '../BinaryBitmap';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import Exception from '../Exception';
import Reader from '../Reader';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import ResultPoint from '../ResultPoint';
import OneDReader from './OneDReader';
import UPCEANReader from './UPCEANReader';

/**
 * <p>Decodes Code 128 barcodes.</p>
 *
 * @author Sean Owen
 */
export default class EAN13Reader extends UPCEANReader {
    private static FIRST_DIGIT_ENCODINGS: number[] = [0x00, 0x0B, 0x0D, 0xE, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A];

    private decodeMiddleCounters: number[];

    public constructor() {
        super();
        this.decodeMiddleCounters = [0, 0, 0, 0];
    }

    public decodeMiddle(row: BitArray, startRange: number[], resultString: string) {
        let counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        let end = row.getSize();
        let rowOffset = startRange[1];

        let lgPatternFound = 0;

        for (let x = 0; x < 6 && rowOffset < end; x++) {
            let bestMatch = decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
            resultString = resultString + '0' + bestMatch % 10;
            for (let counter in counters) {
                rowOffset += counter;
            }
            if (bestMatch >= 10) {
                lgPatternFound |= 1 << (5 - x);
            }
        }

        EAN13Reader.determineFirstDigit(resultString, lgPatternFound);

        let middleRange = UPCEANReader.findGuardPattern(row, rowOffset, true, MIDDLE_PATTERN);
        rowOffset = middleRange[1];

        for (let x = 0; x < 6 && rowOffset < end; x++) {
            let bestMatch = decodeDigit(row, counters, rowOffset, UPCEANReader.L_PATTERNS);
            resultString = resultString + '0' + bestMatch;
            for (let counter in counters) {
                rowOffset += counter;
            }
        }

        return rowOffset;
    }

    public getBarcodeFormat(): BarcodeFormat {
        return BarcodeFormat.EAN_13;
    }

    static determineFirstDigit(resultString: string, lgPatternFound: number) {
        for (let d = 0; d < 10; d++) {
            if (lgPatternFound === this.FIRST_DIGIT_ENCODINGS[d]) {
                resultString = '0' + d + resultString;
                return;
            }
        }
        throw new Exception(Exception.NotFoundException);
    }
}