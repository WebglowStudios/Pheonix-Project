"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { portfolioApi, pricesApi, type InvestmentType } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faChartPie, faCoins, faLeaf, faHandHoldingDollar,
  faLandmark, faSackDollar, faFileContract, faRing, faBitcoinSign,
  faArrowLeft, faCheck, faBolt, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

// ─── Investment type catalogue ───────────────────────────────────────────────

const TYPES: {
  value: InvestmentType; label: string; desc: string;
  color: string; bg: string;
  icon: ReturnType<typeof Object.values>[0];
}[] = [
  { value: "stock",       label: "Stocks",        desc: "NSE / BSE equities",      color: "#1565C0", bg: "#EBF3FD", icon: faChartLine },
  { value: "mutual_fund", label: "Mutual Fund",   desc: "Lump-sum MF investment",  color: "#2E7D32", bg: "#EAF5EB", icon: faChartPie },
  { value: "sip",         label: "SIP",           desc: "Monthly systematic plan",  color: "#E8740C", bg: "#FFF3EB", icon: faCoins },
  { value: "fd",          label: "Fixed Deposit", desc: "Bank / NBFC FD",           color: "#6A1B9A", bg: "#F4E8FB", icon: faLandmark },
  { value: "ppf",         label: "PPF",           desc: "Public Provident Fund",    color: "#E65100", bg: "#FBE9E7", icon: faLeaf },
  { value: "epf",         label: "EPF / PF",      desc: "Employee Provident Fund",  color: "#00838F", bg: "#E0F7FA", icon: faHandHoldingDollar },
  { value: "nps",         label: "NPS",           desc: "National Pension Scheme",  color: "#F57F17", bg: "#FFF9E6", icon: faSackDollar },
  { value: "bond",        label: "Bonds",         desc: "Govt / corporate bonds",   color: "#880E4F", bg: "#FCE4EC", icon: faFileContract },
  { value: "gold",        label: "Gold / SGB",    desc: "Physical gold or SGB",     color: "#B8860B", bg: "#FDF8E1", icon: faRing },
  { value: "crypto",      label: "Crypto",        desc: "Digital assets",           color: "#4527A0", bg: "#EDE7F6", icon: faBitcoinSign },
];

// ─── Shared input class ──────────────────────────────────────────────────────

