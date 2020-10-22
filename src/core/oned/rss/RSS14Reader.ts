import AbstractRSSReader from './AbstractRSSReader';
import Pair from './Pair';
import Result from '../../Result';
import BitArray from '../../common/BitArray';
import DecodeHintType from '../../DecodeHintType';
import NotFoundException from '../../NotFoundException';
import StringBuilder from '../../util/StringBuilder';
import BarcodeFormat from '../../BarcodeFormat';
import ResultPointCallback from '../../ResultPointCallback';
import ResultPoint from '../../ResultPoint';
import FinderPattern from './FinderPattern';
import DataCharacter from './DataCharacter';
import MathUtils from '../../common/detector/MathUtils';
import RSSUtils from './RSSUtils';
import System from '../../util/System';
import OneDReader from '../OneDReader';

export default class RSS14Reader extends AbstractRSSReader {

    private static readonly OUTSIDE_EVEN_TOTAL_SUBSET: number[] = [1, 10, 34, 70, 126];
    private static readonly INSIDE_ODD_TOTAL_SUBSET: number[] = [4, 20, 48, 81];
    private static readonly OUTSIDE_GSUM: number[] = [0, 161, 961, 2015, 2715];
    private static readonly INSIDE_GSUM: number[] = [0, 336, 1036, 1516];
    private static readonly OUTSIDE_ODD_WIDEST: number[] = [8, 6, 4, 3, 1];
    private static readonly INSIDE_ODD_WIDEST: number[] = [2, 4, 6, 8];

    private static readonly FINDER_PATTERNS: Int32Array[] = [
        Int32Array.from([ 3, 8, 2, 1 ]),
        Int32Array.from([ 3, 5, 5, 1 ]),
        Int32Array.from([ 3, 3, 7, 1 ]),
        Int32Array.from([ 3, 1, 9, 1 ]),
        Int32Array.from([ 2, 7, 4, 1 ]),
        Int32Array.from([ 2, 5, 6, 1 ]),
        Int32Array.from([ 2, 3, 8, 1 ]),
        Int32Array.from([ 1, 5, 7, 1 ]),
        Int32Array.from([ 1, 3, 9, 1 ]),
    ];

    private readonly possibleLeftPairs: Pair[] = [];
    private readonly possibleRightPairs: Pair[] = [];

    public decodeRow(rowNumber: number, row: BitArray, hints?: Map<DecodeHintType, any>): Result {
        const leftPair = this.decodePair(row, false, rowNumber, hints);
        RSS14Reader.addOrTally(this.possibleLeftPairs, leftPair);
        row.reverse();
        let rightPair = this.decodePair(row, true, rowNumber, hints);
        RSS14Reader.addOrTally(this.possibleRightPairs, rightPair);
        row.reverse();
        for (let left of this.possibleLeftPairs) {
            if (left.getCount() > 1) {
                for (let right of this.possibleRightPairs) {
                    if (right.getCount() > 1 && RSS14Reader.checkChecksum(left, right)) {
                        return RSS14Reader.constructResult(left, right);
                    }
                }
            }
        }
        throw new NotFoundException();
    }

    private static addOrTally(possiblePairs: Pair[], pair: Pair) {
        if (pair == null) {
            return;
        }
        let found = false;
        for (let other of possiblePairs) {
            if (other.getValue() === pair.getValue()) {
                other.incrementCount();
                found = true;
                break;
            }
        }
        if (!found) {
            possiblePairs.push(pair);
        }
    }

    public reset() {
        this.possibleLeftPairs.length = 0;
        this.possibleRightPairs.length = 0;
    }

    private static constructResult(leftPair: Pair, rightPair: Pair): Result {
        let symbolValue = 4537077 * leftPair.getValue() + rightPair.getValue();
        let text = new String(symbolValue).toString();

        let buffer = new StringBuilder();
        for (let i = 13 - text.length; i > 0; i--) {
            buffer.append('0');
        }
        buffer.append(text);

        let checkDigit = 0;
        for (let i = 0; i < 13; i++) {
            let digit = buffer.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
            checkDigit += ((i & 0x01) === 0) ? 3 * digit : digit;
        }
        checkDigit = 10 - (checkDigit % 10);
        if (checkDigit === 10) {
            checkDigit = 0;
        }
        buffer.append(checkDigit.toString());

        let leftPoints = leftPair.getFinderPattern().getResultPoints();
        let rightPoints = rightPair.getFinderPattern().getResultPoints();
        return new Result(buffer.toString(), null, 0, [leftPoints[0], leftPoints[1], rightPoints[0], rightPoints[1]], BarcodeFormat.RSS_14, new Date().getTime());
    }

    private static checkChecksum(leftPair: Pair, rightPair: Pair): boolean {
        let checkValue = (leftPair.getChecksumPortion() + 16 * rightPair.getChecksumPortion()) % 79;
        let targetCheckValue =
            9 * leftPair.getFinderPattern().getValue() + rightPair.getFinderPattern().getValue();
        if (targetCheckValue > 72) {
            targetCheckValue--;
        }
        if (targetCheckValue > 8) {
            targetCheckValue--;
        }
        return checkValue === targetCheckValue;
    }

