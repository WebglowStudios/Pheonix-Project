import * as XLSX from "xlsx-js-style";
import {
  type Investment,
  type PortfolioSummary,
  type User,
  type CumulativeInvestment,
  type CumulativePortfolioSummary,
  type FamilyMember,
} from "./api";
import { formatDateIndian } from "./format";

const TYPE_NAMES: Record<string, string> = {
  stock: "Direct Equity (Stocks)",
  mutual_fund: "Mutual Funds",
  sip: "Systematic Investment (SIP)",
  fd: "Fixed Deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  bond: "Bonds & Debentures",
  gold: "Gold / SGB",
  crypto: "Cryptocurrency",
  aif: "Alternative Investment Funds (AIF)",
  reit_invit: "REITs / InvITs",
};

// ── Palette & Formatting Tokens ──────────────────────────────────────────────
const PALETTE = {
  brandDark: "16171E",       // Phoenix Brand Charcoal
  brandOrange: "E8740C",     // Phoenix Accent Orange
  navyHeader: "1E293B",      // Deep Navy / Slate
  subHeader: "334155",       // Secondary Slate
  rowZebra: "F8FAFC",        // Alternating row background
  white: "FFFFFF",           // Crisp white
  borderLight: "E2E8F0",     // Crisp table border
  borderMedium: "CBD5E1",    // Section border
  profitGreen: "15803D",     // Positive P&L green
  profitBg: "F0FDF4",        // Positive P&L soft background
  lossRed: "B91C1C",         // Negative P&L red
  lossBg: "FEF2F2",          // Negative P&L soft background
  totalGoldBg: "FEF3C7",     // Summary grand total background
  totalGoldText: "92400E",   // Summary grand total text
  totalGoldBorder: "F59E0B", // Summary grand total border
  metaLabelBg: "F1F5F9",     // Key-value metadata label background
  mutedText: "64748B",       // Muted text
};

const BORDER_THIN = {
  top: { style: "thin", color: { rgb: PALETTE.borderLight } },
  bottom: { style: "thin", color: { rgb: PALETTE.borderLight } },
  left: { style: "thin", color: { rgb: PALETTE.borderLight } },
  right: { style: "thin", color: { rgb: PALETTE.borderLight } },
};

const BORDER_HEADER = {
  top: { style: "thin", color: { rgb: PALETTE.borderMedium } },
  bottom: { style: "medium", color: { rgb: PALETTE.brandOrange } },
  left: { style: "thin", color: { rgb: PALETTE.borderMedium } },
  right: { style: "thin", color: { rgb: PALETTE.borderMedium } },
};

const BORDER_DOUBLE_BOTTOM = {
  top: { style: "thin", color: { rgb: PALETTE.borderMedium } },
  bottom: { style: "double", color: { rgb: "0F172A" } },
  left: { style: "thin", color: { rgb: PALETTE.borderLight } },
  right: { style: "thin", color: { rgb: PALETTE.borderLight } },
};

const FMT_CURRENCY = '₹#,##0.00';
const FMT_PERCENT = '+0.00%;-0.00%;0.00%';
const FMT_QTY = '#,##0.000';
const FMT_INT = '#,##0';

/**
 * Helper to write a styled cell with value, type, and number format
 */
function setCell(
  ws: any,
  r: number,
  c: number,
  val: any,
  style?: any,
  numFmt?: string
) {
  const ref = XLSX.utils.encode_cell({ r, c });
  let t: "n" | "s" | "b" | "d" = "s";
  let v = val;

  if (typeof val === "number") {
    t = "n";
    v = isNaN(val) ? 0 : val;
  } else if (typeof val === "boolean") {
    t = "b";
  } else if (val instanceof Date) {
    t = "d";
  } else if (val === null || val === undefined || val === "") {
    v = "—";
    t = "s";
  } else {
    v = String(val);
    t = "s";
  }

  const cell: any = { v, t };
  if (numFmt && t === "n") {
    cell.z = numFmt;
    if (!style) style = {};
    style.numFmt = numFmt;
  }
  if (style) {
    cell.s = style;
  }
  ws[ref] = cell;
}

/**
 * Helper to merge a range of cells and apply a consistent style across the entire box
 */
