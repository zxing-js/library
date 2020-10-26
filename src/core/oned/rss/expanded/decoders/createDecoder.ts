import { BitArray, IllegalStateException } from '../../../../..';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
import AI013103decoder from './AI013103decoder';
import AI01320xDecoder from './AI01320xDecoder';
import AI01392xDecoder from './AI01392xDecoder';
import AI01393xDecoder from './AI01393xDecoder';
import AI013x0x1xDecoder from './AI013x0x1xDecoder';
import AI01AndOtherAIs from './AI01AndOtherAIs';
import AnyAIDecoder from './AnyAIDecoder';
import GeneralAppIdDecoder from './GeneralAppIdDecoder';


export default function createDecoder(information: BitArray): AbstractExpandedDecoder {
  try {
    if (information.get(1)) {
      return new AI01AndOtherAIs(information);

    }
    if (!information.get(2)) {
      return new AnyAIDecoder(information);
    }

    let fourBitEncodationMethod = GeneralAppIdDecoder.extractNumericValueFromBitArray(information, 1, 4);

    switch (fourBitEncodationMethod) {
      case 4: return new AI013103decoder(information);
      case 5: return new AI01320xDecoder(information);
    }

    let fiveBitEncodationMethod = GeneralAppIdDecoder.extractNumericValueFromBitArray(information, 1, 5);
    switch (fiveBitEncodationMethod) {
      case 12: return new AI01392xDecoder(information);
      case 13: return new AI01393xDecoder(information);
    }

    let sevenBitEncodationMethod = GeneralAppIdDecoder.extractNumericValueFromBitArray(information, 1, 7);
    switch (sevenBitEncodationMethod) {
      case 56: return new AI013x0x1xDecoder(information, '310', '11');
      case 57: return new AI013x0x1xDecoder(information, '320', '11');
      case 58: return new AI013x0x1xDecoder(information, '310', '13');
      case 59: return new AI013x0x1xDecoder(information, '320', '13');
      case 60: return new AI013x0x1xDecoder(information, '310', '15');
      case 61: return new AI013x0x1xDecoder(information, '320', '15');
      case 62: return new AI013x0x1xDecoder(information, '310', '17');
      case 63: return new AI013x0x1xDecoder(information, '320', '17');
    }
  } catch (e) {
    console.log(e);
    throw new IllegalStateException('unknown decoder: ' + information);
  }
}
