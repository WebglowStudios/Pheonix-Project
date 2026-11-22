"use client";

import React, { useEffect, useState } from "react";
import { portfolioApi, Investment } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced, faArrowTrendUp, faArrowTrendDown,
  faCircleInfo, faCalendarDays, faReceipt, faChartPie,
  faChevronDown, faChevronUp, faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function holdingLabel(days: number | null | undefined) {
  if (days === null || days === undefined) return "—";
  if (days < 30)  return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}m ${days % 30}d`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m > 0 ? `${y}y ${m}m` : `${y}y`;
}

const TAX_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "STCG":      { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300" },
  "LTCG":      { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-300" },
  "Slab Rate": { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-300"  },
  "Flat 30%":  { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-300"   },
};

function TaxBadge({ label }: { label?: string }) {
  if (!label) return <span className="text-[#94a3b8]">—</span>;
  const c = TAX_COLORS[label] ?? { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: {
  icon: typeof faScaleBalanced; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 flex gap-4 items-start shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest">{label}</p>
        <p className="text-[20px] font-bold text-[#1a2740] leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Page
// ════════════════════════════════════════════════════════════════════════════
export default function TaxPlanningPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<"all" | "STCG" | "LTCG" | "Slab Rate" | "Flat 30%">("all");
  const [sortBy, setSortBy]           = useState<"holdingDays" | "gain" | "estimatedTax">("holdingDays");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  useEffect(() => {
    portfolioApi.getAll().then((res) => {
      // only holdings with a gain > 0 are tax-relevant (losses = no tax)
      setInvestments(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const withTax = investments.filter((i) => i.gain !== undefined);

  const stcgHoldings  = withTax.filter((i) => i.taxLabel === "STCG");
  const ltcgHoldings  = withTax.filter((i) => i.taxLabel === "LTCG");
  const slabHoldings  = withTax.filter((i) => i.taxLabel === "Slab Rate");
  const flat30Hold    = withTax.filter((i) => i.taxLabel === "Flat 30%");

  const totalSTCGGain = stcgHoldings.reduce((s, i) => s + Math.max(i.gain ?? 0, 0), 0);
  const totalLTCGGain = ltcgHoldings.reduce((s, i) => s + Math.max(i.gain ?? 0, 0), 0);

  const totalEstTax = withTax.reduce((s, i) => {
    if (typeof i.estimatedTax === "number" && i.estimatedTax > 0) return s + i.estimatedTax;
    return s;
  }, 0);

  // Capital-weighted average holding days
  let totalInvestedWithDays = 0;
  let weightedDaysSum = 0;
  withTax.forEach((i) => {
    if (typeof i.holdingDays === "number") {
      const amt = i.investedAmount || 0;
      totalInvestedWithDays += amt;
      weightedDaysSum += i.holdingDays * amt;
    }
  });
  const avgHoldingDays = totalInvestedWithDays > 0 ? Math.round(weightedDaysSum / totalInvestedWithDays) : 0;

  // ── Filtered + sorted display list ───────────────────────────────────────
  const displayed = [...withTax]
    .filter((i) => filter === "all" || i.taxLabel === filter)
    .sort((a, b) => {
      if (sortBy === "holdingDays") return (b.holdingDays ?? 0) - (a.holdingDays ?? 0);
      if (sortBy === "gain")        return (b.gain ?? 0) - (a.gain ?? 0);
      if (sortBy === "estimatedTax") return ((b.estimatedTax ?? 0) as number) - ((a.estimatedTax ?? 0) as number);
      return 0;
    });

  const thCls = "text-left text-[11px] font-bold uppercase tracking-wider text-[#8a92a6] px-4 py-3 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-[13px] text-[#2d3748]";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1a2740] flex items-center gap-2">
          <FontAwesomeIcon icon={faScaleBalanced} className="text-[#E8740C]" />
          Tax Planning
        </h1>
        <p className="text-sm text-[#8a92a6] mt-1">
          Holding period analysis with STCG / LTCG classification — FY 2024-25 rules
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={faCalendarDays}
          label="Avg Holding Days"
          value={holdingLabel(avgHoldingDays)}
          sub={`across ${withTax.length} holdings`}
          color="bg-indigo-100 text-indigo-600"
        />
        <KpiCard
          icon={faArrowTrendUp}
          label="LTCG Gain"
          value={fmt(totalLTCGGain)}
          sub={`${ltcgHoldings.length} holdings · 12.5% tax`}
          color="bg-green-100 text-green-600"
        />
        <KpiCard
          icon={faArrowTrendDown}
          label="STCG Gain"
          value={fmt(totalSTCGGain)}
          sub={`${stcgHoldings.length} holdings · 20% tax`}
          color="bg-amber-100 text-amber-600"
        />
        <KpiCard
          icon={faReceipt}
          label="Est. Tax Liability"
          value={fmt(totalEstTax)}
          sub="excl. ₹1.25L LTCG exemption & slab"
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* LTCG Exemption info bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-start gap-3 text-sm text-blue-700">
        <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0" />
        <div>
          <strong>LTCG Exemption:</strong> Equity & equity MF gains up to <strong>₹1,25,000</strong> per FY are tax-free.
          Gains above that are taxed at <strong>12.5%</strong> (no indexation).
          STCG on equity is taxed at <strong>20%</strong>.
          Debt instruments are taxed at your <strong>income slab rate</strong>.
          Crypto is taxed at a flat <strong>30%</strong>.
        </div>
      </div>

      {/* Distribution pills */}
      <div className="flex flex-wrap gap-3">
        {(["all", "STCG", "LTCG", "Slab Rate", "Flat 30%"] as const).map((f) => {
          const count = f === "all" ? withTax.length : withTax.filter((i) => i.taxLabel === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filter === f
                  ? "bg-[#1a2740] text-white border-[#1a2740]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#1a2740]"
              }`}
            >
              {f === "all" ? "All Holdings" : f} ({count})
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 text-xs text-[#8a92a6]">
          <span>Sort:</span>
          {(["holdingDays", "gain", "estimatedTax"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                sortBy === s
                  ? "bg-[#E8740C] text-white border-[#E8740C]"
                  : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#E8740C]"
              }`}
            >
              {s === "holdingDays" ? "Holding Days" : s === "gain" ? "Gain" : "Est. Tax"}
            </button>
          ))}
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className={thCls + " min-w-[260px]"}>Investment</th>
                <th className={thCls + " w-[110px] whitespace-nowrap"}>Type</th>
                <th className={thCls + " w-[110px] whitespace-nowrap"}>Buy Date</th>
                <th className={thCls + " text-center w-[90px] whitespace-nowrap"}>Holding</th>
                <th className={thCls + " text-right w-[120px] whitespace-nowrap"}>Invested</th>
                <th className={thCls + " text-right w-[130px] whitespace-nowrap"}>Current Value</th>
                <th className={thCls + " text-right w-[120px] whitespace-nowrap"}>Gain / Loss</th>
                <th className={thCls + " text-center w-[110px] whitespace-nowrap"}>Tax Class</th>
                <th className={thCls + " text-right w-[110px] whitespace-nowrap"}>Est. Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#94a3b8] text-sm">
                    No holdings found.
                  </td>
                </tr>
              )}
              {displayed.map((inv) => {
                const gain        = inv.gain ?? 0;
                const isProfit    = gain >= 0;
                const buyDateStr  = inv.buyDate || inv.sipStartDate;
                const isExpanded  = expandedIds.has(inv._id);

                return (
                  <React.Fragment key={inv._id}>
                    <tr className="hover:bg-[#f8fafc] transition-colors">
                      <td className={tdCls}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-[#1a2740] leading-snug break-words" title={inv.name}>{inv.name}</p>
                          {inv.lotCount && inv.lotCount > 1 ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(inv._id)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#E8740C]/10 text-[#E8740C] border border-[#E8740C]/30 hover:bg-[#E8740C] hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap"
                              title="Click to toggle purchase tranches"
                            >
                              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[8px]" />
                              <span>{inv.lotCount} Tranches</span>
                            </button>
                          ) : null}
                        </div>
                        {inv.symbol && <p className="text-[11px] text-[#94a3b8] font-mono">{inv.symbol}</p>}
                      </td>
                      <td className={tdCls}>
                        <span className="px-2 py-0.5 bg-[#f0f4ff] text-[#4f6ef7] text-[11px] font-semibold rounded-full">
                          {inv.type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className={tdCls + " text-[#64748b]"}>
                        {buyDateStr
                          ? new Date(buyDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                        {inv.lotCount && inv.lotCount > 1 ? (
                          <span className="text-[10px] text-[#94a3b8] block">latest purchase</span>
                        ) : null}
                      </td>
                      <td className={tdCls + " text-center font-mono font-semibold text-[#1a2740]"}>
                        {holdingLabel(inv.holdingDays)}
                        {inv.lotCount && inv.lotCount > 1 ? (
                          <span className="text-[10px] text-[#94a3b8] block font-sans font-normal">weighted avg</span>
                        ) : null}
                      </td>
                      <td className={tdCls + " text-right text-[#64748b]"}>
                        {fmt(inv.investedAmount)}
                      </td>
                      <td className={tdCls + " text-right font-semibold"}>
                        {fmt(inv.currentValue ?? inv.investedAmount)}
                      </td>
                      <td className={tdCls + " text-right"}>
                        <span className={isProfit ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                          {isProfit ? "+" : ""}{fmt(gain)}
                        </span>
                        <br />
                        <span className={`text-[11px] ${isProfit ? "text-green-500" : "text-red-400"}`}>
                          {isProfit ? "+" : ""}{(inv.gainPercent ?? 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className={tdCls + " text-center"}>
                        <TaxBadge label={inv.taxLabel} />
                      </td>
                      <td className={tdCls + " text-right"}>
                        {inv.estimatedTax === null || inv.estimatedTax === undefined
                          ? <span className="text-[#94a3b8] text-xs">At slab</span>
                          : gain <= 0
                          ? <span className="text-green-600 text-xs font-semibold">No tax</span>
                          : <span className="text-red-600 font-bold">{fmt(inv.estimatedTax)}</span>
                        }
                      </td>
                    </tr>
                    {isExpanded && inv.lots && inv.lots.length > 0 && (
                      <tr key={`${inv._id}-tranches`} className="bg-[#FAFBFD] border-b border-[#EAECEF]">
                        <td colSpan={9} className="px-6 py-3.5">
                          <div className="bg-white rounded-xl border border-[#EAECEF] p-3.5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#F0F2F5] flex-wrap gap-2">
                              <p className="text-xs font-bold text-[#1a1b23] flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-[#E8740C] text-[10px]" />
                                Individual Purchase Tranches &amp; Tax Status ({inv.lots.length} lots)
                              </p>
                              <span className="text-[11px] text-[#8a92a6]">
                                Each tranche is tracked individually for FY2024-25 LTCG / STCG rules
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[10px] uppercase font-bold text-[#8a92a6] border-b border-[#F0F2F5]">
                                    <th className="text-left py-1.5 px-2">Tranche / Date</th>
                                    <th className="text-right py-1.5 px-2">Units</th>
                                    <th className="text-right py-1.5 px-2">Buy NAV</th>
                                    <th className="text-right py-1.5 px-2">Invested</th>
                                    <th className="text-right py-1.5 px-2">Current Value</th>
                                    <th className="text-right py-1.5 px-2">Gain / Loss</th>
                                    <th className="text-center py-1.5 px-2">Holding Period</th>
                                    <th className="text-center py-1.5 px-2">Tax Class</th>
                                    <th className="text-right py-1.5 px-2">Est. Tax</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F7FA]">
                                  {inv.lots.map((lot, idx) => {
                                    const lotCv = lot.currentValue ?? lot.investedAmount;
                                    const lotGain = lotCv - lot.investedAmount;
                                    const lotProfit = lotGain >= 0;
                                    const lotDate = lot.buyDate;
                                    return (
                                      <tr key={lot._id || idx} className="hover:bg-[#FAFBFD]">
                                        <td className="py-2 px-2 font-medium text-[#1a1b23]">
                                          <span className="font-bold text-[#E8740C] mr-1.5">#{inv.lots!.length - idx}</span>
                                          {lotDate ? new Date(lotDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums font-mono text-[#555]">
                                          {lot.units ? lot.units.toLocaleString("en-IN") : "—"}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums text-[#555]">
                                          {lot.buyPrice ? `₹${lot.buyPrice.toLocaleString("en-IN")}` : "—"}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums font-semibold text-[#1a1b23]">
                                          ₹{lot.investedAmount.toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums font-semibold text-[#1a1b23]">
                                          ₹{lotCv.toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums font-medium">
                                          <span className={lotProfit ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                                            {lotProfit ? "+" : ""}₹{Math.abs(lotGain).toLocaleString("en-IN")}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center text-[#1a2740] font-mono font-semibold">
                                          {holdingLabel(lot.holdingDays)}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <TaxBadge label={lot.taxLabel} />
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                          {lot.estimatedTax === null || lot.estimatedTax === undefined
                                            ? <span className="text-[#94a3b8] text-[11px]">Slab</span>
                                            : lotGain <= 0
                                            ? <span className="text-green-600 text-[11px] font-semibold">No tax</span>
                                            : <span className="text-red-600 font-bold">₹{lot.estimatedTax.toLocaleString("en-IN")}</span>
                                          }
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {/* Footer totals */}
            {displayed.length > 0 && (
              <tfoot className="bg-[#f8fafc] border-t-2 border-[#e2e8f0]">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-[#1a2740]">
                    {displayed.length} holdings shown
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-[#1a2740]">
                    {fmt(displayed.reduce((s, i) => s + i.investedAmount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-[#1a2740]">
                    {fmt(displayed.reduce((s, i) => s + (i.currentValue ?? i.investedAmount), 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const g = displayed.reduce((s, i) => s + (i.gain ?? 0), 0);
                      return <span className={`text-xs font-bold ${g >= 0 ? "text-green-600" : "text-red-500"}`}>{g >= 0 ? "+" : ""}{fmt(g)}</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-xs font-bold text-red-600">
                    {fmt(displayed.reduce((s, i) => s + (typeof i.estimatedTax === "number" ? i.estimatedTax : 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-[#94a3b8] text-center pb-2">
        * Estimated tax figures are indicative only based on FY 2024-25 rules. LTCG on equity excludes the ₹1.25L annual exemption.
        Consult a CA for precise tax computation. Debt instrument tax depends on your individual income slab.
      </p>
    </div>
  );
}
