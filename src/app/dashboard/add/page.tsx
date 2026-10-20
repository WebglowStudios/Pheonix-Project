"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { portfolioApi, pricesApi, type InvestmentType } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faChartPie, faCoins, faLeaf, faHandHoldingDollar,
  faLandmark, faSackDollar, faFileContract, faRing, faBitcoinSign,
  faBuildingColumns, faArrowLeft, faCheck, faBolt, faTriangleExclamation,
  faMagnifyingGlass, faSpinner, faCircleCheck, faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

// ─── Investment type catalogue ───────────────────────────────────────────────

export const MAIN_PRODUCTS: {
  value: InvestmentType; label: string; desc: string;
  color: string; bg: string;
  icon: ReturnType<typeof Object.values>[0];
}[] = [
  { value: "stock",       label: "Stocks",         desc: "NSE & BSE equities, shares",           color: "#1565C0", bg: "#EBF3FD", icon: faChartLine },
  { value: "mutual_fund", label: "Mutual Funds",   desc: "Equity, debt, hybrid & index funds",   color: "#2E7D32", bg: "#EAF5EB", icon: faChartPie },
  { value: "fd",          label: "Fixed Deposits", desc: "Bank & NBFC term deposits",            color: "#6A1B9A", bg: "#F4E8FB", icon: faLandmark },
  { value: "bond",        label: "Bonds",          desc: "Govt securities & corporate bonds",    color: "#880E4F", bg: "#FCE4EC", icon: faFileContract },
];

export const OTHER_PRODUCTS: {
  value: InvestmentType; label: string; desc: string;
  color: string; bg: string;
  icon: ReturnType<typeof Object.values>[0];
}[] = [
  { value: "sip",    label: "SIP (Systematic Plan)",        desc: "Monthly recurring mutual fund plan", color: "#E8740C", bg: "#FFF3EB", icon: faCoins },
  { value: "gold",   label: "Gold / SGB",                   desc: "Physical gold, digital gold or SGB",  color: "#B8860B", bg: "#FDF8E1", icon: faRing },
  { value: "ppf",    label: "PPF (Public Provident Fund)",  desc: "Govt-backed 15-year tax-free scheme", color: "#E65100", bg: "#FBE9E7", icon: faLeaf },
  { value: "epf",    label: "EPF / PF (Provident Fund)",    desc: "Employee Provident Fund balance",    color: "#00838F", bg: "#E0F7FA", icon: faHandHoldingDollar },
  { value: "nps",    label: "NPS (National Pension Scheme)",desc: "Retirement pension fund (Tier I/II)", color: "#F57F17", bg: "#FFF9E6", icon: faSackDollar },
  { value: "aif",    label: "AIF (Alternative Investment)",desc: "Category I/II/III private funds",   color: "#4E342E", bg: "#EFEBE9", icon: faBuildingColumns },
  { value: "crypto", label: "Crypto Assets",                desc: "Bitcoin, Ethereum & digital assets", color: "#4527A0", bg: "#EDE7F6", icon: faBitcoinSign },
];

const TYPES = [...MAIN_PRODUCTS, ...OTHER_PRODUCTS];

