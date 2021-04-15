import BarcodeFormat from '../BarcodeFormat';

export function isBarcodeFormatValue(num: number | BarcodeFormat) {
  const values = Object.keys(BarcodeFormat).map(i => Number(i)).filter(Number.isInteger);
  return values.includes(num);
}
