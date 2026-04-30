import NotFoundException from '../../../../NotFoundException';

type DataLengthProcessor = (rawInformation: string) => string;

export default class FieldParser {

  private static fixed(aiSize: number, fieldSize: number): DataLengthProcessor {
    return (rawInformation) => FieldParser.processFixedAI(aiSize, fieldSize, rawInformation);
  }

  private static variable(aiSize: number, fieldSize: number): DataLengthProcessor {
    return (rawInformation) => FieldParser.processVariableAI(aiSize, fieldSize, rawInformation);
  }

  private static readonly TWO_DIGIT_DATA_LENGTH = (() => {
    const out = new Map<string, DataLengthProcessor>();

    out.set('00', FieldParser.fixed(2, 18));
    out.set('01', FieldParser.fixed(2, 14));
    out.set('02', FieldParser.fixed(2, 14));
    out.set('10', FieldParser.variable(2, 20));
    out.set('11', FieldParser.fixed(2, 6));
    out.set('12', FieldParser.fixed(2, 6));
    out.set('13', FieldParser.fixed(2, 6));
    out.set('15', FieldParser.fixed(2, 6));
    out.set('16', FieldParser.fixed(2, 6));
    out.set('17', FieldParser.fixed(2, 6));
    out.set('20', FieldParser.fixed(2, 2));
    out.set('21', FieldParser.variable(2, 20));
    out.set('22', FieldParser.variable(2, 29)); // limited to 20 in latest versions of spec
    out.set('30', FieldParser.variable(2, 8));
    out.set('37', FieldParser.variable(2, 8));
    //internal company codes
    for (let i = 90; i <= 99; i++) {
      out.set(String(i), FieldParser.variable(2, 30));
    }

    return out;
  })();

  private static readonly THREE_DIGIT_DATA_LENGTH = new Map<string, DataLengthProcessor>([
    ['235', FieldParser.variable(3, 28)],
    ['240', FieldParser.variable(3, 30)],
    ['241', FieldParser.variable(3, 30)],
    ['242', FieldParser.variable(3, 6)],
    ['243', FieldParser.variable(3, 20)],
    ['250', FieldParser.variable(3, 30)],
    ['251', FieldParser.variable(3, 30)],
    ['253', FieldParser.variable(3, 30)],
    ['254', FieldParser.variable(3, 20)],
    ['255', FieldParser.variable(3, 25)],
    ['400', FieldParser.variable(3, 30)],
    ['401', FieldParser.variable(3, 30)],
    ['402', FieldParser.fixed(3, 17)],
    ['403', FieldParser.variable(3, 30)],
    ['410', FieldParser.fixed(3, 13)],
    ['411', FieldParser.fixed(3, 13)],
    ['412', FieldParser.fixed(3, 13)],
    ['413', FieldParser.fixed(3, 13)],
    ['414', FieldParser.fixed(3, 13)],
    ['415', FieldParser.fixed(3, 13)],
    ['416', FieldParser.fixed(3, 13)],
    ['417', FieldParser.fixed(3, 13)],
    ['420', FieldParser.variable(3, 20)],
    ['421', FieldParser.variable(3, 15)], // limited to 12 in latest versions of spec
    ['422', FieldParser.fixed(3, 3)],
    ['423', FieldParser.variable(3, 15)],
    ['424', FieldParser.fixed(3, 3)],
    ['425', FieldParser.variable(3, 15)],
    ['426', FieldParser.fixed(3, 3)],
    ['427', FieldParser.variable(3, 3)],
    ['710', FieldParser.variable(3, 20)],
    ['711', FieldParser.variable(3, 20)],
    ['712', FieldParser.variable(3, 20)],
    ['713', FieldParser.variable(3, 20)],
    ['714', FieldParser.variable(3, 20)],
    ['715', FieldParser.variable(3, 20)],
  ]);

