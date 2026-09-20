"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { portfolioApi, type Investment } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faSearch, faPencil, faTrash, faXmark, faCheck,
  faArrowUp, faArrowDown, faChartLine, faChartPie, faCoins,
  faLandmark, faLeaf, faHandHoldingDollar, faSackDollar,
  faFileContract, faRing, faBitcoinSign,
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
  { value: "ppf", label: "PPF/EPF" },
  { value: "gold", label: "Gold" },
  { value: "nps", label: "NPS" },
  { value: "bond", label: "Bonds" },
  { value: "crypto", label: "Crypto" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({
  inv, onClose, onSaved,
}: { inv: Investment; onClose: () => void; onSaved: () => void }) {
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
          <h3 className="font-bold text-[#333] text-lg">Edit Investment</h3>
          <button onClick={onClose} className="text-[#999] hover:text-[#333]"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-[#C62828] text-sm bg-[#FFEBEE] px-3 py-2 rounded-[8px]">{error}</p>}
          <div><label className="label">Name</label><input value={form.name} onChange={e => upd("name", e.target.value)} className={ic} /></div>
          {(["stock","mutual_fund","gold","crypto"] as const).includes(form.type as never) && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Units</label><input type="number" value={form.units ?? ""} onChange={e => upd("units", +e.target.value)} className={ic} /></div>
              <div><label className="label">Buy Price (₹)</label><input type="number" value={form.buyPrice ?? ""} onChange={e => upd("buyPrice", +e.target.value)} className={ic} /></div>
            </div>
            <div><label className="label">Buy Date</label><input type="date" value={form.buyDate?.slice(0,10) ?? ""} onChange={e => upd("buyDate", e.target.value)} className={ic} /></div>
          </>)}
          {form.type === "sip" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Monthly SIP (₹)</label><input type="number" value={form.sipAmount ?? ""} onChange={e => upd("sipAmount", +e.target.value)} className={ic} /></div>
              <div><label className="label">Instalments</label><input type="number" value={form.instalments ?? ""} onChange={e => upd("instalments", +e.target.value)} className={ic} /></div>
            </div>
          </>)}
          {(["fd","ppf","epf","nps","bond"] as const).includes(form.type as never) && (<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Principal (₹)</label><input type="number" value={form.principal ?? ""} onChange={e => upd("principal", +e.target.value)} className={ic} /></div>
              <div><label className="label">Interest Rate (%)</label><input type="number" value={form.interestRate ?? ""} onChange={e => upd("interestRate", +e.target.value)} className={ic} /></div>
            </div>
          </>)}
          <div><label className="label">Notes</label><textarea value={form.notes ?? ""} onChange={e => upd("notes", e.target.value)} rows={2} className={ic + " resize-none"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-[#EEE] flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#DDD] bg-white rounded-[8px] py-2 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5]">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-[#E8740C] text-white rounded-[8px] py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60">
            {saving ? "Saving..." : <><FontAwesomeIcon icon={faCheck} className="mr-1.5" />Save Changes</>}
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
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editInv, setEditInv] = useState<Investment | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [error, setError] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await portfolioApi.getAll({
      type: activeType !== "all" ? activeType : undefined,
      sort: sortField,
      order: sortOrder,
      search: search || undefined,
    });
    if (res.success) setInvestments(res.data ?? []);
    else setError("Failed to load investments.");
    setLoading(false);
  }, [activeType, sortField, sortOrder, search]);

  useEffect(() => { load(); }, [load]);

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
    ? <FontAwesomeIcon icon={sortOrder === "asc" ? faArrowUp : faArrowDown} className="ml-1 text-[#E8740C]" />
    : null;

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-white text-sm font-bold shadow-lg ${toast.ok ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
          {toast.msg}
        </div>
      )}

      {editInv && (
        <EditModal inv={editInv} onClose={() => setEditInv(null)} onSaved={() => { showToast("Saved!"); load(); }} />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-[#333] text-lg mb-2">Delete Investment?</h3>
            <p className="text-[#666] text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#DDD] bg-white rounded-[8px] py-2 text-sm font-semibold text-[#444]">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-[#C62828] text-white rounded-[8px] py-2 text-sm font-semibold hover:bg-[#E53935]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">My Portfolio</h1>
          <p className="text-[#666] text-sm mt-0.5">
            {investments.length} investment{investments.length !== 1 ? "s" : ""} · Total invested: {fmt(totalInvested)}
          </p>
        </div>
        <Link href="/dashboard/add" className="flex items-center gap-2 px-5 py-2.5 bg-[#E8740C] text-white font-bold rounded-[30px] border-2 border-[#E8740C] hover:bg-[#FF9433] transition-all no-underline text-sm shadow-[0_4px_16px_rgba(232,116,12,0.2)]">
          <FontAwesomeIcon icon={faPlus} /> Add Investment
        </Link>
      </div>

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
        /* Table */
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
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase hidden lg:table-cell">Details</th>
                  <th className="text-right px-4 py-3 text-[#666] font-bold text-xs uppercase cursor-pointer hover:text-[#E8740C] hidden lg:table-cell" onClick={() => toggleSort("buyDate")}>
                    Date <SortIcon field="buyDate" />
                  </th>
                  <th className="text-center px-4 py-3 text-[#666] font-bold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const meta = TYPE_META[inv.type];
                  const detail = inv.type === "sip"
                    ? `₹${inv.sipAmount?.toLocaleString()}/mo · ${inv.instalments} SIPs`
                    : inv.units ? `${inv.units} units @ ₹${inv.buyPrice?.toLocaleString()}`
                    : inv.interestRate ? `${inv.interestRate}% p.a.`
                    : "";
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
                      <td className="px-4 py-3.5 text-right font-bold text-[#333]">{fmt(inv.investedAmount)}</td>
                      <td className="px-4 py-3.5 text-right text-[#666] text-xs hidden lg:table-cell">{detail || "—"}</td>
                      <td className="px-4 py-3.5 text-right text-[#888] text-xs hidden lg:table-cell">{formatDate(inv.buyDate || inv.sipStartDate)}</td>
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
              return (
                <div key={inv._id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: meta?.bg ?? "#f0f0f0" }}>
                    <FontAwesomeIcon icon={TYPE_ICONS[inv.type] ?? faSackDollar} style={{ color: meta?.color ?? "#999" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#333] text-sm truncate">{inv.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta?.bg, color: meta?.color }}>{meta?.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[#333] text-sm">{fmt(inv.investedAmount)}</p>
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
