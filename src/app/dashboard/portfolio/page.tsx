"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { portfolioApi, pricesApi, type Investment } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faMagnifyingGlass, faPencil, faTrash, faXmark, faCheck,
  faArrowUp, faArrowDown, faArrowsRotate, faChartLine, faChartPie, faCoins,
  faLandmark, faLeaf, faHandHoldingDollar, faSackDollar,
  faFileContract, faRing, faBitcoinSign, faClock, faTriangleExclamation,
  faCircleCheck, faCircleXmark, faFilePdf, faBuildingColumns,
} from "@fortawesome/free-solid-svg-icons";

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  stock:       { label: "Stock",         color: "#1565C0", bg: "#EBF3FD" },
  mutual_fund: { label: "Mutual Fund",   color: "#2E7D32", bg: "#EAF5EB" },
  sip:         { label: "SIP",           color: "#E8740C", bg: "#FFF3EB" },
  aif:         { label: "AIF",           color: "#4E342E", bg: "#EFEBE9" },
  fd:          { label: "Fixed Deposit", color: "#6A1B9A", bg: "#F4E8FB" },
  ppf:         { label: "PPF",           color: "#E65100", bg: "#FBE9E7" },
  epf:         { label: "EPF",           color: "#00838F", bg: "#E0F7FA" },
  nps:         { label: "NPS",           color: "#F57F17", bg: "#FFF9E6" },
  bond:        { label: "Bond",          color: "#880E4F", bg: "#FCE4EC" },
  gold:        { label: "Gold",          color: "#B8860B", bg: "#FDF8E1" },
  crypto:      { label: "Crypto",        color: "#4527A0", bg: "#EDE7F6" },
};

const TYPE_ICONS: Record<string, ReturnType<typeof Object.values>[0]> = {
  stock: faChartLine, mutual_fund: faChartPie, sip: faCoins,
  aif: faBuildingColumns,
  fd: faLandmark, ppf: faLeaf, epf: faHandHoldingDollar,
  nps: faSackDollar, bond: faFileContract, gold: faRing, crypto: faBitcoinSign,
};

