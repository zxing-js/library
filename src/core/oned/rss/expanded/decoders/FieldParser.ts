import NotFoundException from '../../../../NotFoundException';

export default class FieldParser {

  private static readonly VARIABLE_LENGTH = [];
  private static readonly TWO_DIGIT_DATA_LENGTH = [
    ['00', 18],
    ['01', 14],
    ['02', 14],
    ['10', FieldParser.VARIABLE_LENGTH, 20],
    ['11', 6],
    ['12', 6],
    ['13', 6],
    ['15', 6],
    ['17', 6],
    ['20', 2],
    ['21', FieldParser.VARIABLE_LENGTH, 20],
    ['22', FieldParser.VARIABLE_LENGTH, 29],

    ['30', FieldParser.VARIABLE_LENGTH, 8],
    ['37', FieldParser.VARIABLE_LENGTH, 8],

    // internal company codes
    ['90', FieldParser.VARIABLE_LENGTH, 30],
    ['91', FieldParser.VARIABLE_LENGTH, 30],
    ['92', FieldParser.VARIABLE_LENGTH, 30],
    ['93', FieldParser.VARIABLE_LENGTH, 30],
    ['94', FieldParser.VARIABLE_LENGTH, 30],
    ['95', FieldParser.VARIABLE_LENGTH, 30],
    ['96', FieldParser.VARIABLE_LENGTH, 30],
    ['97', FieldParser.VARIABLE_LENGTH, 3],
    ['98', FieldParser.VARIABLE_LENGTH, 30],
    ['99', FieldParser.VARIABLE_LENGTH, 30],
  ];
  private static readonly THREE_DIGIT_DATA_LENGTH = [
    // Same format as above

    ['240', FieldParser.VARIABLE_LENGTH, 30],
    ['241', FieldParser.VARIABLE_LENGTH, 30],
    ['242', FieldParser.VARIABLE_LENGTH, 6],
    ['250', FieldParser.VARIABLE_LENGTH, 30],
    ['251', FieldParser.VARIABLE_LENGTH, 30],
    ['253', FieldParser.VARIABLE_LENGTH, 17],
    ['254', FieldParser.VARIABLE_LENGTH, 20],

    ['400', FieldParser.VARIABLE_LENGTH, 30],
    ['401', FieldParser.VARIABLE_LENGTH, 30],
    ['402', 17],
    ['403', FieldParser.VARIABLE_LENGTH, 30],
    ['410', 13],
    ['411', 13],
    ['412', 13],
    ['413', 13],
    ['414', 13],
    ['420', FieldParser.VARIABLE_LENGTH, 20],
    ['421', FieldParser.VARIABLE_LENGTH, 15],
    ['422', 3],
    ['423', FieldParser.VARIABLE_LENGTH, 15],
    ['424', 3],
    ['425', 3],
    ['426', 3],
  ];
  private static readonly THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH = [
    // Same format as above

    ['310', 6],
    ['311', 6],
    ['312', 6],
    ['313', 6],
    ['314', 6],
    ['315', 6],
    ['316', 6],
    ['320', 6],
    ['321', 6],
    ['322', 6],
    ['323', 6],
    ['324', 6],
    ['325', 6],
    ['326', 6],
    ['327', 6],
    ['328', 6],
    ['329', 6],
    ['330', 6],
    ['331', 6],
    ['332', 6],
    ['333', 6],
    ['334', 6],
    ['335', 6],
    ['336', 6],
    ['340', 6],
    ['341', 6],
    ['342', 6],
    ['343', 6],
    ['344', 6],
    ['345', 6],
    ['346', 6],
    ['347', 6],
    ['348', 6],
    ['349', 6],
    ['350', 6],
    ['351', 6],
    ['352', 6],
    ['353', 6],
    ['354', 6],
    ['355', 6],
    ['356', 6],
    ['357', 6],
    ['360', 6],
    ['361', 6],
    ['362', 6],
    ['363', 6],
    ['364', 6],
    ['365', 6],
    ['366', 6],
    ['367', 6],
    ['368', 6],
    ['369', 6],
    ['390', FieldParser.VARIABLE_LENGTH, 15],
    ['391', FieldParser.VARIABLE_LENGTH, 18],
    ['392', FieldParser.VARIABLE_LENGTH, 15],
    ['393', FieldParser.VARIABLE_LENGTH, 18],
    ['703', FieldParser.VARIABLE_LENGTH, 30],
  ];
  private static readonly FOUR_DIGIT_DATA_LENGTH = [
    // Same format as above

    ['7001', 13],
    ['7002', FieldParser.VARIABLE_LENGTH, 30],
    ['7003', 10],

    ['8001', 14],
    ['8002', FieldParser.VARIABLE_LENGTH, 20],
    ['8003', FieldParser.VARIABLE_LENGTH, 30],
    ['8004', FieldParser.VARIABLE_LENGTH, 30],
    ['8005', 6],
    ['8006', 18],
    ['8007', FieldParser.VARIABLE_LENGTH, 30],
    ['8008', FieldParser.VARIABLE_LENGTH, 12],
    ['8018', 18],
    ['8020', FieldParser.VARIABLE_LENGTH, 25],
    ['8100', 6],
    ['8101', 10],
    ['8102', 2],
    ['8110', FieldParser.VARIABLE_LENGTH, 70],
    ['8200', FieldParser.VARIABLE_LENGTH, 70],
  ];

