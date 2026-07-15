"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp, faSeedling, faBriefcase, faShieldHalved,
  faHandHoldingDollar, faCoins, faPercent, faBuildingColumns,
  faVault, faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

interface Product {
  category: string;
  icon?: IconDefinition;
  iconImg?: string;
  title: string;
  desc: string;
  features: string[];
}

const products: Product[] = [
  {
    category: "growth",
    icon: faArrowTrendUp,
    title: "Equity Advisory",
    desc: "Build a high-conviction, research-backed direct equity portfolio tailored to your risk profile and return expectations. Our advisors identify opportunities across large-cap, mid-cap, and small-cap segments - with continuous monitoring, timely entry/exit guidance, and disciplined portfolio reviews to keep your equity investments performing.",
    features: [
      "Large, mid & small-cap coverage",
      "Timely entry/exit guidance",
      "Disciplined portfolio reviews"
    ]
  },
  {
    category: "growth",
    icon: faSeedling,
    title: "Mutual Funds",
    desc: "Build wealth systematically with expertly curated mutual fund portfolios. We align fund selection across equity, debt, hybrid, ELSS, and international categories to your specific goals, risk profile, and tax situation - backed by disciplined SIP structuring and regular portfolio reviews.",
    features: [
      "Systematic Investment Plans (SIP)",
      "Regular portfolio performance auditing",
      "Direct and regular fund reviews"
    ]
  },
  {
    category: "pinnacle",
    icon: faBriefcase,
    title: "Portfolio Management Services (PMS)",
    desc: "For investors seeking a more sophisticated, professionally managed equity portfolio, our PMS offering delivers customized strategies built around your wealth objectives. With a dedicated portfolio manager, higher concentration bets, and direct stock ownership, PMS goes beyond mutual funds to deliver a truly personalized investment experience.",
    features: [
      "Dedicated portfolio manager",
      "Direct stock ownership",
      "Truly personalized strategy"
    ]
  },
  {
    category: "growth",
    icon: faShieldHalved,
    title: "Capital Shield",
    desc: "Capital Shield Product lets you capture market-linked upside tied to your chosen underlying instrument — Nifty, Gold, or Bonds — with the comfort of capital protection built in. Designed for investors who want to participate in market growth without taking on full market risk, this is a smarter way to stay invested across asset classes.",
    features: [
      "Capital protection built in",
      "Upside linked to chosen underlying (Nifty / Gold / Bonds)",
      "Reduced full market risk exposure"
    ]
  },
  {
    category: "pinnacle",
    icon: faHandHoldingDollar,
    title: "Specialised Investment Funds (SIF)",
    desc: "A new, SEBI-regulated investment category bridging the gap between mutual funds and PMS. SIFs offer flexible, higher-conviction strategies with lower entry thresholds than PMS - ideal for experienced investors seeking differentiated portfolio exposure with professional oversight.",
    features: [
      "SEBI-regulated category",
      "Higher-conviction strategies",
      "Lower entry threshold than PMS"
    ]
  },
  {
    category: "pinnacle",
    icon: faCoins,
    title: "Alternative Investment Funds (AIF)",
    desc: "Access institutional-grade investment opportunities beyond traditional asset classes. Our AIF solutions span private equity, venture capital, hedge funds, and real estate strategies - designed for sophisticated investors looking to diversify and enhance portfolio returns with carefully managed risk.",
    features: [
      "Private equity & venture capital",
      "Hedge funds & real estate",
      "Institutional-grade opportunities"
    ]
  },
  {
    category: "anchor",
    icon: faPercent,
    title: "Loan Against Shares & Mutual Funds",
    desc: "Unlock liquidity without liquidating your long-term investments. Our LAS/LAMF facility lets you access funds at competitive interest rates, using your existing portfolio as collateral - so your wealth keeps growing while you meet immediate requirements.",
    features: [
      "Competitive interest rates",
      "Portfolio stays intact & growing",
      "Quick access to liquidity"
    ]
  },
  {
    category: "anchor",
    icon: faBuildingColumns,
    title: "Bonds & NCDs",
    desc: "Invest in government securities, corporate bonds, and non-convertible debentures for stable, predictable income. Our fixed-income specialists curate bond portfolios aligned to your yield expectations, credit risk appetite, and investment tenure - balancing return with capital safety.",
    features: [
      "Government & corporate bonds",
      "Non-convertible debentures (NCDs)",
      "Yield-aligned portfolio curation"
    ]
  },
  {
    category: "anchor",
    icon: faVault,
    title: "Corporate Fixed Deposits",
    desc: "Earn higher, stable returns with Corporate Fixed Deposits - a reliable fixed-income option backed by reputed companies and NBFCs. Ideal for investors seeking predictable returns and capital preservation, with flexible tenures to match your financial goals.",
    features: [
      "Backed by reputed companies & NBFCs",
      "Flexible tenures available",
      "Capital preservation focus"
    ]
  },
  {
    category: "suite",
    iconImg: "/aio.png",
    title: "All-in-One Access — Self-Directed Investing",
    desc: "A Self-Directed Investing account that complements your advised portfolio - offering ETFs, Equity Mutual Funds, and Options trading, with access to research and tools to manage your investments with confidence.",
    features: [
      "ETFs, Equity MFs & Options trading",
      "Research & tools access",
      "Complements your advised portfolio"
    ]
  }
];

