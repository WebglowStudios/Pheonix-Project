"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { portfolioApi, getStoredUser, type PortfolioSummary } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faArrowRight, faChartPie, faArrowTrendUp, faArrowTrendDown,
  faChartLine, faSackDollar, faCoins, faLandmark, faLeaf, faRing,
  faBitcoinSign, faFileContract, faHandHoldingDollar,
} from "@fortawesome/free-solid-svg-icons";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
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
  fd:          { label: "Fixed Deposit", color: "#6A1B9A" },
  ppf:         { label: "PPF",           color: "#E65100" },
  epf:         { label: "EPF",           color: "#00838F" },
  nps:         { label: "NPS",           color: "#F57F17" },
  bond:        { label: "Bonds",         color: "#880E4F" },
  gold:        { label: "Gold",          color: "#F9A825" },
  crypto:      { label: "Crypto",        color: "#4527A0" },
};

// ─── Allocation Donut Chart ──────────────────────────────────────────────────

function AllocationChart({ byType, total }: {
  byType: Record<string, { count: number; invested: number }>;
  total: number;
}) {
  if (total === 0) return null;
  const entries = Object.entries(byType);
  let cumulative = 0;
  const segments = entries.map(([type, data]) => {
    const pct = (data.invested / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { type, pct, start, end: cumulative, color: TYPE_META[type]?.color ?? "#999" };
  });

  const gradient = segments
    .map(s => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`)
    .join(", ");

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0 w-40 h-40">
        <div
          className="w-40 h-40 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        {/* Center hole */}
        <div className="absolute inset-[22px] rounded-full bg-white flex flex-col items-center justify-center">
          <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Total</p>
          <p className="text-sm font-extrabold text-[#1a1b23] leading-tight">{fmt(total)}</p>
        </div>
      </div>
      {/* Legend */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {segments.map(s => (
          <div key={s.type} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-[#555] font-medium truncate">
              {TYPE_META[s.type]?.label ?? s.type}
            </span>
            <span className="ml-auto text-xs font-bold text-[#333]">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, isGain }: {
  label: string; value: string; sub?: string; isGain?: boolean | null;
}) {
  return (
    <div className="bg-white rounded-[12px] shadow-sm p-5 border border-[#F0F0F0]">
      <p className="text-[10px] font-bold text-[#999] uppercase tracking-[1.2px] mb-2">{label}</p>
      <p className={`text-[1.8rem] font-extrabold leading-none ${
        isGain === true ? "text-[#2E7D32]" : isGain === false ? "text-[#C62828]" : "text-[#1a1b23]"
      }`}>
        {value}
      </p>
      {sub && <p className="text-[#aaa] text-xs mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Type icon map for recent investments ────────────────────────────────────

const TYPE_ICONS: Record<string, ReturnType<typeof Object.values>[0]> = {
  stock: faChartLine, mutual_fund: faChartPie, sip: faCoins,
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = getStoredUser();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    portfolioApi.getSummary().then((res) => {
      if (res.success && res.data) setSummary(res.data);
      else setError("Could not load portfolio data.");
      setLoading(false);
    }).catch(() => { setError("Could not connect to server."); setLoading(false); });
  }, []);

  const gain = summary?.totalGain ?? 0;
  const gainPct = summary?.totalGainPercent ?? 0;
  const hasHoldings = (summary?.holdings ?? 0) > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">
            {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-[#666] text-sm mt-1">
            {hasHoldings ? "Here's your portfolio overview." : "Start by adding your first investment."}
          </p>
        </div>
        <Link
          href="/dashboard/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-bold rounded-[30px] border-2 border-[#E8740C] hover:bg-[#FF9433] transition-all shadow-[0_4px_16px_rgba(232,116,12,0.2)] no-underline text-sm flex-shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} /> Add Investment
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666] text-sm">Loading portfolio...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-[12px] p-5 text-[#C62828] text-sm font-medium mb-6">
          ⚠️ {error} — Make sure the Phoenix Engine server is running on port 5000.
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Invested" value={fmt(summary?.totalInvested ?? 0)} />
            <StatCard label="Current Value" value={fmt(summary?.currentValue ?? 0)} />
            <StatCard
              label="Total Gain / Loss"
              value={gain === 0 ? "—" : `${gain >= 0 ? "+" : ""}${fmt(Math.abs(gain))}`}
              sub={gain !== 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%` : undefined}
              isGain={gain === 0 ? null : gain > 0}
            />
            <StatCard label="Holdings" value={String(summary?.holdings ?? 0)} sub="investments" />
          </div>

          {hasHoldings ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
              {/* Left: Allocation + Recent */}
              <div className="flex flex-col gap-5">
                {/* Allocation */}
                <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] p-6">
                  <h2 className="font-bold text-[#333] mb-5 text-sm uppercase tracking-wide">Portfolio Allocation</h2>
                  <AllocationChart byType={summary?.byType ?? {}} total={summary?.totalInvested ?? 0} />
                </div>

                {/* Recent investments */}
                <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
                    <h2 className="font-bold text-[#333] text-sm">Recent Investments</h2>
                    <Link href="/dashboard/portfolio" className="text-[#E8740C] text-xs font-semibold flex items-center gap-1 hover:text-[#FF9433] no-underline">
                      View all <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                    </Link>
                  </div>
                  <div className="divide-y divide-[#F5F5F5]">
                    {(summary?.recentInvestments ?? []).map((inv) => (
                      <div key={inv._id} className="flex items-center gap-4 px-5 py-3.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: (TYPE_META[inv.type!]?.color ?? "#999") + "20" }}
                        >
                          <FontAwesomeIcon
                            icon={TYPE_ICONS[inv.type!] ?? faSackDollar}
                            style={{ color: TYPE_META[inv.type!]?.color ?? "#999" }}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#333] text-sm truncate">{inv.name}</p>
                          <p className="text-[#999] text-xs">{TYPE_META[inv.type!]?.label ?? inv.type}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-[#333] text-sm">{fmt(inv.investedAmount ?? 0)}</p>
                          <p className="text-[#aaa] text-xs">{timeAgo(inv.createdAt!)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Type breakdown */}
              <div className="flex flex-col gap-5">
                <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#F0F0F0]">
                    <h2 className="font-bold text-[#333] text-sm">By Asset Class</h2>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {Object.entries(summary?.byType ?? {}).map(([type, d]) => {
                      const pct = summary?.totalInvested ? (d.invested / summary.totalInvested) * 100 : 0;
                      const meta = TYPE_META[type];
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#444]">{meta?.label ?? type}</span>
                            <span className="text-xs text-[#666]">{fmt(d.invested)} · {pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta?.color ?? "#999" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#F0F0F0]">
                    <h2 className="font-bold text-[#333] text-sm">Quick Actions</h2>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    {[
                      { href: "/dashboard/add", label: "Add Investment", icon: faPlus },
                      { href: "/dashboard/portfolio", label: "View All Holdings", icon: faChartPie },
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-sm font-semibold text-[#444] hover:bg-[#FFF3EB] hover:text-[#E8740C] transition-all no-underline group">
                        <FontAwesomeIcon icon={item.icon} className="text-[#E8740C] w-[14px]" />
                        {item.label}
                        <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-xs text-[#CCC] group-hover:text-[#E8740C]" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#FFF3EB] flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faSackDollar} className="text-[#E8740C] text-3xl" />
              </div>
              <h2 className="text-[1.4rem] font-extrabold text-[#1a1b23] mb-2">No investments yet</h2>
              <p className="text-[#666] text-sm max-w-[360px] mb-8">
                Add your first investment to start tracking your portfolio — stocks, SIPs, mutual funds, FDs, gold, and more.
              </p>
              <Link href="/dashboard/add"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#E8740C] text-white font-bold rounded-[30px] border-2 border-[#E8740C] hover:bg-[#FF9433] transition-all shadow-[0_4px_16px_rgba(232,116,12,0.25)] no-underline">
                <FontAwesomeIcon icon={faPlus} /> Add First Investment
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
