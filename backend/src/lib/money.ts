export function formatMoney(value: string | number): string {
  return Number(value).toFixed(2);
}

export function moneyNumber(value: string | number): number {
  return Number(formatMoney(value));
}
