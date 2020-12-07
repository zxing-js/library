import BarcodeFormat from '../BarcodeFormat';

export function isBarcodeFormatValue(num: number) {
  const values = Object.keys(BarcodeFormat).map(i => Number(i)).filter(Number.isInteger);
  return values.includes(num);
}
