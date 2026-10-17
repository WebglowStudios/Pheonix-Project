"use client";

import React from "react";
import {
  type CumulativeInvestment,
  type CumulativePortfolioSummary,
  type FamilyMember,
  type User,
} from "@/lib/api";
import {
  fmtIndianCurrency,
  fmtNumber,
  formatDateIndian,
  estimateAnnualizedReturn,
} from "@/lib/format";
import { getMacroAssetClass, MACRO_ASSET_CLASSES, type MacroAssetClass } from "@/lib/assetAllocation";

interface Props {
  primaryUser: User | null;
  members: FamilyMember[];
  summary: CumulativePortfolioSummary | null;
  investments: CumulativeInvestment[];
  reportDate?: Date;
}

const ASSET_LABEL_MAP: Record<string, string> = {
  mutual_fund: "Mutual Funds",
  sip: "Systematic Investment (SIP)",
  stock: "Direct Equity Holdings",
  aif: "Alternative Investment Funds (AIF)",
  fd: "Fixed Deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  bond: "Bonds & Debentures",
  gold: "Gold / SGB",
  crypto: "Crypto / Digital Assets",
  reit_invit: "REIT / InvIT",
};

const ASSET_COLORS: Record<string, string> = {
  mutual_fund: "#2E7D32",
  sip: "#E8740C",
  stock: "#1565C0",
  aif: "#4E342E",
  fd: "#6A1B9A",
  ppf: "#E65100",
  epf: "#00838F",
  nps: "#F57F17",
  bond: "#880E4F",
  gold: "#F9A825",
  crypto: "#4527A0",
  reit_invit: "#37474F",
};

const MEMBER_ACCENT_COLORS = [
  "#1565C0", "#2E7D32", "#6A1B9A", "#880E4F",
  "#E65100", "#00838F", "#F57F17", "#4527A0",
];

const MARKET_TYPES = ["stock", "mutual_fund", "gold", "crypto", "sip", "bond", "reit_invit"];
const FIXED_TYPES  = ["fd", "ppf", "epf", "nps", "bond"];

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(x: number, y: number, inner: number, outer: number, start: number, end: number) {
  const span = Math.min(Math.max(end - start, 0.1), 359.99);
  const eff = start + span;
  const s1 = polarToCartesian(x, y, outer, start);
  const e1 = polarToCartesian(x, y, outer, eff);
  const s2 = polarToCartesian(x, y, inner, start);
  const e2 = polarToCartesian(x, y, inner, eff);
  const big = span > 180 ? 1 : 0;
  return `M ${s1.x} ${s1.y} A ${outer} ${outer} 0 ${big} 1 ${e1.x} ${e1.y} L ${e2.x} ${e2.y} A ${inner} ${inner} 0 ${big} 0 ${s2.x} ${s2.y} Z`;
}