const filters = [
  { key: "all", label: "Suite" },
  { key: "growth", label: "Growth" },
  { key: "anchor", label: "Anchor" },
  { key: "pinnacle", label: "Pinnacle" }
];

export default function ServicesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const filtered = activeFilter === "all" ? products : products.filter((p) => p.category === activeFilter);

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] text-center border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Our Services &amp; Products</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[700px] mx-auto">
              We provide a comprehensive range of financial instruments tailored to individual risk appetites, helping you build a diversified portfolio managed by experts.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-[40px] bg-white border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex justify-center gap-[12px] w-full max-w-[600px] mx-auto">
              {filters.map((f) => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`flex-1 text-center py-[10px] px-[15px] border rounded-[20px] font-semibold cursor-pointer transition-all text-[0.95rem] font-[inherit] whitespace-nowrap min-w-0 ${
                    activeFilter === f.key
                      ? "border-[#E8740C] text-[#E8740C] bg-[#FFF3EB]"
                      : "border-[#DDD] text-[#444] bg-white hover:border-[#E8740C] hover:text-[#E8740C] hover:bg-[#FFF3EB]"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid (1 Column Grid) */}
        <section className="py-[80px] bg-[#F2F3F5]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 gap-[30px]">
              {filtered.map((p, index) => {
                const isAlt = index % 2 === 1;
                return (
                  <div key={p.title} className="bg-white border border-[#DDD] rounded-[8px] p-[40px] flex flex-col md:flex-row gap-[25px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C]">
                    <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center text-[1.8rem] flex-shrink-0 text-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${isAlt ? "bg-gradient-to-br from-[#666] to-[#333]" : "bg-gradient-to-br from-[#FF9433] to-[#E8740C]"}`}>
                      {p.iconImg ? (
                        <img src={p.iconImg} alt={p.title} className="w-[36px] h-[36px] object-contain block" />
                      ) : p.icon ? (
                        <FontAwesomeIcon icon={p.icon} />
                      ) : null}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-[1.4rem] font-extrabold text-[#E8740C] mb-[15px] tracking-[1.5px]">{p.title}</h3>
                      <p className="text-[#444] text-[0.95rem] leading-[1.5] mb-5">{p.desc}</p>
                      <ul className="flex flex-col gap-2">
                        {p.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2 text-[0.9rem] font-medium text-[#333]">
                            <FontAwesomeIcon icon={faCheck} className="text-[#E8740C] text-[0.85rem]" /> {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