const ic = "w-full border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm sm:text-base text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 bg-white placeholder:text-[#94A3B8] transition-all";

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs sm:text-[13px] font-bold text-[#475569] uppercase tracking-wider mb-2">
        {label}{required && <span className="text-[#E8740C] ml-1">*</span>}
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

// ─── Smart Name Search & Suggestion Combobox ───────────────────────────────────

function NameSearchCombobox({
  type,
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  type: InvestmentType;
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: { name: string; symbol?: string; exchange?: string; code?: string; id?: string }) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchType =
    type === "sip" ? "mutual_fund" :
    type === "stock" || type === "mutual_fund" || type === "crypto" ? type : null;

  useEffect(() => {
    if (!searchType || !query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await pricesApi.search(searchType, query.trim());
        if (res.success && Array.isArray(res.data)) {
          setResults(res.data);
          setIsOpen(res.data.length > 0);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchType]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`${ic} pr-10`}
          autoComplete="off"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a92a6]">
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-[#E8740C]" />
          ) : searchType ? (
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs text-[#C0C4CC]" />
          ) : null}
        </div>
      </div>

      {/* Suggestion Dropdown Popover */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E5EB] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-[#F0F2F5]">
          <div className="px-3.5 py-1.5 bg-[#FAFBFD] text-[10px] font-bold text-[#8a92a6] uppercase tracking-wider flex items-center justify-between">
            <span>Suggestions by name</span>
            <span className="text-[#E8740C]">Click to autofill</span>
          </div>
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className="w-full px-3.5 py-2.5 text-left hover:bg-[#FFF8F3] transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1a1b23] group-hover:text-[#E8740C] truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8a92a6]">
                  {item.symbol && (
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[#F0F2F5] text-[#444] text-[10px]">
                      {item.symbol}
                    </span>
                  )}
                  {item.exchange && (
                    <span className="font-semibold text-[#1565C0] text-[11px]">{item.exchange}</span>
                  )}
                  {item.code && item.code !== item.symbol && (
                    <span className="font-mono text-[10px] text-[#2E7D32]">AMFI: {item.code}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#E8740C] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Select →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
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
          <Field label="Instalments Done" required><input type="number" min="0" placeholder="12" value={form.instalments as string} onChange={e => upd("instalments", e.target.value)} className={ic} /></Field>
        </div>
        <div>
          <Field label="Average Purchase NAV (₹)"><input type="number" min="0" step="any" placeholder="92.30" value={form.avgNav as string} onChange={e => upd("avgNav", e.target.value)} className={ic} /></Field>
          <div className="mt-2"><FetchButton onClick={fetchMFNav} loading={!!lookup?.loading} label="Fetch Current NAV" /></div>
          <PriceMsg />
        </div>
      </>);

    case "aif":
      return (<>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fund House / AMC" required>
            <input
              placeholder="e.g. ICICI Prudential AMC, ASK, Kotak"
              value={form.institution as string}
              onChange={e => upd("institution", e.target.value)}
              list="aif-amc-list"
              className={ic}
            />
            <datalist id="aif-amc-list">
              <option value="ICICI Prudential AMC" />
              <option value="Kotak Alternate Asset Managers" />
              <option value="ASK Investment Managers" />
              <option value="360 ONE Asset (IIFL Wealth)" />
              <option value="WhiteOak Capital Management" />
              <option value="Sundaram Alternate Assets" />
              <option value="Edelweiss Alternative Asset Advisors" />
              <option value="Abakkus Asset Manager" />
              <option value="Nippon India AIF" />
              <option value="HDFC AMC Alternative" />
            </datalist>
          </Field>
          <Field label="AIF Category / Strategy">
            <select
              value={form.notes as string}
              onChange={e => upd("notes", e.target.value)}
              className={ic}
            >
              <option value="Category III — Long/Short Equity">Category III — Long/Short Equity</option>
              <option value="Category III — Structured / Capital Protection">Category III — Structured / Capital Protection</option>
              <option value="Category II — Private Equity">Category II — Private Equity</option>
              <option value="Category II — Private Debt / Credit">Category II — Private Debt / Credit</option>
              <option value="Category II — Real Estate Fund">Category II — Real Estate Fund</option>
              <option value="Category I — Venture Capital / SME">Category I — Venture Capital / SME</option>
              <option value="Category I — Infrastructure Fund">Category I — Infrastructure Fund</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Capital Invested / Called (₹)" required>
            <input
              type="number"
              min="0"
              placeholder="10000000"
              value={form.investedAmount as string}
              onChange={e => upd("investedAmount", e.target.value)}
              className={ic}
            />
          </Field>
          <Field label="Commitment / Inception Date">
            <input
              type="date"
              value={form.buyDate as string}
              onChange={e => upd("buyDate", e.target.value)}
              className={ic}
            />
          </Field>
        </div>
        <Field label="Client Folio / Account ID (optional)">
          <input
            placeholder="e.g. AIF-2024-890"
            value={form.folioNumber as string}
            onChange={e => upd("folioNumber", e.target.value)}
            className={ic}
          />
        </Field>
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
  institution: "", notes: "", folioNumber: "", investedAmount: "", currentPrice: "",
};

export default function AddInvestmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autofillMsg, setAutofillMsg] = useState("");

  function upd(k: string, v: string | number) {
    setForm(p => ({ ...p, [k]: v }));
    setError("");
  }

  function selectType(t: InvestmentType) {
    setSelectedType(t);
    setForm({
      ...EMPTY_FORM,
      notes: t === "aif" ? "Category III — Long/Short Equity" : "",
    });
    setAutofillMsg("");
    setStep(2);
  }

  async function handleSuggestionSelect(item: {
    name: string;
    symbol?: string;
    exchange?: string;
    code?: string;
    id?: string;
  }) {
    upd("name", item.name);

    if (selectedType === "stock") {
      const sym = item.symbol || "";
      const exch = item.exchange || "NSE";
      upd("symbol", sym);
      upd("exchange", exch);
      if (sym) {
        setAutofillMsg(`Selected "${item.name}". Fetching live price...`);
        const res = await pricesApi.lookupStock(sym, exch);
        if (res.success && res.data?.price) {
          upd("buyPrice", res.data.price);
          setAutofillMsg(`Live price fetched: ₹${res.data.price.toLocaleString("en-IN")} (${exch})`);
        } else {
          setAutofillMsg(`Selected "${item.name}". Ticker set to ${sym} (${exch}).`);
        }
      }
    } else if (selectedType === "mutual_fund" || selectedType === "sip") {
      const amfi = item.code || item.symbol || "";
      upd("symbol", amfi);
      if (amfi) {
        setAutofillMsg(`Selected "${item.name}". Fetching latest NAV...`);
        const res = await pricesApi.lookupMFNav(amfi);
        if (res.success && res.data?.nav) {
          upd("buyPrice", res.data.nav);
          if (selectedType === "sip") upd("avgNav", res.data.nav);
          setAutofillMsg(`Latest NAV fetched: ₹${res.data.nav.toFixed(4)} (AMFI: ${amfi})`);
        } else {
          setAutofillMsg(`Selected "${item.name}". AMFI code set to ${amfi}.`);
        }
      }
    } else if (selectedType === "crypto") {
      const sym = item.symbol || "";
      upd("symbol", sym);
      if (sym) {
        setAutofillMsg(`Selected "${item.name}". Fetching live price...`);
        const res = await pricesApi.lookupCrypto(sym);
        if (res.success && res.data?.price) {
          upd("buyPrice", res.data.price);
          setAutofillMsg(`Live price fetched: ₹${res.data.price.toLocaleString("en-IN")}`);
        } else {
          setAutofillMsg(`Selected "${item.name}". Symbol set to ${sym}.`);
        }
      }
    }

    setTimeout(() => setAutofillMsg(""), 6000);
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

    // Ensure AIF investedAmount is captured
    if (selectedType === "aif") {
      payload.investedAmount = Number(form.investedAmount || form.principal || 0);
      if (form.currentPrice) payload.currentPrice = Number(form.currentPrice);
      if (form.folioNumber) payload.folioNumber = String(form.folioNumber);
      if (form.remarks) {
        payload.notes = `${form.notes || "Category III"} | ${form.remarks}`;
      }
    }

    const res = await portfolioApi.add(payload as never);
    if (res.success) {
      router.push("/dashboard/portfolio");
    } else {
      setError(res.message || res.errors?.[0]?.msg || "Failed to save investment.");
      setSaving(false);
    }
  }

  const typeMeta = selectedType ? TYPES.find(t => t.value === selectedType) : null;
  const isSearchableType =
    selectedType === "stock" ||
    selectedType === "mutual_fund" ||
    selectedType === "sip" ||
    selectedType === "crypto";

  return (
    <div className="max-w-[960px] mx-auto px-1 sm:px-4">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1b23] tracking-tight">Add Investment</h1>
        <p className="text-[#64748B] text-sm sm:text-base mt-1.5 font-medium">
          {step === 1 ? "Select the type of investment to add to your portfolio." : "Fill in the details below to complete tracking."}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {([1, 2] as const).map(s => (
          <div key={s} className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
              step > s
                ? "bg-[#1b5e20] border-[#1b5e20] text-white"
                : step === s
                ? "bg-[#E8740C] border-[#E8740C] text-white shadow-sm"
                : "bg-white border-[#CBD5E1] text-[#94A3B8]"
            }`}>
              {step > s ? <FontAwesomeIcon icon={faCheck} className="text-xs" /> : s}
            </div>
            <span className={`text-sm sm:text-base font-bold ${step >= s ? "text-[#1a1b23]" : "text-[#94A3B8]"}`}>
              {s === 1 ? "Select Type" : "Enter Details"}
            </span>
            {s < 2 && (
              <div className={`h-0.5 w-10 sm:w-16 mx-1 ${step > s ? "bg-[#1b5e20]" : "bg-[#E2E8F0]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Type selection (4 Main Products + 1 Single Option with Dropdown for Others) */}
      {step === 1 && (
        <div className="space-y-4 sm:space-y-5">
          {/* 4 Main Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {MAIN_PRODUCTS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => selectType(t.value)}
                className="flex items-start gap-4 sm:gap-5 p-5 sm:p-7 rounded-2xl border-2 border-[#EAECEF] bg-white hover:border-[#E8740C] hover:shadow-lg transition-all text-left group cursor-pointer active:scale-[0.99]"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs"
                  style={{ background: t.bg }}
                >
                  <FontAwesomeIcon icon={t.icon} style={{ color: t.color }} className="text-2xl sm:text-3xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[#1a1b23] text-base sm:text-lg group-hover:text-[#E8740C] transition-colors leading-snug">
                    {t.label}
                  </p>
                  <p className="text-[#64748B] text-xs sm:text-sm mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 5th Single Option: Other Products with Dropdown Selector */}
          <div className="p-5 sm:p-7 rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-gradient-to-br from-[#FAFBFC] via-[#F8FAFC] to-[#F1F5F9] hover:border-[#E8740C] transition-all shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-2xl sm:text-3xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-extrabold text-[#1a1b23] text-base sm:text-lg">Other Asset Classes</p>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8740C]/10 text-[#E8740C] text-[11px] font-bold uppercase tracking-wider">
                      7 Options
                    </span>
                  </div>
                  <p className="text-[#64748B] text-xs sm:text-sm mt-1 leading-relaxed">
                    SIP, Gold / SGB, PPF, EPF, NPS, AIF, Crypto
                  </p>
                </div>
              </div>

              <div className="w-full md:w-72 flex-shrink-0">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      selectType(e.target.value as InvestmentType);
                    }
                  }}
                  className="w-full bg-white border-2 border-[#CBD5E1] hover:border-[#E8740C] rounded-xl px-4 py-3.5 text-xs sm:text-sm font-bold text-[#1a1b23] focus:border-[#E8740C] focus:ring-4 focus:ring-[#E8740C]/15 outline-none transition-all cursor-pointer shadow-xs"
                >
                  <option value="" disabled>Select Product to Add ▾</option>
                  {OTHER_PRODUCTS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && selectedType && typeMeta && (
        <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-sm overflow-hidden">
          {/* Selected type header */}
          <div className="px-6 sm:px-8 py-5 border-b border-[#F0F2F5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: typeMeta.bg }}>
              <FontAwesomeIcon icon={typeMeta.icon} style={{ color: typeMeta.color }} className="text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-[#1a1b23] text-base sm:text-lg">{typeMeta.label}</p>
              <p className="text-[#64748B] text-xs sm:text-sm">{typeMeta.desc}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#E8740C] transition-colors px-3.5 py-2 rounded-lg hover:bg-[#FFF8F3]"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
              Change
            </button>
          </div>

          {/* Quick-switch dropdown for Other Products in Step 2 */}
          {OTHER_PRODUCTS.some((o) => o.value === selectedType) && (
            <div className="px-6 sm:px-8 py-3 bg-[#FFF8F3] border-b border-[#FFE0CC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#E8740C] uppercase tracking-wider">
                  Asset Class:
                </span>
                <select
                  value={selectedType}
                  onChange={(e) => selectType(e.target.value as InvestmentType)}
                  className="bg-white border border-[#E8740C]/40 text-[#1a1b23] rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#E8740C]/20 cursor-pointer shadow-2xs"
                >
                  {OTHER_PRODUCTS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-[#64748B]">Switch product anytime</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#c62828] text-sm">
                <FontAwesomeIcon icon={faTriangleExclamation} className="flex-shrink-0 text-xs" />
                {error}
              </div>
            )}

            {autofillMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#EAF5EB] border border-[#A5D6A7] rounded-lg text-[#1b5e20] text-xs font-semibold transition-all">
                <FontAwesomeIcon icon={faCircleCheck} className="flex-shrink-0 text-sm text-[#2E7D32]" />
                {autofillMsg}
              </div>
            )}

            <Field label={isSearchableType ? "Search by Name or Enter Name" : "Investment Name"} required>
              {isSearchableType ? (
                <NameSearchCombobox
                  type={selectedType}
                  value={form.name as string}
                  onChange={(val) => upd("name", val)}
                  onSelect={handleSuggestionSelect}
                  placeholder={
                    selectedType === "stock" ? "Start typing stock name e.g. Tata Motors, Reliance..." :
                    selectedType === "mutual_fund" || selectedType === "sip" ? "Start typing fund name e.g. Parag Parikh, HDFC Top 100..." :
                    "Start typing crypto name e.g. Bitcoin, Solana..."
                  }
                />
              ) : (
                <input
                  value={form.name as string}
                  onChange={e => upd("name", e.target.value)}
                  placeholder={
                    selectedType === "aif" ? "e.g. ICICI Prudential India Equity AIF - Class A" :
                    selectedType === "fd"  ? "e.g. HDFC Bank Fixed Deposit" :
                    "Enter a name..."
                  }
                  className={ic}
                />
              )}
            </Field>

            <TypeForm type={selectedType} form={form} upd={upd} />

            {selectedType !== "aif" ? (
              <Field label="Notes (optional)">
                <textarea
                  value={form.notes as string}
                  onChange={e => upd("notes", e.target.value)}
                  placeholder="Any additional notes or portfolio strategy details..."
                  rows={2}
                  className={ic + " resize-none"}
                />
              </Field>
            ) : (
              <Field label="Additional Remarks / Strategy Details (optional)">
                <textarea
                  value={(form.remarks as string) || ""}
                  onChange={e => upd("remarks", e.target.value)}
                  placeholder="e.g. Drawdown committed over 3 years, minimum lock-in period, hurdle rate..."
                  rows={2}
                  className={ic + " resize-none"}
                />
              </Field>
            )}

            <div className="flex gap-4 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-[#E2E5EB] bg-white rounded-xl py-3.5 text-sm sm:text-base font-bold text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-2 flex-1 bg-[#E8740C] !text-white rounded-xl py-3.5 text-sm sm:text-base font-bold hover:bg-[#d4660b] disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin inline-block" />
                    <span className="!text-white">Saving...</span>
                  </span>
                ) : (
                  <><FontAwesomeIcon icon={faCheck} className="mr-2 text-xs text-white" /><span className="!text-white">Save Investment</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