    private decodePair(row: BitArray, right: boolean, rowNumber: number, hints: Map<DecodeHintType, any>): Pair {
        try {
            let startEnd = this.findFinderPattern(row, right);
            let pattern = this.parseFoundFinderPattern(row, rowNumber, right, startEnd);

            let resultPointCallback = hints == null ? null : <ResultPointCallback>hints.get(DecodeHintType.NEED_RESULT_POINT_CALLBACK);

            if (resultPointCallback != null) {
                let center = (startEnd[0] + startEnd[1]) / 2.0;
                if (right) {
                    // row is actually reversed
                    center = row.getSize() - 1 - center;
                }
                resultPointCallback.foundPossibleResultPoint(new ResultPoint(center, rowNumber));
            }

            let outside = this.decodeDataCharacter(row, pattern, true);
            let inside = this.decodeDataCharacter(row, pattern, false);
            return new Pair(1597 * outside.getValue() + inside.getValue(),
                outside.getChecksumPortion() + 4 * inside.getChecksumPortion(),
                pattern);
        }
        catch (err) {
            return null;
        }
    }

    private decodeDataCharacter(row: BitArray, pattern: FinderPattern, outsideChar: boolean): DataCharacter {

        let counters = this.getDataCharacterCounters();
        for (let x = 0; x < counters.length; x++) {
            counters[x] = 0;
        }

        if (outsideChar) {
            OneDReader.recordPatternInReverse(row, pattern.getStartEnd()[0], counters);
        } else {
            OneDReader.recordPattern(row, pattern.getStartEnd()[1] + 1, counters);
            // reverse it
            for (let i = 0, j = counters.length - 1; i < j; i++ , j--) {
                let temp = counters[i];
                counters[i] = counters[j];
                counters[j] = temp;
            }
        }

        let numModules = outsideChar ? 16 : 15;
        let elementWidth = MathUtils.sum(new Int32Array(counters)) / numModules;

        let oddCounts = this.getOddCounts();
        let evenCounts = this.getEvenCounts();
        let oddRoundingErrors = this.getOddRoundingErrors();
        let evenRoundingErrors = this.getEvenRoundingErrors();

        for (let i = 0; i < counters.length; i++) {
            let value = counters[i] / elementWidth;
            let count = Math.floor(value + 0.5);
            if (count < 1) {
                count = 1;
            } else if (count > 8) {
                count = 8;
            }
            let offset = Math.floor(i / 2);
            if ((i & 0x01) === 0) {
                oddCounts[offset] = count;
                oddRoundingErrors[offset] = value - count;
            } else {
                evenCounts[offset] = count;
                evenRoundingErrors[offset] = value - count;
            }
        }

        this.adjustOddEvenCounts(outsideChar, numModules);

        let oddSum = 0;
        let oddChecksumPortion = 0;
        for (let i = oddCounts.length - 1; i >= 0; i--) {
            oddChecksumPortion *= 9;
            oddChecksumPortion += oddCounts[i];
            oddSum += oddCounts[i];
        }
        let evenChecksumPortion = 0;
        let evenSum = 0;
        for (let i = evenCounts.length - 1; i >= 0; i--) {
            evenChecksumPortion *= 9;
            evenChecksumPortion += evenCounts[i];
            evenSum += evenCounts[i];
        }
        let checksumPortion = oddChecksumPortion + 3 * evenChecksumPortion;

        if (outsideChar) {
            if ((oddSum & 0x01) !== 0 || oddSum > 12 || oddSum < 4) {
                throw new NotFoundException();
            }
            let group = (12 - oddSum) / 2;
            let oddWidest = RSS14Reader.OUTSIDE_ODD_WIDEST[group];
            let evenWidest = 9 - oddWidest;
            let vOdd = RSSUtils.getRSSvalue(oddCounts, oddWidest, false);
            let vEven = RSSUtils.getRSSvalue(evenCounts, evenWidest, true);
            let tEven = RSS14Reader.OUTSIDE_EVEN_TOTAL_SUBSET[group];
            let gSum = RSS14Reader.OUTSIDE_GSUM[group];
            return new DataCharacter(vOdd * tEven + vEven + gSum, checksumPortion);
        } else {
            if ((evenSum & 0x01) !== 0 || evenSum > 10 || evenSum < 4) {
                throw new NotFoundException();
            }
            let group = (10 - evenSum) / 2;
            let oddWidest = RSS14Reader.INSIDE_ODD_WIDEST[group];
            let evenWidest = 9 - oddWidest;
            let vOdd = RSSUtils.getRSSvalue(oddCounts, oddWidest, true);
            let vEven = RSSUtils.getRSSvalue(evenCounts, evenWidest, false);
            let tOdd = RSS14Reader.INSIDE_ODD_TOTAL_SUBSET[group];
            let gSum = RSS14Reader.INSIDE_GSUM[group];
            return new DataCharacter(vEven * tOdd + vOdd + gSum, checksumPortion);
        }

    }

