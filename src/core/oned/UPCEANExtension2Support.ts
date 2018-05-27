import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import Exception from '../Exception';
import UPCEANReader from './UPCEANReader';
import Result from '../Result';
import ResultPoint from '../ResultPoint';
import ResultMetadataType from '../ResultMetadataType';

export default class UPCEANExtension2Support {
    private decodeMiddleCounters = [0, 0, 0, 0];
    private decodeRowStringBuffer = '';


    public decodeRow(rowNumber: number, row: BitArray, extensionStartRange: number[]) {
        let result = this.decodeRowStringBuffer;
        let end = this.decodeMiddle(row, extensionStartRange, result);

        let resultString = result.toString();
        let extensionData = UPCEANExtension2Support.parseExtensionString(resultString);

        let resultPoints = [
            new ResultPoint((extensionStartRange[0] + extensionStartRange[1]) / 2.0, rowNumber),
            new ResultPoint(end, rowNumber)
        ];

        let extensionResult = new Result(resultString, null, 0, resultPoints, BarcodeFormat.UPC_EAN_EXTENSION, new Date().getTime());

        if (extensionData != null) {
            extensionResult.putAllMetadata(extensionData);
        }

        return extensionResult;
    }

    public decodeMiddle(row: BitArray, startRange: number[], resultString: string) {
        let counters = this.decodeMiddleCounters;
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        let end = row.getSize();
        let rowOffset = startRange[1];

        let checkParity = 0;

        for (let x = 0; x < 2 && rowOffset < end; x++) {
            let bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
            resultString += String.fromCharCode(('0'.charCodeAt(0) + bestMatch % 10));
            for (let counter of counters) {
                rowOffset += counter;
            }
            if (bestMatch >= 10) {
                checkParity |= 1 << (1 - x);
            }
            if (x !== 1) {
                // Read off separator if not last
                rowOffset = row.getNextSet(rowOffset);
                rowOffset = row.getNextUnset(rowOffset);
            }
        }

        if (resultString.length !== 2) {
            throw new Exception(Exception.NotFoundException);
        }

        if (parseInt(resultString.toString()) % 4 !== checkParity) {
            throw new Exception(Exception.NotFoundException);
        }

        return rowOffset;
    }

    static parseExtensionString(raw: string) {
        if (raw.length !== 2) {
            return null;
        }

        return new Map([[ResultMetadataType.ISSUE_NUMBER, parseInt(raw)]]);
    }
}