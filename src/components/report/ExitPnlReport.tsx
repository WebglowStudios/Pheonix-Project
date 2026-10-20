"use client";

import { useState, useMemo } from "react";
import { type Transaction, type ExitReportSummary, type User, type AdminUser } from "@/lib/api";
import { fmtIndianCurrency, fmtNumber, formatDateIndian } from "@/lib/format";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faArrowTrendUp,
  faArrowTrendDown,
  faCoins,
  faShieldHalved,
  faSearch,
  faFileExcel,
  faStar,
  faFilter,
  faCheckCircle,
  faCalendarAlt,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  transactions: Transaction[];
  summary?: ExitReportSummary | null;
  user?: Partial<User | AdminUser> | null;
  loading?: boolean;
}

export default function ExitPnlReport({
  transactions = [],
  summary,
  user,
  loading = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "profit" | "free">("all");

  // Derived calculations if summary is not provided
  const derivedSummary = useMemo(() => {
    if (summary) return summary;

    const totalRealizedProfit = transactions.reduce((acc, t) => acc + (t.realizedGain || 0), 0);
    const totalProceeds = transactions.reduce((acc, t) => acc + (t.totalProceeds || 0), 0);
    const totalCostBasis = transactions.reduce((acc, t) => acc + ((t.units || 0) * (t.buyPrice || 0)), 0);
    const profitableCount = transactions.filter((t) => (t.realizedGain || 0) > 0).length;
    const lossCount = transactions.filter((t) => (t.realizedGain || 0) < 0).length;
    const freeSharesCount = transactions.filter((t) => t.isFreeShares).length;

    return {
      totalTrades: transactions.length,
      totalRealizedProfit: Math.round(totalRealizedProfit * 100) / 100,
      totalProceeds: Math.round(totalProceeds * 100) / 100,
      totalCostBasis: Math.round(totalCostBasis * 100) / 100,
      overallReturnPercent: totalCostBasis > 0 ? Math.round((totalRealizedProfit / totalCostBasis) * 10000) / 100 : 0,
      profitableCount,
      lossCount,
      winRate: transactions.length > 0 ? Math.round((profitableCount / transactions.length) * 100) : 0,
      freeSharesCount,
    };
  }, [transactions, summary]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.investmentName.toLowerCase().includes(search.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

      let matchFilter = true;
      if (filterType === "profit") {
        matchFilter = (t.realizedGain || 0) > 0;
      } else if (filterType === "free") {
        matchFilter = !!t.isFreeShares;
      }

      return matchSearch && matchFilter;
    });
  }, [transactions, search, filterType]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const headers = [
      "S.No",
      "Exit / Trade Date",
      "Asset / Scheme Name",
      "Units Sold",
      "Avg Buy Price (₹)",
      "Exit / Sell Price (₹)",
      "Cost Basis (₹)",
      "Total Proceeds (₹)",
      "Realized P&L (₹)",
      "Return (%)",
      "Compounding Status",
      "Remaining Units",
      "Notes & Remarks",
    ];

    const rows: any[][] = [
      ["PHOENIX FINANCIAL SERVICES — EXIT P&L & ACTIVITY REPORT"],
      [`Investor: ${user?.name || "Client"} | Generated: ${new Date().toLocaleDateString("en-IN")}`],
      [""],
      [
        `Total Realized Gain: ₹${derivedSummary.totalRealizedProfit.toLocaleString("en-IN")}`,
        `Total Proceeds Released: ₹${derivedSummary.totalProceeds.toLocaleString("en-IN")}`,
        `Total Trades: ${derivedSummary.totalTrades}`,
        `Win Rate: ${derivedSummary.winRate}%`,
        `Free Shares Created: ${derivedSummary.freeSharesCount}`,
      ],
      [""],
      headers,
    ];

    transactions.forEach((t, idx) => {
      const costBasis = Math.round((t.units || 0) * (t.buyPrice || 0) * 100) / 100;
      rows.push([
        idx + 1,
        formatDateIndian(t.sellDate || t.createdAt),
        t.investmentName,
        t.units,
        t.buyPrice,
        t.price,
        costBasis,
        t.totalProceeds,
        t.realizedGain,
        `${t.realizedGainPercent >= 0 ? "+" : ""}${t.realizedGainPercent}%`,
        t.isFreeShares ? "FREE SHARES CREATED" : t.remainingUnits === 0 ? "FULL EXIT" : "PARTIAL EXIT",
        t.remainingUnits,
        t.notes || "—",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 32 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Exit_P&L_Report");
    const filename = `Exit_PnL_Report_${(user?.name || "Client").replace(/[^a-zA-Z0-9]/g, "_")}_${
      new Date().toISOString().slice(0, 10)
    }.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Report Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16171e] to-gray-800 flex items-center justify-center text-amber-400 shadow-md">
              <FontAwesomeIcon icon={faReceipt} className="text-base" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Exit Report &amp; Realized P&amp;L History
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Official audit ledger of executed sales, capital recoveries &amp; compounding events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 disabled:opacity-40 transition-all shadow-xs"
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-emerald-600" />
            Export Excel Report
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Realized Profit */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              derivedSummary.totalRealizedProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Total Realized P&amp;L
          </div>
          <div
            className={`text-xl font-black mt-1.5 ${
              derivedSummary.totalRealizedProfit >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"
            }`}
          >
            {derivedSummary.totalRealizedProfit >= 0 ? "+" : ""}
            {fmtIndianCurrency(derivedSummary.totalRealizedProfit)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-gray-500">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                derivedSummary.overallReturnPercent >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {derivedSummary.overallReturnPercent >= 0 ? "+" : ""}
              {fmtNumber(derivedSummary.overallReturnPercent, 1)}%
            </span>
            <span>Net return</span>
          </div>
        </div>

        {/* Total Capital Proceeds */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Capital Proceeds Released
          </div>
          <div className="text-xl font-black text-gray-900 mt-1.5">
            {fmtIndianCurrency(derivedSummary.totalProceeds)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Gross cash returned
          </div>
        </div>

        {/* Total Cost Basis of Sold */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Cost Basis of Exits
          </div>
          <div className="text-xl font-black text-gray-800 mt-1.5">
            {fmtIndianCurrency(derivedSummary.totalCostBasis)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Original capital basis
          </div>
        </div>

        {/* Win Rate / Trade Efficiency */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Exit Win Rate
          </div>
          <div className="text-xl font-black text-indigo-900 mt-1.5">
            {derivedSummary.winRate}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {derivedSummary.profitableCount} / {derivedSummary.totalTrades} profitable
          </div>
        </div>

        {/* Free Shares Created */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[10px]" />
            Free Shares Created
          </div>
          <div className="text-xl font-black text-amber-700 mt-1.5">
            {derivedSummary.freeSharesCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Positions with ₹0 risk
          </div>
        </div>
      </div>

      {/* ── Table Toolbar with Live Search & Filter Chips ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70">
          <div className="relative w-full sm:w-80">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            />
            <input
              type="text"
              placeholder="Search by asset name or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-bold mr-1">Filter:</span>
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === "all"
                  ? "bg-[#16171e] text-white shadow-xs"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Trades ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType("profit")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === "profit"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Profitable Exits (+P&amp;L)
            </button>
            <button
              onClick={() => setFilterType("free")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === "free"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Free Shares Events
            </button>
          </div>
        </div>

        {/* ── Transactions Table ────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#FAFBFD] text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Exit Date</th>
                <th className="py-3.5 px-4">Asset &amp; Scheme</th>
                <th className="py-3.5 px-3">Units Sold</th>
                <th className="py-3.5 px-3">Buy Price</th>
                <th className="py-3.5 px-3">Exit Price</th>
                <th className="py-3.5 px-3">Cost Basis (₹)</th>
                <th className="py-3.5 px-3">Proceeds (₹)</th>
                <th className="py-3.5 px-3">Realized P&amp;L</th>
                <th className="py-3.5 px-3">Return (%)</th>
                <th className="py-3.5 px-3">Compounding Status</th>
                <th className="py-3.5 px-4 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-500">
                    <div className="w-8 h-8 border-3 border-[#E8740C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading user activity and exit trades...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-400">
                    <FontAwesomeIcon icon={faInbox} className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No exit trades recorded yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      When holdings are sold or capital is recovered, their complete exit P&amp;L history will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => {
                  const costBasis = Math.round((t.units || 0) * (t.buyPrice || 0) * 100) / 100;
                  const isProfit = (t.realizedGain || 0) >= 0;

                  return (
                    <tr key={t._id} className="hover:bg-amber-50/20 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-[10px]" />
                          <span>{formatDateIndian(t.sellDate || t.createdAt)}</span>
                        </div>
                      </td>

                      {/* Asset Name */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 max-w-[240px]">
                        <div className="truncate" title={t.investmentName}>
                          {t.investmentName}
                        </div>
                      </td>

                      {/* Units Sold */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-gray-800">
                        {fmtNumber(t.units, 2)}
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-gray-600">
                        {fmtIndianCurrency(t.buyPrice)}
                      </td>

                      {/* Exit Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-gray-900">
                        {fmtIndianCurrency(t.price)}
                      </td>

                      {/* Cost Basis */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-gray-700">
                        {fmtIndianCurrency(costBasis)}
                      </td>

                      {/* Total Proceeds */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-black text-gray-900">
                        {fmtIndianCurrency(t.totalProceeds)}
                      </td>

                      {/* Realized P&L */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-black ${
                            isProfit ? "text-[#2E7D32]" : "text-[#C62828]"
                          }`}
                        >
                          {isProfit ? "+" : ""}
                          {fmtIndianCurrency(t.realizedGain)}
                        </span>
                      </td>

                      {/* Return % */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isProfit ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isProfit ? "+" : ""}
                          {fmtNumber(t.realizedGainPercent, 1)}%
                        </span>
                      </td>

                      {/* Compounding Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {t.isFreeShares ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                            title="100% Capital was recovered! Remaining units are risk-free Free Shares."
                          >
                            <FontAwesomeIcon icon={faStar} className="text-[8px] text-emerald-600" />
                            FREE SHARES
                          </span>
                        ) : t.remainingUnits === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                            FULL EXIT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            PARTIAL ({fmtNumber(t.remainingUnits, 2)} left)
                          </span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-[11px] text-gray-500 max-w-[140px] truncate" title={t.notes}>
                        {t.notes || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
