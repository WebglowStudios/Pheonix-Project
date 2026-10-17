import * as XLSX from "xlsx";
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

/**
 * Exports user's or entire family's complete portfolio profile to an Excel (.xlsx) workbook.
 * Contains 2 structured worksheets:
 * 1. Investor_Summary / Family_Summary: Overview, contact data, financial KPIs, and asset allocation breakdown.
 * 2. Holdings_Master: Every holding with family member tag, purchase price, current price, units, valuation, and profit.
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
  const summaryRows: any[][] = [
    [
      isFamily
        ? "PHOENIX FINANCIAL SERVICES — FAMILY CUMULATIVE PORTFOLIO STATEMENT"
        : "PHOENIX FINANCIAL SERVICES — INVESTOR PORTFOLIO STATEMENT",
    ],
    ["Generated on:", generatedAt, "", "Advisory Firm:", "Phoenix Financial Services"],
    [""],
    [isFamily ? "1. PRIMARY ACCOUNT HOLDER & FAMILY GROUP" : "1. INVESTOR CREDENTIALS & PROFILE"],
    ["Primary Investor:", userName, "", "Verified Phone:", userPhone],
    ["Email Address:", userEmail, "", "Risk Profile:", riskProfile],
  ];

  if (isFamily && options?.members) {
    summaryRows.push([
      "Total Family Members Linked:",
      options.members.length,
      "",
      "Total Family Holdings:",
      investments.length,
    ]);
  }

  summaryRows.push(
    [""],
    [isFamily ? "2. CUMULATIVE FAMILY PORTFOLIO SUMMARY" : "2. EXECUTIVE PORTFOLIO SUMMARY"],
    [
      "Total Capital Invested (₹)",
      "Current Portfolio Value (₹)",
      "Total Net Gain / Loss (₹)",
      "Total Return (%)",
      "Total Holdings Count",
    ],
    [
      totalInvested,
      currentValue,
      totalGain,
      Number(totalGainPercent.toFixed(2)),
      investments.length,
    ],
    [""],
    ["3. ASSET ALLOCATION BREAKDOWN"],
    [
      "Asset Class",
      "Holdings Count",
      "Invested Capital (₹)",
      "Current Valuation (₹)",
      "Net Gain / Loss (₹)",
      "Portfolio Share (%)",
    ]
  );

  // Group by type for summary allocation
  const byTypeMap: Record<string, { count: number; invested: number; current: number }> = {};
  investments.forEach((inv) => {
    const t = inv.type || "other";
    if (!byTypeMap[t]) byTypeMap[t] = { count: 0, invested: 0, current: 0 };
    byTypeMap[t].count += 1;
    byTypeMap[t].invested += inv.investedAmount || 0;
    byTypeMap[t].current += inv.currentValue ?? inv.investedAmount ?? 0;
  });

  Object.entries(byTypeMap).forEach(([t, data]) => {
    const gain = data.current - data.invested;
    const share = currentValue > 0 ? (data.current / currentValue) * 100 : 0;
    summaryRows.push([
      TYPE_NAMES[t] || t.toUpperCase(),
      data.count,
      data.invested,
      data.current,
      gain,
      Number(share.toFixed(2)),
    ]);
  });

  // If Family Mode, add Member Contribution Breakdown
  if (isFamily && options?.members && options.members.length > 0) {
    summaryRows.push([""]);
    summaryRows.push(["4. FAMILY MEMBERS WEALTH CONTRIBUTION"]);
    summaryRows.push([
      "Member Name",
      "Relationship",
      "Email Address",
      "Holdings Count",
      "Invested Amount (₹)",
      "Current Value (₹)",
      "Net Gain / Loss (₹)",
      "Family Wealth Share (%)",
    ]);

    options.members.forEach((m) => {
      const stats = m.stats || {
        holdingsCount: 0,
        totalInvested: 0,
        currentValue: 0,
        totalGain: 0,
      };
      const share = currentValue > 0 ? (stats.currentValue / currentValue) * 100 : 0;
      summaryRows.push([
        m.name,
        m.relationship || "Family Member",
        m.email || "—",
        stats.holdingsCount,
        stats.totalInvested,
        stats.currentValue,
        stats.totalGain,
        Number(share.toFixed(2)),
      ]);
    });
  }

  summaryRows.push([""]);
  summaryRows.push([
    "CONFIDENTIALITY NOTICE: This document contains proprietary investor information intended strictly for Phoenix Financial Services advisory reference.",
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

  wsSummary["!cols"] = [
    { wch: 32 },
    { wch: 28 },
    { wch: 28 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, isFamily ? "Family_Summary" : "Investor_Summary");

  // ───────────────────────────────────────────────────────────────────────────
  // SHEET 2: DETAILED HOLDINGS MASTER
  // ───────────────────────────────────────────────────────────────────────────
  const headerCols: string[] = [
    "S.No",
    ...(isFamily ? ["Family Member", "Relationship"] : []),
    "Asset Class",
    "Investment / Scheme Name",
    "Ticker / AMFI Code",
    "Exchange / Category",
    "Institution / Bank / AMC",
    "Folio / Account No",
    "Units / Qty",
    "Purchase Price / Buy NAV (₹)",
    "Investment Date",
    "Current Price / Latest NAV (₹)",
    "Total Invested (₹)",
    "Current Value (₹)",
    "Gain / Loss (₹)",
    "Return (%)",
    "Maturity / Tenure",
    "Interest / Coupon (%)",
    "Notes & Remarks",
  ];

  const holdingsRows: any[][] = [headerCols];

  investments.forEach((inv, index) => {
    const cv = inv.currentValue ?? inv.investedAmount ?? 0;
    const invested = inv.investedAmount || 0;
    const gain = cv - invested;
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

    let tenureOrMaturity = "—";
    if (inv.maturityDate) {
      tenureOrMaturity = formatDateIndian(inv.maturityDate);
    } else if (inv.tenureMonths) {
      tenureOrMaturity = `${inv.tenureMonths} Months`;
    }

    const row: any[] = [index + 1];

    if (isFamily) {
      const famInv = inv as CumulativeInvestment;
      row.push(famInv.ownerName || "Primary User");
      row.push(famInv.relationship || "Self");
    }

    row.push(
      TYPE_NAMES[inv.type] || inv.type.toUpperCase(),
      inv.name,
      inv.symbol || "—",
      inv.exchange || (inv.type === "aif" ? "AIF" : "—"),
      inv.institution || "—",
      inv.folioNumber || "—",
      inv.units || (inv.type === "sip" ? inv.instalments : 1),
      inv.buyPrice || (inv.type === "sip" ? inv.avgNav : "—"),
      formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt),
      inv.currentPrice || (inv.type === "stock" || inv.type === "mutual_fund" ? "—" : cv),
      invested,
      cv,
      gain,
      Number(gainPct.toFixed(2)),
      tenureOrMaturity,
      inv.interestRate ? `${inv.interestRate}%` : "—",
      inv.notes || "—"
    );

    holdingsRows.push(row);
  });

  const wsHoldings = XLSX.utils.aoa_to_sheet(holdingsRows);
  wsHoldings["!cols"] = [
    { wch: 6 },
    ...(isFamily ? [{ wch: 22 }, { wch: 18 }] : []),
    { wch: 24 },
    { wch: 34 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
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
 * Exports official Master/Family Portfolio Report sections to high-quality PDF.
 * Elements may be inside a hidden container — we temporarily reveal it during capture.
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
    compress: true,
  });

  const pdfWidth  = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin       = 6;
  const contentWidth = pdfWidth - margin * 2;

  // --- Find the outermost hidden wrapper to temporarily reveal ---------------
  // Priority: known wrapper IDs → walk up from first section to topmost hidden ancestor
  const KNOWN_WRAPPER_IDS = ["family-pdf-wrapper", "master-pdf-wrapper"];
  let wrapper: HTMLElement | null = null;

  for (const id of KNOWN_WRAPPER_IDS) {
    const el = document.getElementById(id);
    if (el) { wrapper = el; break; }
  }

  // Fallback: walk UP from the first target section and find the topmost hidden ancestor
  if (!wrapper) {
    const firstSection = document.getElementById(pageIds[0]);
    if (firstSection) {
      let p = firstSection.parentElement;
      let topHidden: HTMLElement | null = null;
      while (p && p !== document.body) {
        const style = getComputedStyle(p);
        if (style.display === "none" || p.classList.contains("hidden")) {
          topHidden = p;
        }
        p = p.parentElement;
      }
      wrapper = topHidden;
    }
  }

  // Temporarily reveal wrapper by overriding inline style (beats any CSS class)
  if (wrapper) {
    console.log("[PDF] Revealing wrapper:", wrapper.id || wrapper.className.slice(0, 60));
    wrapper.style.cssText +=
      ";display:block!important;position:fixed!important;left:-9999px!important;top:0!important;z-index:-1!important;width:1060px!important;overflow:visible!important";
    // Let the browser fully lay out the revealed subtree
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));
  } else {
    console.warn("[PDF] No hidden wrapper found — sections may already be visible.");
  }

  let addedPage = false;

  try {
    for (let i = 0; i < pageIds.length; i++) {
      const el = document.getElementById(pageIds[i]);
      if (!el) {
        console.warn(`[PDF] Section not found: ${pageIds[i]}`);
        continue;
      }
      console.log(`[PDF] Capturing section: ${pageIds[i]} (${el.scrollWidth}×${el.scrollHeight})`);

      if (addedPage) pdf.addPage();

      const imgData = await toPng(el, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: el.scrollWidth || 1060,
      });

      // Validate the data URI before passing to jsPDF
      if (!imgData || !imgData.startsWith("data:image/png")) {
        console.warn(`[PDF] Skipping ${pageIds[i]}: invalid image data`);
        continue;
      }

      const imgProps = pdf.getImageProperties(imgData);
      const h = (imgProps.height * contentWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", margin, margin, contentWidth, Math.min(h, pdfHeight - margin * 2));
      addedPage = true;
    }
  } finally {
    // Restore: remove the inline cssText additions we injected
    if (wrapper) {
      wrapper.style.display   = "";
      wrapper.style.position  = "";
      wrapper.style.left      = "";
      wrapper.style.top       = "";
      wrapper.style.zIndex    = "";
      wrapper.style.width     = "";
      wrapper.style.overflow  = "";
    }
  }

  if (!addedPage) throw new Error("No pages were captured — check browser console for [PDF] logs.");

  const cleanName = userName.trim().replace(/[^a-zA-Z0-9]/g, "_");
  const fileDate  = new Date().toISOString().split("T")[0];
  pdf.save(`${filenamePrefix}_${cleanName}_${fileDate}.pdf`);
}
