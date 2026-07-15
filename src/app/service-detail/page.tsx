"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie, faArrowsSpin, faPercent, faBullseye,
  faChevronDown, faChevronUp, faShieldHalved, faCalculator,
} from "@fortawesome/free-solid-svg-icons";

const faqs = [
  {
    q: "How are mutual funds different from direct equities?",
    a: "Mutual funds pool capital from thousands of investors to buy a diversified basket of stocks managed by professional fund managers. Direct equities involve buying individual shares of companies directly on the stock exchange, placing all research and selection responsibilities on the individual investor. Mutual funds offer diversification and expert management, reducing single-stock risks."
  },
  {
    q: "What is an SIP (Systematic Investment Plan)?",
    a: "An SIP is a method of investing a fixed sum of money regularly (e.g., monthly) into a mutual fund scheme rather than making a one-time lump-sum investment. It instills investing discipline and leverages rupee-cost averaging to buy more units when prices are low and fewer units when prices are high."
  },
  {
    q: "What are liquid funds, and when should I use them?",
    a: "Liquid funds are a category of debt mutual funds that invest in short-term debt instruments and market securities (like treasury bills). They offer high liquidity and capital safety, making them ideal for parking emergency funds or surplus cash for very short tenures (ranging from days to months)."
  }
];

