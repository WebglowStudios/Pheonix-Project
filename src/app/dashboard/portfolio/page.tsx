"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { portfolioApi, pricesApi, type Investment } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faSearch, faPencil, faTrash, faXmark, faCheck,
  faArrowUp, faArrowDown, faRotate, faChartLine, faChartPie, faCoins,
  faLandmark, faLeaf, faHandHoldingDollar, faSackDollar,
  faFileContract, faRing, faBitcoinSign, faClock,
} from "@fortawesome/free-solid-svg-icons";

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  stock:       { label: "Stock",         color: "#1565C0", bg: "#E3F2FD" },
  mutual_fund: { label: "Mutual Fund",   color: "#2E7D32", bg: "#E8F5E9" },
  sip:         { label: "SIP",           color: "#E8740C", bg: "#FFF3EB" },
  fd:          { label: "Fixed Deposit", color: "#6A1B9A", bg: "#F3E5F5" },
  ppf:         { label: "PPF",           color: "#E65100", bg: "#FBE9E7" },
  epf:         { label: "EPF",           color: "#00838F", bg: "#E0F7FA" },
  nps:         { label: "NPS",           color: "#F57F17", bg: "#FFFDE7" },
  bond:        { label: "Bond",          color: "#880E4F", bg: "#FCE4EC" },
  gold:        { label: "Gold",          color: "#F9A825", bg: "#FFFDE7" },
  crypto:      { label: "Crypto",        color: "#4527A0", bg: "#EDE7F6" },
};

const TYPE_ICONS: Record<string, ReturnType<typeof Object.values>[0]> = {
  stock: faChartLine, mutual_fund: faChartPie, sip: faCoins,
  fd: faLandmark, ppf: faLeaf, epf: faHandHoldingDollar,
  nps: faSackDollar, bond: faFileContract, gold: faRing, crypto: faBitcoinSign,
};

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "stock", label: "Stocks" },
  { value: "mutual_fund", label: "Mutual Funds" },
  { value: "sip", label: "SIP" },
  { value: "fd", label: "FD" },
  { value: "ppf_epf", label: "PPF/EPF" },
  { value: "gold", label: "Gold" },
  { value: "nps", label: "NPS" },
  { value: "bond", label: "Bonds" },
  { value: "crypto", label: "Crypto" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000)     return `₹${(Math.abs(n) / 1000).toFixed(1)}K`;
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

// ─── Gain/Loss Badge ─────────────────────────────────────────────────────────

