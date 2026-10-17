"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import {
  calculateMacroAllocation,
  type MacroAllocationResult,
  MACRO_ASSET_CLASSES,
} from "@/lib/assetAllocation";

export type AllocationViewMode = "asset" | "type";

interface AllocationWidgetProps {
  investments?: Array<{
    type?: string;
    investedAmount?: number;
    currentValue?: number;
  }>;
  byType?: Record<string, { count: number; invested: number; currentValue?: number }>;
  totalInvested?: number;
  totalCurrentValue?: number;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  stock:       { label: "Stocks",        color: "#1565C0" },
  mutual_fund: { label: "Mutual Funds",  color: "#2E7D32" },
  sip:         { label: "SIP",           color: "#E8740C" },
  aif:         { label: "AIF",           color: "#4E342E" },
  fd:          { label: "Fixed Deposit", color: "#6A1B9A" },
  ppf:         { label: "PPF",           color: "#E65100" },
  epf:         { label: "EPF",           color: "#00838F" },
  nps:         { label: "NPS",           color: "#F57F17" },
  bond:        { label: "Bonds",         color: "#880E4F" },
  gold:        { label: "Gold",          color: "#F9A825" },
  crypto:      { label: "Crypto",        color: "#4527A0" },
  reit_invit:  { label: "REIT / InvIT",  color: "#009688" },
};

function fmt(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AllocationWidget({
  investments = [],
  byType = {},
  totalInvested = 0,
  totalCurrentValue = 0,
}: AllocationWidgetProps) {
  const [viewMode, setViewMode] = useState<AllocationViewMode>("asset");

  // Effective basis for pie percentages
  const effectiveTotal = totalCurrentValue > 0 ? totalCurrentValue : totalInvested;

  // 1. Macro Asset Class Allocation (Equity, Debt, Alternatives, Others)
  const macroData: MacroAllocationResult = useMemo(() => {
    if (investments.length > 0) {
      return calculateMacroAllocation(investments);
    }
    // Fallback from byType map
    const list: Array<{ type: string; investedAmount: number; currentValue: number }> = [];
    Object.entries(byType).forEach(([type, data]) => {
      list.push({
        type,
        investedAmount: data.invested || 0,
        currentValue: data.currentValue ?? data.invested ?? 0,
      });
    });
    return calculateMacroAllocation(list);
  }, [investments, byType]);

  // 2. Instrument Type Allocation (Stocks, Mutual Funds, SIP, FD, etc.)
  const typeSegments = useMemo(() => {
    const entries = Object.entries(byType);
    if (entries.length === 0 && investments.length > 0) {
      // aggregate from investments
      const agg: Record<string, { count: number; invested: number; currentValue: number }> = {};
      investments.forEach((i) => {
        const t = i.type || "other";
        if (!agg[t]) agg[t] = { count: 0, invested: 0, currentValue: 0 };
        agg[t].count += 1;
        agg[t].invested += i.investedAmount || 0;
        agg[t].currentValue += i.currentValue ?? i.investedAmount ?? 0;
      });
      return Object.entries(agg).map(([type, d]) => {
        const val = d.currentValue || d.invested;
        const pct = effectiveTotal > 0 ? (val / effectiveTotal) * 100 : 0;
        return {
          key: type,
          label: TYPE_META[type]?.label ?? type,
          color: TYPE_META[type]?.color ?? "#999",
          pct,
          currentValue: val,
        };
      });
    }

    return entries.map(([type, d]) => {
      const val = d.currentValue ?? d.invested;
      const pct = effectiveTotal > 0 ? (val / effectiveTotal) * 100 : 0;
      return {
        key: type,
        label: TYPE_META[type]?.label ?? type,
        color: TYPE_META[type]?.color ?? "#999",
        pct,
        currentValue: val,
      };
    });
  }, [byType, investments, effectiveTotal]);

  // Conic gradient calculation
  const activeSegments = viewMode === "asset" ? macroData.items : typeSegments;
  const nonZeroSegments = activeSegments.filter((s) => s.pct > 0.05);

  let cumulative = 0;
  const gradientStops = nonZeroSegments.map((s) => {
    const start = cumulative;
    cumulative += s.pct;
    const end = Math.min(100, cumulative);
    return `${s.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });
  const gradient =
    gradientStops.length > 0
      ? gradientStops.join(", ")
      : "#E5E7EB 0% 100%";

  return (
    <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden flex flex-col justify-between h-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0F2F5] min-h-[58px]">
        <div>
          <h2 className="text-[13px] font-bold text-[#1a1b23] tracking-tight">Allocation</h2>
          <p className="text-[11px] text-gray-400 font-medium">
            {viewMode === "asset" ? "Macro Asset Class" : "Instrument Distribution"}
          </p>
        </div>

        {/* Toggle Pills matching the reference screenshot */}
        <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-lg">
          <button
            onClick={() => setViewMode("asset")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              viewMode === "asset"
                ? "bg-white text-[#1a1b23] shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            BY ASSET
          </button>
          <button
            onClick={() => setViewMode("type")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              viewMode === "type"
                ? "bg-white text-[#1a1b23] shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            BY INVESTMENT TYPE
          </button>
        </div>
      </div>

      {/* Main Allocation Body */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        {effectiveTotal === 0 ? (
          <div className="h-[210px] flex items-center justify-center text-gray-400 text-xs">
            No holdings recorded
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative flex-shrink-0 w-40 h-40">
              <div
                className="w-40 h-40 rounded-full transition-all duration-500 shadow-xs"
                style={{ background: `conic-gradient(${gradient})` }}
              />
              <div className="absolute inset-[24px] rounded-full bg-white flex flex-col items-center justify-center shadow-xs">
                <p className="text-[8.5px] text-[#8a92a6] font-bold uppercase tracking-widest mb-0.5">
                  TOTAL
                </p>
                <p className="text-xs font-black text-[#1a1b23] leading-tight text-center px-1">
                  {fmt(effectiveTotal)}
                </p>
              </div>
            </div>

            {/* Legend List (Identical to screenshot) */}
            <div className="flex-1 w-full flex flex-col gap-2.5">
              {viewMode === "asset" ? (
                // BY ASSET: Shows Equity, Debt, Alternatives, Others
                macroData.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-gray-800">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1a1b23] tabular-nums">
                        {item.pct.toFixed(2)}%
                      </span>
                      <span className="text-[10.5px] text-gray-400 tabular-nums">
                        ({fmt(item.currentValue)})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                // BY INVESTMENT TYPE: Shows Stocks, Mutual Funds, SIP, etc.
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {typeSegments.map((s) => (
                    <div key={s.key} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-gray-700 font-medium truncate">
                          {s.label}
                        </span>
                      </div>
                      <span className="font-bold text-[#1a1b23] tabular-nums ml-2">
                        {s.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Link matching screenshot */}
      <div className="px-5 py-2.5 bg-[#FAFBFD] border-t border-[#F0F2F5] flex justify-between items-center text-xs mt-auto">
        <span className="text-gray-400 font-medium">
          {viewMode === "asset" ? "4 Core Asset Classes" : `${typeSegments.length} Investment Types`}
        </span>
        <Link
          href="/dashboard/portfolio"
          className="text-[#E8740C] font-semibold flex items-center gap-1 hover:text-[#d4660b] no-underline"
        >
          See Detailed Breakdown <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
        </Link>
      </div>
    </div>
  );
}