const ic = "w-full border border-[#E2E5EB] rounded-lg px-3.5 py-2.5 text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 bg-white placeholder:text-[#C0C4CC] transition-all";

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-[#E8740C] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Live Price Fetch button ─────────────────────────────────────────────────

function FetchButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 w-full py-2 px-3 border border-[#E8740C]/40 text-[#E8740C] bg-[#FFF8F3] rounded-lg text-xs font-semibold hover:bg-[#FFF3EB] hover:border-[#E8740C] transition-all disabled:opacity-50"
    >
      <FontAwesomeIcon icon={faBolt} className={`text-xs ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Fetching..." : label}
    </button>
  );
}

// ─── Adaptive form by type ───────────────────────────────────────────────────

function TypeForm({ type, form, upd }: {
  type: InvestmentType;
  form: Record<string, string | number>;
  upd: (k: string, v: string | number) => void;
}) {
  const [lookup, setLookup] = useState<{ loading: boolean; msg: string; ok: boolean } | null>(null);

  async function fetchStockPrice() {
    const sym = form.symbol as string;
    const exch = form.exchange as string || "NSE";
    if (!sym) { setLookup({ loading: false, msg: "Enter a symbol first.", ok: false }); return; }
    setLookup({ loading: true, msg: "", ok: true });
    const res = await pricesApi.lookupStock(sym, exch);
    if (res.success && res.data?.price) {
      upd("buyPrice", res.data.price);
      setLookup({ loading: false, msg: `Fetched: ₹${res.data.price.toLocaleString("en-IN")} (${exch})`, ok: true });
    } else {
      setLookup({ loading: false, msg: "Symbol not found. Check ticker.", ok: false });
    }
    setTimeout(() => setLookup(null), 5000);
  }

  async function fetchMFNav() {
    const code = form.symbol as string;
    if (!code) { setLookup({ loading: false, msg: "Enter AMFI code first.", ok: false }); return; }
    setLookup({ loading: true, msg: "", ok: true });
    const res = await pricesApi.lookupMFNav(code);
    if (res.success && res.data?.nav) {
      upd("buyPrice", res.data.nav);
      if (type === "sip") upd("avgNav", res.data.nav);
      setLookup({ loading: false, msg: `NAV: ₹${res.data.nav.toFixed(4)}`, ok: true });
    } else {
      setLookup({ loading: false, msg: "NAV not found. Check AMFI code.", ok: false });
    }
    setTimeout(() => setLookup(null), 5000);
  }

  async function fetchGold() {
    setLookup({ loading: true, msg: "", ok: true });
    const res = await pricesApi.lookupGold();
    if (res.success && res.data?.pricePerGram) {
      upd("buyPrice", res.data.pricePerGram);
      setLookup({ loading: false, msg: `₹${res.data.pricePerGram.toFixed(0)} / gram`, ok: true });
    } else {
      setLookup({ loading: false, msg: "Gold price unavailable.", ok: false });
    }
    setTimeout(() => setLookup(null), 5000);
  }

  async function fetchCrypto() {
    const sym = form.symbol as string;
    if (!sym) { setLookup({ loading: false, msg: "Enter symbol first (e.g. BTC).", ok: false }); return; }
    setLookup({ loading: true, msg: "", ok: true });
    const res = await pricesApi.lookupCrypto(sym);
    if (res.success && res.data?.price) {
      upd("buyPrice", res.data.price);
      setLookup({ loading: false, msg: `₹${res.data.price.toLocaleString("en-IN")}`, ok: true });
    } else {
      setLookup({ loading: false, msg: "Price not found.", ok: false });
    }
    setTimeout(() => setLookup(null), 5000);
  }

  const PriceMsg = () => lookup && !lookup.loading ? (
    <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${lookup.ok ? "text-[#2e7d32]" : "text-[#c62828]"}`}>
      {lookup.ok ? <FontAwesomeIcon icon={faCheck} className="text-[9px]" /> : <FontAwesomeIcon icon={faTriangleExclamation} className="text-[9px]" />}
      {lookup.msg}
    </p>
  ) : null;

  switch (type) {
    case "stock":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ticker Symbol"><input placeholder="RELIANCE" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Exchange">
            <select value={form.exchange as string} onChange={e => upd("exchange", e.target.value)} className={ic}>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity" required><input type="number" min="0" step="any" placeholder="100" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
          <div>
            <Field label="Buy Price / unit (₹)" required><input type="number" min="0" step="any" placeholder="2500" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
            <div className="mt-2"><FetchButton onClick={fetchStockPrice} loading={!!lookup?.loading} label="Fetch Live Price" /></div>
            <PriceMsg />
          </div>
        </div>
        <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
      </>);

    case "gold":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Symbol / Type"><input placeholder="GOLD / GC=F / GOLDBEES" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Quantity (grams)" required><input type="number" min="0" step="any" placeholder="10" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Buy Price / gram (₹)" required><input type="number" min="0" step="any" placeholder="6500" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
          <div className="mt-2"><FetchButton onClick={fetchGold} loading={!!lookup?.loading} label="Fetch Live Gold Price" /></div>
          <PriceMsg />
        </div>
        <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
      </>);

    case "crypto":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Symbol (e.g. BTC)"><input placeholder="BTC" value={form.symbol as string} onChange={e => upd("symbol", e.target.value.toUpperCase())} className={ic} /></Field>
          <Field label="Quantity" required><input type="number" min="0" step="any" placeholder="0.5" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Buy Price / unit (₹)" required><input type="number" min="0" step="any" placeholder="3200000" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
          <div className="mt-2"><FetchButton onClick={fetchCrypto} loading={!!lookup?.loading} label="Fetch Live Price" /></div>
          <PriceMsg />
        </div>
        <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
      </>);

    case "mutual_fund":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="AMFI Scheme Code"><input placeholder="120503" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Units Allotted" required><input type="number" min="0" step="any" placeholder="500.123" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field label="NAV at Purchase (₹)" required><input type="number" min="0" step="any" placeholder="85.50" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
            <div className="mt-2"><FetchButton onClick={fetchMFNav} loading={!!lookup?.loading} label="Fetch Latest NAV" /></div>
            <PriceMsg />
          </div>
          <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
        </div>
      </>);

    case "sip":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="AMFI / Fund Code"><input placeholder="120503" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Monthly SIP (₹)" required><input type="number" min="0" placeholder="5000" value={form.sipAmount as string} onChange={e => upd("sipAmount", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SIP Start Date"><input type="date" value={form.sipStartDate as string} onChange={e => upd("sipStartDate", e.target.value)} className={ic} /></Field>
          <Field label="Instalments" required><input type="number" min="0" placeholder="12" value={form.instalments as string} onChange={e => upd("instalments", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Average NAV (₹)"><input type="number" min="0" step="any" placeholder="92.30" value={form.avgNav as string} onChange={e => upd("avgNav", e.target.value)} className={ic} /></Field>
          <div className="mt-2"><FetchButton onClick={fetchMFNav} loading={!!lookup?.loading} label="Fetch Current NAV" /></div>
          <PriceMsg />
        </div>
      </>);

    case "fd":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Principal (₹)" required><input type="number" min="0" placeholder="200000" value={form.principal as string} onChange={e => upd("principal", e.target.value)} className={ic} /></Field>
          <Field label="Interest Rate (% p.a.)" required><input type="number" min="0" step="0.01" placeholder="7.5" value={form.interestRate as string} onChange={e => upd("interestRate", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tenure (months)"><input type="number" min="0" placeholder="24" value={form.tenureMonths as string} onChange={e => upd("tenureMonths", e.target.value)} className={ic} /></Field>
          <Field label="Bank / Institution"><input placeholder="HDFC Bank" value={form.institution as string} onChange={e => upd("institution", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
          <Field label="Maturity Date"><input type="date" value={form.maturityDate as string} onChange={e => upd("maturityDate", e.target.value)} className={ic} /></Field>
        </div>
      </>);

    case "ppf":
    case "epf":
    case "nps":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current Balance (₹)" required><input type="number" min="0" placeholder="500000" value={form.principal as string} onChange={e => upd("principal", e.target.value)} className={ic} /></Field>
          <Field label="Interest Rate (% p.a.)"><input type="number" min="0" step="0.01" placeholder="7.1" value={form.interestRate as string} onChange={e => upd("interestRate", e.target.value)} className={ic} /></Field>
        </div>
        {type === "nps" && (
          <Field label="Tier">
            <select value={form.institution as string} onChange={e => upd("institution", e.target.value)} className={ic}>
              <option value="Tier 1">Tier 1 — Pension</option>
              <option value="Tier 2">Tier 2 — Investment</option>
            </select>
          </Field>
        )}
        <Field label="Maturity Date (optional)"><input type="date" value={form.maturityDate as string} onChange={e => upd("maturityDate", e.target.value)} className={ic} /></Field>
      </>);

    case "bond":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Units" required><input type="number" min="0" placeholder="10" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
          <Field label="Purchase Price / unit (₹)" required><input type="number" min="0" placeholder="1000" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Coupon Rate (% p.a.)"><input type="number" min="0" step="0.01" placeholder="8.5" value={form.interestRate as string} onChange={e => upd("interestRate", e.target.value)} className={ic} /></Field>
          <Field label="Maturity Date"><input type="date" value={form.maturityDate as string} onChange={e => upd("maturityDate", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Issuer"><input placeholder="Govt of India" value={form.institution as string} onChange={e => upd("institution", e.target.value)} className={ic} /></Field>
          <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
        </div>
      </>);

    default:
      return null;
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const EMPTY_FORM: Record<string, string | number> = {
  name: "", symbol: "", exchange: "NSE", units: "", buyPrice: "",
  buyDate: "", sipAmount: "", sipStartDate: "", instalments: "", avgNav: "",
  principal: "", interestRate: "", maturityDate: "", tenureMonths: "",
  institution: "", notes: "",
};

export default function AddInvestmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function upd(k: string, v: string | number) {
    setForm(p => ({ ...p, [k]: v }));
    setError("");
  }

  function selectType(t: InvestmentType) {
    setSelectedType(t);
    setForm(EMPTY_FORM);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    if (!form.name) { setError("Investment name is required."); return; }
    setSaving(true);
    setError("");
    const payload: Record<string, string | number | undefined> = {
      type: selectedType,
      ...Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "" && v !== 0)),
    };
    const res = await portfolioApi.add(payload as never);
    if (res.success) {
      router.push("/dashboard/portfolio");
    } else {
      setError(res.message || res.errors?.[0]?.msg || "Failed to save investment.");
      setSaving(false);
    }
  }

  const typeMeta = selectedType ? TYPES.find(t => t.value === selectedType) : null;

  return (
    <div className="max-w-[620px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1b23]">Add Investment</h1>
        <p className="text-[#8a92a6] text-sm mt-0.5">
          {step === 1 ? "Select the type of investment to add." : "Fill in the details below."}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2] as const).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              step > s
                ? "bg-[#1b5e20] border-[#1b5e20] text-white"
                : step === s
                ? "bg-[#E8740C] border-[#E8740C] text-white"
                : "bg-white border-[#E2E5EB] text-[#aaa]"
            }`}>
              {step > s ? <FontAwesomeIcon icon={faCheck} className="text-[9px]" /> : s}
            </div>
            <span className={`text-xs font-semibold ${step >= s ? "text-[#1a1b23]" : "text-[#aaa]"}`}>
              {s === 1 ? "Select Type" : "Enter Details"}
            </span>
            {s < 2 && (
              <div className={`h-px w-8 mx-1 ${step > s ? "bg-[#1b5e20]" : "bg-[#E2E5EB]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Type grid */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => selectType(t.value)}
              className="flex flex-col items-start gap-3 p-4 rounded-xl border-2 border-[#EAECEF] bg-white hover:border-[#E8740C] hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ background: t.bg }}>
                <FontAwesomeIcon icon={t.icon} style={{ color: t.color }} className="text-base" />
              </div>
              <div>
                <p className="font-bold text-[#1a1b23] text-sm">{t.label}</p>
                <p className="text-[#8a92a6] text-[11px] mt-0.5 leading-tight">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && selectedType && typeMeta && (
        <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-sm overflow-hidden">
          {/* Selected type header */}
          <div className="px-6 py-4 border-b border-[#F0F2F5] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: typeMeta.bg }}>
              <FontAwesomeIcon icon={typeMeta.icon} style={{ color: typeMeta.color }} className="text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1a1b23] text-sm">{typeMeta.label}</p>
              <p className="text-[#8a92a6] text-xs">{typeMeta.desc}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#8a92a6] hover:text-[#E8740C] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FFF8F3]"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[9px]" />
              Change
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#c62828] text-sm">
                <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 text-xs" />
                {error}
              </div>
            )}

            <Field label="Investment Name" required>
              <input
                value={form.name as string}
                onChange={e => upd("name", e.target.value)}
                placeholder={
                  selectedType === "stock" ? "e.g. Reliance Industries" :
                  selectedType === "fd"    ? "e.g. HDFC Bank FD" :
                  "Enter a name..."
                }
                className={ic}
              />
            </Field>

            <TypeForm type={selectedType} form={form} upd={upd} />

            <Field label="Notes (optional)">
              <textarea
                value={form.notes as string}
                onChange={e => upd("notes", e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                className={ic + " resize-none"}
              />
            </Field>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-[#E2E5EB] bg-white rounded-lg py-3 text-sm font-semibold text-[#444] hover:bg-[#F5F6F8] transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-2 flex-1 bg-[#E8740C] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#d4660b] disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin inline-block" />
                    Saving...
                  </span>
                ) : (
                  <><FontAwesomeIcon icon={faCheck} className="mr-2 text-xs" />Save Investment</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
