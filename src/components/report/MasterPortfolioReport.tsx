"use client";

import React from "react";
import Image from "next/image";
import { type Investment, type PortfolioSummary, type User } from "@/lib/api";
import {
  fmtIndianCurrency,
  fmtNumber,
  formatDateIndian,
  estimateAnnualizedReturn,
} from "@/lib/format";
import { getMacroAssetClass, MACRO_ASSET_CLASSES, type MacroAssetClass } from "@/lib/assetAllocation";

interface Props {
  user: User | null;
  summary: PortfolioSummary | null;
  investments: Investment[];
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
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const span = Math.min(Math.max(endAngle - startAngle, 0.1), 359.99);
  const effectiveEnd = startAngle + span;

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, effectiveEnd);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, effectiveEnd);

  const largeArcFlag = span > 180 ? 1 : 0;

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y,
    "Z",
  ].join(" ");
}

export default function MasterPortfolioReport({
  user,
  summary,
  investments,
  reportDate = new Date(),
}: Props) {
  // Aggregate multi-asset exposure
  const totalInvested = summary?.totalInvested || investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const totalCurrentValue = summary?.currentValue || investments.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
  const totalUnrealisedGain = totalCurrentValue - totalInvested;
  const totalAbsReturn = totalInvested > 0 ? (totalUnrealisedGain / totalInvested) * 100 : 0;

  // Filter groups
  const mfHoldings = investments.filter((i) => i.type === "mutual_fund" || i.type === "sip");
  const equityHoldings = investments.filter((i) => i.type === "stock");
  const aifHoldings = investments.filter((i) => i.type === "aif");
  const otherHoldings = investments.filter((i) => !["mutual_fund", "sip", "stock", "aif"].includes(i.type));

  // Detect whether report contains family cumulative holdings with distinct account owners
  const hasFamilyOwners = investments.some((i) => !!(i as any).ownerName);

  // Helper to resolve the exact account name of the user holding the entity
  function getInvestorName(inv: Investment): string {
    const owner = (inv as any).ownerName;
    if (owner && typeof owner === "string" && owner.trim()) {
      return owner.trim();
    }
    if (user?.name) {
      return user.name.replace(/\s*&\s*Family$/i, "").trim() || "Client";
    }
    return "Client";
  }

  // Macro Asset Allocation Breakdown (Equity, Debt, Alternatives, Others)
  const macroBreakdown = (["equity", "debt", "alternatives", "others"] as MacroAssetClass[])
    .map((macroKey) => {
      const meta = MACRO_ASSET_CLASSES[macroKey];
      const items = investments.filter((i) => getMacroAssetClass(i.type) === macroKey);
      const cost = items.reduce((s, i) => s + (i.investedAmount || 0), 0);
      const val = items.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
      const gain = val - cost;
      const absRet = cost > 0 ? (gain / cost) * 100 : 0;
      const holdingPct = totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0;

      const earliestDate = items.reduce<string | null>((earliest, i) => {
        const d = i.buyDate || i.sipStartDate || i.createdAt;
        if (!d) return earliest;
        if (!earliest) return d;
        return new Date(d) < new Date(earliest) ? d : earliest;
      }, null);

      const xirr = estimateAnnualizedReturn(cost, val, earliestDate);

      return {
        type: macroKey,
        label: meta.label,
        cost,
        val,
        absRet,
        xirr,
        holdingPct,
        color: meta.color,
        count: items.length,
      };
    })
    .filter((m) => m.count > 0 || m.holdingPct > 0);

  // Calculate earliest portfolio date for overall XIRR proxy
  const earliestPortfolioDate = investments.reduce<string | null>((earliest, i) => {
    const d = i.buyDate || i.sipStartDate || i.createdAt;
    if (!d) return earliest;
    if (!earliest) return d;
    return new Date(d) < new Date(earliest) ? d : earliest;
  }, null);

  const totalXirr = estimateAnnualizedReturn(totalInvested, totalCurrentValue, earliestPortfolioDate);

  // Donut chart calculation
  let cumulativePct = 0;
  const donutSegments = macroBreakdown.map((item) => {
    const startPct = cumulativePct;
    cumulativePct += item.holdingPct;
    return {
      ...item,
      startPct,
      endPct: cumulativePct,
    };
  });

  const donutGradient = donutSegments.length > 0
    ? donutSegments.map((s) => `${s.color} ${s.startPct.toFixed(1)}% ${s.endPct.toFixed(1)}%`).join(", ")
    : "#ccc 0% 100%";

  return (
    <div id="master-portfolio-report" className="report-container font-sans text-[#111] bg-white max-w-[1020px] mx-auto p-4 sm:p-8 print:p-0 print:max-w-none shadow-sm print:shadow-none border border-gray-200 print:border-none">
      {/* ── Page 1 ── */}
      <section id="report-page-1" className="print:break-after-page html2pdf__page-break bg-white p-2">
        {/* Top Header Banner */}
        <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] text-[#14532d] py-1.5 px-4 text-center font-bold text-[16px] tracking-wide rounded-t-sm border border-[#86efac]">
          Master Portfolio
        </div>

        {/* Investor & Distributor Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 py-4 px-2 border-b border-gray-300">
          {/* Investor Details (Left) */}
          <div className="flex-1 text-[13.5px] leading-relaxed">
            <h2 className="font-extrabold text-[17px] text-black uppercase tracking-tight">
              {user?.name || "Client"} {user?.id ? `(${user.id.slice(-8).toUpperCase()})` : ""}
            </h2>
            <p className="text-gray-700">Financial Planning & Wealth Management Client</p>
            <p className="font-medium text-black">
              Mobile : <span className="font-semibold">{user?.phone || "+91 98860 XXXXX"}</span> | Email :{" "}
              <span className="font-semibold">{user?.email || "client@email.com"}</span>
            </p>
            <p className="text-gray-700">
              RM Name : <span className="font-semibold text-black">Phoenix Financial Advisory Desk</span>
            </p>
          </div>

          {/* Center Logo */}
          <div className="flex items-center justify-center px-4 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Phoenix Financial Services"
              className="h-16 sm:h-20 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>

          {/* Distributor Details (Right) */}
          <div className="flex-1 text-right text-[12px] leading-relaxed">
            <h3 className="font-extrabold text-[16px] text-black uppercase tracking-tight">
              PHOENIX FINANCIAL SERVICES
            </h3>
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

        {/* Date & Website Bar */}
        <div className="flex justify-between items-center py-1.5 px-2 text-[13px] font-bold text-gray-800 border-b border-gray-300 bg-gray-50 print:bg-gray-50">
          <div>Report Date : {formatDateIndian(reportDate)}</div>
          <div>www.phoenixfiserv.co.in</div>
        </div>

        {/* High-Level KPI Summary Bar */}
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
                <td className="py-2 px-2 border-r border-gray-300">{fmtIndianCurrency(totalCurrentValue, false)}</td>
                <td className={`py-2 px-2 border-r border-gray-300 ${totalUnrealisedGain >= 0 ? "text-green-800" : "text-red-700"}`}>
                  {fmtIndianCurrency(totalUnrealisedGain, false)}
                </td>
                <td className={`py-2 px-2 border-r border-gray-300 ${totalAbsReturn >= 0 ? "text-green-800" : "text-red-700"}`}>
                  {fmtNumber(totalAbsReturn)}%
                </td>
                <td className="py-2 px-2 text-green-800">{fmtNumber(totalXirr)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Asset Allocation */}
        <div className="mt-4 mb-2">
          <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] text-center font-bold text-[14px] text-gray-900 py-1 border border-[#86efac]">
            Portfolio Asset Allocation (Macro Asset Classes)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border border-gray-300 border-t-0">
            {/* Left: Donut chart */}
            <div className="md:col-span-5 p-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-300 bg-white">
              <span className="text-[13px] font-bold text-gray-700 mb-2">Macro Asset Allocation</span>
              {totalCurrentValue > 0 ? (
                <div className="relative w-44 h-44 flex items-center justify-center my-1 flex-shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {donutSegments.map((segment) => {
                      const startAngle = (segment.startPct / 100) * 360;
                      const endAngle = (segment.endPct / 100) * 360;
                      if (endAngle - startAngle <= 0.05) return null;
                      return (
                        <path
                          key={segment.type}
                          d={describeDonutArc(100, 100, 52, 85, startAngle, endAngle)}
                          fill={segment.color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                    {/* Center text */}
                    <text x="100" y="93" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#666666">
                      TOTAL
                    </text>
                    <text x="100" y="112" textAnchor="middle" fontSize="15" fontWeight="900" fill="#111111">
                      {fmtIndianCurrency(totalCurrentValue, true)}
                    </text>
                  </svg>
                </div>
              ) : (
                <div className="text-gray-400 text-xs py-8">No holdings recorded</div>
              )}

              {/* Mini Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center text-[12px]">
                {donutSegments.map((s) => (
                  <span key={s.type} className="inline-flex items-center gap-1 font-medium text-gray-700">
                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: s.color }} />
                    {s.label}: {fmtNumber(s.holdingPct, 1)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Asset Allocation Table */}
            <div className="md:col-span-7 overflow-x-auto">
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
                  {/* Grand Total Row */}
                  <tr className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-extrabold text-gray-900 border-t border-gray-400">
                    <td className="py-1.5 px-2 border-r border-gray-300">Total</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalInvested, false)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(totalCurrentValue, false)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(totalAbsReturn)}</td>
                    <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(totalXirr)}</td>
                    <td className="py-1.5 px-2 text-left">100.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section: Mutual Fund Holdings (if any) */}
        {mfHoldings.length > 0 && (
          <div className="mt-4 mb-3 border border-gray-300">
            <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-bold text-[14px] text-gray-900 py-1 px-3 border-b border-[#86efac]">
              Mutual Fund & SIP Holdings
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#dcfce7] print:bg-[#dcfce7] font-bold text-gray-800 border-b border-gray-300">
                    {hasFamilyOwners && (
                      <th className="py-1.5 px-2 border-r border-gray-300">Investor Name</th>
                    )}
                    <th className="py-1.5 px-2 border-r border-gray-300">Scheme Name</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Folio / Code</th>
                    <th className="py-1.5 px-2 border-r border-gray-300">Investment Date</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Units</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Avg NAV</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Inv. Cost</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Value</th>
                    <th className="py-1.5 px-2 border-r border-gray-300 text-left">Unrealised Gain</th>
                    <th className="py-1.5 px-2 text-left">Abs Ret (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {mfHoldings.map((inv) => {
                    const cost = inv.investedAmount || 0;
                    const val = inv.currentValue || cost;
                    const gain = val - cost;
                    const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                    const units = inv.units || (inv.sipAmount && inv.instalments && inv.avgNav ? (inv.sipAmount * inv.instalments) / inv.avgNav : 0);
                    const nav = inv.buyPrice || inv.avgNav || (units > 0 ? cost / units : 0);

                    return (
                      <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50">
                        {hasFamilyOwners && (
                          <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800">
                            {getInvestorName(inv)}
                          </td>
                        )}
                        <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-900">{inv.name}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">{inv.symbol || "—"}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">
                          {formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt)}
                        </td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(units, 3)}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(nav, 2)}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{fmtIndianCurrency(val, false)}</td>
                        <td className={`py-1.5 px-2 border-r border-gray-300 text-left ${gain >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {fmtIndianCurrency(gain, false)}
                        </td>
                        <td className={`py-1.5 px-2 text-left font-semibold ${absRet >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {fmtNumber(absRet)}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fund Total */}
                  {(() => {
                    const cost = mfHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
                    const val = mfHoldings.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
                    const gain = val - cost;
                    const ret = cost > 0 ? (gain / cost) * 100 : 0;
                    return (
                      <tr className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-bold text-gray-900">
                        <td colSpan={hasFamilyOwners ? 6 : 5} className="py-1.5 px-2 border-r border-gray-300 text-left">Fund Portfolio Total:</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(val, false)}</td>
                        <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(gain, false)}</td>
                        <td className="py-1.5 px-2 text-left">{fmtNumber(ret)}%</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sign-off Footer if Page 2 does not render */}
        {equityHoldings.length === 0 && otherHoldings.length === 0 && (
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
              <span>Generated by <strong>Phoenix Financial Services</strong> Portal</span>
              <span>Confidential — For Client Reference Only</span>
            </div>
          </footer>
        )}
      </section>

      {/* ── Page 2: Direct Equities & Other Assets ── */}
      {(equityHoldings.length > 0 || otherHoldings.length > 0) && (
        <section id="report-page-2" className="print:break-before-page mt-6 print:mt-0 bg-white p-2">
          {/* Direct Equity Holdings */}
          {equityHoldings.length > 0 && (
            <div className="mb-4 border border-gray-300">
              <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-bold text-[14px] text-gray-900 py-1 px-3 border-b border-[#86efac]">
                Direct Equity Holdings
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#dcfce7] print:bg-[#dcfce7] font-bold text-gray-800 border-b border-gray-300">
                      <th className="py-1.5 px-2 border-r border-gray-300">Investor Name</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Scrip Name / Symbol</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Avg Price</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">No of Shares</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Invested Amount</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Price</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Value</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Gain</th>
                      <th className="py-1.5 px-2 text-left">Abs Ret (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equityHoldings.map((inv) => {
                      const cost = inv.investedAmount || 0;
                      const val = inv.currentValue || cost;
                      const gain = val - cost;
                      const absRet = cost > 0 ? (gain / cost) * 100 : 0;

                      return (
                        <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800">{getInvestorName(inv)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 font-bold text-gray-900">
                            {inv.name} {inv.symbol ? `(${inv.symbol})` : ""}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(inv.buyPrice)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(inv.units, 0)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtNumber(inv.currentPrice)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{fmtIndianCurrency(val, false)}</td>
                          <td className={`py-1.5 px-2 border-r border-gray-300 text-left font-medium ${gain >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtIndianCurrency(gain, false)}
                          </td>
                          <td className={`py-1.5 px-2 text-left font-semibold ${absRet >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtNumber(absRet)}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Equity Grand Total */}
                    {(() => {
                      const cost = equityHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
                      const val = equityHoldings.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
                      const gain = val - cost;
                      const ret = cost > 0 ? (gain / cost) * 100 : 0;
                      return (
                        <tr className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-bold text-gray-900">
                          <td colSpan={4} className="py-1.5 px-2 border-r border-gray-300 text-left">Equity Grand Total:</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">—</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(val, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(gain, false)}</td>
                          <td className="py-1.5 px-2 text-left">{fmtNumber(ret)}%</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alternative Investment Funds (AIF) Holdings */}
          {aifHoldings.length > 0 && (
            <div className="mb-4 border border-gray-300">
              <div className="bg-[#4E342E] print:bg-[#4E342E] text-white font-bold text-[14px] py-1.5 px-3 flex justify-between items-center">
                <span>Alternative Investment Funds (AIF) Portfolio</span>
                <span className="text-[11.5px] font-normal opacity-90">SEBI Regulated Category I / II / III Alternative Funds</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#EFEBE9] print:bg-[#EFEBE9] font-bold text-gray-800 border-b border-gray-300">
                      {hasFamilyOwners && (
                        <th className="py-1.5 px-2 border-r border-gray-300">Investor Name</th>
                      )}
                      <th className="py-1.5 px-2 border-r border-gray-300">Fund / Scheme Name</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Fund House / AMC</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Category / Strategy</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Folio ID</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Inception Date</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Capital Invested</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Latest Valuation</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Unrealised Gain</th>
                      <th className="py-1.5 px-2 text-left">Abs Ret (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aifHoldings.map((inv) => {
                      const cost = inv.investedAmount || 0;
                      const val = inv.currentValue || cost;
                      const gain = val - cost;
                      const absRet = cost > 0 ? (gain / cost) * 100 : 0;
                      return (
                        <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50">
                          {hasFamilyOwners && (
                            <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800">
                              {getInvestorName(inv)}
                            </td>
                          )}
                          <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-900">{inv.name}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-700">{inv.institution || "—"}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-700">{inv.notes || "Category III"}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">{inv.folioNumber || "—"}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">{formatDateIndian(inv.buyDate || inv.createdAt)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{fmtIndianCurrency(cost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left font-bold text-gray-900">{fmtIndianCurrency(val, false)}</td>
                          <td className={`py-1.5 px-2 border-r border-gray-300 text-left font-semibold ${gain >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtIndianCurrency(gain, false)}
                          </td>
                          <td className={`py-1.5 px-2 text-left font-bold ${absRet >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {fmtNumber(absRet)}%
                          </td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const cost = aifHoldings.reduce((s, i) => s + (i.investedAmount || 0), 0);
                      const val = aifHoldings.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
                      const gain = val - cost;
                      const ret = cost > 0 ? (gain / cost) * 100 : 0;
                      return (
                        <tr className="bg-[#D7CCC8] print:bg-[#D7CCC8] font-bold text-gray-900">
                          <td colSpan={hasFamilyOwners ? 6 : 5} className="py-1.5 px-2 border-r border-gray-300 text-left">AIF Grand Total:</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(val, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(gain, false)}</td>
                          <td className="py-1.5 px-2 text-left">{fmtNumber(ret)}%</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fixed Income & Other Asset Holdings */}
          {otherHoldings.length > 0 && (
            <div className="mb-4 border border-gray-300">
              <div className="bg-[#bbf7d0] print:bg-[#bbf7d0] font-bold text-[14px] text-gray-900 py-1 px-3 border-b border-[#86efac]">
                Fixed Income, Commodities & Other Assets
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#dcfce7] print:bg-[#dcfce7] font-bold text-gray-800 border-b border-gray-300">
                      {hasFamilyOwners && (
                        <th className="py-1.5 px-2 border-r border-gray-300">Investor Name</th>
                      )}
                      <th className="py-1.5 px-2 border-r border-gray-300">Asset Type</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Holding Name / Institution</th>
                      <th className="py-1.5 px-2 border-r border-gray-300">Investment / Maturity Date</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Interest / Rate</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Invested Amount</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Current Value</th>
                      <th className="py-1.5 px-2 border-r border-gray-300 text-left">Gain / Accrual</th>
                      <th className="py-1.5 px-2 text-left">Abs Ret (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherHoldings.map((inv) => {
                      const cost = inv.investedAmount || 0;
                      const val = inv.currentValue || cost;
                      const gain = val - cost;
                      const absRet = cost > 0 ? (gain / cost) * 100 : 0;

                      return (
                        <tr key={inv._id} className="border-b border-gray-200 hover:bg-gray-50">
                          {hasFamilyOwners && (
                            <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800">
                              {getInvestorName(inv)}
                            </td>
                          )}
                          <td className="py-1.5 px-2 border-r border-gray-300 font-semibold text-gray-800">
                            {ASSET_LABEL_MAP[inv.type] || inv.type.toUpperCase()}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-900 font-medium">
                            {inv.name} {inv.institution ? `(${inv.institution})` : ""}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-gray-600">
                            {inv.maturityDate ? `Mat: ${formatDateIndian(inv.maturityDate)}` : formatDateIndian(inv.buyDate || inv.createdAt)}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left text-gray-700">
                            {inv.interestRate ? `${inv.interestRate}% p.a.` : "—"}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left">{fmtIndianCurrency(cost, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left font-medium">{fmtIndianCurrency(val, false)}</td>
                          <td className="py-1.5 px-2 border-r border-gray-300 text-left text-green-700">
                            {fmtIndianCurrency(gain, false)}
                          </td>
                          <td className="py-1.5 px-2 text-left font-semibold text-green-700">{fmtNumber(absRet)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
              <span>Generated by <strong>Phoenix Financial Services</strong> Portal</span>
              <span>Confidential — For Client Reference Only</span>
            </div>
          </footer>
        </section>
      )}
    </div>
  );
}
