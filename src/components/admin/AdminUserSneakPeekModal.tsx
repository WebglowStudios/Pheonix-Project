"use client";

import { useEffect, useState, useMemo } from "react";
import {
  adminApi,
  type AdminUser,
  type Investment,
  type PortfolioSummary,
} from "@/lib/api";
import {
  fmtIndianCurrency,
  fmtNumber,
  formatDateIndian,
} from "@/lib/format";
import { exportPortfolioToExcel, exportReportToPdf } from "@/lib/exportUtils";
import MasterPortfolioReport from "@/components/report/MasterPortfolioReport";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faFileExcel,
  faFilePdf,
  faPrint,
  faPhone,
  faEnvelope,
  faLock,
  faChartPie,
  faSearch,
  faSpinner,
  faArrowTrendUp,
  faArrowTrendDown,
  faBriefcase,
  faCommentDots,
  faLightbulb,
  faUserTie,
  faCalendarAlt,
  faShieldHalved,
  faBuildingColumns,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

interface Props {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  stock: { label: "Equity / Stock", color: "#1565C0", bg: "#E3F2FD" },
  mutual_fund: { label: "Mutual Fund", color: "#2E7D32", bg: "#E8F5E9" },
  sip: { label: "SIP", color: "#E8740C", bg: "#FFF3EB" },
  fd: { label: "Fixed Deposit", color: "#6A1B9A", bg: "#F3E5F5" },
  ppf: { label: "PPF", color: "#E65100", bg: "#FBE9E7" },
  epf: { label: "EPF", color: "#00838F", bg: "#E0F7FA" },
  nps: { label: "NPS", color: "#F57F17", bg: "#FFFDE7" },
  bond: { label: "Bond / NCD", color: "#880E4F", bg: "#FCE4EC" },
  gold: { label: "Gold / SGB", color: "#B78103", bg: "#FFF8E1" },
  crypto: { label: "Crypto", color: "#4527A0", bg: "#EDE7F6" },
  aif: { label: "AIF", color: "#4E342E", bg: "#EFEBE9" },
  reit_invit: { label: "REIT / InvIT", color: "#37474F", bg: "#ECEFF1" },
};

