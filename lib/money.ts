export function formatMoney(cents: number, currency: string) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

export function toCents(input: string | number) {
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}