function GainBadge({ gain, pct }: { gain: number; pct: number }) {
  if (!gain && gain !== 0) return <span className="text-[#999] text-xs">—</span>;
  const isPos = gain >= 0;
  const isZero = gain === 0;
  if (isZero) return <span className="text-[#aaa] text-xs">±0</span>;
  return (
    <div className={`inline-flex flex-col items-end`}>
      <span className={`text-sm font-bold ${isPos ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
        {isPos ? "+" : "−"}{fmt(Math.abs(gain))}
      </span>
      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPos ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
        <FontAwesomeIcon icon={isPos ? faArrowUp : faArrowDown} className="text-[8px]" />
        {Math.abs(pct).toFixed(2)}%
      </span>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ inv, onClose, onSaved }: { inv: Investment; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ ...inv });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ic = "border border-[#DDD] rounded-[8px] px-3 py-2 w-full text-sm text-[#333] focus:border-[#E8740C] outline-none bg-white";

  async function save() {
    setSaving(true);
    const res = await portfolioApi.update(inv._id, form);
    if (res.success) { onSaved(); onClose(); }
    else { setError(res.message || "Failed to save."); setSaving(false); }
  }

  function upd(k: string, v: string | number) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEE]">
          <h3 className="font-bold text-[#333] text-lg">Edit — {inv.name}</h3>
          <button onClick={onClose} className="text-[#999] hover:text-[#333]"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-[#C62828] text-sm bg-[#FFEBEE] px-3 py-2 rounded-[8px]">{error}</p>}
          <div><label className="label text-xs font-bold text-[#555]">Name</label><input value={form.name} onChange={e => upd("name", e.target.value)} className={ic} /></div>
          {(["stock","mutual_fund","gold","crypto"] as const).includes(form.type as never) && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-[#555]">Units</label><input type="number" value={form.units ?? ""} onChange={e => upd("units", +e.target.value)} className={ic} /></div>
              <div><label className="text-xs font-bold text-[#555]">Buy Price (₹)</label><input type="number" value={form.buyPrice ?? ""} onChange={e => upd("buyPrice", +e.target.value)} className={ic} /></div>
            </div>
            <div><label className="text-xs font-bold text-[#555]">Buy Date</label><input type="date" value={form.buyDate?.slice(0,10) ?? ""} onChange={e => upd("buyDate", e.target.value)} className={ic} /></div>
          </>)}
          {form.type === "sip" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-[#555]">Monthly SIP (₹)</label><input type="number" value={form.sipAmount ?? ""} onChange={e => upd("sipAmount", +e.target.value)} className={ic} /></div>
              <div><label className="text-xs font-bold text-[#555]">Instalments</label><input type="number" value={form.instalments ?? ""} onChange={e => upd("instalments", +e.target.value)} className={ic} /></div>
            </div>
            <div><label className="text-xs font-bold text-[#555]">Avg NAV (₹)</label><input type="number" step="any" value={form.avgNav ?? ""} onChange={e => upd("avgNav", +e.target.value)} className={ic} /></div>
          </>)}
          {(["fd","ppf","epf","nps","bond"] as const).includes(form.type as never) && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-[#555]">Principal (₹)</label><input type="number" value={form.principal ?? ""} onChange={e => upd("principal", +e.target.value)} className={ic} /></div>
              <div><label className="text-xs font-bold text-[#555]">Interest Rate (%)</label><input type="number" step="0.01" value={form.interestRate ?? ""} onChange={e => upd("interestRate", +e.target.value)} className={ic} /></div>
            </div>
          </>)}
          <div><label className="text-xs font-bold text-[#555]">Notes</label><textarea value={form.notes ?? ""} onChange={e => upd("notes", e.target.value)} rows={2} className={ic + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-[#EEE] flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#DDD] bg-white rounded-[8px] py-2.5 text-sm font-semibold text-[#444]">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#E8740C] text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60">
            {saving ? "Saving..." : <><FontAwesomeIcon icon={faCheck} className="mr-1.5" />Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio List Page ─────────────────────────────────────────────────────

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
    setTimeout(() => setToast(null), 3500);
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
    showToast("Fetching live prices... this may take a moment.", true);
    const res = await pricesApi.refresh();
    if (res.success && res.data) {
      showToast(`✓ Updated ${res.data.updated} investment${res.data.updated !== 1 ? "s" : ""}. ${res.data.failed > 0 ? `${res.data.failed} failed.` : ""}`, res.data.updated > 0);
      setLastRefreshed(new Date().toISOString());
      load();
    } else {
      showToast(res.message || "Price refresh failed.", false);
    }
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    const res = await portfolioApi.remove(id);
    if (res.success) { showToast("Investment deleted."); load(); }
    else showToast("Failed to delete.", false);
    setDeleteId(null);
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("desc"); }
  }

  const SortIcon = ({ field }: { field: string }) => sortField === field
    ? <FontAwesomeIcon icon={sortOrder === "asc" ? faArrowUp : faArrowDown} className="ml-1 text-[#E8740C] text-[10px]" />
    : null;

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = investments.reduce((s, i) => s + (i.currentValue ?? i.investedAmount), 0);
  const totalGain = totalCurrent - totalInvested;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-white text-sm font-bold shadow-lg transition-all max-w-[320px] ${toast.ok ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {editInv && <EditModal inv={editInv} onClose={() => setEditInv(null)} onSaved={() => { showToast("Saved!"); load(); }} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-[#333] text-lg mb-2">Delete Investment?</h3>
            <p className="text-[#666] text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#DDD] bg-white rounded-[8px] py-2.5 text-sm font-semibold text-[#444]">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-[#C62828] text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#E53935]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">My Portfolio</h1>
          <p className="text-[#666] text-sm mt-0.5">
            {investments.length} investment{investments.length !== 1 ? "s" : ""}
            {lastRefreshed && (
              <span className="ml-2 text-[#E8740C]">
                <FontAwesomeIcon icon={faClock} className="mr-1 text-[10px]" />
                Updated {timeAgo(lastRefreshed)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1b23] text-white font-bold rounded-[30px] border-2 border-[#1a1b23] hover:bg-[#2d2d3f] transition-all text-sm disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faRotate} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
          <Link href="/dashboard/add" className="flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-bold rounded-[30px] border-2 border-[#E8740C] hover:bg-[#FF9433] transition-all no-underline text-sm shadow-[0_4px_16px_rgba(232,116,12,0.2)]">
            <FontAwesomeIcon icon={faPlus} /> Add
          </Link>
        </div>
      </div>

      {/* Portfolio totals bar */}
      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Invested", value: `₹${totalInvested.toLocaleString("en-IN")}` },
            { label: "Current Value", value: `₹${totalCurrent.toLocaleString("en-IN")}` },
            {
              label: "Total Gain/Loss",
              value: totalGain === 0 ? "—" : `${totalGain > 0 ? "+" : "−"}${fmt(Math.abs(totalGain))}`,
              gain: totalGain,
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-[12px] border border-[#F0F0F0] shadow-sm px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-1">{card.label}</p>
              <p className={`font-extrabold text-lg leading-tight ${
                card.gain === undefined ? "text-[#1a1b23]" :
                card.gain > 0 ? "text-[#2E7D32]" : card.gain < 0 ? "text-[#C62828]" : "text-[#1a1b23]"
              }`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => setActiveType(tab.value)}
            className={`px-4 py-1.5 rounded-[20px] text-xs font-bold border-2 transition-all ${
              activeType === tab.value
                ? "bg-[#E8740C] border-[#E8740C] text-white"
                : "bg-white border-[#DDD] text-[#555] hover:border-[#E8740C] hover:text-[#E8740C]"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-[360px]">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aaa] text-sm" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search investments..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#DDD] rounded-[10px] text-sm focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.1)] outline-none bg-white"
        />
      </div>

      {error && <p className="text-[#C62828] text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] p-12 text-center">
          <p className="text-[#999] text-lg mb-4">No investments found</p>
          <Link href="/dashboard/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-bold rounded-[30px] no-underline text-sm">
            <FontAwesomeIcon icon={faPlus} /> Add Investment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9F9] border-b border-[#EEE]">
                  <th className="text-left px-5 py-3 text-[#666] font-bold text-xs uppercase">Investment</th>
                  <th className="text-left px-4 py-3 text-[#666] font-bold text-xs uppercase">Type</th>
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase cursor-pointer hover:text-[#E8740C]" onClick={() => toggleSort("investedAmount")}>
                    Invested <SortIcon field="investedAmount" />
                  </th>
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase hidden lg:table-cell">
                    Current Value
                  </th>
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase hidden xl:table-cell">
                    Gain / Loss
                  </th>
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase hidden lg:table-cell cursor-pointer hover:text-[#E8740C]" onClick={() => toggleSort("lastPriceUpdate")}>
                    Updated <SortIcon field="lastPriceUpdate" />
                  </th>
                  <th className="text-center px-4 py-3 text-[#666] font-bold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const meta = TYPE_META[inv.type];
                  const cv = inv.currentValue ?? inv.investedAmount;
                  const gain = inv.gain ?? 0;
                  const gainPct = inv.gainPercent ?? 0;
                  return (
                    <tr key={inv._id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta?.bg ?? "#f0f0f0" }}>
                            <FontAwesomeIcon icon={TYPE_ICONS[inv.type] ?? faSackDollar} style={{ color: meta?.color ?? "#999" }} className="text-xs" />
                          </div>
                          <div>
                            <p className="font-bold text-[#333]">{inv.name}</p>
                            {inv.symbol && <p className="text-[#999] text-xs">{inv.symbol}{inv.exchange ? ` · ${inv.exchange}` : ""}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: meta?.bg ?? "#f0f0f0", color: meta?.color ?? "#555" }}>
                          {meta?.label ?? inv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-[#333]">
                        ₹{inv.investedAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#1a1b23] hidden lg:table-cell">
                        ₹{cv.toLocaleString("en-IN")}
                        {inv.lastPriceUpdate && (
                          <p className="text-[10px] text-[#E8740C] font-medium">LIVE</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                        <GainBadge gain={gain} pct={gainPct} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#aaa] text-xs hidden lg:table-cell">
                        {timeAgo(inv.lastPriceUpdate) ?? formatDate(inv.buyDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditInv(inv)} className="w-8 h-8 rounded-[6px] border border-[#DDD] flex items-center justify-center text-[#555] hover:bg-[#FFF3EB] hover:text-[#E8740C] hover:border-[#E8740C] transition-all">
                            <FontAwesomeIcon icon={faPencil} className="text-xs" />
                          </button>
                          <button onClick={() => setDeleteId(inv._id)} className="w-8 h-8 rounded-[6px] border border-[#FFCDD2] bg-[#FFEBEE] flex items-center justify-center text-[#C62828] hover:bg-[#FFCDD2] transition-all">
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
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
          <div className="md:hidden divide-y divide-[#F5F5F5]">
            {investments.map(inv => {
              const meta = TYPE_META[inv.type];
              const cv = inv.currentValue ?? inv.investedAmount;
              const gain = inv.gain ?? 0;
              return (
                <div key={inv._id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta?.bg ?? "#f0f0f0" }}>
                    <FontAwesomeIcon icon={TYPE_ICONS[inv.type] ?? faSackDollar} style={{ color: meta?.color ?? "#999" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#333] text-sm truncate">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta?.bg, color: meta?.color }}>{meta?.label}</span>
                      {gain !== 0 && (
                        <span className={`text-[10px] font-bold ${gain > 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
                          {gain > 0 ? "+" : "−"}{fmt(Math.abs(gain))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[#333] text-sm">₹{cv.toLocaleString("en-IN")}</p>
                    <p className="text-[#999] text-xs">invested: ₹{inv.investedAmount.toLocaleString("en-IN")}</p>
                    <div className="flex gap-1.5 mt-1 justify-end">
                      <button onClick={() => setEditInv(inv)} className="text-[#666] hover:text-[#E8740C]"><FontAwesomeIcon icon={faPencil} className="text-xs" /></button>
                      <button onClick={() => setDeleteId(inv._id)} className="text-[#C62828]"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button>
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