export default function FamilyPortfolioReport({
  primaryUser,
  members,
  summary,
  investments,
  reportDate = new Date(),
}: Props) {
  const totalInvested = summary?.totalInvested ?? investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const totalCurrent  = summary?.currentValue  ?? investments.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const totalGain     = totalCurrent - totalInvested;
  const totalGainPct  = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Macro Asset Allocation Breakdown (Equity, Debt, Alternatives, Others)
  const macroBreakdown = (["equity", "debt", "alternatives", "others"] as MacroAssetClass[])
    .map((macroKey) => {
      const meta = MACRO_ASSET_CLASSES[macroKey];
      const items = investments.filter((i) => getMacroAssetClass(i.type) === macroKey);
      const cost  = items.reduce((s, i) => s + (i.investedAmount || 0), 0);
      const val   = items.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
      const gain  = val - cost;
      const absRet    = cost > 0 ? (gain / cost) * 100 : 0;
      const holdingPct = totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;
      const earliest  = items.reduce<string | null>((e, i) => {
        const d = i.buyDate || i.sipStartDate || i.createdAt;
        if (!d) return e;
        if (!e) return d;
        return new Date(d) < new Date(e) ? d : e;
      }, null);
      return {
        type: macroKey,
        label: meta.label,
        cost,
        val,
        gain,
        absRet,
        xirr: estimateAnnualizedReturn(cost, val, earliest),
        holdingPct,
        color: meta.color,
        count: items.length,
      };
    })
    .filter((m) => m.count > 0 || m.holdingPct > 0);

  // Donut
  let cum = 0;
  const donutSegs = macroBreakdown.map((a) => {
    const s = cum; cum += a.holdingPct;
    return { ...a, startPct: s, endPct: cum };
  });

  const earliestAll = investments.reduce<string | null>((e, i) => {
    const d = i.buyDate || i.sipStartDate || i.createdAt;
    if (!d) return e; if (!e) return d;
    return new Date(d) < new Date(e) ? d : e;
  }, null);
  const totalXirr = estimateAnnualizedReturn(totalInvested, totalCurrent, earliestAll);

  // Group by member
  const byMember: Record<string, CumulativeInvestment[]> = {};
  members.forEach((m) => { byMember[(m.userId || (m as any).id)] = []; });
  investments.forEach((inv) => {
    if (byMember[inv.ownerId] !== undefined) byMember[inv.ownerId].push(inv);
  });

  const memberNames = members.map((m) => m.name).join(" • ");

  return (
    <div
      id="family-report-root"
      className="font-sans text-[#111] bg-white max-w-[1020px] mx-auto p-4 sm:p-8 print:p-0 print:max-w-none border border-gray-200 print:border-none"
    >
      {/* ── PAGE 1 ── */}
      <section id="family-report-page-1" className="bg-white p-2 print:break-after-page html2pdf__page-break">

        {/* Banner */}
        <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] text-[#14532d] py-1.5 px-4 text-center font-bold text-[16px] tracking-wide rounded-t-sm border border-[#86efac]">
          Household Cumulative Portfolio — Master Statement
        </div>

        {/* Header info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 py-4 px-2 border-b border-gray-300">
          <div className="flex-1 text-[13.5px] leading-relaxed">
            <h2 className="font-extrabold text-[17px] text-black uppercase tracking-tight">
              {primaryUser?.name || "Primary Account Holder"} &amp; Family
            </h2>
            <p className="text-gray-700">Linked Members: {memberNames}</p>
            <p className="text-gray-700">Financial Planning &amp; Wealth Management — Household Consolidated</p>
            <p className="font-medium text-black">
              Mobile: <span className="font-semibold">{primaryUser?.phone || "—"}</span> | Email:{" "}
              <span className="font-semibold">{primaryUser?.email || "—"}</span>
            </p>
            <p className="text-gray-700">
              RM Name: <span className="font-semibold text-black">Phoenix Financial Advisory Desk</span>
            </p>
          </div>
          <div className="flex items-center justify-center px-4 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Phoenix Financial Services" className="h-16 sm:h-20 w-auto object-contain" crossOrigin="anonymous" />
          </div>
          <div className="flex-1 text-right text-[12px] leading-relaxed">
            <h3 className="font-extrabold text-[16px] text-black uppercase tracking-tight">PHOENIX FINANCIAL SERVICES</h3>
            <p className="text-gray-700">
              <strong className="text-gray-900">Pune:</strong> 708, Global Business Hub, Kharadi, Pune 411014
            </p>
            <p className="text-gray-700">
              <strong className="text-gray-900">Mumbai:</strong> 11, Brahamsiddhi, Century Bazar Lane, Worli, Mumbai 400025
            </p>
            <p className="font-medium text-black mt-0.5">
              Phone: <span className="font-semibold">+91 70212 10788</span> | Email:{" "}
              <span className="font-semibold">connect@phoenixfiserv.co.in</span>
            </p>
          </div>
        </div>

        {/* Date bar */}
        <div className="flex justify-between items-center py-1.5 px-2 text-[13px] font-bold text-gray-800 border-b border-gray-300 bg-gray-50 print:bg-gray-50">
          <div>Report Date: {formatDateIndian(reportDate)} &nbsp;|&nbsp; Accounts: {members.length}</div>
          <div>www.phoenixfiserv.co.in</div>
        </div>

        {/* KPI bar */}
        <div className="my-3 border border-gray-300">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#dcfce7] print:bg-[#dcfce7] text-[13px] font-bold text-gray-800 border-b border-gray-300">
                <th className="py-1.5 px-2 border-r border-gray-300">Inv. Cost</th>
                <th className="py-1.5 px-2 border-r border-gray-300">Current Value</th>
                <th className="py-1.5 px-2 border-r border-gray-300">Unrealised Gain</th>
                <th className="py-1.5 px-2 border-r border-gray-300">Absolute Return (%)</th>
                <th className="py-1.5 px-2">XIRR / Ann. (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[16px] font-extrabold text-gray-900 bg-white">
                <td className="py-2 px-2 border-r border-gray-300">{fmtIndianCurrency(totalInvested, false)}</td>
                <td className="py-2 px-2 border-r border-gray-300">{fmtIndianCurrency(totalCurrent, false)}</td>
                <td className={`py-2 px-2 border-r border-gray-300 ${totalGain >= 0 ? "text-green-800" : "text-red-700"}`}>
                  {fmtIndianCurrency(totalGain, false)}
                </td>
                <td className={`py-2 px-2 border-r border-gray-300 ${totalGainPct >= 0 ? "text-green-800" : "text-red-700"}`}>
                  {fmtNumber(totalGainPct)}%
                </td>
                <td className="py-2 px-2 text-green-800">{fmtNumber(totalXirr)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Member contribution table */}
        <div className="mt-3 mb-3">
          <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] text-center font-bold text-[14px] text-gray-900 py-1 border border-[#86efac]">
            Family Members — Individual Wealth Contribution
          </div>
          <div className="border border-t-0 border-gray-300">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="bg-[#dcfce7] print:bg-[#dcfce7] font-bold text-gray-800 border-b border-gray-300">
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Member</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Relationship</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Email</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Holdings</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Inv. Cost</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Value</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Gain / Loss</th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-left">Abs Ret (%)</th>
                  <th className="py-1.5 px-2 text-left">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => {
                  const st = m.stats || { totalInvested: 0, currentValue: 0, totalGain: 0, totalGainPercent: 0, holdingsCount: 0 };
                  const share = totalCurrent > 0 ? (st.currentValue / totalCurrent) * 100 : 0;
                  const color = MEMBER_ACCENT_COLORS[idx % MEMBER_ACCENT_COLORS.length];
                  return (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-1.5 px-2 border-r border-gray-300 font-bold" style={{ color }}>
                        {m.name}{m.isSelf && <span className="ml-1 text-[10.5px] font-normal text-gray-400">(Primary)</span>}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-gray-700">{m.relationship}</td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">{m.email || "—"}</td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{st.holdingsCount}</td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(st.totalInvested, false)}</td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left font-semibold">{fmtIndianCurrency(st.currentValue, false)}</td>
                      <td className={`py-1.5 px-2 border-r border-gray-300 text-left font-semibold ${st.totalGain >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {fmtIndianCurrency(st.totalGain, false)}
                      </td>
                      <td className={`py-1.5 px-2 border-r border-gray-300 text-left ${st.totalGainPercent >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {fmtNumber(st.totalGainPercent)}%
                      </td>
                      <td className="py-1.5 px-2 text-left font-bold text-gray-900">{fmtNumber(share, 1)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-extrabold text-gray-900 border-t border-gray-400">
                  <td colSpan={4} className="py-1.5 px-2 border-r border-gray-300 text-left">Household Total</td>
                  <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalInvested, false)}</td>
                  <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalCurrent, false)}</td>
                  <td className={`py-1.5 px-2 border-r border-gray-300 text-left ${totalGain >= 0 ? "text-green-800" : "text-red-700"}`}>
                    {fmtIndianCurrency(totalGain, false)}
                  </td>
                  <td className={`py-1.5 px-2 border-r border-gray-300 text-left ${totalGainPct >= 0 ? "text-green-800" : "text-red-700"}`}>
                    {fmtNumber(totalGainPct)}%
                  </td>
                  <td className="py-1.5 px-2 text-left">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="mt-3 mb-2">
          <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] text-center font-bold text-[14px] text-gray-900 py-1 border border-[#86efac]">
            Household Asset Allocation (Macro Asset Classes)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-300 border-t-0">
            <div className="md:col-span-4 p-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-300 bg-white">
              <span className="text-[13px] font-bold text-gray-700 mb-2">Macro Asset Allocation</span>
              {totalCurrent > 0 ? (
                <div className="relative w-40 h-40 flex items-center justify-center my-1 flex-shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {donutSegs.map((s) => {
                      const sa = (s.startPct / 100) * 360;
                      const ea = (s.endPct / 100) * 360;
                      if (ea - sa <= 0.05) return null;
                      return <path key={s.type} d={donutArc(100, 100, 52, 85, sa, ea)} fill={s.color} stroke="#fff" strokeWidth="1.5" />;
                    })}
                    <text x="100" y="93" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#666">HOUSEHOLD</text>
                    <text x="100" y="112" textAnchor="middle" fontSize="14" fontWeight="900" fill="#111">
                      {fmtIndianCurrency(totalCurrent, true)}
                    </text>
                  </svg>
                </div>
              ) : (
                <div className="text-gray-400 text-xs py-8">No holdings</div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center text-[11.5px]">
                {donutSegs.map((s) => (
                  <span key={s.type} className="inline-flex items-center gap-1 font-medium text-gray-700">
                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: s.color }} />
                    {s.label}: {fmtNumber(s.holdingPct, 1)}%
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-8 overflow-x-auto">
              <table className="w-full text-[12.5px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#dcfce7] print:bg-[#dcfce7] font-bold text-gray-800 border-b border-gray-300">
                    <th className="py-1.5 px-2 border-r border-gray-300">Asset Class</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Inv. Cost</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Value</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Abs Ret (%)</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">XIRR (%)</th>
                    <th className="py-1.5 px-2 text-left">Allocation (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {macroBreakdown.map((row) => (
                    <tr key={row.type} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs flex-shrink-0" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(row.cost, false)}</td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{fmtIndianCurrency(row.val, false)}</td>
                      <td className={`py-1.5 px-2 border-r border-gray-300 text-left ${row.absRet >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {fmtNumber(row.absRet)}
                      </td>
                      <td className="py-1.5 px-2 border-r border-gray-300 text-left text-gray-700">{fmtNumber(row.xirr)}</td>
                      <td className="py-1.5 px-2 text-left font-bold text-gray-900">{fmtNumber(row.holdingPct)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-extrabold text-gray-900 border-t border-gray-400">
                    <td className="py-1.5 px-2 border-r border-gray-300">Total</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalInvested, false)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalCurrent, false)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(totalGainPct)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(totalXirr)}</td>
                    <td className="py-1.5 px-2 text-left">100.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAGES 2+: Per-member sections ── */}
      {members.map((member, mIdx) => {
        const mid = member.userId || (member as any).id;
        const mInvs = byMember[mid] || [];
        if (mInvs.length === 0) return null;

        const accentColor = MEMBER_ACCENT_COLORS[mIdx % MEMBER_ACCENT_COLORS.length];
        const mInvested   = mInvs.reduce((s, i) => s + (i.investedAmount || 0), 0);
        const mCurrent    = mInvs.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
        const mGain       = mCurrent - mInvested;
        const mGainPct    = mInvested > 0 ? (mGain / mInvested) * 100 : 0;
        const mTypes      = Array.from(new Set(mInvs.map((i) => i.type)));

        return (
          <section
            key={mid}
            id={`family-report-member-${mIdx}`}
            className="bg-white p-2 mt-4 print:break-before-page print:mt-0 html2pdf__page-break"
          >
            {/* Member banner */}
            <div
              className="py-1.5 px-4 text-white font-bold text-[14px] tracking-wide rounded-t-sm"
              style={{ backgroundColor: accentColor }}
            >
              Holdings Statement — {member.name} ({member.relationship})
              {member.isSelf ? "  ·  Primary Account Holder" : ""}
            </div>

            {/* Member KPI */}
            <div className="border border-t-0 border-gray-300 mb-3">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="text-[13px] font-bold text-gray-800 border-b border-gray-200" style={{ backgroundColor: `${accentColor}1a` }}>
                    <th className="py-1.5 px-2 border-r border-gray-300">Inv. Cost</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Current Value</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Unrealised Gain</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Abs Return (%)</th>
                    <th className="py-1.5 px-2">Total Holdings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-[15.5px] font-extrabold text-gray-900">
                    <td className="py-1.5 px-2 border-r border-gray-300">{fmtIndianCurrency(mInvested, false)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300">{fmtIndianCurrency(mCurrent, false)}</td>
                    <td className={`py-1.5 px-2 border-r border-gray-300 ${mGain >= 0 ? "text-green-800" : "text-red-700"}`}>
                      {fmtIndianCurrency(mGain, false)}
                    </td>
                    <td className={`py-1.5 px-2 border-r border-gray-300 ${mGainPct >= 0 ? "text-green-800" : "text-red-700"}`}>
                      {fmtNumber(mGainPct)}%
                    </td>
                    <td className="py-1.5 px-2">{mInvs.length} assets</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Per-type holdings */}
            {mTypes.map((type) => {
              const typeInvs  = mInvs.filter((i) => i.type === type);
              const typeLabel = ASSET_LABEL_MAP[type] || type.toUpperCase();
              const tColor    = ASSET_COLORS[type] || "#666";
              const tCost     = typeInvs.reduce((s, i) => s + (i.investedAmount || 0), 0);
              const tVal      = typeInvs.reduce((s, i) => s + (i.currentValue ?? i.investedAmount ?? 0), 0);
              const tGain     = tVal - tCost;
              const tRet      = tCost > 0 ? (tGain / tCost) * 100 : 0;
              const showUnits = MARKET_TYPES.includes(type);
              const showRate  = FIXED_TYPES.includes(type);

              return (
                <div key={type} className="mb-3 border border-gray-300">
                  <div
                    className="font-bold text-[13.5px] py-1 px-3 border-b border-gray-200 flex justify-between items-center text-white"
                    style={{ backgroundColor: tColor }}
                  >
                    <span>{typeLabel}</span>
                    <span className="font-normal text-[11.5px] opacity-90">
                      {typeInvs.length} {typeInvs.length === 1 ? "holding" : "holdings"}
                      &nbsp;|&nbsp;Value: {fmtIndianCurrency(tVal, false)}
                      &nbsp;|&nbsp;Return: {fmtNumber(tRet)}%
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] border-collapse">
                      <thead>
                        <tr className="font-bold text-gray-700 border-b border-gray-200 bg-gray-50">
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Name / Scheme</th>
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Symbol / Code</th>
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Investment Date</th>
                          {showUnits && <th className="py-1.5 px-2 border-r border-gray-200 text-left">Units</th>}
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Buy Price</th>
                          {showRate  && <th className="py-1.5 px-2 border-r border-gray-200 text-left">Rate %</th>}
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Inv. Cost</th>
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Current Value</th>
                          <th className="py-1.5 px-2 border-r border-gray-200 text-left">Gain</th>
                          <th className="py-1.5 px-2 text-left">Ret %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeInvs.map((inv) => {
                          const cost    = inv.investedAmount || 0;
                          const val     = inv.currentValue ?? cost;
                          const gain    = val - cost;
                          const ret     = cost > 0 ? (gain / cost) * 100 : 0;
                          const units   =
                            inv.units ||
                            (inv.sipAmount && inv.instalments && inv.avgNav
                              ? (inv.sipAmount * inv.instalments) / inv.avgNav
                              : null);
                          return (
                            <tr key={inv._id} className="border-b border-gray-100">
                              <td className="py-1.5 px-2 border-r border-gray-200 font-semibold text-gray-900">
                                {inv.name}
                                {inv.institution && <div className="text-[10.5px] text-gray-400 font-normal">{inv.institution}</div>}
                              </td>
                              <td className="py-1.5 px-2 border-r border-gray-200 text-gray-600 font-mono text-[11px]">{inv.symbol || "—"}</td>
                              <td className="py-1.5 px-2 border-r border-gray-200 text-gray-500">
                                {formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt)}
                                {inv.maturityDate && <div className="text-[10.5px] text-gray-400">Mat: {formatDateIndian(inv.maturityDate)}</div>}
                              </td>
                              {showUnits && (
                                <td className="py-1.5 px-2 border-r border-gray-200 text-left text-gray-700">
                                  {units ? fmtNumber(units, type === "stock" ? 0 : 3) : "—"}
                                </td>
                              )}
                              <td className="py-1.5 px-2 border-r border-gray-200 text-left text-gray-700">
                                {inv.buyPrice ? fmtIndianCurrency(inv.buyPrice, false) : inv.avgNav ? fmtIndianCurrency(inv.avgNav, false) : "—"}
                              </td>
                              {showRate && (
                                <td className="py-1.5 px-2 border-r border-gray-200 text-left text-gray-700">
                                  {inv.interestRate ? `${inv.interestRate}%` : "—"}
                                </td>
                              )}
                              <td className="py-1.5 px-2 border-r border-gray-200 text-left">{fmtIndianCurrency(cost, false)}</td>
                              <td className="py-1.5 px-2 border-r border-gray-200 text-left font-semibold text-gray-900">{fmtIndianCurrency(val, false)}</td>
                              <td className={`py-1.5 px-2 border-r border-gray-200 text-left font-semibold ${gain >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {fmtIndianCurrency(gain, false)}
                              </td>
                              <td className={`py-1.5 px-2 text-left font-bold ${ret >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {fmtNumber(ret)}%
                              </td>
                            </tr>
                          );
                        })}
                        {/* Subtotal */}
                        <tr className="font-bold text-gray-900 border-t border-gray-300" style={{ backgroundColor: `${tColor}12` }}>
                          <td colSpan={2 + (showUnits ? 1 : 0) + (showRate ? 1 : 0) + 1} className="py-1.5 px-2 border-r border-gray-200 text-left text-[11.5px]">
                            {typeLabel} Subtotal:
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-200 text-left">{fmtIndianCurrency(tCost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-200 text-left">{fmtIndianCurrency(tVal, false)}</td>
                          <td className={`py-1.5 px-2 border-r border-gray-200 text-left ${tGain >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtIndianCurrency(tGain, false)}
                          </td>
                          <td className={`py-1.5 px-2 text-left ${tRet >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtNumber(tRet)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {/* Sign-off Footer */}
      <footer className="mt-5 pt-3 border-t border-gray-300 text-[11.5px] text-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-gray-50 print:bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 font-medium mb-2.5">
          <span className="font-bold text-gray-900 uppercase tracking-wider text-[10.5px]">Regulatory Registrations:</span>
          <span className="inline-flex items-center gap-1">
            <strong className="text-gray-900">AMFI:</strong> <span className="font-mono text-gray-800">ARN 175433</span>
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1">
            <strong className="text-gray-900">BSE:</strong> <span className="font-mono text-gray-800">AP0107480100941</span>
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1">
            <strong className="text-gray-900">NSE:</strong> <span className="font-mono text-gray-800">AP206911451</span>
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1">
            <strong className="text-gray-900">MCX:</strong> <span className="font-mono text-gray-800">AP33944</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Generated by <strong>Phoenix Financial Services</strong> Portal · {formatDateIndian(reportDate)}</span>
          <span>Confidential — For Client Reference Only</span>
        </div>
      </footer>
    </div>
  );
}
