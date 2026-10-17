"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { portfolioApi, getStoredUser, type PortfolioSummary, type Investment } from "@/lib/api";
import InvestmentNotePopup from "@/components/InvestmentNotePopup";
import PerformanceGraph from "@/components/dashboard/PerformanceGraph";
import AllocationWidget from "@/components/dashboard/AllocationWidget";
import { calculateMacroFromByType, MACRO_ASSET_CLASSES } from "@/lib/assetAllocation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faArrowRight, faChartPie, faArrowTrendUp, faArrowTrendDown,
  faChartLine, faSackDollar, faCoins, faLandmark, faLeaf, faRing,
  faBitcoinSign, faFileContract, faHandHoldingDollar, faWallet,
  faScaleBalanced, faLayerGroup, faTriangleExclamation, faFilePdf, faBuildingColumns,
} from "@fortawesome/free-solid-svg-icons";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Allocation chart colors & type labels ───────────────────────────────────

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
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, isGain, icon }: {
  label: string; value: string; sub?: string; isGain?: boolean | null;
  icon: ReturnType<typeof Object.values>[0];
}) {
  const valueColor =
    isGain === true  ? "text-[#1b5e20]" :
    isGain === false ? "text-[#b71c1c]" :
    "text-[#1a1b23]";

  const iconBg =
    isGain === true  ? "bg-[#e8f5e9]" :
    isGain === false ? "bg-[#ffebee]" :
    "bg-[#f5f6f8]";

  const iconColor =
    isGain === true  ? "text-[#2e7d32]" :
    isGain === false ? "text-[#c62828]" :
    "text-[#E8740C]";

  return (
    <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#8a92a6] uppercase tracking-[0.8px]">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <FontAwesomeIcon icon={icon} className={`text-xs ${iconColor}`} />
        </div>
      </div>
      <p className={`text-2xl font-extrabold leading-none tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="text-[#aaa] text-xs mt-1.5 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Type icon map for recent investments ────────────────────────────────────

const TYPE_ICONS: Record<string, ReturnType<typeof Object.values>[0]> = {
  stock: faChartLine, mutual_fund: faChartPie, sip: faCoins,
  aif: faBuildingColumns,
  fd: faLandmark, ppf: faLeaf, epf: faHandHoldingDollar,
  nps: faSackDollar, bond: faFileContract, gold: faRing, crypto: faBitcoinSign,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0F2F5]">
      <h2 className="text-[13px] font-bold text-[#1a1b23] tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = getStoredUser();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      portfolioApi.getSummary(),
      portfolioApi.getAll().catch(() => [] as Investment[]),
    ])
      .then(([resSummary, resAll]) => {
        if (resSummary.success && resSummary.data) setSummary(resSummary.data);
        else setError("Could not load portfolio data.");

        const invs = Array.isArray(resAll)
          ? resAll
          : Array.isArray((resAll as any)?.data)
          ? (resAll as any).data
          : [];
        setInvestments(invs);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to server.");
        setLoading(false);
      });
  }, []);

  const gain = summary?.totalGain ?? 0;
  const gainPct = summary?.totalGainPercent ?? 0;
  const hasHoldings = (summary?.holdings ?? 0) > 0;

  const macroSummary = calculateMacroFromByType(summary?.byType ?? {});

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1">
            {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
          </p>
          <h1 className="text-2xl font-extrabold text-[#1a1b23] leading-tight">
            Portfolio Overview
          </h1>
          <p className="text-[#8a92a6] text-sm mt-0.5">
            {hasHoldings ? "Here's how your investments are performing." : "Start by adding your first investment."}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E5EB] text-[#1a1b23] font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm no-underline shadow-xs flex-shrink-0"
          >
            <FontAwesomeIcon icon={faFilePdf} className="text-xs text-[#E8740C]" />
            Export Report (PDF)
          </Link>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-semibold rounded-lg hover:bg-[#d4660b] transition-colors text-sm no-underline shadow-sm flex-shrink-0"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Investment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#E8740C] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#aaa] text-sm">Loading portfolio...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-[#fff8f8] border border-[#FFCDD2] rounded-xl p-4 flex items-center gap-3 text-[#c62828] text-sm font-medium mb-6">
          <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0" />
          {error} — Make sure Phoenix Engine is running on port 5000.
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Invested"
              value={fmt(summary?.totalInvested ?? 0)}
              icon={faWallet}
            />
            <StatCard
              label="Current Value"
              value={fmt(summary?.currentValue ?? 0)}
              icon={faChartLine}
            />
            <StatCard
              label="Total Gain / Loss"
              value={gain === 0 ? "—" : `${gain >= 0 ? "+" : ""}${fmt(Math.abs(gain))}`}
              sub={gain !== 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%` : undefined}
              isGain={gain === 0 ? null : gain > 0}
              icon={gain >= 0 ? faArrowTrendUp : faArrowTrendDown}
            />
            <StatCard
              label="Holdings"
              value={String(summary?.holdings ?? 0)}
              sub="investments"
              icon={faLayerGroup}
            />
          </div>

          {hasHoldings ? (
            <div className="flex flex-col gap-6">
              {/* Row 1: Performance Graph & Allocation Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-7 flex flex-col h-full">
                  <PerformanceGraph
                    investments={investments.length > 0 ? investments : (summary?.recentInvestments as any[] || [])}
                    totalCurrentValue={summary?.currentValue ?? 0}
                    totalInvested={summary?.totalInvested ?? 0}
                  />
                </div>
                <div className="lg:col-span-5 flex flex-col h-full">
                  <AllocationWidget
                    investments={investments}
                    byType={summary?.byType ?? {}}
                    totalInvested={summary?.totalInvested ?? 0}
                    totalCurrentValue={summary?.currentValue ?? 0}
                  />
                </div>
              </div>

              {/* Row 2: Recent investments + Macro Asset breakdown & actions */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
                {/* Recent investments */}
                <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <SectionHeader
                      title="Recent Investments"
                      action={
                        <Link href="/dashboard/portfolio" className="text-[#E8740C] text-xs font-semibold flex items-center gap-1.5 hover:text-[#d4660b] no-underline transition-colors">
                          View all <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                        </Link>
                      }
                    />
                    <div className="divide-y divide-[#F5F7FA]">
                      {(summary?.recentInvestments ?? []).map((inv) => (
                        <div key={inv._id} className="flex items-center gap-3.5 px-5 py-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: (TYPE_META[inv.type!]?.color ?? "#999") + "18" }}
                          >
                            <FontAwesomeIcon
                              icon={TYPE_ICONS[inv.type!] ?? faSackDollar}
                              style={{ color: TYPE_META[inv.type!]?.color ?? "#999" }}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <InvestmentNotePopup notes={inv.notes} itemName={inv.name} itemType={TYPE_META[inv.type!]?.label}>
                              <p className="font-semibold text-[#1a1b23] text-sm truncate">{inv.name}</p>
                            </InvestmentNotePopup>
                            <p className="text-[#8a92a6] text-xs">{TYPE_META[inv.type!]?.label ?? inv.type}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-[#1a1b23] text-sm tabular-nums">{fmt(inv.investedAmount ?? 0)}</p>
                            <p className="text-[#aaa] text-xs">{timeAgo(inv.createdAt!)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Macro Asset class breakdown + Quick actions */}
                <div className="flex flex-col gap-5">
                  {/* Macro Asset class breakdown */}
                  <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden">
                    <SectionHeader title="Macro Asset Exposure" />
                    <div className="p-4 flex flex-col gap-3">
                      {macroSummary.items.map((m) => (
                        <div key={m.key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-semibold text-[#1a1b23] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                              {m.label}
                            </span>
                            <span className="text-[11px] text-[#8a92a6] font-bold tabular-nums">
                              {fmt(m.currentValue)} · {m.pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, m.pct)}%`, backgroundColor: m.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden">
                    <SectionHeader title="Quick Actions" />
                    <div className="p-3 flex flex-col gap-1">
                      {[
                        { href: "/dashboard/add", label: "Add Investment", icon: faPlus },
                        { href: "/dashboard/portfolio", label: "View All Holdings", icon: faScaleBalanced },
                        { href: "/dashboard/report", label: "Export PDF Report", icon: faFilePdf },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#444] hover:bg-[#FFF8F3] hover:text-[#E8740C] transition-all no-underline group"
                        >
                          <FontAwesomeIcon icon={item.icon} className="text-[#E8740C] w-[13px]" />
                          {item.label}
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="ml-auto text-[10px] text-[#D0D3DA] group-hover:text-[#E8740C] transition-colors"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF3EB] flex items-center justify-center mb-5">
                <FontAwesomeIcon icon={faWallet} className="text-[#E8740C] text-2xl" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a1b23] mb-2">No investments yet</h2>
              <p className="text-[#8a92a6] text-sm max-w-[340px] mb-7 leading-relaxed">
                Add your first investment to start tracking your portfolio — stocks, SIPs, mutual funds, FDs, gold, and more.
              </p>
              <Link href="/dashboard/add"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E8740C] text-white font-semibold rounded-lg hover:bg-[#d4660b] transition-colors shadow-sm no-underline text-sm">
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Add First Investment
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
