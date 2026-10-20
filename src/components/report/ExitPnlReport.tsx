"use client";

import { useState, useMemo } from "react";
import { type Transaction, type ExitReportSummary, type User, type AdminUser } from "@/lib/api";
import { fmtIndianCurrency, fmtNumber, formatDateIndian } from "@/lib/format";
import * as XLSX from "xlsx-js-style";
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

// Excel Export Handler with Executive Corporate Styling
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws: any = {};
    const colCount = 13;
    let r = 0;

    const brandDark = "16171E";
    const brandOrange = "E8740C";
    const navyHeader = "1E293B";
    const subHeader = "334155";
    const white = "FFFFFF";
    const borderLight = "E2E8F0";
    const borderMedium = "CBD5E1";
    const rowZebra = "F8FAFC";
    const profitGreen = "15803D";
    const profitBg = "F0FDF4";
    const lossRed = "B91C1C";
    const lossBg = "FEF2F2";
    const totalGoldBg = "FEF3C7";
    const totalGoldText = "92400E";

    const bThin = {
      top: { style: "thin", color: { rgb: borderLight } },
      bottom: { style: "thin", color: { rgb: borderLight } },
      left: { style: "thin", color: { rgb: borderLight } },
      right: { style: "thin", color: { rgb: borderLight } },
    };

    const bHeader = {
      top: { style: "thin", color: { rgb: borderMedium } },
      bottom: { style: "medium", color: { rgb: brandOrange } },
      left: { style: "thin", color: { rgb: borderMedium } },
      right: { style: "thin", color: { rgb: borderMedium } },
    };

    const bDouble = {
      top: { style: "thin", color: { rgb: borderMedium } },
      bottom: { style: "double", color: { rgb: "0F172A" } },
      left: { style: "thin", color: { rgb: borderLight } },
      right: { style: "thin", color: { rgb: borderLight } },
    };

    const setCellHelper = (
      row: number,
      col: number,
      val: any,
      style?: any,
      numFmt?: string
    ) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      let t: "n" | "s" | "b" = "s";
      let v = val;
      if (typeof val === "number") {
        t = "n";
        v = isNaN(val) ? 0 : val;
      } else if (typeof val === "boolean") {
        t = "b";
      } else if (val === null || val === undefined || val === "") {
        v = "—";
      } else {
        v = String(val);
      }
      const cell: any = { v, t };
      if (numFmt && t === "n") {
        cell.z = numFmt;
        if (!style) style = {};
        style.numFmt = numFmt;
      }
      if (style) cell.s = style;
      ws[ref] = cell;
    };

    const mergeHelper = (
      sR: number,
      sC: number,
      eR: number,
      eC: number,
      style: any,
      text?: string
    ) => {
      if (!ws["!merges"]) ws["!merges"] = [];
      ws["!merges"].push({ s: { r: sR, c: sC }, e: { r: eR, c: eC } });
      for (let ro = sR; ro <= eR; ro++) {
        for (let co = sC; co <= eC; co++) {
          const ref = XLSX.utils.encode_cell({ r: ro, c: co });
          if (!ws[ref]) {
            ws[ref] = {
              v: ro === sR && co === sC && text !== undefined ? text : "",
              t: "s",
            };
          } else if (ro === sR && co === sC && text !== undefined) {
            ws[ref].v = text;
          }
          ws[ref].s = { ...(ws[ref].s || {}), ...style };
        }
      }
    };

    // 1. Title Banner
    mergeHelper(
      r,
      0,
      r,
      colCount - 1,
      {
        fill: { fgColor: { rgb: brandDark } },
        font: { name: "Calibri", sz: 14, bold: true, color: { rgb: white } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      "PHOENIX FINANCIAL SERVICES — EXIT P&L & ACTIVITY REPORT"
    );
    r++;

    // 2. Subtitle
    const genDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    mergeHelper(
      r,
      0,
      r,
      colCount - 1,
      {
        fill: { fgColor: { rgb: brandDark } },
        font: { name: "Calibri", sz: 9, bold: true, color: { rgb: brandOrange } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      `Investor: ${user?.name || "Client"}  |  Generated: ${genDate}  |  Official Executed Sales & Capital Freed Ledger`
    );
    r++;

    // 3. Spacer
    r++;

    // 4. KPI Summary Cards Header
    mergeHelper(
      r,
      0,
      r,
      colCount - 1,
      {
        fill: { fgColor: { rgb: navyHeader } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } },
        alignment: { horizontal: "left", vertical: "center", indent: 1 },
      },
      "  EXECUTIVE REALIZED CAPITAL PERFORMANCE & SUMMARY"
    );
    r++;

    // KPI Column Headers
    const kpiTitles = [
      "Total Realized Profit (₹)",
      "Total Capital Proceeds (₹)",
      "Executed Trades",
      "Win Rate (%)",
      "Free Shares Holdings",
    ];
    mergeHelper(r, 0, r, 1, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, kpiTitles[0]);
    mergeHelper(r, 2, r, 3, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, kpiTitles[1]);
    mergeHelper(r, 4, r, 5, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, kpiTitles[2]);
    mergeHelper(r, 6, r, 7, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, kpiTitles[3]);
    mergeHelper(r, 8, r, 9, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, kpiTitles[4]);
    mergeHelper(r, 10, r, colCount - 1, { fill: { fgColor: { rgb: subHeader } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, "Status");
    r++;

    // KPI Values
    const isGainPos = derivedSummary.totalRealizedProfit >= 0;
    const gainCardBg = isGainPos ? profitBg : lossBg;
    const gainCardColor = isGainPos ? profitGreen : lossRed;

    mergeHelper(r, 0, r, 1, { fill: { fgColor: { rgb: gainCardBg } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: gainCardColor } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin });
    setCellHelper(r, 0, derivedSummary.totalRealizedProfit, { fill: { fgColor: { rgb: gainCardBg } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: gainCardColor } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, '₹#,##0.00');

    mergeHelper(r, 2, r, 3, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin });
    setCellHelper(r, 2, derivedSummary.totalProceeds, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, '₹#,##0.00');

    mergeHelper(r, 4, r, 5, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, `${derivedSummary.totalTrades} Executed`);

    mergeHelper(r, 6, r, 7, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin });
    setCellHelper(r, 6, derivedSummary.winRate / 100, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, '0.00%');

    mergeHelper(r, 8, r, 9, { fill: { fgColor: { rgb: rowZebra } }, font: { name: "Calibri", sz: 12, bold: true, color: { rgb: brandOrange } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, `${derivedSummary.freeSharesCount} Positions`);

    mergeHelper(r, 10, r, colCount - 1, { fill: { fgColor: { rgb: "ECFDF5" } }, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "047857" } }, alignment: { horizontal: "center", vertical: "center" }, border: bThin }, "AUDITED LEDGER");
    r++;

    // Spacer
    r++;

    // 5. Table Column Headers
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
    const headerRowIdx = r;
    headers.forEach((h, cIdx) => {
      setCellHelper(headerRowIdx, cIdx, h, {
        fill: { fgColor: { rgb: navyHeader } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: white } },
        alignment: {
          horizontal:
            cIdx === 0
              ? "center"
              : h.includes("Name") || h.includes("Notes")
              ? "left"
              : h.includes("(₹)") || h.includes("Units") || h.includes("(%)")
              ? "right"
              : "center",
          vertical: "center",
          wrapText: true,
        },
        border: bHeader,
      });
    });
    r++;

    // 6. Data Rows
    let totalCostBasis = 0;
    let totalProceeds = 0;
    let totalGain = 0;

    transactions.forEach((t, idx) => {
      const costBasis = Math.round((t.units || 0) * (t.buyPrice || 0) * 100) / 100;
      totalCostBasis += costBasis;
      totalProceeds += t.totalProceeds || 0;
      totalGain += t.realizedGain || 0;

      const isEven = idx % 2 === 0;
      const rowBg = isEven ? white : rowZebra;
      const baseStyle = {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
        border: bThin,
      };

      let c = 0;
      setCellHelper(r, c++, idx + 1, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
      setCellHelper(r, c++, formatDateIndian(t.sellDate || t.createdAt), { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
      setCellHelper(r, c++, t.investmentName, { ...baseStyle, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "left", vertical: "center", wrapText: true } });
      setCellHelper(r, c++, t.units, { ...baseStyle, alignment: { horizontal: "right", vertical: "center" } }, '#,##0.000');
      setCellHelper(r, c++, t.buyPrice, { ...baseStyle, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');
      setCellHelper(r, c++, t.price, { ...baseStyle, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');
      setCellHelper(r, c++, costBasis, { ...baseStyle, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');
      setCellHelper(r, c++, t.totalProceeds, { ...baseStyle, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } }, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');

      const isTradePos = (t.realizedGain || 0) >= 0;
      setCellHelper(
        r,
        c++,
        t.realizedGain,
        {
          fill: { fgColor: { rgb: isTradePos ? profitBg : lossBg } },
          font: { name: "Calibri", sz: 10, bold: true, color: { rgb: isTradePos ? profitGreen : lossRed } },
          alignment: { horizontal: "right", vertical: "center" },
          border: bThin,
        },
        '₹#,##0.00'
      );

      setCellHelper(
        r,
        c++,
        (t.realizedGainPercent || 0) / 100,
        {
          fill: { fgColor: { rgb: isTradePos ? profitBg : lossBg } },
          font: { name: "Calibri", sz: 10, bold: true, color: { rgb: isTradePos ? profitGreen : lossRed } },
          alignment: { horizontal: "right", vertical: "center" },
          border: bThin,
        },
        '+0.00%;-0.00%;0.00%'
      );

      const statusText = t.isFreeShares ? "FREE SHARES CREATED" : t.remainingUnits === 0 ? "FULL EXIT" : "PARTIAL EXIT";
      setCellHelper(r, c++, statusText, {
        fill: { fgColor: { rgb: t.isFreeShares ? "FFF3EB" : rowBg } },
        font: { name: "Calibri", sz: 9, bold: true, color: { rgb: t.isFreeShares ? brandOrange : "334155" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bThin,
      });

      setCellHelper(r, c++, t.remainingUnits, { ...baseStyle, alignment: { horizontal: "right", vertical: "center" } }, '#,##0.000');
      setCellHelper(r, c++, t.notes || "—", { ...baseStyle, alignment: { horizontal: "left", vertical: "center", wrapText: true } });
      r++;
    });

    // Calculate dynamic width for Notes column
    const maxNotesLen = transactions.reduce(
      (max, t) => Math.max(max, (t.notes || "").length),
      0
    );
    const notesColWidth = Math.min(Math.max(38, maxNotesLen + 4), 65);

    // 7. Grand Total Row
    const grandRow = r;
    const totStyle = {
      fill: { fgColor: { rgb: totalGoldBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: totalGoldText } },
      border: bDouble,
    };
    for (let c = 0; c < colCount; c++) {
      setCellHelper(grandRow, c, "", totStyle);
    }
    setCellHelper(grandRow, 2, "GRAND TOTAL AUDITED SALES", { ...totStyle, alignment: { horizontal: "left", vertical: "center" } });
    setCellHelper(grandRow, 6, totalCostBasis, { ...totStyle, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');
    setCellHelper(grandRow, 7, totalProceeds, { ...totStyle, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');
    setCellHelper(grandRow, 8, totalGain, { ...totStyle, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: totalGain >= 0 ? profitGreen : lossRed } }, alignment: { horizontal: "right", vertical: "center" } }, '₹#,##0.00');

    const totalGainPct = totalCostBasis > 0 ? (totalGain / totalCostBasis) : 0;
    setCellHelper(grandRow, 9, totalGainPct, { ...totStyle, font: { name: "Calibri", sz: 10, bold: true, color: { rgb: totalGain >= 0 ? profitGreen : lossRed } }, alignment: { horizontal: "right", vertical: "center" } }, '+0.00%;-0.00%;0.00%');

    // Bounds & formatting
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: grandRow, c: colCount - 1 } });
    ws["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 16 }, // Exit Date
      { wch: 34 }, // Scheme Name
      { wch: 14 }, // Units Sold
      { wch: 18 }, // Buy Price
      { wch: 18 }, // Sell Price
      { wch: 20 }, // Cost Basis
      { wch: 20 }, // Proceeds
      { wch: 20 }, // Realized P&L
      { wch: 14 }, // Return %
      { wch: 24 }, // Status
      { wch: 16 }, // Remaining Units
      { wch: notesColWidth }, // Notes & Remarks
    ];

    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({ s: { r: headerRowIdx, c: 0 }, e: { r: grandRow, c: colCount - 1 } }),
    };

    ws["!views"] = [
      { state: "frozen", ySplit: headerRowIdx + 1, showGridLines: true },
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