export default function AdminUserSneakPeekModal({ user, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"holdings" | "statement">("holdings");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const userId = user?.id || (user as any)?._id;

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    adminApi
      .getUser(userId)
      .then((res) => {
        if (!isMounted) return;
        const payload = res.data;
        const invList: Investment[] = payload?.investments || (res as any).investments || [];
        const sumObj: PortfolioSummary | undefined = payload?.summary || (res as any).summary;

        if (res.success) {
          setInvestments(invList);
          if (sumObj) {
            setSummary(sumObj);
          } else {
            // Compute fallback summary
            const totalInv = invList.reduce((acc: number, i: Investment) => acc + (i.investedAmount || 0), 0);
            const totalCur = invList.reduce(
              (acc: number, i: Investment) => acc + (i.currentValue ?? i.investedAmount ?? 0),
              0
            );
            const gain = totalCur - totalInv;
            setSummary({
              totalInvested: totalInv,
              currentValue: totalCur,
              totalGain: gain,
              totalGainPercent: totalInv > 0 ? (gain / totalInv) * 100 : 0,
              holdings: invList.length,
              byType: {},
              recentInvestments: [],
              pricesLastUpdated: null,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching user sneak peek details:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  // Derived financial metrics
  const totalInvested =
    summary?.totalInvested ??
    investments.reduce((acc, i) => acc + (i.investedAmount || 0), 0);
  const currentValue =
    summary?.currentValue ??
    investments.reduce((acc, i) => acc + (i.currentValue ?? i.investedAmount ?? 0), 0);
  const totalGain = summary?.totalGain ?? (currentValue - totalInvested);
  const totalGainPercent =
    summary?.totalGainPercent ??
    (totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0);

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchType = selectedType === "all" || inv.type === selectedType;
      const matchSearch =
        !search.trim() ||
        inv.name.toLowerCase().includes(search.toLowerCase()) ||
        (inv.symbol && inv.symbol.toLowerCase().includes(search.toLowerCase())) ||
        (inv.institution && inv.institution.toLowerCase().includes(search.toLowerCase())) ||
        (inv.folioNumber && inv.folioNumber.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [investments, selectedType, search]);

  // Group by type for allocation pills
  const typeBreakdown = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    investments.forEach((i) => {
      const t = i.type || "other";
      if (!map[t]) map[t] = { count: 0, value: 0 };
      map[t].count += 1;
      map[t].value += i.currentValue ?? i.investedAmount ?? 0;
    });
    return map;
  }, [investments]);

  // Advisory insights engine
  const advisoryInsights = useMemo(() => {
    const insights: string[] = [];
    if (!investments.length) {
      insights.push("Client currently has no active holdings registered in the system.");
      return insights;
    }

    const equityVal = (typeBreakdown["stock"]?.value || 0) + (typeBreakdown["reit_invit"]?.value || 0);
    const mfVal = (typeBreakdown["mutual_fund"]?.value || 0) + (typeBreakdown["sip"]?.value || 0);
    const fixedVal =
      (typeBreakdown["fd"]?.value || 0) +
      (typeBreakdown["bond"]?.value || 0) +
      (typeBreakdown["ppf"]?.value || 0) +
      (typeBreakdown["epf"]?.value || 0);

    if (currentValue >= 2500000) {
      insights.push("Portfolio exceeds ₹25L — High-Net-Worth Individual (HNI). Prime candidate for PMS, AIF, and Structured Products.");
    }
    if (equityVal > 0 && equityVal / (currentValue || 1) > 0.6) {
      insights.push("Direct Equity exposure is above 60%. Advisory opportunity: suggest Capital Shield / Fixed Income rebalancing to protect gains.");
    }
    if (fixedVal > 0 && fixedVal / (currentValue || 1) > 0.5) {
      insights.push("High cash/fixed-income allocation (>50%). Opportunity to introduce Equity Mutual Funds / Systematic SIPs for inflation-beating returns.");
    }
    if (mfVal > 0 && !typeBreakdown["sip"]) {
      insights.push("Client holds lump-sum Mutual Funds but has no active SIPs. Suggest setting up monthly SIPs to average volatility.");
    }
    if (!typeBreakdown["gold"]) {
      insights.push("Zero Gold / SGB allocation detected. Advise on 5–10% Gold ETF/SGB hedge for risk mitigation.");
    }

    return insights;
  }, [investments, currentValue, typeBreakdown]);

  async function handleExcelExport() {
    if (!user || exportingExcel) return;
    setExportingExcel(true);
    try {
      exportPortfolioToExcel(user, investments, summary);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setExportingExcel(false);
    }
  }

  async function handlePdfExport() {
    if (!user || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportReportToPdf(user.name);
    } catch (err) {
      console.error("PDF export error:", err);
      // Fallback to print
      window.print();
    } finally {
      setExportingPdf(false);
    }
  }

  if (!isOpen || !user) return null;

  const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(
        `Hello ${user.name}, greetings from Phoenix Financial Services! We have reviewed your investment portfolio and would like to share some customized wealth advisory insights.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── Top Header & Security Banner ─────────────────────────────────── */}
        <div className="bg-[#16171e] text-white p-5 border-b border-gray-800 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* User Identity */}
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#E8740C] flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#E8740C] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-white tracking-wide">
                    {user.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF3EB] text-[#E8740C]">
                    {user.riskProfile || "Moderate"} Risk
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-medium">
                    ID: {user.id ? String(user.id).slice(-6) : "Client"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faEnvelope} className="text-[#E8740C]" />
                    <a href={`mailto:${user.email}`} className="hover:underline text-gray-300">
                      {user.email}
                    </a>
                  </span>

                  {user.phone ? (
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faPhone} className="text-[#2E7D32]" />
                      <a href={`tel:${user.phone.replace(/\s+/g, "")}`} className="hover:underline text-gray-300 font-semibold">
                        {user.phone}
                      </a>
                    </span>
                  ) : (
                    <span className="text-red-400 font-medium">No Phone Number</span>
                  )}

                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500" />
                    Joined {formatDateIndian(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action & Export Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Excel Download */}
              <button
                onClick={handleExcelExport}
                disabled={exportingExcel || loading}
                title="Download user portfolio as formatted Microsoft Excel (.xlsx) spreadsheet"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {exportingExcel ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                ) : (
                  <FontAwesomeIcon icon={faFileExcel} className="text-sm" />
                )}
                <span>Export Excel</span>
              </button>

              {/* PDF Download */}
              <button
                onClick={handlePdfExport}
                disabled={exportingPdf || loading}
                title="Download official Master Portfolio Statement as PDF"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {exportingPdf ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                ) : (
                  <FontAwesomeIcon icon={faFilePdf} className="text-sm" />
                )}
                <span>Download PDF</span>
              </button>

              {/* Print */}
              <button
                onClick={() => window.print()}
                title="Print Master Statement"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 transition-all"
              >
                <FontAwesomeIcon icon={faPrint} className="text-xs" />
                <span>Print</span>
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-all ml-1"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} className="text-base" />
              </button>
            </div>
          </div>

          {/* Read-Only Notice Bar */}
          <div className="mt-3.5 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-amber-400 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-800/40">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLock} className="text-amber-400 text-xs" />
              <span>
                <strong>Admin Sneak Peek Mode:</strong> You are viewing live, read-only investor holdings. All edits and transactions are locked.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-gray-400">
              Target Advisory &amp; Portfolio Diagnostics
            </span>
          </div>
        </div>

        {/* ── Tabs Bar ─────────────────────────────────────────────────────── */}
        <div className="bg-[#F8FAFC] border-b border-gray-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("holdings")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "holdings"
                  ? "bg-[#E8740C] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faBriefcase} className="mr-2" />
              Holdings &amp; Live Analytics ({investments.length})
            </button>

            <button
              onClick={() => setActiveTab("statement")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "statement"
                  ? "bg-[#E8740C] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
              Institutional Statement (A4 PDF Preview)
            </button>
          </div>

          <div className="text-xs text-gray-500 hidden md:block">
            Prices synced via Yahoo Finance &amp; AMFI
          </div>
        </div>

        {/* ── Modal Body Content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F3F4F7]">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-600">
                Fetching investor's live portfolio &amp; stock holdings...
              </p>
            </div>
          ) : activeTab === "statement" ? (
            /* ── TAB 2: Institutional Statement Preview ── */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6">
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Master Portfolio Statement
                  </h3>
                  <p className="text-xs text-gray-500">
                    Official 2-page statement ready for print or direct PDF client dispatch.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePdfExport}
                    disabled={exportingPdf}
                    className="px-3 py-1.5 bg-[#C62828] text-white rounded text-xs font-bold hover:bg-[#B71C1C] transition-colors"
                  >
                    <FontAwesomeIcon icon={faFilePdf} className="mr-1.5" />
                    Save PDF
                  </button>
                </div>
              </div>

              <MasterPortfolioReport
                user={user}
                summary={summary}
                investments={investments}
                reportDate={new Date()}
              />
            </div>
          ) : (
            /* ── TAB 1: Holdings & Live Analytics ── */
            <div className="space-y-6">
              {/* Executive Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Current Valuation */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Current Value
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {fmtIndianCurrency(currentValue)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live valuation across {investments.length} holdings
                  </p>
                </div>

                {/* Total Invested */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Capital Invested
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {fmtIndianCurrency(totalInvested)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Net cash purchase value
                  </p>
                </div>

                {/* Total Gain / Loss */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Overall Profit / Loss
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p
                      className={`text-2xl font-extrabold ${
                        totalGain >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"
                      }`}
                    >
                      {totalGain >= 0 ? "+" : ""}
                      {fmtIndianCurrency(totalGain)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        totalGain >= 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={totalGain >= 0 ? faArrowTrendUp : faArrowTrendDown}
                        className="mr-1"
                      />
                      {totalGainPercent >= 0 ? "+" : ""}
                      {fmtNumber(totalGainPercent)}%
                    </span>
                    <span className="text-[11px] text-gray-500">Unrealized return</span>
                  </div>
                </div>

                {/* Holdings & Profile */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Asset Class Exposure
                  </p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {Object.keys(typeBreakdown).length} Classes
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Risk Category: <strong className="text-gray-800 uppercase">{user.riskProfile || "Moderate"}</strong>
                  </p>
                </div>
              </div>

              {/* Asset Allocation Strip */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartPie} className="text-[#E8740C]" />
                    Portfolio Asset Allocation
                  </h4>
                  <span className="text-xs text-gray-500">
                    Click any asset class to filter holdings
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedType("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedType === "all"
                        ? "bg-[#16171e] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Assets ({investments.length})
                  </button>

                  {Object.entries(typeBreakdown).map(([t, data]) => {
                    const meta = TYPE_COLORS[t] || { label: t, color: "#475569", bg: "#F1F5F9" };
                    const share = currentValue > 0 ? (data.value / currentValue) * 100 : 0;
                    const isSelected = selectedType === t;

                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedType(isSelected ? "all" : t)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? "border-current shadow-sm scale-105"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{
                          backgroundColor: isSelected ? meta.bg : "#ffffff",
                          color: meta.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span>{meta.label}</span>
                        <span className="px-1.5 py-0.2 rounded bg-black/5 text-[10px]">
                          {data.count} ({fmtNumber(share, 1)}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Holdings Table with Live Search */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                  <div className="relative w-full sm:w-80">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Search holdings by name, symbol, or AMC..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C]"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>
                      Showing <strong>{filteredInvestments.length}</strong> of{" "}
                      <strong>{investments.length}</strong> items
                    </span>
                    <button
                      onClick={handleExcelExport}
                      className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faFileExcel} />
                      Export Table
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4">Asset &amp; Scheme</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Units / Qty</th>
                        <th className="py-3 px-3">Buy Price / NAV</th>
                        <th className="py-3 px-3">Current Price</th>
                        <th className="py-3 px-3">Invested (₹)</th>
                        <th className="py-3 px-3">Current Value (₹)</th>
                        <th className="py-3 px-3">Gain / Return</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInvestments.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-400">
                            No holdings match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInvestments.map((inv) => {
                          const meta = TYPE_COLORS[inv.type] || {
                            label: inv.type,
                            color: "#475569",
                            bg: "#F1F5F9",
                          };
                          const cv = inv.currentValue ?? inv.investedAmount ?? 0;
                          const invested = inv.investedAmount || 0;
                          const gain = cv - invested;
                          const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

                          return (
                            <tr
                              key={inv._id}
                              className="hover:bg-amber-50/40 transition-colors"
                            >
                              {/* Name & Symbol */}
                              <td className="py-3 px-4 font-semibold text-gray-900 max-w-[220px]">
                                <div className="truncate font-bold" title={inv.name}>
                                  {inv.name}
                                </div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  {inv.symbol && (
                                    <span className="font-mono px-1 py-0.2 bg-gray-100 rounded text-gray-700">
                                      {inv.symbol}
                                    </span>
                                  )}
                                  {inv.exchange && (
                                    <span className="text-[10px] text-gray-400">
                                      {inv.exchange}
                                    </span>
                                  )}
                                  {inv.folioNumber && (
                                    <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                                      Folio: {inv.folioNumber}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Asset Type */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: meta.bg,
                                    color: meta.color,
                                  }}
                                >
                                  {meta.label}
                                </span>
                              </td>

                              {/* Units / Qty */}
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                                {inv.units
                                  ? fmtNumber(inv.units, 3)
                                  : inv.instalments
                                  ? `${inv.instalments} Inst.`
                                  : "—"}
                              </td>

                              {/* Buy Price */}
                              <td className="py-3 px-3 whitespace-nowrap text-gray-700">
                                {inv.buyPrice
                                  ? fmtIndianCurrency(inv.buyPrice)
                                  : inv.avgNav
                                  ? fmtIndianCurrency(inv.avgNav)
                                  : "—"}
                                <div className="text-[10px] text-gray-400">
                                  {formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt)}
                                </div>
                              </td>

                              {/* Current Price */}
                              <td className="py-3 px-3 whitespace-nowrap font-semibold text-gray-900">
                                {inv.currentPrice && inv.currentPrice > 0
                                  ? fmtIndianCurrency(inv.currentPrice)
                                  : "—"}
                              </td>

                              {/* Invested Amount */}
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">
                                {fmtIndianCurrency(invested)}
                              </td>

                              {/* Current Value */}
                              <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-900">
                                {fmtIndianCurrency(cv)}
                              </td>

                              {/* Gain & Return */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`font-bold ${
                                    gain >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"
                                  }`}
                                >
                                  {gain >= 0 ? "+" : ""}
                                  {fmtIndianCurrency(gain)}
                                </span>
                                <div
                                  className={`text-[10px] font-semibold ${
                                    gainPct >= 0 ? "text-green-700" : "text-red-700"
                                  }`}
                                >
                                  {gainPct >= 0 ? "+" : ""}
                                  {fmtNumber(gainPct)}%
                                </div>
                              </td>

                              {/* Details / Notes */}
                              <td className="py-3 px-4 text-right whitespace-nowrap text-[11px] text-gray-500">
                                {inv.institution && (
                                  <div className="font-medium text-gray-700 truncate max-w-[120px]">
                                    {inv.institution}
                                  </div>
                                )}
                                {inv.interestRate ? (
                                  <div className="text-amber-700 font-semibold">
                                    {inv.interestRate}% p.a.
                                  </div>
                                ) : null}
                                {inv.notes && (
                                  <div className="text-[10px] text-gray-400 italic truncate max-w-[120px]" title={inv.notes}>
                                    {inv.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Advisor Contact & Targeted Outreach Panel ───────────────── */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200/80 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Contact Channels */}
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-[#16171e] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faUserTie} className="text-[#E8740C]" />
                      Advisory Outreach — Engage Client on Services
                    </h4>
                    <p className="text-xs text-gray-600 mb-4">
                      Connect with <strong>{user.name}</strong> to present customized asset rebalancing, PMS/AIF onboarding, or insurance/fixed-income yields.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Direct Phone Call */}
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone.replace(/\s+/g, "")}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16171e] hover:bg-black text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <FontAwesomeIcon icon={faPhone} className="text-[#E8740C]" />
                          <span>Call Investor ({user.phone})</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed"
                        >
                          No Phone Registered
                        </button>
                      )}

                      {/* WhatsApp Advisory */}
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-sm" />
                          <span>WhatsApp Advisory</span>
                        </a>
                      ) : null}

                      {/* Send Email */}
                      <a
                        href={`mailto:${user.email}?subject=${encodeURIComponent(
                          "Portfolio Advisory Update — Phoenix Financial Services"
                        )}&body=${encodeURIComponent(
                          `Dear ${user.name},\n\nWe have reviewed your active investment portfolio at Phoenix Financial Services (Current Valuation: ${fmtIndianCurrency(currentValue)}). We would be delighted to schedule a portfolio review call at your convenience.\n\nWarm regards,\nPhoenix Financial Services Advisory Team`
                        )}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-sm transition-all"
                      >
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#E8740C]" />
                        <span>Send Official Email</span>
                      </a>
                    </div>
                  </div>

                  {/* Right: Automated Advisory Insights */}
                  <div className="w-full lg:w-96 bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
                    <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <FontAwesomeIcon icon={faLightbulb} className="text-[#E8740C]" />
                      Advisory Opportunities Detected
                    </h5>
                    <ul className="space-y-1.5">
                      {advisoryInsights.map((insight, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-gray-700 leading-snug flex items-start gap-1.5"
                        >
                          <span className="text-[#E8740C] font-bold">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Hidden Master Portfolio Report component for direct PDF capture */}
              <div className="hidden">
                <MasterPortfolioReport
                  user={user}
                  summary={summary}
                  investments={investments}
                  reportDate={new Date()}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 text-xs text-gray-500">
          <div>
            Investor: <strong className="text-gray-900">{user.name}</strong> • Phone:{" "}
            <strong>{user.phone || "N/A"}</strong> • Total Assets:{" "}
            <strong className="text-[#2E7D32]">{fmtIndianCurrency(currentValue)}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-colors"
          >
            Close Sneak Peek
          </button>
        </div>
      </div>
    </div>
  );
}
