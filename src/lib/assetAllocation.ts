/**
 * Asset Allocation & Portfolio Performance Utilities
 * Categorizes holdings into standard macro asset classes:
 * - Equity (Direct Stocks, Mutual Funds, SIP)
 * - Debt (FD, PPF, EPF, Bonds, NPS)
 * - Alternatives (AIF, Gold, REIT, Crypto)
 * - Others (Cash, Unclassified)
 */

export type MacroAssetClass = "equity" | "debt" | "alternatives" | "others";

export interface MacroClassMeta {
  key: MacroAssetClass;
  label: string;
  color: string;
  bgLight: string;
  borderLight: string;
  description: string;
}

export const MACRO_ASSET_CLASSES: Record<MacroAssetClass, MacroClassMeta> = {
  equity: {
    key: "equity",
    label: "Equity",
    color: "#1E88E5", // Vibrant Blue as in reference dashboard
    bgLight: "#EFF6FF",
    borderLight: "#BFDBFE",
    description: "Direct stocks, equity mutual funds & systematic investment plans",
  },
  debt: {
    key: "debt",
    label: "Debt",
    color: "#2E7D32", // Forest Green
    bgLight: "#F0FDF4",
    borderLight: "#BBF7D0",
    description: "Fixed deposits, bonds, government provident schemes & fixed income",
  },
  alternatives: {
    key: "alternatives",
    label: "Alternatives",
    color: "#B45309", // Warm Amber / Ochre
    bgLight: "#FFFBEB",
    borderLight: "#FDE68A",
    description: "AIFs, PMS, gold / precious metals & alternative assets",
  },
  others: {
    key: "others",
    label: "Others",
    color: "#7C3AED", // Royal Purple
    bgLight: "#FAF5FF",
    borderLight: "#E9D5FF",
    description: "Cash buffers, liquid savings & unclassified investments",
  },
};

/**
 * Maps granular investment instrument types to their Macro Asset Class.
 */
export function getMacroAssetClass(instrumentType?: string): MacroAssetClass {
  if (!instrumentType) return "others";
  const t = instrumentType.toLowerCase().trim();

  // 1. Equity
  if (t === "stock" || t === "stocks" || t === "mutual_fund" || t === "sip" || t === "equity") {
    return "equity";
  }

  // 2. Debt
  if (
    t === "fd" ||
    t === "fixed_deposit" ||
    t === "ppf" ||
    t === "epf" ||
    t === "nps" ||
    t === "bond" ||
    t === "bonds" ||
    t === "debt" ||
    t === "gsec"
  ) {
    return "debt";
  }

  // 3. Alternatives
  if (
    t === "aif" ||
    t === "pms" ||
    t === "gold" ||
    t === "sgb" ||
    t === "reit_invit" ||
    t === "reit" ||
    t === "crypto" ||
    t === "real_estate" ||
    t === "commodities"
  ) {
    return "alternatives";
  }

  return "others";
}

export interface MacroAllocationItem {
  key: MacroAssetClass;
  label: string;
  color: string;
  invested: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  pct: number;
  count: number;
}

export interface MacroAllocationResult {
  totalInvested: number;
  totalCurrentValue: number;
  totalGain: number;
  totalGainPct: number;
  items: MacroAllocationItem[];
}

/**
 * Calculates Macro Asset Allocation summary from raw investments or byType summary.
 */
