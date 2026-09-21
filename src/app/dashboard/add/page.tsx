"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { portfolioApi, pricesApi, type InvestmentType } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faChartPie, faCoins, faLeaf, faHandHoldingDollar,
  faLandmark, faSackDollar, faFileContract, faRing, faBitcoinSign,
  faArrowLeft, faCheck, faMagnifyingGlassChart,
} from "@fortawesome/free-solid-svg-icons";

// ─── Investment type catalogue ───────────────────────────────────────────────

const TYPES: {
  value: InvestmentType; label: string; desc: string;
  color: string; bg: string;
  icon: ReturnType<typeof Object.values>[0];
}[] = [
  { value: "stock",       label: "Stock",         desc: "NSE / BSE equities",     color: "#1565C0", bg: "#E3F2FD", icon: faChartLine },
  { value: "mutual_fund", label: "Mutual Fund",   desc: "Lump-sum MF investment", color: "#2E7D32", bg: "#E8F5E9", icon: faChartPie },
  { value: "sip",         label: "SIP",           desc: "Monthly SIP in a fund",  color: "#E8740C", bg: "#FFF3EB", icon: faCoins },
  { value: "fd",          label: "Fixed Deposit", desc: "Bank / NBFC FD",         color: "#6A1B9A", bg: "#F3E5F5", icon: faLandmark },
  { value: "ppf",         label: "PPF",           desc: "Public Provident Fund",  color: "#E65100", bg: "#FBE9E7", icon: faLeaf },
  { value: "epf",         label: "EPF / PF",      desc: "Employee PF",            color: "#00838F", bg: "#E0F7FA", icon: faHandHoldingDollar },
  { value: "nps",         label: "NPS",           desc: "National Pension Scheme",color: "#F57F17", bg: "#FFFDE7", icon: faSackDollar },
  { value: "bond",        label: "Bond",          desc: "Govt / corporate bond",  color: "#880E4F", bg: "#FCE4EC", icon: faFileContract },
  { value: "gold",        label: "Gold / SGB",    desc: "Physical gold or SGB",   color: "#F9A825", bg: "#FFFDE7", icon: faRing },
  { value: "crypto",      label: "Crypto",        desc: "Digital assets",         color: "#4527A0", bg: "#EDE7F6", icon: faBitcoinSign },
];

// ─── Styled input class ──────────────────────────────────────────────────────

const ic = "w-full border border-[#DDD] rounded-[10px] px-3.5 py-2.5 text-sm text-[#333] outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.1)] bg-white placeholder:text-[#bbb] transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-[#E8740C] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Adaptive form by type ───────────────────────────────────────────────────