const FILTER_TABS = [
  { value: "all",         label: "All" },
  { value: "stock",       label: "Stocks" },
  { value: "mutual_fund", label: "Mutual Funds" },
  { value: "sip",         label: "SIP" },
  { value: "aif",         label: "AIF" },
  { value: "fd",          label: "FD" },
  { value: "ppf_epf",     label: "PPF / EPF" },
  { value: "gold",        label: "Gold" },
  { value: "nps",         label: "NPS" },
  { value: "bond",        label: "Bonds" },
  { value: "crypto",      label: "Crypto" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (Math.abs(n) >= 1000)     return `₹${(Math.abs(n) / 1000).toFixed(1)} K`;
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(d?: string) {
  if (!d) return null;
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Gain Badge ──────────────────────────────────────────────────────────────

function GainBadge({ gain, pct }: { gain: number; pct: number }) {
  if (!gain && gain !== 0) return <span className="text-[#ccc] text-xs font-mono">—</span>;
  if (gain === 0) return <span className="text-[#aaa] text-xs font-mono">±0.00%</span>;
  const isPos = gain > 0;
  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <span className={`text-[13px] font-bold tabular-nums leading-none ${isPos ? "text-[#1b5e20]" : "text-[#b71c1c]"}`}>
        {isPos ? "+" : "−"}{fmt(Math.abs(gain))}
      </span>
      <span className={`text-[11px] font-semibold flex items-center gap-0.5 tabular-nums ${isPos ? "text-[#2e7d32]" : "text-[#c62828]"}`}>
        <FontAwesomeIcon icon={isPos ? faArrowUp : faArrowDown} className="text-[8px]" />
        {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDismiss }: { msg: string; ok: boolean; onDismiss: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg max-w-sm cursor-pointer
        ${ok ? "bg-[#1b5e20]" : "bg-[#b71c1c]"}`}
      onClick={onDismiss}
    >
      <FontAwesomeIcon icon={ok ? faCircleCheck : faCircleXmark} className="flex-shrink-0" />
      {msg}
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ inv, onClose, onSaved }: { inv: Investment; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ ...inv });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ic = "border border-[#E2E5EB] rounded-lg px-3 py-2.5 w-full text-sm text-[#1a1b23] focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 outline-none bg-white transition-all";

  async function save() {
    setSaving(true);
    const res = await portfolioApi.update(inv._id, form);
    if (res.success) { onSaved(); onClose(); }
    else { setError(res.message || "Failed to save."); setSaving(false); }
  }

  function upd(k: string, v: string | number) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-[#EAECEF]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <h3 className="font-bold text-[#1a1b23] text-base">Edit Investment</h3>
            <p className="text-xs text-[#8a92a6] mt-0.5">{inv.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a92a6] hover:bg-[#F0F2F5] hover:text-[#333] transition-all">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#c62828] text-sm">
              <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 text-xs" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Name</label>
            <input value={form.name} onChange={e => upd("name", e.target.value)} className={ic} />
          </div>
          {(["stock","mutual_fund","gold","crypto"] as const).includes(form.type as never) && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Units</label>
                <input type="number" value={form.units ?? ""} onChange={e => upd("units", +e.target.value)} className={ic} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Buy Price (₹)</label>
                <input type="number" value={form.buyPrice ?? ""} onChange={e => upd("buyPrice", +e.target.value)} className={ic} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Buy Date</label>
              <input type="date" value={form.buyDate?.slice(0,10) ?? ""} onChange={e => upd("buyDate", e.target.value)} className={ic} />
            </div>
          </>)}
          {form.type === "sip" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Monthly SIP (₹)</label>
                <input type="number" value={form.sipAmount ?? ""} onChange={e => upd("sipAmount", +e.target.value)} className={ic} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Instalments</label>
                <input type="number" value={form.instalments ?? ""} onChange={e => upd("instalments", +e.target.value)} className={ic} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Avg NAV (₹)</label>
              <input type="number" step="any" value={form.avgNav ?? ""} onChange={e => upd("avgNav", +e.target.value)} className={ic} />
            </div>
          </>)}
          {form.type === "aif" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Invested Capital (₹)</label>
                <input type="number" value={form.investedAmount ?? ""} onChange={e => upd("investedAmount", +e.target.value)} className={ic} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Latest Valuation (₹)</label>
                <input type="number" value={form.currentPrice ?? ""} onChange={e => upd("currentPrice", +e.target.value)} className={ic} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Fund House / AMC</label>
                <input value={form.institution ?? ""} onChange={e => upd("institution", e.target.value)} className={ic} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Folio / Account ID</label>
                <input value={form.folioNumber ?? ""} onChange={e => upd("folioNumber", e.target.value)} className={ic} />
              </div>
            </div>
          </>)}
          {(["fd","ppf","epf","nps","bond"] as const).includes(form.type as never) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Principal (₹)</label>
                <input type="number" value={form.principal ?? ""} onChange={e => upd("principal", +e.target.value)} className={ic} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Interest Rate (%)</label>
                <input type="number" step="0.01" value={form.interestRate ?? ""} onChange={e => upd("interestRate", +e.target.value)} className={ic} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Notes</label>
            <textarea value={form.notes ?? ""} onChange={e => upd("notes", e.target.value)} rows={2} className={ic + " resize-none"} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F0F2F5] flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#E2E5EB] bg-white rounded-lg py-2.5 text-sm font-semibold text-[#444] hover:bg-[#F5F6F8] transition-all">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#E8740C] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#d4660b] disabled:opacity-50 transition-all">
            {saving ? "Saving..." : <><FontAwesomeIcon icon={faCheck} className="mr-1.5 text-xs" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────

function DeleteDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#EAECEF]">
        <div className="w-12 h-12 rounded-2xl bg-[#fff0f0] flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faTrash} className="text-[#c62828] text-base" />
        </div>
        <h3 className="font-bold text-[#1a1b23] text-base mb-1.5">Remove Investment</h3>
        <p className="text-[#8a92a6] text-sm mb-6 leading-relaxed">
          This investment will be permanently deleted from your portfolio. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-[#E2E5EB] bg-white rounded-lg py-2.5 text-sm font-semibold text-[#444] hover:bg-[#F5F6F8] transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-[#c62828] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#b71c1c] transition-all">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Page ──────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editInv, setEditInv] = useState<Investment | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await portfolioApi.getAll({
      type: activeType !== "all" ? activeType : undefined,
      sort: sortField, order: sortOrder,
      search: search || undefined,
    });
    if (res.success) setInvestments(res.data ?? []);
    else setError("Failed to load investments.");
    setLoading(false);
  }, [activeType, sortField, sortOrder, search]);

  useEffect(() => { load(); }, [load]);

  async function handleRefreshPrices() {
    setRefreshing(true);
    showToast("Fetching live prices — this may take a moment.", true);
    const res = await pricesApi.refresh();
    if (res.success && res.data) {
      showToast(
        `Updated ${res.data.updated} investment${res.data.updated !== 1 ? "s" : ""}.${res.data.failed > 0 ? ` ${res.data.failed} failed.` : ""}`,
        res.data.updated > 0
      );
      setLastRefreshed(new Date().toISOString());
      load();
    } else {
      showToast(res.message || "Price refresh failed.", false);
    }
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    const res = await portfolioApi.remove(id);
    if (res.success) { showToast("Investment removed."); load(); }
    else showToast("Failed to remove investment.", false);
    setDeleteId(null);
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("desc"); }
  }

  const SortIcon = ({ field }: { field: string }) => sortField === field
    ? <FontAwesomeIcon icon={sortOrder === "asc" ? faArrowUp : faArrowDown} className="ml-1.5 text-[#E8740C]" style={{ fontSize: 9 }} />
    : null;

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent  = investments.reduce((s, i) => s + (i.currentValue ?? i.investedAmount), 0);
  const totalGain     = totalCurrent - totalInvested;

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={() => setToast(null)} />}
      {editInv && <EditModal inv={editInv} onClose={() => setEditInv(null)} onSaved={() => { showToast("Changes saved."); load(); }} />}
      {deleteId && <DeleteDialog onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}

      {/* Page header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1b23]">My Portfolio</h1>
          <p className="text-[#8a92a6] text-sm mt-0.5 flex items-center gap-2">
            <span>{investments.length} investment{investments.length !== 1 ? "s" : ""}</span>
            {lastRefreshed && (
              <span className="inline-flex items-center gap-1 text-[#E8740C] text-xs">
                <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                Updated {timeAgo(lastRefreshed)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/report"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E5EB] text-[#444] font-semibold rounded-lg hover:bg-[#F5F6F8] transition-all no-underline text-sm shadow-sm"
          >
            <FontAwesomeIcon icon={faFilePdf} className="text-[#E8740C] text-xs" />
            Download PDF
          </Link>
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E5EB] text-[#444] font-semibold rounded-lg hover:bg-[#F5F6F8] transition-all text-sm disabled:opacity-50 shadow-sm"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={refreshing ? "animate-spin text-[#E8740C]" : "text-[#8a92a6]"} style={{ fontSize: 13 }} />
            {refreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
          <Link href="/dashboard/add" className="flex items-center gap-2 px-4 py-2.5 bg-[#E8740C] text-white font-semibold rounded-lg hover:bg-[#d4660b] transition-all no-underline text-sm shadow-sm">
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Investment
          </Link>
        </div>
      </div>

      {/* Totals bar */}
      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Invested",       value: `₹${totalInvested.toLocaleString("en-IN")}`, gain: undefined },
            { label: "Current Value",  value: `₹${totalCurrent.toLocaleString("en-IN")}`,  gain: undefined },
            {
              label: "Total Gain / Loss",
              value: totalGain === 0 ? "—" : `${totalGain > 0 ? "+" : "−"}${fmt(Math.abs(totalGain))}`,
              gain: totalGain,
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-[#EAECEF] shadow-sm px-4 py-3">
              <p className="text-[10px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`font-extrabold text-[17px] leading-tight tabular-nums ${
                card.gain === undefined ? "text-[#1a1b23]" :
                card.gain > 0  ? "text-[#1b5e20]" :
                card.gain < 0  ? "text-[#b71c1c]" :
                "text-[#1a1b23]"
              }`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => setActiveType(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeType === tab.value
                ? "bg-[#E8740C] border-[#E8740C] text-white shadow-sm"
                : "bg-white border-[#E2E5EB] text-[#555] hover:border-[#E8740C] hover:text-[#E8740C]"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-[340px]">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C0C4CC] text-xs" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search investments..."
          className="w-full pl-9 pr-4 py-2.5 border border-[#E2E5EB] rounded-lg text-sm focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 outline-none bg-white placeholder:text-[#C0C4CC] transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#c62828] text-sm mb-4">
          <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 text-xs" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-[3px] border-[#E8740C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm p-14 text-center">
          <p className="text-[#aaa] text-base mb-5 font-medium">No investments found</p>
          <Link href="/dashboard/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-semibold rounded-lg no-underline text-sm hover:bg-[#d4660b] transition-colors shadow-sm">
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Investment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EAECEF] shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#F0F2F5] bg-[#FAFBFC]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest w-[260px]">
                    Investment
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest">
                    Type
                  </th>
                  <th
                    className="text-right px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest cursor-pointer hover:text-[#E8740C] select-none"
                    onClick={() => toggleSort("investedAmount")}
                  >
                    Invested <SortIcon field="investedAmount" />
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest hidden lg:table-cell">
                    Current Value
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest hidden xl:table-cell">
                    Gain / Loss
                  </th>
                  <th
                    className="text-right px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest hidden lg:table-cell cursor-pointer hover:text-[#E8740C] select-none"
                    onClick={() => toggleSort("lastPriceUpdate")}
                  >
                    Updated <SortIcon field="lastPriceUpdate" />
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest w-[80px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const meta = TYPE_META[inv.type];
                  const cv = inv.currentValue ?? inv.investedAmount;
                  const gain = inv.gain ?? 0;
                  const gainPct = inv.gainPercent ?? 0;
                  return (
                    <tr key={inv._id} className="border-b border-[#F5F7FA] hover:bg-[#FAFBFC] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta?.bg ?? "#f5f5f5" }}>
                            <FontAwesomeIcon icon={TYPE_ICONS[inv.type] ?? faSackDollar} style={{ color: meta?.color ?? "#999" }} className="text-xs" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1a1b23] text-[13px] truncate max-w-[180px]">{inv.name}</p>
                            {inv.symbol ? (
                              <p className="text-[#8a92a6] text-xs">{inv.symbol}{inv.exchange ? ` · ${inv.exchange}` : ""}</p>
                            ) : inv.institution ? (
                              <p className="text-[#8a92a6] text-xs">{inv.institution}{inv.folioNumber ? ` · Folio: ${inv.folioNumber}` : ""}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: meta?.bg ?? "#f5f5f5", color: meta?.color ?? "#555" }}>
                          {meta?.label ?? inv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-[#1a1b23] tabular-nums text-[13px]">
                        ₹{inv.investedAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <p className="font-bold text-[#1a1b23] tabular-nums text-[13px]">₹{cv.toLocaleString("en-IN")}</p>
                        {inv.lastPriceUpdate && (
                          <span className="text-[10px] font-bold text-[#E8740C] tracking-wide">LIVE</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                        <GainBadge gain={gain} pct={gainPct} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#aaa] text-xs hidden lg:table-cell tabular-nums">
                        {timeAgo(inv.lastPriceUpdate) ?? formatDate(inv.buyDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditInv(inv)}
                            className="w-7 h-7 rounded-lg border border-[#E2E5EB] flex items-center justify-center text-[#8a92a6] hover:bg-[#FFF3EB] hover:text-[#E8740C] hover:border-[#E8740C]/30 transition-all"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faPencil} style={{ fontSize: 10 }} />
                          </button>
                          <button
                            onClick={() => setDeleteId(inv._id)}
                            className="w-7 h-7 rounded-lg border border-[#FFCDD2] bg-[#fff8f8] flex items-center justify-center text-[#c62828] hover:bg-[#FFEBEE] transition-all"
                            title="Remove"
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#F5F7FA]">
            {investments.map(inv => {
              const meta = TYPE_META[inv.type];
              const cv = inv.currentValue ?? inv.investedAmount;
              const gain = inv.gain ?? 0;
              return (
                <div key={inv._id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta?.bg ?? "#f5f5f5" }}>
                    <FontAwesomeIcon icon={TYPE_ICONS[inv.type] ?? faSackDollar} style={{ color: meta?.color ?? "#999" }} className="text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1b23] text-sm truncate">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: meta?.bg, color: meta?.color }}>
                        {meta?.label}
                      </span>
                      {gain !== 0 && (
                        <span className={`text-[11px] font-bold ${gain > 0 ? "text-[#1b5e20]" : "text-[#b71c1c]"}`}>
                          {gain > 0 ? "+" : "−"}{fmt(Math.abs(gain))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-[#1a1b23] text-sm tabular-nums">₹{cv.toLocaleString("en-IN")}</p>
                    <p className="text-[#aaa] text-xs tabular-nums">inv: ₹{inv.investedAmount.toLocaleString("en-IN")}</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => setEditInv(inv)} className="text-[#8a92a6] hover:text-[#E8740C] transition-colors p-0.5">
                        <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                      </button>
                      <button onClick={() => setDeleteId(inv._id)} className="text-[#c62828] p-0.5">
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