export function calculateMacroAllocation(
  investments: Array<{
    type?: string;
    investedAmount?: number;
    currentValue?: number;
  }>
): MacroAllocationResult {
  const buckets: Record<MacroAssetClass, { count: number; invested: number; currentValue: number }> = {
    equity: { count: 0, invested: 0, currentValue: 0 },
    debt: { count: 0, invested: 0, currentValue: 0 },
    alternatives: { count: 0, invested: 0, currentValue: 0 },
    others: { count: 0, invested: 0, currentValue: 0 },
  };

  investments.forEach((inv) => {
    const macro = getMacroAssetClass(inv.type);
    const cost = inv.investedAmount || 0;
    const val = inv.currentValue ?? cost;
    buckets[macro].count += 1;
    buckets[macro].invested += cost;
    buckets[macro].currentValue += val;
  });

  const totalInvested = Object.values(buckets).reduce((s, b) => s + b.invested, 0);
  const totalCurrentValue = Object.values(buckets).reduce((s, b) => s + b.currentValue, 0);
  const basis = totalCurrentValue > 0 ? totalCurrentValue : totalInvested;

  const items: MacroAllocationItem[] = (["equity", "debt", "alternatives", "others"] as MacroAssetClass[]).map(
    (key) => {
      const b = buckets[key];
      const val = b.currentValue;
      const cost = b.invested;
      const gain = val - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
      const pct = basis > 0 ? (val / basis) * 100 : 0;

      return {
        key,
        label: MACRO_ASSET_CLASSES[key].label,
        color: MACRO_ASSET_CLASSES[key].color,
        invested: cost,
        currentValue: val,
        gain,
        gainPct,
        pct,
        count: b.count,
      };
    }
  );

  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalGain,
    totalGainPct,
    items,
  };
}

/**
 * Calculates Macro Asset Allocation directly from backend byType map
 */
export function calculateMacroFromByType(
  byType: Record<string, { count: number; invested: number; currentValue?: number }>
): MacroAllocationResult {
  const flattened: Array<{ type: string; investedAmount: number; currentValue: number }> = [];
  Object.entries(byType || {}).forEach(([type, data]) => {
    flattened.push({
      type,
      investedAmount: data.invested || 0,
      currentValue: data.currentValue ?? data.invested ?? 0,
    });
  });
  return calculateMacroAllocation(flattened);
}

// ─── Performance Timeline Generation ──────────────────────────────────────────

export type PerformanceTimeframe = "ALL" | "YTD" | "1Y" | "3M";

export interface PerformancePoint {
  date: string;
  label: string;
  value: number;
  invested: number;
  gain: number;
  gainPct: number;
}

/**
 * Generates historical performance time-series points based on holding entry dates
 * and current value progression.
 */
export function generatePerformanceTimeline(
  investments: Array<{
    buyDate?: string | Date | null;
    sipStartDate?: string | Date | null;
    createdAt?: string | Date | null;
    investedAmount?: number;
    currentValue?: number;
  }>,
  timeframe: PerformanceTimeframe = "ALL"
): PerformancePoint[] {
  if (!investments || investments.length === 0) return [];

  const now = new Date();
  let startDate = new Date();

  // Find earliest investment date
  let earliest = now.getTime();
  const normalized = investments.map((inv) => {
    const rawDate = inv.buyDate || inv.sipStartDate || inv.createdAt;
    const d = rawDate ? new Date(rawDate) : now;
    const time = isNaN(d.getTime()) ? now.getTime() : d.getTime();
    if (time < earliest) earliest = time;
    return {
      time,
      invested: inv.investedAmount || 0,
      currentValue: inv.currentValue ?? inv.investedAmount ?? 0,
    };
  });

  if (timeframe === "3M") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  } else if (timeframe === "1Y") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (timeframe === "YTD") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    // ALL TIME: use earliest holding date or at least 4 months ago for nice visualization
    const minSpan = new Date(now.getFullYear(), now.getMonth() - 4, 1).getTime();
    startDate = new Date(Math.min(earliest, minSpan));
  }

  // Ensure start is before now
  if (startDate >= now) {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  // Sort investments by chronological time
  normalized.sort((a, b) => a.time - b.time);

  // Generate 8-10 equidistant sampling date points between startDate and now
  const pointCount = 10;
  const timeStep = (now.getTime() - startDate.getTime()) / (pointCount - 1);
  const points: PerformancePoint[] = [];

  for (let idx = 0; idx < pointCount; idx++) {
    const targetTime = idx === pointCount - 1 ? now.getTime() : startDate.getTime() + idx * timeStep;
    const pDate = new Date(targetTime);

    // Filter investments made on or before targetTime
    const activeInvs = normalized.filter((i) => i.time <= targetTime);
    let investedSoFar = activeInvs.reduce((s, i) => s + i.invested, 0);

    // Compute interpolated valuation progression:
    // When time progresses from acquisition to now, gain matures toward currentValue
    let valueSoFar = 0;
    activeInvs.forEach((inv) => {
      const ageRatio =
        now.getTime() > inv.time
          ? Math.min(1, Math.max(0, (targetTime - inv.time) / (now.getTime() - inv.time)))
          : 1;
      const finalGain = inv.currentValue - inv.invested;
      // Growth curve: smoothly scales from cost to final value
      const pointVal = inv.invested + finalGain * Math.pow(ageRatio, 0.85);
      valueSoFar += pointVal;
    });

    // If no investments before this date, project baseline zero or first investment's start
    if (activeInvs.length === 0 && normalized.length > 0) {
      investedSoFar = 0;
      valueSoFar = 0;
    }

    const gain = valueSoFar - investedSoFar;
    const gainPct = investedSoFar > 0 ? (gain / investedSoFar) * 100 : 0;

    const day = pDate.getDate();
    const month = pDate.toLocaleString("en-US", { month: "short" });
    const label = `${day}-${month}`;
    const dateStr = pDate.toISOString().split("T")[0];

    points.push({
      date: dateStr,
      label,
      value: Math.round(valueSoFar),
      invested: Math.round(investedSoFar),
      gain: Math.round(gain),
      gainPct,
    });
  }

  return points;
}

