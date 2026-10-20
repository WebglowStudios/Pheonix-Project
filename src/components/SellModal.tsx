"use client";

import { useState, useMemo } from "react";
import { type Investment, type SellResult, portfolioApi, adminApi } from "@/lib/api";
import { fmtIndianCurrency, fmtNumber, formatDateIndian } from "@/lib/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faArrowTrendUp,
  faCoins,
  faShieldHalved,
  faCheck,
  faSpinner,
  faStar,
  faHandHoldingDollar,
  faScaleBalanced,
  faPercent,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  investment: Investment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: SellResult) => void;
  isAdmin?: boolean;
}

export default function SellModal({
  investment,
  isOpen,
  onClose,
  onSuccess,
  isAdmin = false,
}: Props) {
  if (!isOpen || !investment) return null;

  const availableUnits = investment.units || (investment.type === "sip" ? investment.instalments || 1 : 1);
  const buyPrice =
    investment.buyPrice ||
    (investment.investedAmount > 0 && availableUnits > 0
      ? investment.investedAmount / availableUnits
      : 0);
  const currentPrice = investment.currentPrice && investment.currentPrice > 0
    ? investment.currentPrice
    : buyPrice;

  // Form states
  const [unitsToSell, setUnitsToSell] = useState<number>(availableUnits);
  const [sellPrice, setSellPrice] = useState<number>(currentPrice);
  const [sellDate, setSellDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Total original capital invested
  const originalCapital = investment.originalInvestedAmount || investment.investedAmount || 0;

  // Real-time compounding & capital recovery calculations
  const calc = useMemo(() => {
    const qty = Number(unitsToSell) || 0;
    const price = Number(sellPrice) || 0;

    const totalProceeds = Math.round(qty * price * 100) / 100;
    const costOfSold = Math.round(qty * buyPrice * 100) / 100;
    const realizedProfit = Math.round((totalProceeds - costOfSold) * 100) / 100;
    const realizedProfitPct = costOfSold > 0 ? (realizedProfit / costOfSold) * 100 : 0;

    const remainingQty = Math.max(0, Math.round((availableUnits - qty) * 1000) / 1000);
    const remainingMarketVal = Math.round(remainingQty * price * 100) / 100;
    const remainingCostBasis = Math.round(remainingQty * buyPrice * 100) / 100;

    // Cumulative proceeds check: Does this sale recover the entire original investment?
    const cumulativeProceeds = (investment.totalProceeds || 0) + totalProceeds;
    const isFreeShares = cumulativeProceeds >= originalCapital && originalCapital > 0 && remainingQty > 0;
    const capitalRecoveryPct = originalCapital > 0
      ? Math.min(200, Math.round((cumulativeProceeds / originalCapital) * 100))
      : 100;

    return {
      qty,
      price,
      totalProceeds,
      costOfSold,
      realizedProfit,
      realizedProfitPct,
      remainingQty,
      remainingMarketVal,
      remainingCostBasis,
      cumulativeProceeds,
      isFreeShares,
      capitalRecoveryPct,
    };
  }, [unitsToSell, sellPrice, availableUnits, buyPrice, investment.totalProceeds, originalCapital]);

  // Quick unit shortcuts
  const handleQuickPercent = (pct: number) => {
    const qty = Math.round((availableUnits * (pct / 100)) * 1000) / 1000;
    setUnitsToSell(qty);
    setError("");
  };

  // Capital Recovery calculation: How many shares needed to recover 100% of original investment
  const handleRecoverPrincipal = () => {
    const effectivePrice = Number(sellPrice) || currentPrice;
    if (effectivePrice <= 0) return;
    const remainingCapitalToRecover = Math.max(0, originalCapital - (investment.totalProceeds || 0));
    const targetQty = Math.ceil(remainingCapitalToRecover / effectivePrice);
    const safeQty = Math.min(availableUnits, Math.max(1, targetQty));
    setUnitsToSell(safeQty);
    setError("");
  };

  const handleExecuteSell = async () => {
    if (calc.qty <= 0) {
      setError("Please specify a valid quantity to sell.");
      return;
    }
    if (calc.qty > availableUnits) {
      setError(`Cannot sell more than available quantity (${availableUnits} units).`);
      return;
    }
    if (calc.price <= 0) {
      setError("Please specify a valid selling price per unit.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        units: calc.qty,
        sellPrice: calc.price,
        sellDate,
        notes,
      };

      const res = isAdmin
        ? await adminApi.sellInvestment(investment._id, payload)
        : await portfolioApi.sell(investment._id, payload);

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError((res as any)?.message || "Failed to process sale. Please try again.");
      }
    } catch (err: any) {
      console.error("Sell execution failed:", err);
      setError(err?.message || "An unexpected error occurred during sale execution.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#16171E] text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E8740C] to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <FontAwesomeIcon icon={faScaleBalanced} className="text-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Sell &amp; Capital Freeing</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Compounding
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Recover invested capital &amp; retain risk-free compounding shares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Asset Summary Card */}
          <div className="bg-gradient-to-br from-gray-50 to-amber-50/30 rounded-xl p-4 border border-gray-200/90 shadow-xs">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 leading-tight">
                  {investment.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                  {investment.symbol && (
                    <span className="font-mono px-1.5 py-0.2 bg-gray-200/80 rounded text-gray-800 font-bold">
                      {investment.symbol}
                    </span>
                  )}
                  {investment.exchange && <span>· {investment.exchange}</span>}
                  <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-amber-100/70 text-amber-800 font-bold">
                    {investment.type.replace("_", " ")}
                  </span>
                </div>
              </div>
              {investment.isFreeShare && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs animate-pulse">
                  <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                  FREE SHARES
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200/70 text-center">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Holding Qty</div>
                <div className="text-xs font-black text-gray-900 mt-0.5">{fmtNumber(availableUnits, 2)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Buy Price</div>
                <div className="text-xs font-black text-gray-800 mt-0.5">{fmtIndianCurrency(buyPrice)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Price</div>
                <div className="text-xs font-black text-[#1565C0] mt-0.5">{fmtIndianCurrency(currentPrice)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invested Capital</div>
                <div className="text-xs font-black text-gray-900 mt-0.5">{fmtIndianCurrency(originalCapital)}</div>
              </div>
            </div>
          </div>

          {/* Sell Form Inputs */}
          <div className="space-y-4">
            {/* Units to Sell Input & Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Quantity to Sell <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500">
                  Available: <strong>{fmtNumber(availableUnits, 2)}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.001"
                  max={availableUnits}
                  step="any"
                  value={unitsToSell}
                  onChange={(e) => {
                    setUnitsToSell(Number(e.target.value));
                    setError("");
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/20 outline-none transition-all"
                  placeholder="Enter units to sell..."
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  Units
                </span>
              </div>

              {/* Quick Percent Buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickPercent(25)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(75)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(100)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  100% (All)
                </button>
                <button
                  type="button"
                  onClick={handleRecoverPrincipal}
                  className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-300 transition-all flex items-center gap-1"
                  title="Calculates exact quantity to sell to retrieve 100% of your invested capital"
                >
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                  Recover Capital Only
                </button>
              </div>
            </div>

            {/* Sell Price & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Execution Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={sellPrice}
                    onChange={(e) => {
                      setSellPrice(Number(e.target.value));
                      setError("");
                    }}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sell Date
                </label>
                <input
                  type="date"
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Memo / Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Notes &amp; Advisory Reason <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Profit booking, partial exit to compound in new asset..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* ── Compounding & Free Shares Real-Time HUD ───────────────── */}
          <div className="bg-[#0D0F17] text-white rounded-2xl p-4 border border-gray-800 shadow-lg relative overflow-hidden">
            {/* Top Amber Radiant Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#E8740C] to-emerald-500" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCoins} className="text-amber-400 text-xs" />
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-300">
                  Sale Proceeds &amp; Free Shares HUD
                </span>
              </div>
              {calc.isFreeShares ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  ✓ 100% Capital Recovered
                </span>
              ) : (
                <span className="text-[11px] font-bold text-gray-400">
                  {calc.capitalRecoveryPct}% Capital Recovered
                </span>
              )}
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Cash Proceeds Released</div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  {fmtIndianCurrency(calc.totalProceeds)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {fmtNumber(calc.qty, 2)} units @ {fmtIndianCurrency(calc.price)}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Realized Profit (P&amp;L)</div>
                <div
                  className={`text-base font-black mt-0.5 ${
                    calc.realizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {calc.realizedProfit >= 0 ? "+" : ""}
                  {fmtIndianCurrency(calc.realizedProfit)}
                </div>
                <div
                  className={`text-[10px] font-semibold mt-0.5 ${
                    calc.realizedProfitPct >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {calc.realizedProfitPct >= 0 ? "+" : ""}
                  {fmtNumber(calc.realizedProfitPct, 1)}% Return on Sold
                </div>
              </div>
            </div>

            {/* Capital Recovery Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                <span>Capital Recovery Progress</span>
                <span className={calc.capitalRecoveryPct >= 100 ? "text-emerald-400 font-extrabold" : "text-gray-300"}>
                  {fmtIndianCurrency(calc.cumulativeProceeds)} / {fmtIndianCurrency(originalCapital)} ({calc.capitalRecoveryPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, calc.capitalRecoveryPct)}%`,
                    backgroundColor: calc.capitalRecoveryPct >= 100 ? "#10B981" : "#E8740C",
                  }}
                />
              </div>
            </div>

            {/* Remaining Compounding Holding Box */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                calc.isFreeShares
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-white/5 border-white/10 text-gray-300"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span>Remaining in Portfolio:</span>
                  <strong className="text-white font-extrabold">{fmtNumber(calc.remainingQty, 2)} Units</strong>
                </div>
                <span className="text-white font-extrabold">{fmtIndianCurrency(calc.remainingMarketVal)}</span>
              </div>

              {calc.isFreeShares ? (
                <div className="mt-2 text-[11px] text-emerald-300 flex items-start gap-1.5 leading-relaxed">
                  <FontAwesomeIcon icon={faStar} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Free Shares Achieved!</strong> Your original capital of{" "}
                    {fmtIndianCurrency(originalCapital)} is 100% recovered. These {fmtNumber(calc.remainingQty, 2)}{" "}
                    shares now sit in your portfolio with <strong>₹0 capital at risk</strong>, compounding pure profit indefinitely!
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-gray-400">
                  Book cost: {fmtIndianCurrency(calc.remainingCostBasis)} · Will continue holding in portfolio
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteSell}
            disabled={submitting || calc.qty <= 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8740C] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                Executing Sale...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                Confirm &amp; Execute Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