export default function ServiceDetailPage() {
  // Calculator States
  const [monthlySip, setMonthlySip] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);

  // Form States
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Accordion States
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Math for SIP
  const n = tenureYears * 12; // months
  const i = expectedReturn / 12 / 100; // monthly rate
  const investedAmount = monthlySip * n;
  
  let totalValue = 0;
  if (monthlySip > 0 && expectedReturn > 0 && tenureYears > 0) {
    totalValue = monthlySip * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  const estReturns = Math.max(0, totalValue - investedAmount);

  // Form Submit
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  }

  const inputClass = "w-full px-[12px] py-[8px] border border-[#DDD] rounded-[8px] font-[inherit] text-[0.9rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_#FFF3EB]";

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <span className="block text-[0.9rem] font-bold text-[#E8740C] uppercase tracking-[1.5px] mb-[10px]">Service Vertical 01</span>
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Mutual Fund Advisory</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[800px] leading-relaxed">
              Our mutual fund selection desk analyzes historical volatility, underlying sector allocation, and manager tenure to architect a portfolio built to grow and withstand cycles.
            </p>
          </div>
        </section>

        {/* Page Details Layout */}
        <section className="py-[80px] bg-white">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-[60px]">

              {/* Left Column: Content */}
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-[2rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Strategic Wealth Allocation</h2>
                  <p className="text-[#444] text-[1.05rem] leading-[1.7] mb-6">
                    Mutual funds represent the core engine of retail wealth creation in India. Rather than selecting individual stocks which present higher risk profiles, mutual funds offer professionally managed, diversified portfolios that track sectors, indices, or custom combinations. At Phoenix Financial Services, we construct custom mutual fund allocation blocks aligned to your specific target horizons.
                  </p>
                </div>

                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                  <div className="flex gap-3 items-start">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[0.9rem] flex-shrink-0">
                      <FontAwesomeIcon icon={faChartPie} />
                    </div>
                    <div>
                      <h4 className="text-[0.95rem] font-bold text-[#333] mb-1">Optimal Diversification</h4>
                      <p className="text-[0.85rem] text-[#444] leading-[1.5]">Allocation spread across large-cap stability, mid-cap growth, and hybrid buffer pools.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[0.9rem] flex-shrink-0">
                      <FontAwesomeIcon icon={faArrowsSpin} />
                    </div>
                    <div>
                      <h4 className="text-[0.95rem] font-bold text-[#333] mb-1">Quarterly Rebalancing</h4>
                      <p className="text-[0.85rem] text-[#444] leading-[1.5]">We dynamically re-align assets when equity valuations exceed targeted thresholds.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[0.9rem] flex-shrink-0">
                      <FontAwesomeIcon icon={faPercent} />
                    </div>
                    <div>
                      <h4 className="text-[0.95rem] font-bold text-[#333] mb-1">Risk Adjustments</h4>
                      <p className="text-[0.85rem] text-[#444] leading-[1.5]">Automatic portfolio risk reductions as you reach closer to your target milestones.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-[30px] h-[30px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[0.9rem] flex-shrink-0">
                      <FontAwesomeIcon icon={faShieldHalved} />
                    </div>
                    <div>
                      <h4 className="text-[0.95rem] font-bold text-[#333] mb-1">100% Transparent</h4>
                      <p className="text-[0.85rem] text-[#444] leading-[1.5]">All selected schemes comply with the latest AMFI definitions and categorization standards.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-[2rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Our Investment Philosophy</h2>
                  <p className="text-[#444] text-[1.05rem] leading-[1.7] mb-6">
                    We do not believe in chasing temporary chart toppers. Most top performing mutual funds during bull phases experience major drawdowns during market corrections. Our desk uses a multi-factor risk assessment filter that analyzes down-side capture ratios. We prefer fund managers who have managed assets for more than 5 years and have demonstrated consistent outperformance relative to their underlying benchmark indices.
                  </p>
                  <div className="border-l-4 border-[#E8740C] bg-[#FFF3EB] px-5 py-4 rounded-r-[8px] italic text-[#444] my-6">
                    <p className="mb-2 font-medium">&quot;Systematic investing is not about timing the market; it is about time in the market. Consistent, monthly asset accumulation drives compound yields over long cycles.&quot;</p>
                    <span className="text-xs font-bold uppercase text-[#E8740C]">— Investment Committee, Phoenix Financial Services</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-[2rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Advisory vs. Distribution</h2>
                  <p className="text-[#444] text-[1.05rem] leading-[1.7] mb-6">
                    Phoenix Financial Services maintains a highly transparent relationship with all clients. We detail the commission structures for regular plans or direct asset structures beforehand. Under our wealth advisory mandate, we ensure your portfolios are audited, clean of high expense ratio blocks, and balanced properly across debt and equity to minimize tax drag.
                  </p>
                </div>

                {/* FAQ Accordion */}
                <div className="mt-4">
                  <h3 className="text-[1.6rem] font-extrabold text-[#333] mb-6 tracking-[1.5px]">Mutual Fund FAQ</h3>
                  <div className="flex flex-col gap-[15px]">
                    {faqs.map((item, idx) => {
                      const isOpen = !!openFaqs[idx];
                      return (
                        <div key={idx} className={`bg-[#F2F3F5] border rounded-[8px] overflow-hidden transition-all ${isOpen ? "border-[#E8740C]" : "border-[#DDD]"}`}>
                          <button onClick={() => toggleFaq(idx)} className="w-full px-5 py-4 flex justify-between items-center text-left bg-transparent border-none cursor-pointer">
                            <h4 className={`text-[1.05rem] font-bold ${isOpen ? "text-[#E8740C]" : "text-[#333]"}`}>{item.q}</h4>
                            <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="text-[#E8740C] text-sm flex-shrink-0" />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5">
                              <p className="text-sm text-[#444] leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Sidebar */}
              <div className="flex flex-col gap-8">
                {/* Interactive SIP Calculator */}
                <div className="bg-[#F2F3F5] border border-[#DDD] rounded-[8px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#DDD]">
                    <FontAwesomeIcon icon={faCalculator} className="text-[#E8740C] text-[1.2rem]" />
                    <h3 className="text-[1.2rem] font-bold text-[#333] tracking-[1.5px]">Interactive SIP Calculator</h3>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Monthly SIP Amount */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-[#444]">Monthly SIP</span>
                        <span className="text-sm font-bold text-[#E8740C]">₹{monthlySip.toLocaleString("en-IN")}</span>
                      </div>
                      <input type="range" min={500} max={100000} step={500} value={monthlySip} onChange={(e) => setMonthlySip(Number(e.target.value))} className="w-full accent-[#E8740C] cursor-pointer" />
                    </div>

                    {/* Expected Return Rate */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-[#444]">Expected Return (p.a.)</span>
                        <span className="text-sm font-bold text-[#E8740C]">{expectedReturn}%</span>
                      </div>
                      <input type="range" min={1} max={30} step={0.5} value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full accent-[#E8740C] cursor-pointer" />
                    </div>

                    {/* Tenure in Years */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-[#444]">Tenure</span>
                        <span className="text-sm font-bold text-[#E8740C]">{tenureYears} Years</span>
                      </div>
                      <input type="range" min={1} max={40} step={1} value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))} className="w-full accent-[#E8740C] cursor-pointer" />
                    </div>

                    {/* Calculator Output Display */}
                    <div className="bg-white border border-[#DDD] rounded-[8px] p-4 flex flex-col gap-3 mt-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between text-xs font-semibold text-[#444]">
                        <span>Invested Amount:</span>
                        <span className="font-bold text-[#333]">₹{Math.round(investedAmount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-[#444]">
                        <span>Est. Returns:</span>
                        <span className="font-bold text-[#333]">₹{Math.round(estReturns).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-[#333] border-t border-[#DDD] pt-2.5 mt-1">
                        <span>Total Value:</span>
                        <span className="text-[#E8740C]">₹{Math.round(totalValue).toLocaleString("en-IN")}</span>
                      </div>

                      {/* Visual Progress Ratio Bar */}
                      {totalValue > 0 && (
                        <div className="w-full h-2.5 bg-[#FFF3EB] rounded-full overflow-hidden flex mt-2.5">
                          <div style={{ width: `${(investedAmount / totalValue) * 100}%` }} className="bg-[#FF9433] h-full" />
                          <div style={{ width: `${(estReturns / totalValue) * 100}%` }} className="bg-[#E8740C] h-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consult Advisor Sidebar Form */}
                <div className="bg-[#F2F3F5] border border-[#DDD] rounded-[8px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <h3 className="text-[1.2rem] font-bold text-[#333] mb-1 tracking-[1.5px]">Consult a Fund Advisor</h3>
                  <p className="text-xs text-[#444] mb-5">Schedule a free mutual fund portfolio audit and gap analysis.</p>
                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#444] mb-1.5 uppercase">Full Name</label>
                      <input type="text" placeholder="John Doe" required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#444] mb-1.5 uppercase">Phone Number</label>
                      <input type="tel" placeholder="+91 00000 00000" required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#444] mb-1.5 uppercase">Email Address</label>
                      <input type="email" placeholder="john@example.com" required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#444] mb-1.5 uppercase">Target Goal</label>
                      <textarea rows={3} placeholder="e.g. Retirement planning in 15 years..." required className={inputClass + " resize-y"} />
                    </div>
                    <button type="submit" disabled={loading || submitted}
                      className={`w-full px-5 py-2.5 rounded-[30px] font-semibold text-sm text-white border-2 transition-all ${submitted ? "bg-[#28a745] border-[#28a745]" : "bg-[#E8740C] border-[#E8740C] hover:bg-[#FF9433] hover:border-[#FF9433]"}`}>
                      {loading ? "Submitting..." : submitted ? "✓ Request Received!" : "Schedule Free Audit"}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