// ─── Admin Only EDEOH Categorization (Equity, Debt, ELSS, Others, Hybrid) ───

export type EdeohCategory = "equity" | "debt" | "elss" | "others" | "hybrid";

export interface EdeohCategoryMeta {
  key: EdeohCategory;
  label: string;
  code: "E" | "D" | "O" | "H";
  badgeLabel: string;
  color: string;
  bgLight: string;
  borderLight: string;
  description: string;
}

export const EDEOH_CATEGORIES: Record<EdeohCategory, EdeohCategoryMeta> = {
  equity: {
    key: "equity",
    label: "Equity",
    code: "E",
    badgeLabel: "E · Equity",
    color: "#1E88E5",
    bgLight: "#EFF6FF",
    borderLight: "#BFDBFE",
    description: "Direct stocks & pure equity mutual fund schemes",
  },
  debt: {
    key: "debt",
    label: "Debt",
    code: "D",
    badgeLabel: "D · Debt",
    color: "#2E7D32",
    bgLight: "#F0FDF4",
    borderLight: "#BBF7D0",
    description: "Fixed deposits, bonds, government provident schemes & debt funds",
  },
  elss: {
    key: "elss",
    label: "ELSS",
    code: "E",
    badgeLabel: "E · ELSS",
    color: "#E8740C",
    bgLight: "#FFF3EB",
    borderLight: "#FED7AA",
    description: "Equity-linked tax-saving schemes (Section 80C)",
  },
  others: {
    key: "others",
    label: "Others",
    code: "O",
    badgeLabel: "O · Others",
    color: "#7C3AED",
    bgLight: "#FAF5FF",
    borderLight: "#E9D5FF",
    description: "Gold, commodities, real estate, cash & alternative assets",
  },
  hybrid: {
    key: "hybrid",
    label: "Hybrid",
    code: "H",
    badgeLabel: "H · Hybrid",
    color: "#0284C7",
    bgLight: "#F0F9FF",
    borderLight: "#BAE6FD",
    description: "Balanced advantage, dynamic asset allocation & multi-asset funds",
  },
};

export const EDEOH_ORDER: EdeohCategory[] = ["equity", "debt", "elss", "others", "hybrid"];

export function getEdeohMeta(category?: string | null): EdeohCategoryMeta | null {
  if (!category) return null;
  const key = category.toLowerCase().trim() as EdeohCategory;
  return EDEOH_CATEGORIES[key] || null;
}

