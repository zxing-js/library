import BitArray from '../common/BitArray';
import UPCEANReader from './UPCEANReader';
import UPCEANExtension5Support from './UPCEANExtension5Support';

export default class UPCEANExtensionSupport {
    private static EXTENSION_START_PATTERN = [1, 1, 2];

    // private final UPCEANExtension2Support twoSupport = new UPCEANExtension2Support();

    static decodeRow(rowNumber: number, row: BitArray, rowOffset: number) {
        let extensionStartRange = UPCEANReader.findGuardPattern(row, rowOffset, false, this.EXTENSION_START_PATTERN, new Array(this.EXTENSION_START_PATTERN.length));
        try {
            let fiveSupport = new UPCEANExtension5Support();
            return fiveSupport.decodeRow(rowNumber, row, extensionStartRange);
        } catch (err) {
            return twoSupport.decodeRow(rowNumber, row, extensionStartRange);
        }
    }
}