  private static readonly THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH = (() => {
    const out = new Map<string, DataLengthProcessor>();

    for (let i = 310; i <= 316; i++) {
      out.set(String(i), FieldParser.fixed(4, 6));
    }
    for (let i = 320; i <= 337; i++) {
      out.set(String(i), FieldParser.fixed(4, 6));
    }
    for (let i = 340; i <= 357; i++) {
      out.set(String(i), FieldParser.fixed(4, 6));
    }
    for (let i = 360; i <= 369; i++) {
      out.set(String(i), FieldParser.fixed(4, 6));
    }
    out.set('390', FieldParser.variable(4, 15));
    out.set('391', FieldParser.variable(4, 18));
    out.set('392', FieldParser.variable(4, 15));
    out.set('393', FieldParser.variable(4, 18));
    out.set('394', FieldParser.fixed(4, 4));
    out.set('395', FieldParser.fixed(4, 6));
    out.set('703', FieldParser.variable(4, 30));
    out.set('723', FieldParser.variable(4, 30));

    return out;
  })();

  private static readonly FOUR_DIGIT_DATA_LENGTH = (() => {
    const out = new Map<string, DataLengthProcessor>();

    out.set('4300', FieldParser.variable(4, 35));
    out.set('4301', FieldParser.variable(4, 35));
    out.set('4302', FieldParser.variable(4, 70));
    out.set('4303', FieldParser.variable(4, 70));
    out.set('4304', FieldParser.variable(4, 70));
    out.set('4305', FieldParser.variable(4, 70));
    out.set('4306', FieldParser.variable(4, 70));
    out.set('4307', FieldParser.fixed(4, 2));
    out.set('4308', FieldParser.variable(4, 30));
    out.set('4309', FieldParser.fixed(4, 20));
    out.set('4310', FieldParser.variable(4, 35));
    out.set('4311', FieldParser.variable(4, 35));
    out.set('4312', FieldParser.variable(4, 70));
    out.set('4313', FieldParser.variable(4, 70));
    out.set('4314', FieldParser.variable(4, 70));
    out.set('4315', FieldParser.variable(4, 70));
    out.set('4316', FieldParser.variable(4, 70));
    out.set('4317', FieldParser.fixed(4, 2));
    out.set('4318', FieldParser.variable(4, 20));
    out.set('4319', FieldParser.variable(4, 30));
    out.set('4320', FieldParser.variable(4, 35));
    out.set('4321', FieldParser.fixed(4, 1));
    out.set('4322', FieldParser.fixed(4, 1));
    out.set('4323', FieldParser.fixed(4, 1));
    out.set('4324', FieldParser.fixed(4, 10));
    out.set('4325', FieldParser.fixed(4, 10));
    out.set('4326', FieldParser.fixed(4, 6));
    out.set('7001', FieldParser.fixed(4, 13));
    out.set('7002', FieldParser.variable(4, 30));
    out.set('7003', FieldParser.fixed(4, 10));
    out.set('7004', FieldParser.variable(4, 4));
    out.set('7005', FieldParser.variable(4, 12));
    out.set('7006', FieldParser.fixed(4, 6));
    out.set('7007', FieldParser.variable(4, 12));
    out.set('7008', FieldParser.variable(4, 3));
    out.set('7009', FieldParser.variable(4, 10));
    out.set('7010', FieldParser.variable(4, 2));
    out.set('7011', FieldParser.variable(4, 10));
    out.set('7020', FieldParser.variable(4, 20));
    out.set('7021', FieldParser.variable(4, 20));
    out.set('7022', FieldParser.variable(4, 20));
    out.set('7023', FieldParser.variable(4, 30));
    out.set('7040', FieldParser.fixed(4, 4));
    out.set('7240', FieldParser.variable(4, 20));
    out.set('8001', FieldParser.fixed(4, 14));
    out.set('8002', FieldParser.variable(4, 20));
    out.set('8003', FieldParser.variable(4, 30));
    out.set('8004', FieldParser.variable(4, 30));
    out.set('8005', FieldParser.fixed(4, 6));
    out.set('8006', FieldParser.fixed(4, 18));
    out.set('8007', FieldParser.variable(4, 34));
    out.set('8008', FieldParser.variable(4, 12));
    out.set('8009', FieldParser.variable(4, 50));
    out.set('8010', FieldParser.variable(4, 30));
    out.set('8011', FieldParser.variable(4, 12));
    out.set('8012', FieldParser.variable(4, 20));
    out.set('8013', FieldParser.variable(4, 25));
    out.set('8017', FieldParser.fixed(4, 18));
    out.set('8018', FieldParser.fixed(4, 18));
    out.set('8019', FieldParser.variable(4, 10));
    out.set('8020', FieldParser.variable(4, 25));
    out.set('8026', FieldParser.fixed(4, 18));
    out.set('8100', FieldParser.fixed(4, 6)); // removed from latest versions of spec
    out.set('8101', FieldParser.fixed(4, 10)); // removed from latest versions of spec
    out.set('8102', FieldParser.fixed(4, 2)); // removed from latest versions of spec
    out.set('8110', FieldParser.variable(4, 70));
    out.set('8111', FieldParser.fixed(4, 4));
    out.set('8112', FieldParser.variable(4, 70));
    out.set('8200', FieldParser.variable(4, 70));

    return out;
  })();

