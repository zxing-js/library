import BitArray from '../common/BitArray';
import UPCEANReader from './UPCEANReader';
import UPCEANExtension5Support from './UPCEANExtension5Support';
import UPCEANExtension2Support from './UPCEANExtension2Support';
import Result from '../Result';

export default class UPCEANExtensionSupport {
    private static EXTENSION_START_PATTERN = [1, 1, 2];

    // private final UPCEANExtension2Support twoSupport = new UPCEANExtension2Support();

    static decodeRow(rowNumber: number, row: BitArray, rowOffset: number): Result {
        let extensionStartRange = UPCEANReader.findGuardPattern(row, rowOffset, false, this.EXTENSION_START_PATTERN, new Array(this.EXTENSION_START_PATTERN.length).fill(0));
        try {
            let fiveSupport = new UPCEANExtension5Support();
            return fiveSupport.decodeRow(rowNumber, row, extensionStartRange);
        } catch (err) {
            let twoSupport = new UPCEANExtension2Support();
            return twoSupport.decodeRow(rowNumber, row, extensionStartRange);
        }
    }
}