function mergeAndStyle(
  ws: any,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  style: any,
  text?: string
) {
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({
    s: { r: startRow, c: startCol },
    e: { r: endRow, c: endCol },
  });

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) {
        ws[ref] = {
          v: r === startRow && c === startCol && text !== undefined ? text : "",
          t: "s",
        };
      } else if (r === startRow && c === startCol && text !== undefined) {
        ws[ref].v = text;
      }
      ws[ref].s = { ...(ws[ref].s || {}), ...style };
    }
  }
}

/**
 * Exports user's or entire family's complete portfolio profile to an executive-grade Excel (.xlsx) workbook.
 * Contains 2 structured, beautifully formatted worksheets:
 * 1. Investor_Summary / Family_Summary: Executive header, investor profile, KPI valuation cards, and asset class allocation breakdown.
 * 2. Holdings_Master: Complete holdings register with accounting formats, frozen headers, autofilter, and grand totals.
 */
export function exportPortfolioToExcel(
  user: Partial<User> | null,
  investments: (Investment | CumulativeInvestment)[],
  summary?: PortfolioSummary | CumulativePortfolioSummary | null,
  options?: { isFamily?: boolean; members?: FamilyMember[] }
) {
  const wb = XLSX.utils.book_new();
  const isFamily = !!options?.isFamily;
  const userName = user?.name || "Client";
  const userEmail = user?.email || "—";
  const userPhone = user?.phone || "—";
  const riskProfile = (user?.riskProfile || "moderate").toUpperCase();
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const totalInvested =
    summary?.totalInvested ??
    investments.reduce((acc, i) => acc + (i.investedAmount || 0), 0);
  const currentValue =
    summary?.currentValue ??
    investments.reduce((acc, i) => acc + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const totalGain =
    summary?.totalGain ?? (currentValue - totalInvested);
  const totalGainPercent =
    summary?.totalGainPercent ??
    (totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0);

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 1: INVESTOR / FAMILY SUMMARY & ALLOCATION
  // ───────────────────────────────────────────────────────────────────────────
  const wsSummary: any = {};
  const sumCols = 6;
  let currRow = 0;

  // Title Banner (Row 0)
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      fill: { fgColor: { rgb: PALETTE.brandDark } },
      font: { name: "Calibri", sz: 14, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    "PHOENIX FINANCIAL SERVICES"
  );
  currRow++;

  // Subtitle (Row 1)
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      fill: { fgColor: { rgb: PALETTE.brandDark } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.brandOrange } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    isFamily
      ? "FAMILY CUMULATIVE WEALTH & ASSET ALLOCATION STATEMENT"
      : "EXECUTIVE PORTFOLIO STATEMENT & ASSET ALLOCATION"
  );
  currRow++;

  // Empty Spacer (Row 2)
  currRow++;

  // Section 1 Header: Profile
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      fill: { fgColor: { rgb: PALETTE.navyHeader } },
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
    },
    isFamily ? "  1. PRIMARY ACCOUNT HOLDER & FAMILY GROUP" : "  1. INVESTOR PROFILE & CREDENTIALS"
  );
  currRow++;

  // Meta Rows
  const metaStyleLabel = {
    fill: { fgColor: { rgb: PALETTE.metaLabelBg } },
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "334155" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  };
  const metaStyleValue = {
    fill: { fgColor: { rgb: PALETTE.white } },
    font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  };

  // Row: Name & Phone
  setCell(wsSummary, currRow, 0, "Primary Investor:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 1, currRow, 2, metaStyleValue, userName);
  setCell(wsSummary, currRow, 3, "Verified Phone:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 4, currRow, 5, metaStyleValue, userPhone);
  currRow++;

  // Row: Email & Risk Profile
  setCell(wsSummary, currRow, 0, "Email Address:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 1, currRow, 2, metaStyleValue, userEmail);
  setCell(wsSummary, currRow, 3, "Risk Profile:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 4, currRow, 5, metaStyleValue, riskProfile);
  currRow++;

  // Row: Generated At & Advisory Firm
  setCell(wsSummary, currRow, 0, "Statement Date:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 1, currRow, 2, metaStyleValue, generatedAt);
  setCell(wsSummary, currRow, 3, "Advisory Firm:", metaStyleLabel);
  mergeAndStyle(wsSummary, currRow, 4, currRow, 5, metaStyleValue, "Phoenix Financial Services");
  currRow++;

  if (isFamily && options?.members) {
    setCell(wsSummary, currRow, 0, "Linked Members:", metaStyleLabel);
    mergeAndStyle(wsSummary, currRow, 1, currRow, 2, metaStyleValue, `${options.members.length} Members`);
    setCell(wsSummary, currRow, 3, "Total Holdings:", metaStyleLabel);
    mergeAndStyle(wsSummary, currRow, 4, currRow, 5, metaStyleValue, `${investments.length} Active Holdings`);
    currRow++;
  }

  // Spacer
  currRow++;

  // Section 2: Executive Portfolio Valuation (KPI Cards)
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      fill: { fgColor: { rgb: PALETTE.navyHeader } },
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
    },
    "  2. EXECUTIVE PORTFOLIO VALUATION (AS ON STATEMENT DATE)"
  );
  currRow++;

  const kpiHeaders = [
    "Total Capital Invested (₹)",
    "Current Valuation (₹)",
    "Total Net Gain / Loss (₹)",
    "Overall Return (%)",
    "Active Holdings",
    "Advisory Status",
  ];
  kpiHeaders.forEach((kh, idx) => {
    setCell(wsSummary, currRow, idx, kh, {
      fill: { fgColor: { rgb: PALETTE.subHeader } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: BORDER_THIN,
    });
  });
  currRow++;

  // KPI Values
  const isGainPositive = totalGain >= 0;
  const kpiValRow = currRow;
  setCell(
    wsSummary,
    kpiValRow,
    0,
    totalInvested,
    {
      fill: { fgColor: { rgb: PALETTE.rowZebra } },
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_THIN,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    kpiValRow,
    1,
    currentValue,
    {
      fill: { fgColor: { rgb: PALETTE.rowZebra } },
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_THIN,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    kpiValRow,
    2,
    totalGain,
    {
      fill: { fgColor: { rgb: isGainPositive ? PALETTE.profitBg : PALETTE.lossBg } },
      font: {
        name: "Calibri",
        sz: 12,
        bold: true,
        color: { rgb: isGainPositive ? PALETTE.profitGreen : PALETTE.lossRed },
      },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_THIN,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    kpiValRow,
    3,
    totalGainPercent / 100,
    {
      fill: { fgColor: { rgb: isGainPositive ? PALETTE.profitBg : PALETTE.lossBg } },
      font: {
        name: "Calibri",
        sz: 12,
        bold: true,
        color: { rgb: isGainPositive ? PALETTE.profitGreen : PALETTE.lossRed },
      },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_THIN,
    },
    FMT_PERCENT
  );
  setCell(
    wsSummary,
    kpiValRow,
    4,
    investments.length,
    {
      fill: { fgColor: { rgb: PALETTE.rowZebra } },
      font: { name: "Calibri", sz: 12, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    },
    FMT_INT
  );
  setCell(
    wsSummary,
    kpiValRow,
    5,
    "ACTIVE PORTFOLIO",
    {
      fill: { fgColor: { rgb: "ECFDF5" } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "047857" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    }
  );
  currRow++;

  // Spacer
  currRow++;

  // Section 3: Asset Class Allocation Breakdown
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      fill: { fgColor: { rgb: PALETTE.navyHeader } },
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
    },
    "  3. ASSET ALLOCATION BREAKDOWN & DISTRIBUTION"
  );
  currRow++;

  const allocHeaders = [
    "Asset Class",
    "Holdings Count",
    "Invested Capital (₹)",
    "Current Valuation (₹)",
    "Net Gain / Loss (₹)",
    "Portfolio Share (%)",
  ];
  allocHeaders.forEach((ah, idx) => {
    setCell(wsSummary, currRow, idx, ah, {
      fill: { fgColor: { rgb: PALETTE.brandOrange } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.white } },
      alignment: {
        horizontal: idx === 0 ? "left" : idx === 1 ? "center" : "right",
        vertical: "center",
      },
      border: BORDER_THIN,
    });
  });
  currRow++;

  // Group by type for summary allocation
  const byTypeMap: Record<string, { count: number; invested: number; current: number }> = {};
  investments.forEach((inv) => {
    const t = inv.type || "other";
    if (!byTypeMap[t]) byTypeMap[t] = { count: 0, invested: 0, current: 0 };
    byTypeMap[t].count += 1;
    byTypeMap[t].invested += inv.investedAmount || 0;
    byTypeMap[t].current += inv.currentValue ?? inv.investedAmount ?? 0;
  });

  let allocDataIdx = 0;
  Object.entries(byTypeMap).forEach(([t, data]) => {
    const gain = data.current - data.invested;
    const share = currentValue > 0 ? data.current / currentValue : 0;
    const isRowEven = allocDataIdx % 2 === 0;
    const rowBg = isRowEven ? PALETTE.white : PALETTE.rowZebra;

    setCell(wsSummary, currRow, 0, TYPE_NAMES[t] || t.toUpperCase(), {
      fill: { fgColor: { rgb: rowBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: BORDER_THIN,
    });
    setCell(
      wsSummary,
      currRow,
      1,
      data.count,
      {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, color: { rgb: "334155" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_INT
    );
    setCell(
      wsSummary,
      currRow,
      2,
      data.invested,
      {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_CURRENCY
    );
    setCell(
      wsSummary,
      currRow,
      3,
      data.current,
      {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_CURRENCY
    );
    setCell(
      wsSummary,
      currRow,
      4,
      gain,
      {
        fill: { fgColor: { rgb: gain >= 0 ? PALETTE.profitBg : PALETTE.lossBg } },
        font: {
          name: "Calibri",
          sz: 10,
          bold: true,
          color: { rgb: gain >= 0 ? PALETTE.profitGreen : PALETTE.lossRed },
        },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_CURRENCY
    );
    setCell(
      wsSummary,
      currRow,
      5,
      share,
      {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      "0.00%"
    );
    currRow++;
    allocDataIdx++;
  });

  // Allocation Total Row
  const totalAllocRow = currRow;
  setCell(wsSummary, totalAllocRow, 0, "TOTAL PORTFOLIO ALLOCATION", {
    fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_DOUBLE_BOTTOM,
  });
  setCell(
    wsSummary,
    totalAllocRow,
    1,
    investments.length,
    {
      fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_DOUBLE_BOTTOM,
    },
    FMT_INT
  );
  setCell(
    wsSummary,
    totalAllocRow,
    2,
    totalInvested,
    {
      fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_DOUBLE_BOTTOM,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    totalAllocRow,
    3,
    currentValue,
    {
      fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_DOUBLE_BOTTOM,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    totalAllocRow,
    4,
    totalGain,
    {
      fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
      font: {
        name: "Calibri",
        sz: 10,
        bold: true,
        color: { rgb: totalGain >= 0 ? PALETTE.profitGreen : PALETTE.lossRed },
      },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_DOUBLE_BOTTOM,
    },
    FMT_CURRENCY
  );
  setCell(
    wsSummary,
    totalAllocRow,
    5,
    1,
    {
      fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_DOUBLE_BOTTOM,
    },
    "0.00%"
  );
  currRow++;

  // Family Members Section (if family)
  if (isFamily && options?.members && options.members.length > 0) {
    currRow++;
    mergeAndStyle(
      wsSummary,
      currRow,
      0,
      currRow,
      sumCols - 1,
      {
        fill: { fgColor: { rgb: PALETTE.navyHeader } },
        font: { name: "Calibri", sz: 11, bold: true, color: { rgb: PALETTE.white } },
        alignment: { horizontal: "left", vertical: "center", indent: 1 },
      },
      "  4. FAMILY MEMBERS WEALTH CONTRIBUTION"
    );
    currRow++;

    const famHeaders = [
      "Member Name",
      "Relationship",
      "Holdings",
      "Invested Capital (₹)",
      "Current Value (₹)",
      "Family Wealth Share",
    ];
    famHeaders.forEach((fh, idx) => {
      setCell(wsSummary, currRow, idx, fh, {
        fill: { fgColor: { rgb: PALETTE.subHeader } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.white } },
        alignment: {
          horizontal: idx === 0 ? "left" : idx <= 2 ? "center" : "right",
          vertical: "center",
        },
        border: BORDER_THIN,
      });
    });
    currRow++;

    options.members.forEach((m, mIdx) => {
      const stats = m.stats || {
        holdingsCount: 0,
        totalInvested: 0,
        currentValue: 0,
        totalGain: 0,
      };
      const share = currentValue > 0 ? stats.currentValue / currentValue : 0;
      const rowBg = mIdx % 2 === 0 ? PALETTE.white : PALETTE.rowZebra;

      setCell(wsSummary, currRow, 0, m.name, {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: BORDER_THIN,
      });
      setCell(wsSummary, currRow, 1, m.relationship || "Family Member", {
        fill: { fgColor: { rgb: rowBg } },
        font: { name: "Calibri", sz: 10, color: { rgb: "334155" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: BORDER_THIN,
      });
      setCell(
        wsSummary,
        currRow,
        2,
        stats.holdingsCount,
        {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 10, color: { rgb: "334155" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: BORDER_THIN,
        },
        FMT_INT
      );
      setCell(
        wsSummary,
        currRow,
        3,
        stats.totalInvested,
        {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: BORDER_THIN,
        },
        FMT_CURRENCY
      );
      setCell(
        wsSummary,
        currRow,
        4,
        stats.currentValue,
        {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: BORDER_THIN,
        },
        FMT_CURRENCY
      );
      setCell(
        wsSummary,
        currRow,
        5,
        share,
        {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: BORDER_THIN,
        },
        "0.00%"
      );
      currRow++;
    });
  }

  // Footer Disclaimer
  currRow += 2;
  mergeAndStyle(
    wsSummary,
    currRow,
    0,
    currRow,
    sumCols - 1,
    {
      font: { name: "Calibri", sz: 9, italic: true, color: { rgb: PALETTE.mutedText } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    "CONFIDENTIALITY NOTICE: This document contains proprietary investor information intended strictly for Phoenix Financial Services advisory reference."
  );

  // Set Summary Sheet Reference, Columns & Row Heights
  wsSummary["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currRow, c: sumCols - 1 },
  });
  wsSummary["!cols"] = [
    { wch: 34 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
  ];
  wsSummary["!views"] = [{ showGridLines: true }];

  XLSX.utils.book_append_sheet(wb, wsSummary, isFamily ? "Family_Summary" : "Investor_Summary");

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: DETAILED HOLDINGS MASTER
  // ───────────────────────────────────────────────────────────────────────────
  const wsHoldings: any = {};
  let hRow = 0;

  const headerCols: string[] = [
    "S.No",
    ...(isFamily ? ["Family Member", "Relationship"] : []),
    "Asset Class",
    "Category (EDEOH)",
    "Investment / Scheme Name",
    "Ticker / Symbol",
    "Exchange / Type",
    "Institution / AMC",
    "Folio / Account No",
    "Units / Qty",
    "Buy Price / NAV (₹)",
    "Investment Date",
    "Current Price / NAV (₹)",
    "Total Invested (₹)",
    "Current Value (₹)",
    "Net Gain / Loss (₹)",
    "Return (%)",
    "Maturity / Tenure",
    "Interest / Coupon (%)",
    "Notes & Remarks",
  ];
  const hColCount = headerCols.length;

  // Title Banner (Row 0)
  mergeAndStyle(
    wsHoldings,
    hRow,
    0,
    hRow,
    hColCount - 1,
    {
      fill: { fgColor: { rgb: PALETTE.brandDark } },
      font: { name: "Calibri", sz: 13, bold: true, color: { rgb: PALETTE.white } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    "PHOENIX FINANCIAL SERVICES — COMPLETE HOLDINGS MASTER REGISTER"
  );
  hRow++;

  // Subtitle (Row 1)
  mergeAndStyle(
    wsHoldings,
    hRow,
    0,
    hRow,
    hColCount - 1,
    {
      fill: { fgColor: { rgb: PALETTE.brandDark } },
      font: { name: "Calibri", sz: 9, bold: true, color: { rgb: PALETTE.brandOrange } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    `Investor: ${userName}  |  Generated: ${generatedAt}  |  Currency: INR (₹)`
  );
  hRow++;

  // Spacer (Row 2)
  hRow++;

  // Table Column Headers (Row 3)
  const headerRowIdx = hRow;
  headerCols.forEach((colName, cIdx) => {
    setCell(wsHoldings, headerRowIdx, cIdx, colName, {
      fill: { fgColor: { rgb: PALETTE.navyHeader } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.white } },
      alignment: {
        horizontal:
          cIdx === 0
            ? "center"
            : colName.includes("Name") || colName.includes("Class") || colName.includes("Institution")
            ? "left"
            : colName.includes("(₹)") || colName.includes("Units") || colName.includes("(%)")
            ? "right"
            : "center",
        vertical: "center",
        wrapText: true,
      },
      border: BORDER_HEADER,
    });
  });
  hRow++;

  // Data Rows
  let sumInvested = 0;
  let sumCurrent = 0;

  investments.forEach((inv, index) => {
    const cv = inv.currentValue ?? inv.investedAmount ?? 0;
    const invested = inv.investedAmount || 0;
    const gain = cv - invested;
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

    sumInvested += invested;
    sumCurrent += cv;

    let tenureOrMaturity = "—";
    if (inv.maturityDate) {
      tenureOrMaturity = formatDateIndian(inv.maturityDate);
    } else if (inv.tenureMonths) {
      tenureOrMaturity = `${inv.tenureMonths} Months`;
    }

    const isRowEven = index % 2 === 0;
    const rowBg = isRowEven ? PALETTE.white : PALETTE.rowZebra;

    const baseStyle = {
      fill: { fgColor: { rgb: rowBg } },
      font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
      border: BORDER_THIN,
    };

    let col = 0;

    // 1. S.No
    setCell(wsHoldings, hRow, col++, index + 1, {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // If Family
    if (isFamily) {
      const famInv = inv as CumulativeInvestment;
      setCell(wsHoldings, hRow, col++, famInv.ownerName || "Primary User", {
        ...baseStyle,
        alignment: { horizontal: "left", vertical: "center" },
      });
      setCell(wsHoldings, hRow, col++, famInv.relationship || "Self", {
        ...baseStyle,
        alignment: { horizontal: "center", vertical: "center" },
      });
    }

    // Asset Class
    setCell(wsHoldings, hRow, col++, TYPE_NAMES[inv.type] || inv.type.toUpperCase(), {
      ...baseStyle,
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" },
    });

    // Category (EDEOH)
    const edeohLabel = inv.category ? inv.category.toUpperCase() : "—";
    setCell(wsHoldings, hRow, col++, edeohLabel, {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Investment / Scheme Name
    setCell(wsHoldings, hRow, col++, inv.name, {
      ...baseStyle,
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
    });

    // Ticker / Symbol
    setCell(wsHoldings, hRow, col++, inv.symbol || "—", {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Exchange / Type
    setCell(wsHoldings, hRow, col++, inv.exchange || (inv.type === "aif" ? "AIF" : "—"), {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Institution / AMC
    setCell(wsHoldings, hRow, col++, inv.institution || "—", {
      ...baseStyle,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
    });

    // Folio / Account No
    setCell(wsHoldings, hRow, col++, inv.folioNumber || "—", {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Units / Qty
    const unitsVal = inv.units ?? (inv.type === "sip" ? inv.instalments : 1);
    setCell(
      wsHoldings,
      hRow,
      col++,
      unitsVal,
      {
        ...baseStyle,
        alignment: { horizontal: "right", vertical: "center" },
      },
      typeof unitsVal === "number" && !Number.isInteger(unitsVal) ? FMT_QTY : FMT_INT
    );

    // Buy Price
    const buyPriceVal = inv.buyPrice ?? (inv.type === "sip" ? inv.avgNav : null);
    if (buyPriceVal !== null && buyPriceVal !== undefined) {
      setCell(
        wsHoldings,
        hRow,
        col++,
        buyPriceVal,
        {
          ...baseStyle,
          alignment: { horizontal: "right", vertical: "center" },
        },
        FMT_CURRENCY
      );
    } else {
      setCell(wsHoldings, hRow, col++, "—", {
        ...baseStyle,
        alignment: { horizontal: "center", vertical: "center" },
      });
    }

    // Investment Date
    setCell(
      wsHoldings,
      hRow,
      col++,
      formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt),
      {
        ...baseStyle,
        alignment: { horizontal: "center", vertical: "center" },
      }
    );

    // Current Price
    const curPriceVal = inv.currentPrice ?? (inv.type === "stock" || inv.type === "mutual_fund" ? null : cv);
    if (curPriceVal !== null && curPriceVal !== undefined) {
      setCell(
        wsHoldings,
        hRow,
        col++,
        curPriceVal,
        {
          ...baseStyle,
          alignment: { horizontal: "right", vertical: "center" },
        },
        FMT_CURRENCY
      );
    } else {
      setCell(wsHoldings, hRow, col++, "—", {
        ...baseStyle,
        alignment: { horizontal: "center", vertical: "center" },
      });
    }

    // Total Invested
    setCell(
      wsHoldings,
      hRow,
      col++,
      invested,
      {
        ...baseStyle,
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
      },
      FMT_CURRENCY
    );

    // Current Value
    setCell(
      wsHoldings,
      hRow,
      col++,
      cv,
      {
        ...baseStyle,
        font: { name: "Calibri", sz: 10, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
      },
      FMT_CURRENCY
    );

    // Gain / Loss
    const isGainPos = gain >= 0;
    setCell(
      wsHoldings,
      hRow,
      col++,
      gain,
      {
        fill: { fgColor: { rgb: isGainPos ? PALETTE.profitBg : PALETTE.lossBg } },
        font: {
          name: "Calibri",
          sz: 10,
          bold: true,
          color: { rgb: isGainPos ? PALETTE.profitGreen : PALETTE.lossRed },
        },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_CURRENCY
    );

    // Return (%)
    setCell(
      wsHoldings,
      hRow,
      col++,
      gainPct / 100,
      {
        fill: { fgColor: { rgb: isGainPos ? PALETTE.profitBg : PALETTE.lossBg } },
        font: {
          name: "Calibri",
          sz: 10,
          bold: true,
          color: { rgb: isGainPos ? PALETTE.profitGreen : PALETTE.lossRed },
        },
        alignment: { horizontal: "right", vertical: "center" },
        border: BORDER_THIN,
      },
      FMT_PERCENT
    );

    // Maturity / Tenure
    setCell(wsHoldings, hRow, col++, tenureOrMaturity, {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Interest Rate
    setCell(wsHoldings, hRow, col++, inv.interestRate ? `${inv.interestRate}%` : "—", {
      ...baseStyle,
      alignment: { horizontal: "center", vertical: "center" },
    });

    // Notes & Remarks
    setCell(wsHoldings, hRow, col++, inv.notes || "—", {
      ...baseStyle,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
    });

    hRow++;
  });

  // Calculate dynamic width for Notes column so long emails/remarks fit comfortably
  const maxNotesLen = investments.reduce(
    (max, inv) => Math.max(max, (inv.notes || "").length),
    0
  );
  const notesColWidth = Math.min(Math.max(38, maxNotesLen + 4), 65);

  // GRAND TOTAL Row at Bottom of Holdings
  const sumGain = sumCurrent - sumInvested;
  const sumGainPct = sumInvested > 0 ? (sumGain / sumInvested) * 100 : 0;
  const grandTotalRow = hRow;

  const totalStyle = {
    fill: { fgColor: { rgb: PALETTE.totalGoldBg } },
    font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.totalGoldText } },
    border: BORDER_DOUBLE_BOTTOM,
  };

  for (let c = 0; c < hColCount; c++) {
    setCell(wsHoldings, grandTotalRow, c, "", totalStyle);
  }

  // Set Label in Scheme Name Column
  const nameColIdx = isFamily ? 4 : 2;
  setCell(wsHoldings, grandTotalRow, nameColIdx, "GRAND TOTAL PORTFOLIO", {
    ...totalStyle,
    alignment: { horizontal: "left", vertical: "center" },
  });

  // Invested, Current Value, Gain, Return columns
  const investedColIdx = isFamily ? 13 : 11;
  setCell(
    wsHoldings,
    grandTotalRow,
    investedColIdx,
    sumInvested,
    {
      ...totalStyle,
      alignment: { horizontal: "right", vertical: "center" },
    },
    FMT_CURRENCY
  );
  setCell(
    wsHoldings,
    grandTotalRow,
    investedColIdx + 1,
    sumCurrent,
    {
      ...totalStyle,
      alignment: { horizontal: "right", vertical: "center" },
    },
    FMT_CURRENCY
  );
  setCell(
    wsHoldings,
    grandTotalRow,
    investedColIdx + 2,
    sumGain,
    {
      ...totalStyle,
      font: {
        name: "Calibri",
        sz: 10,
        bold: true,
        color: { rgb: sumGain >= 0 ? PALETTE.profitGreen : PALETTE.lossRed },
      },
      alignment: { horizontal: "right", vertical: "center" },
    },
    FMT_CURRENCY
  );
  setCell(
    wsHoldings,
    grandTotalRow,
    investedColIdx + 3,
    sumGainPct / 100,
    {
      ...totalStyle,
      font: {
        name: "Calibri",
        sz: 10,
        bold: true,
        color: { rgb: sumGain >= 0 ? PALETTE.profitGreen : PALETTE.lossRed },
      },
      alignment: { horizontal: "right", vertical: "center" },
    },
    FMT_PERCENT
  );

  // Set Holdings Sheet Reference & Formats
  wsHoldings["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: grandTotalRow, c: hColCount - 1 },
  });

  wsHoldings["!cols"] = [
    { wch: 6 }, // S.No
    ...(isFamily ? [{ wch: 22 }, { wch: 16 }] : []),
    { wch: 24 }, // Asset Class
    { wch: 18 }, // Category (EDEOH)
    { wch: 36 }, // Scheme Name
    { wch: 16 }, // Ticker
    { wch: 16 }, // Exchange
    { wch: 24 }, // Institution
    { wch: 18 }, // Folio
    { wch: 14 }, // Units
    { wch: 20 }, // Buy Price
    { wch: 16 }, // Buy Date
    { wch: 20 }, // Current Price
    { wch: 22 }, // Total Invested
    { wch: 22 }, // Current Value
    { wch: 20 }, // Gain/Loss
    { wch: 14 }, // Return %
    { wch: 18 }, // Maturity
    { wch: 18 }, // Interest %
    { wch: notesColWidth }, // Notes & Remarks
  ];

  // Auto-filter on the column header row
  wsHoldings["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIdx, c: 0 },
      e: { r: grandTotalRow, c: hColCount - 1 },
    }),
  };

  // Freezes panes: keeps headers frozen at row 4 while scrolling
  wsHoldings["!views"] = [
    { state: "frozen", ySplit: headerRowIdx + 1, showGridLines: true },
  ];

  XLSX.utils.book_append_sheet(wb, wsHoldings, "Holdings_Master");

  // Generate clean filename
  const cleanName = userName.trim().replace(/[^a-zA-Z0-9]/g, "_");
  const fileDate = new Date().toISOString().split("T")[0];
  const filename = isFamily
    ? `Phoenix_Family_Cumulative_${cleanName}_${fileDate}.xlsx`
    : `Phoenix_Portfolio_${cleanName}_${fileDate}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Legacy PDF export utility (kept for backward compatibility).
 */
export async function exportReportToPdf(
  userName: string = "Client",
  pageIds: string[] = ["report-page-1", "report-page-2"],
  filenamePrefix: string = "Phoenix_Portfolio_Statement"
) {
  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210;
  const imgHeight = 297;

  let pageAdded = false;

  for (let i = 0; i < pageIds.length; i++) {
    const el = document.getElementById(pageIds[i]);
    if (!el) continue;

    const dataUrl = await toPng(el, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    if (pageAdded) {
      pdf.addPage();
    }
    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
    pageAdded = true;
  }

  const cleanName = userName.trim().replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  pdf.save(`${filenamePrefix}_${cleanName}_${dateStr}.pdf`);
}
