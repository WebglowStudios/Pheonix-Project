/**
 * Formatting utilities for Indian currency, numbers, and dates.
 */

export function fmtIndianCurrency(n: number | undefined | null, includeSymbol = true): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: abs % 1 !== 0 ? 2 : 0,
  });
  const prefix = n < 0 ? "-" : "";
  return includeSymbol ? `${prefix}₹${formatted}` : `${prefix}${formatted}`;
}

export function fmtNumber(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export function fmtCompactIndian(n: number): string {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}

export function formatDateIndian(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Calculates estimated annualized return (CAGR) as proxy for XIRR
 * when cashflow schedules are not available.
 */
export function estimateAnnualizedReturn(
  invested: number,
  currentValue: number,
  startDate?: string | Date | null
): number {
  if (!invested || invested <= 0 || !currentValue) return 0;
  if (!startDate) {
    return ((currentValue - invested) / invested) * 100;
  }
  const date = typeof startDate === "string" ? new Date(startDate) : startDate;
  const years = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (years <= 0.08) {
    return ((currentValue - invested) / invested) * 100;
  }
  const cagr = (Math.pow(currentValue / invested, 1 / years) - 1) * 100;
  return isFinite(cagr) ? cagr : 0;
}