  constructor() {

  }
  static parseFieldsInGeneralPurpose(rawInformation: string): string {
    if (!rawInformation) {
      return null;
    }

    // Processing 2-digit AIs

    if (rawInformation.length < 2) {
      throw new NotFoundException();
    }

    let firstTwoDigits = rawInformation.substring(0, 2);

    for (let dataLength of FieldParser.TWO_DIGIT_DATA_LENGTH) {
      if (dataLength[0] === firstTwoDigits) {
        if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
          return FieldParser.processVariableAI(2, <number>dataLength[2], rawInformation);
        }
        return FieldParser.processFixedAI(2, <number>dataLength[1], rawInformation);
      }
    }

    if (rawInformation.length < 3) {
      throw new NotFoundException();
    }

    let firstThreeDigits = rawInformation.substring(0, 3);

    for (let dataLength of FieldParser.THREE_DIGIT_DATA_LENGTH) {
      if (dataLength[0] === firstThreeDigits) {
        if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
          return FieldParser.processVariableAI(3, <number>dataLength[2], rawInformation);
        }
        return FieldParser.processFixedAI(3, <number>dataLength[1], rawInformation);
      }
    }


    for (let dataLength of FieldParser.THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH) {
      if (dataLength[0] === firstThreeDigits) {
        if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
          return FieldParser.processVariableAI(4, <number>dataLength[2], rawInformation);
        }
        return FieldParser.processFixedAI(4, <number>dataLength[1], rawInformation);
      }
    }

    if (rawInformation.length < 4) {
      throw new NotFoundException();
    }

    let firstFourDigits = rawInformation.substring(0, 4);

    for (let dataLength of FieldParser.FOUR_DIGIT_DATA_LENGTH) {
      if (dataLength[0] === firstFourDigits) {
        if (dataLength[1] === FieldParser.VARIABLE_LENGTH) {
          return FieldParser.processVariableAI(4, <number>dataLength[2], rawInformation);
        }
        return FieldParser.processFixedAI(4, <number>dataLength[1], rawInformation);
      }
    }

    throw new NotFoundException();
  }

  private static processFixedAI(aiSize: number, fieldSize: number, rawInformation: string): string {
    if (rawInformation.length < aiSize) {
      throw new NotFoundException();
    }

    let ai = rawInformation.substring(0, aiSize);

    if (rawInformation.length < aiSize + fieldSize) {
      throw new NotFoundException();
    }

    let field = rawInformation.substring(aiSize, aiSize + fieldSize);
    let remaining = rawInformation.substring(aiSize + fieldSize);
    let result = '(' + ai + ')' + field;
    let parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
    return parsedAI == null ? result : result + parsedAI;
  }

  private static processVariableAI(aiSize: number, variableFieldSize: number, rawInformation: string): string {
    let ai = rawInformation.substring(0, aiSize);
    let maxSize;
    if (rawInformation.length < aiSize + variableFieldSize) {
      maxSize = rawInformation.length;
    } else {
      maxSize = aiSize + variableFieldSize;
    }
    let field = rawInformation.substring(aiSize, maxSize);
    let remaining = rawInformation.substring(maxSize);
    let result = '(' + ai + ')' + field;
    let parsedAI = FieldParser.parseFieldsInGeneralPurpose(remaining);
    return parsedAI == null ? result : result + parsedAI;
  }


}