function TypeForm({ type, form, upd }: {
  type: InvestmentType;
  form: Record<string, string | number>;
  upd: (k: string, v: string | number) => void;
}) {
  const [priceLookup, setPriceLookup] = useState<{ loading: boolean; msg: string; ok: boolean } | null>(null);

  async function fetchStockPrice() {
    const sym = form.symbol as string;
    const exch = form.exchange as string || "NSE";
    if (!sym) { setPriceLookup({ loading: false, msg: "Enter a symbol first.", ok: false }); return; }
    setPriceLookup({ loading: true, msg: "Fetching...", ok: true });
    const res = await pricesApi.lookupStock(sym, exch);
    if (res.success && res.data?.price) {
      upd("buyPrice", res.data.price);
      setPriceLookup({ loading: false, msg: `✓ ₹${res.data.price.toLocaleString("en-IN")} (${exch})`, ok: true });
    } else {
      setPriceLookup({ loading: false, msg: "Not found. Check symbol.", ok: false });
    }
    setTimeout(() => setPriceLookup(null), 5000);
  }

  async function fetchMFNavLive() {
    const code = form.symbol as string;
    if (!code) { setPriceLookup({ loading: false, msg: "Enter AMFI code first.", ok: false }); return; }
    setPriceLookup({ loading: true, msg: "Fetching NAV...", ok: true });
    const res = await pricesApi.lookupMFNav(code);
    if (res.success && res.data?.nav) {
      upd("buyPrice", res.data.nav);
      if (type === "sip") upd("avgNav", res.data.nav);
      setPriceLookup({ loading: false, msg: `✓ NAV ₹${res.data.nav.toFixed(4)}`, ok: true });
    } else {
      setPriceLookup({ loading: false, msg: "NAV not found. Check AMFI code.", ok: false });
    }
    setTimeout(() => setPriceLookup(null), 5000);
  }

  async function fetchGoldPrice() {
    setPriceLookup({ loading: true, msg: "Fetching gold price...", ok: true });
    const res = await pricesApi.lookupGold();
    if (res.success && res.data?.pricePerGram) {
      upd("buyPrice", res.data.pricePerGram);
      setPriceLookup({ loading: false, msg: `✓ ₹${res.data.pricePerGram.toFixed(0)}/gram`, ok: true });
    } else {
      setPriceLookup({ loading: false, msg: "Gold price unavailable.", ok: false });
    }
    setTimeout(() => setPriceLookup(null), 5000);
  }

  async function fetchCrypto() {
    const sym = form.symbol as string;
    if (!sym) { setPriceLookup({ loading: false, msg: "Enter symbol first (e.g. BTC).", ok: false }); return; }
    setPriceLookup({ loading: true, msg: "Fetching price...", ok: true });
    const res = await pricesApi.lookupCrypto(sym);
    if (res.success && res.data?.price) {
      upd("buyPrice", res.data.price);
      setPriceLookup({ loading: false, msg: `✓ ₹${res.data.price.toLocaleString("en-IN")}`, ok: true });
    } else {
      setPriceLookup({ loading: false, msg: "Price not found.", ok: false });
    }
    setTimeout(() => setPriceLookup(null), 5000);
  }

  const FetchButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} disabled={priceLookup?.loading}
      className="w-full flex items-center justify-center gap-2 py-2 border border-[#E8740C] text-[#E8740C] rounded-[8px] text-xs font-bold hover:bg-[#FFF3EB] transition-all disabled:opacity-50">
      <FontAwesomeIcon icon={faMagnifyingGlassChart} className={priceLookup?.loading ? "animate-pulse" : ""} />
      {priceLookup?.loading ? "Fetching..." : label}
    </button>
  );

  const PriceMsg = () => priceLookup && !priceLookup.loading ? (
    <p className={`text-xs font-semibold mt-1 ${priceLookup.ok ? "text-[#2E7D32]" : "text-[#C62828]"}`}>
      {priceLookup.msg}
    </p>
  ) : null;
  switch (type) {
    case "stock":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ticker / Symbol"><input placeholder="RELIANCE" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Exchange"><select value={form.exchange as string} onChange={e => upd("exchange", e.target.value)} className={ic}><option value="NSE">NSE</option><option value="BSE">BSE</option></select></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity / Units" required><input type="number" min="0" step="any" placeholder="100" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
          <div>
            <Field label="Buy Price / unit (₹)" required><input type="number" min="0" step="any" placeholder="2500" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
            <div className="mt-1.5"><FetchButton onClick={fetchStockPrice} label="Fetch Live Price" /></div>
            <PriceMsg />
          </div>
        </div>
        <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
      </>);

    case "gold":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Symbol / Type"><input placeholder="GOLD / GC=F / GOLDBEES.NS" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Quantity (grams)" required><input type="number" min="0" step="any" placeholder="10" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Buy Price / gram (₹)" required><input type="number" min="0" step="any" placeholder="6500" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
          <div className="mt-1.5"><FetchButton onClick={fetchGoldPrice} label="Fetch Live Gold Price (₹/gram)" /></div>
          <PriceMsg />
        </div>
        <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
      </>);

    case "crypto":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Symbol (e.g. BTC, ETH)"><input placeholder="BTC" value={form.symbol as string} onChange={e => upd("symbol", e.target.value.toUpperCase())} className={ic} /></Field>
          <Field label="Quantity / Units" required><input type="number" min="0" step="any" placeholder="0.5" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Buy Price / unit (₹)" required><input type="number" min="0" step="any" placeholder="3200000" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
          <div className="mt-1.5"><FetchButton onClick={fetchCrypto} label="Fetch Live Crypto Price (₹)" /></div>
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
            <div className="mt-1.5"><FetchButton onClick={fetchMFNavLive} label="Fetch Latest NAV" /></div>
            <PriceMsg />
          </div>
          <Field label="Purchase Date"><input type="date" value={form.buyDate as string} onChange={e => upd("buyDate", e.target.value)} className={ic} /></Field>
        </div>
      </>);

    case "sip":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="AMFI / Fund Code"><input placeholder="120503" value={form.symbol as string} onChange={e => upd("symbol", e.target.value)} className={ic} /></Field>
          <Field label="Monthly SIP Amount (₹)" required><input type="number" min="0" placeholder="5000" value={form.sipAmount as string} onChange={e => upd("sipAmount", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SIP Start Date"><input type="date" value={form.sipStartDate as string} onChange={e => upd("sipStartDate", e.target.value)} className={ic} /></Field>
          <Field label="Instalments Completed" required><input type="number" min="0" placeholder="12" value={form.instalments as string} onChange={e => upd("instalments", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Average NAV (₹)"><input type="number" min="0" step="any" placeholder="92.30" value={form.avgNav as string} onChange={e => upd("avgNav", e.target.value)} className={ic} /></Field>
          <div className="mt-1.5"><FetchButton onClick={fetchMFNavLive} label="Fetch Current NAV" /></div>
          <PriceMsg />
        </div>
      </>);

    case "fd":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Principal Amount (₹)" required><input type="number" min="0" placeholder="200000" value={form.principal as string} onChange={e => upd("principal", e.target.value)} className={ic} /></Field>
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
              <option value="Tier 1">Tier 1 (Pension)</option>
              <option value="Tier 2">Tier 2 (Investment)</option>
            </select>
          </Field>
        )}
        <Field label="Maturity Date (optional)"><input type="date" value={form.maturityDate as string} onChange={e => upd("maturityDate", e.target.value)} className={ic} /></Field>
      </>);

    case "bond":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Units / Face Value Count" required><input type="number" min="0" placeholder="10" value={form.units as string} onChange={e => upd("units", e.target.value)} className={ic} /></Field>
          <Field label="Purchase Price / unit (₹)" required><input type="number" min="0" placeholder="1000" value={form.buyPrice as string} onChange={e => upd("buyPrice", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Coupon Rate (% p.a.)"><input type="number" min="0" step="0.01" placeholder="8.5" value={form.interestRate as string} onChange={e => upd("interestRate", e.target.value)} className={ic} /></Field>
          <Field label="Maturity Date"><input type="date" value={form.maturityDate as string} onChange={e => upd("maturityDate", e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Issuer / Institution"><input placeholder="Govt of India" value={form.institution as string} onChange={e => upd("institution", e.target.value)} className={ic} /></Field>
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
    <div className="max-w-[640px] mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">Add Investment</h1>
        <p className="text-[#666] text-sm mt-1">
          {step === 1 ? "Choose the type of investment you want to add." : "Fill in the details for your investment."}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-7">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? "bg-[#E8740C] text-white" : "bg-[#EEE] text-[#999]"
            }`}>
              {step > s ? <FontAwesomeIcon icon={faCheck} /> : s}
            </div>
            <span className={`text-xs font-semibold ${step >= s ? "text-[#E8740C]" : "text-[#999]"}`}>
              {s === 1 ? "Select Type" : "Enter Details"}
            </span>
            {s < 2 && <div className={`h-0.5 w-10 rounded-full ${step > s ? "bg-[#E8740C]" : "bg-[#EEE]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Type selection grid */}
      {step === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => selectType(t.value)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-[14px] border-2 border-[#EEE] bg-white hover:border-[#E8740C] hover:shadow-[0_4px_16px_rgba(232,116,12,0.12)] transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: t.bg }}>
                <FontAwesomeIcon icon={t.icon} style={{ color: t.color }} className="text-lg" />
              </div>
              <div>
                <p className="font-bold text-[#333] text-sm">{t.label}</p>
                <p className="text-[#999] text-[11px] mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Investment form */}
      {step === 2 && selectedType && typeMeta && (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#F0F0F0] overflow-hidden">
          {/* Type badge header */}
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: typeMeta.bg }}>
              <FontAwesomeIcon icon={typeMeta.icon} style={{ color: typeMeta.color }} />
            </div>
            <div>
              <p className="font-bold text-[#333]">New {typeMeta.label}</p>
              <p className="text-[#999] text-xs">{typeMeta.desc}</p>
            </div>
            <button onClick={() => setStep(1)} className="ml-auto text-[#999] hover:text-[#333] flex items-center gap-1 text-xs font-semibold">
              <FontAwesomeIcon icon={faArrowLeft} /> Change
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="px-4 py-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-[10px] text-[#C62828] text-sm font-medium">
                {error}
              </div>
            )}

            <Field label="Investment Name" required>
              <input
                value={form.name as string}
                onChange={e => upd("name", e.target.value)}
                placeholder={selectedType === "stock" ? "Reliance Industries" : selectedType === "fd" ? "HDFC Bank FD" : "Enter name..."}
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

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-[#DDD] bg-white rounded-[10px] py-3 text-sm font-bold text-[#444] hover:bg-[#F9F9F9]">
                Back
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-[#E8740C] text-white rounded-[10px] py-3 text-sm font-bold border-2 border-[#E8740C] hover:bg-[#FF9433] disabled:opacity-60 shadow-[0_4px_16px_rgba(232,116,12,0.25)]">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Saving...
                  </span>
                ) : (
                  <><FontAwesomeIcon icon={faCheck} className="mr-2" />Save Investment</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