  private constructor() {
  }

  static parseFieldsInGeneralPurpose(rawInformation: string): string {
    if (!rawInformation) {
      return null;
    }

    if (rawInformation.length < 2) {
      throw new NotFoundException();
    }

    const firstTwoDigits = rawInformation.substring(0, 2);
    const twoDigitDataProcessor = this.TWO_DIGIT_DATA_LENGTH.get(firstTwoDigits);
    if (twoDigitDataProcessor) {
      return twoDigitDataProcessor(rawInformation);
    }

    if (rawInformation.length < 3) {
      throw new NotFoundException();
    }

    const firstThreeDigits = rawInformation.substring(0, 3);

    const threeDigitDataProcessor = this.THREE_DIGIT_DATA_LENGTH.get(firstThreeDigits);
    if (threeDigitDataProcessor) {
      return threeDigitDataProcessor(rawInformation);
    }

    const threeDigitPlusDigitDataProcessor = this.THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH.get(firstThreeDigits);
    if (threeDigitPlusDigitDataProcessor) {
      return threeDigitPlusDigitDataProcessor(rawInformation);
    }

    if (rawInformation.length < 4) {
      throw new NotFoundException();
    }

    const firstFourDigits = rawInformation.substring(0, 4);
    const fourDigitDataProcessor = this.FOUR_DIGIT_DATA_LENGTH.get(firstFourDigits);
    if (fourDigitDataProcessor) {
      return fourDigitDataProcessor(rawInformation);
    }

    throw new NotFoundException();
  }

  private static processFixedAI(aiSize: number, fieldSize: number, rawInformation: string): string {
    if (rawInformation.length < aiSize) {
      throw new NotFoundException();
    }

    const ai = rawInformation.substring(0, aiSize);

    if (rawInformation.length < aiSize + fieldSize) {
      throw new NotFoundException();
    }

    const field = rawInformation.substring(aiSize, aiSize + fieldSize);
    const remaining = rawInformation.substring(aiSize + fieldSize);
    const result = '(' + ai + ')' + field;
    const parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
    return parsedAI === null ? result : result + parsedAI;
  }

  private static processVariableAI(aiSize: number, variableFieldSize: number, rawInformation: string): string {
    const ai = rawInformation.substring(0, aiSize);
    let maxSize: number;
    if (rawInformation.length < aiSize + variableFieldSize) {
      maxSize = rawInformation.length;
    } else {
      maxSize = aiSize + variableFieldSize;
    }
    const field = rawInformation.substring(aiSize, maxSize);
    const remaining = rawInformation.substring(maxSize);
    const result = '(' + ai + ')' + field;
    const parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
    return parsedAI === null ? result : result + parsedAI;
  }

}
