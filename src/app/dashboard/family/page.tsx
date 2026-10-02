"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  familyApi,
  getStoredUser,
  type User,
  type FamilyMember,
  type CumulativeInvestment,
  type CumulativePortfolioSummary,
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
  faUsers,
  faUserPlus,
  faFileExcel,
  faFilePdf,
  faTrash,
  faTimes,
  faSearch,
  faShieldHalved,
  faArrowTrendUp,
  faArrowTrendDown,
  faChartPie,
  faEye,
  faEyeSlash,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faArrowLeft,
  faBuildingColumns,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

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

const RELATIONSHIPS = [
  "Spouse",
  "Brother",
  "Sister",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Other Family Member",
];

export default function FamilyPortfolioPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [investments, setInvestments] = useState<CumulativeInvestment[]>([]);
  const [summary, setSummary] = useState<CumulativePortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals & Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkRelationship, setLinkRelationship] = useState("Brother");
  const [showPassword, setShowPassword] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Export State
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function showToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadCumulativeData() {
    setLoading(true);
    try {
      const stored = getStoredUser();
      setCurrentUser(stored);

      const res = await familyApi.getCumulative();
      if (res.success && res.data) {
        setInvestments(res.data.investments || []);
        setSummary(res.data.summary || null);
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error("Failed to load cumulative family portfolio:", err);
      showToast("Failed to fetch family portfolio data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCumulativeData();
  }, []);

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchMember = selectedMember === "all" || inv.ownerId === selectedMember;
      const matchType = selectedType === "all" || inv.type === selectedType;
      const matchSearch =
        !search.trim() ||
        inv.name.toLowerCase().includes(search.toLowerCase()) ||
        (inv.symbol && inv.symbol.toLowerCase().includes(search.toLowerCase())) ||
        (inv.institution && inv.institution.toLowerCase().includes(search.toLowerCase())) ||
        (inv.ownerName && inv.ownerName.toLowerCase().includes(search.toLowerCase()));
      return matchMember && matchType && matchSearch;
    });
  }, [investments, selectedMember, selectedType, search]);

  // Asset type breakdown
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

  // Metrics
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

  // Link family member handler
  async function handleLinkMember(e: React.FormEvent) {
    e.preventDefault();
    setLinkError("");
    setLinkLoading(true);

    try {
      const res = await familyApi.linkMember({
        email: linkEmail.trim(),
        password: linkPassword,
        relationship: linkRelationship,
      });

      if (res.success) {
        showToast(res.message || "Family member linked successfully!", "success");
        setIsAddModalOpen(false);
        setLinkEmail("");
        setLinkPassword("");
        setLinkRelationship("Brother");
        loadCumulativeData();
      } else {
        setLinkError(res.message || "Failed to link family member.");
      }
    } catch (err: any) {
      setLinkError(err?.message || "Server error while validating credentials.");
    } finally {
      setLinkLoading(false);
    }
  }

  // Unlink family member handler
  async function handleUnlink(member: FamilyMember) {
    if (
      !confirm(
        `Are you sure you want to unlink ${member.name}'s account (${member.relationship}) from your family portfolio? You will no longer see their cumulative data.`
      )
    ) {
      return;
    }

    setUnlinkingId(member.userId);
    try {
      const res = await familyApi.unlinkMember(member.userId);
      if (res.success) {
        showToast(`Unlinked ${member.name}'s account`, "success");
        loadCumulativeData();
      } else {
        showToast(res.message || "Failed to unlink account", "error");
      }
    } catch {
      showToast("Error unlinking family account", "error");
    } finally {
      setUnlinkingId(null);
    }
  }

  // Export Cumulative Excel
  function handleExcelExport() {
    if (exportingExcel || !currentUser) return;
    setExportingExcel(true);
    try {
      exportPortfolioToExcel(
        { ...currentUser, name: `${currentUser.name} & Family` },
        investments,
        summary,
        { isFamily: true, members }
      );
      showToast("Cumulative Excel report downloaded!", "success");
    } catch (err) {
      console.error("Excel download error:", err);
      showToast("Failed to generate Excel report", "error");
    } finally {
      setExportingExcel(false);
    }
  }

  // Export Cumulative PDF
  async function handlePdfExport() {
    if (exportingPdf || !currentUser) return;
    setExportingPdf(true);
    try {
      await exportReportToPdf(
        `${currentUser.name}_Family`,
        ["report-page-1", "report-page-2"],
        "Phoenix_Family_Cumulative_Statement"
      );
      showToast("Cumulative PDF statement generated!", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-xl transition-all flex items-center gap-2.5 ${
            toastMessage.type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"
          }`}
        >
          <FontAwesomeIcon
            icon={toastMessage.type === "success" ? faCheckCircle : faExclamationTriangle}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-xs flex items-center justify-between gap-6">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-base flex-shrink-0">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-[#16171e] tracking-tight leading-tight whitespace-nowrap">
              Family Wealth &amp; Cumulative Portfolio
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              Consolidated household investments across linked accounts
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-gray-200 flex-shrink-0 hidden md:block" />

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8740C] hover:bg-[#d06405] text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Link Account</span>
          </button>

          <button
            onClick={handleExcelExport}
            disabled={exportingExcel || loading}
            title="Download cumulative family portfolio as Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {exportingExcel ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faFileExcel} />
            )}
            <span>Excel</span>
          </button>

          <button
            onClick={handlePdfExport}
            disabled={exportingPdf || loading}
            title="Download official combined Family Master Statement as PDF"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {exportingPdf ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faFilePdf} />
            )}
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* ── Linked Family Members Cards Strip ───────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-[#16171e] uppercase tracking-wider flex items-center gap-2">
            <span>Household Accounts</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
              {members.length} {members.length === 1 ? "Account" : "Accounts"}
            </span>
          </h2>
          <span className="text-xs text-gray-500">
            Click any member below to isolate their holdings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => {
            const isSelected = selectedMember === member.userId;
            const stats = member.stats || {
              totalInvested: 0,
              currentValue: 0,
              totalGain: 0,
              totalGainPercent: 0,
              holdingsCount: 0,
            };
            const share = currentValue > 0 ? (stats.currentValue / currentValue) * 100 : 0;

            return (
              <div
                key={member.userId}
                onClick={() => setSelectedMember(isSelected ? "all" : member.userId)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer relative group ${
                  isSelected
                    ? "border-[#E8740C] ring-2 ring-[#E8740C]/20 shadow-md scale-102"
                    : "border-gray-200 hover:border-gray-300 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#16171e] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-[#16171e] text-sm leading-tight group-hover:text-[#E8740C] transition-colors">
                        {member.name}
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF3EB] text-[#E8740C]">
                        {member.relationship}
                      </span>
                    </div>
                  </div>

                  {!member.isSelf && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlink(member);
                      }}
                      disabled={unlinkingId === member.userId}
                      title="Unlink this family account"
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Current Value
                    </p>
                    <p className="font-extrabold text-[#16171e] text-base">
                      {fmtIndianCurrency(stats.currentValue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Holdings
                    </p>
                    <p className="font-bold text-gray-700 text-xs mt-0.5">
                      {stats.holdingsCount} assets ({fmtNumber(share, 1)}%)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Member Card Shortcut */}
          <div
            onClick={() => setIsAddModalOpen(true)}
            className="border-2 border-dashed border-gray-300 hover:border-[#E8740C] bg-gray-50/50 hover:bg-[#FFF3EB]/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-full bg-white group-hover:bg-[#E8740C] text-gray-400 group-hover:text-white flex items-center justify-center mb-2 shadow-xs transition-colors">
              <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
            </div>
            <p className="text-xs font-bold text-gray-700 group-hover:text-[#E8740C] transition-colors">
              Link Another Member
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Brother, Spouse, Parent</p>
          </div>
        </div>
      </div>

      {/* ── Cumulative Portfolio KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Combined Family Valuation
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {fmtIndianCurrency(currentValue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Unified net worth of {members.length} accounts
          </p>
        </div>

        {/* Invested Capital */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Capital Invested
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {fmtIndianCurrency(totalInvested)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Total principal deployed by household
          </p>
        </div>

        {/* Total Gain / Loss */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Combined Profit / Loss
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
            <span className="text-[11px] text-gray-500">Unrealized household return</span>
          </div>
        </div>

        {/* Total Holdings Count */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Active Family Holdings
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {investments.length} Assets
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Across {Object.keys(typeBreakdown).length} distinct asset classes
          </p>
        </div>
      </div>

      {/* ── Asset Allocation Exposure Strip ─────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <FontAwesomeIcon icon={faChartPie} className="text-[#E8740C]" />
            Cumulative Household Asset Allocation
          </h3>
          <span className="text-xs text-gray-500">
            Click any asset class to filter family holdings
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedType === "all"
                ? "bg-[#16171e] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Products ({investments.length})
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
                    ? "border-current shadow-xs scale-102"
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

      {/* ── Cumulative Holdings Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              />
              <input
                type="text"
                placeholder="Search by asset, stock, fund, or family member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C]"
              />
            </div>

            {/* Quick Member Filter Dropdown */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-[#E8740C]"
            >
              <option value="all">All Family Members ({members.length})</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.relationship})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              Showing <strong>{filteredInvestments.length}</strong> of{" "}
              <strong>{investments.length}</strong> cumulative holdings
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Family Member</th>
                <th className="py-3.5 px-4">Asset &amp; Scheme</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Units / Qty</th>
                <th className="py-3.5 px-3">Buy Price / NAV</th>
                <th className="py-3.5 px-3">Current Market Price</th>
                <th className="py-3.5 px-3">Invested (₹)</th>
                <th className="py-3.5 px-3">Current Value (₹)</th>
                <th className="py-3.5 px-4">Gain / Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Loading family portfolio data...
                    </p>
                  </td>
                </tr>
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    No family holdings matching criteria found.
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
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      {/* Family Member Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#16171e] text-white flex items-center justify-center font-bold text-[10px]">
                            {inv.ownerName ? inv.ownerName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">
                              {inv.ownerName || "Family Member"}
                            </p>
                            <span className="text-[10px] font-semibold text-[#E8740C]">
                              {inv.relationship || "Member"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name & Symbol */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 max-w-[240px]">
                        <div className="truncate font-bold" title={inv.name}>
                          {inv.name}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          {inv.symbol && (
                            <span className="font-mono px-1 py-0.2 bg-gray-100 rounded text-gray-700">
                              {inv.symbol}
                            </span>
                          )}
                          {inv.institution && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {inv.institution}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Asset Type */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
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

                      {/* Units */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-gray-800">
                        {inv.units
                          ? fmtNumber(inv.units, 3)
                          : inv.instalments
                          ? `${inv.instalments} Inst.`
                          : "—"}
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-gray-700">
                        {inv.buyPrice
                          ? fmtIndianCurrency(inv.buyPrice)
                          : inv.avgNav
                          ? fmtIndianCurrency(inv.avgNav)
                          : "—"}
                        <div className="text-[10px] text-gray-400">
                          {formatDateIndian(inv.buyDate || inv.sipStartDate || inv.createdAt)}
                        </div>
                      </td>

                      {/* Current Market Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-gray-900">
                        {inv.currentPrice && inv.currentPrice > 0
                          ? fmtIndianCurrency(inv.currentPrice)
                          : "—"}
                      </td>

                      {/* Invested Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-gray-800">
                        {fmtIndianCurrency(invested)}
                      </td>

                      {/* Current Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-gray-900">
                        {fmtIndianCurrency(cv)}
                      </td>

                      {/* Gain & Return */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Link Family Member Modal ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#16171e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8740C] flex items-center justify-center text-white text-base">
                  <FontAwesomeIcon icon={faUserPlus} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Link Family Account</h3>
                  <p className="text-xs text-gray-400">
                    Verify account credentials to link portfolio
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setLinkError("");
                }}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-all"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleLinkMember} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <FontAwesomeIcon icon={faLock} className="text-[#E8740C] mt-0.5 text-xs flex-shrink-0" />
                <span>
                  Enter your family member's registered email and password to verify ownership and enable cumulative portfolio aggregation.
                </span>
              </div>

              {linkError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {linkError}
                </div>
              )}

              {/* Relationship */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Relationship to You
                </label>
                <select
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#E8740C] focus:bg-white"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Family Member's Registered Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. brother@example.com"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#E8740C] focus:bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter family member's password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#E8740C] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] hover:bg-[#d06405] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
                >
                  {linkLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                  ) : (
                    <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                  )}
                  <span>Verify &amp; Link Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Master Portfolio Report component for direct PDF capture */}
      <div className="hidden">
        <MasterPortfolioReport
          user={
            currentUser
              ? {
                  ...currentUser,
                  name: `${currentUser.name} & Family`,
                }
              : null
          }
          summary={summary}
          investments={investments}
          reportDate={new Date()}
        />
      </div>
    </div>
  );
}