    private findFinderPattern(row: BitArray, rightFinderPattern: boolean): number[] {

        let counters = this.getDecodeFinderCounters();
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;

        let width = row.getSize();
        let isWhite = false;
        let rowOffset = 0;
        while (rowOffset < width) {
            isWhite = !row.get(rowOffset);
            if (rightFinderPattern === isWhite) {
                // Will encounter white first when searching for right finder pattern
                break;
            }
            rowOffset++;
        }

        let counterPosition = 0;
        let patternStart = rowOffset;
        for (let x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            } else {
                if (counterPosition === 3) {
                    if (AbstractRSSReader.isFinderPattern(counters)) {
                        return [patternStart, x ];
                    }
                    patternStart += counters[0] + counters[1];
                    counters[0] = counters[2];
                    counters[1] = counters[3];
                    counters[2] = 0;
                    counters[3] = 0;
                    counterPosition--;
                } else {
                    counterPosition++;
                }
                counters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException();
    }

    private parseFoundFinderPattern(row: BitArray, rowNumber: number, right: boolean, startEnd: number[]): FinderPattern {
        // Actually we found elements 2-5
        let firstIsBlack = row.get(startEnd[0]);
        let firstElementStart = startEnd[0] - 1;
        // Locate element 1
        while (firstElementStart >= 0 && firstIsBlack !== row.get(firstElementStart)) {
            firstElementStart--;
        }
        firstElementStart++;
        const firstCounter = startEnd[0] - firstElementStart;
        // Make 'counters' hold 1-4
        const counters = this.getDecodeFinderCounters();
        const copy = new Int32Array(counters.length);
        System.arraycopy(counters, 0, copy, 1, counters.length - 1);
        copy[0] = firstCounter;
        const value = this.parseFinderValue(copy, RSS14Reader.FINDER_PATTERNS);
        let start = firstElementStart;
        let end = startEnd[1];
        if (right) {
            // row is actually reversed
            start = row.getSize() - 1 - start;
            end = row.getSize() - 1 - end;
        }
        return new FinderPattern(value, [ firstElementStart, startEnd[1] ], start, end, rowNumber);
    }

    private adjustOddEvenCounts(outsideChar: boolean, numModules: number) {

        let oddSum = MathUtils.sum(new Int32Array(this.getOddCounts()));
        let evenSum = MathUtils.sum(new Int32Array(this.getEvenCounts()));

        let incrementOdd = false;
        let decrementOdd = false;
        let incrementEven = false;
        let decrementEven = false;

        if (outsideChar) {
            if (oddSum > 12) {
                decrementOdd = true;
            }
            else if (oddSum < 4) {
                incrementOdd = true;
            }
            if (evenSum > 12) {
                decrementEven = true;
            }
            else if (evenSum < 4) {
                incrementEven = true;
            }
        }
        else {
            if (oddSum > 11) {
                decrementOdd = true;
            }
            else if (oddSum < 5) {
                incrementOdd = true;
            }
            if (evenSum > 10) {
                decrementEven = true;
            }
            else if (evenSum < 4) {
                incrementEven = true;
            }
        }

        let mismatch = oddSum + evenSum - numModules;
        let oddParityBad = (oddSum & 0x01) === (outsideChar ? 1 : 0);
        let evenParityBad = (evenSum & 0x01) === 1;
        if (mismatch === 1) {
        if (oddParityBad) {
            if (evenParityBad) {
                throw new NotFoundException();
            }
            decrementOdd = true;
        } else {
            if (!evenParityBad) {
                throw new NotFoundException();
            }
            decrementEven = true;
        }
        } else if (mismatch === -1) {
            if (oddParityBad) {
                if (evenParityBad) {
                    throw new NotFoundException();
                }
                incrementOdd = true;
            } else {
                if (!evenParityBad) {
                    throw new NotFoundException();
                }
                incrementEven = true;
            }
        }
        else if (mismatch === 0) {
            if (oddParityBad) {
                if (!evenParityBad) {
                    throw new NotFoundException();
                }
                // Both bad
                if (oddSum < evenSum) {
                    incrementOdd = true;
                    decrementEven = true;
                } else {
                    decrementOdd = true;
                    incrementEven = true;
                }
            }
            else {
                if (evenParityBad) {
                    throw new NotFoundException();
                }
                // Nothing to do!
            }
        }
        else {
            throw new NotFoundException();
        }

        if (incrementOdd) {
            if (decrementOdd) {
                throw new NotFoundException();
            }
            AbstractRSSReader.increment(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (decrementOdd) {
            AbstractRSSReader.decrement(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (incrementEven) {
            if (decrementEven) {
                throw new NotFoundException();
            }
            AbstractRSSReader.increment(this.getEvenCounts(), this.getOddRoundingErrors());
        }
        if (decrementEven) {
            AbstractRSSReader.decrement(this.getEvenCounts(), this.getEvenRoundingErrors());
        }
    }
}
