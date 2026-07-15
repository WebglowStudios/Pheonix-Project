"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faChevronDown, faChevronRight, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

const groups = [
  {
    category: "general",
    title: "Getting Started",
    items: [
      { q: "Who can invest with Phoenix Financial Services?", a: "We work with individuals, families, business owners, and institutions across all investment stages — from first-time investors to seasoned HNIs looking for sophisticated wealth strategies." },
      { q: "How do I get started?", a: "Simply reach out through our Contact page or WhatsApp. Our advisors will schedule a free consultation to understand your goals and recommend the right solutions." },
      { q: "Is there a minimum investment amount?", a: "Minimums vary by product — SIPs can start as low as ₹500, while PMS requires a minimum of ₹50 lakhs as per SEBI guidelines. Our advisors will guide you to the right entry point." },
    ],
  },
  {
    category: "products",
    title: "Products & Services",
    items: [
      { q: "What products does Phoenix Financial Services offer?", a: "We offer a complete suite across Mutual Funds, Equity Advisory, PMS, AIF, SIF, Capital Shield, Bonds & NCDs, Corporate Fixed Deposits, Loan Against Shares & Mutual Funds, and a Self-Directed Investing platform." },
      { q: "What is a Structured Capital Protection Plan?", a: "It is a market-linked investment product that gives you participation in NIFTY's upside while protecting your principal — ideal for investors who want equity exposure without full market risk." },
      { q: "What is the difference between PMS and Mutual Funds?", a: "Mutual Funds pool money from multiple investors into a diversified portfolio. PMS offers a directly owned, customised equity portfolio managed by a dedicated portfolio manager — suited for investors with higher capital and sophisticated requirements." },
      { q: "Can I take a loan against my existing investments?", a: "Yes. Our Loan Against Shares & Mutual Funds (LAS/LAMF) facility lets you unlock liquidity from your existing portfolio at competitive rates — without having to sell your investments." },
    ],
  },
  {
    category: "fees",
    title: "Advisory & Process",
    items: [
      { q: "How does Phoenix Financial Services select investments?", a: "Every recommendation is research-driven and aligned to your specific goals, risk appetite, and time horizon. We do not follow a one-size-fits-all approach." },
      { q: "How often will my portfolio be reviewed?", a: "We conduct periodic portfolio reviews and proactive rebalancing as market conditions evolve — ensuring your investments stay aligned to your goals at every stage." },
      { q: "Are your advisors SEBI registered?", a: "Yes. Phoenix Financial Services operates in full compliance with SEBI and AMFI guidelines across all distribution and broking activities as an authorised Sharekhan partner." },
    ],
  },
  {
    category: "loans",
    title: "Trust & Safety",
    items: [
      { q: "Is my money safe with Phoenix Financial Services?", a: "Your investments are held directly in your name with SEBI-registered custodians, AMCs, and depositories — Phoenix Financial Services acts as your advisor, not a custodian of your funds." },
      { q: "How is Phoenix Financial Services regulated?", a: "We are a SEBI and AMFI compliant firm and an authorised Sharekhan partner, operating under the full regulatory framework governing financial advisory and distribution in India." },
    ],
  },
];

const filters = [
  { key: "all", label: "All Categories" },
  { key: "general", label: "Getting Started" },
  { key: "products", label: "Products & Services" },
  { key: "fees", label: "Advisory & Process" },
  { key: "loans", label: "Trust & Safety" },
];

export default function FaqPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = useMemo(() => {
    return groups
      .filter((g) => activeFilter === "all" || g.category === activeFilter)
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            search === "" ||
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [activeFilter, search]);

  const inputClass = "w-full pl-[45px] pr-4 py-3 border border-[#DDD] rounded-[8px] font-[inherit] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_#FFF3EB]";

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] text-center border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">Frequently Asked Questions</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[700px] mx-auto">
              Clarity before commitment. Find answers to the questions that matter most about investing with Phoenix Financial Services.
            </p>
          </div>
        </section>

        {/* FAQ Layout */}
        <section className="py-[100px] bg-[#F2F3F5]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[60px]">

              {/* Sidebar */}
              <aside className="flex flex-col gap-[25px] lg:sticky lg:top-[120px] lg:self-start">
                {/* Search */}
                <div className="relative">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-[18px] top-[14px] text-[#444]" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Category filters */}
                <div className="flex flex-col gap-[10px]">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`text-left px-5 py-[14px] border rounded-[8px] font-semibold cursor-pointer transition-all flex items-center justify-between text-[0.95rem] font-[inherit] ${
                        activeFilter === f.key
                          ? "bg-[#E8740C] text-white border-[#E8740C]"
                          : "bg-white text-[#333] border-[#DDD] hover:border-[#E8740C] hover:text-[#E8740C] hover:bg-[#FFF3EB]"
                      }`}
                    >
                      {f.label}
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`transition-all text-sm ${activeFilter === f.key ? "text-white translate-x-[3px]" : "text-[#DDD]"}`}
                      />
                    </button>
                  ))}
                </div>

                {/* Support card */}
                <div className="bg-white border border-dashed border-[#FF9433] p-[25px] rounded-[8px]">
                  <h4 className="text-[1.1rem] font-bold text-[#333] mb-2 tracking-[1.5px]">Still have questions?</h4>
                  <p className="text-[0.85rem] text-[#444] mb-[15px]">Speak to our advisory team for personalized consultation.</p>
                  <Link href="/contact" className="block w-full text-center px-4 py-[10px] rounded-[30px] font-semibold text-[0.85rem] bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433]">
                    Speak to an Advisor
                  </Link>
                </div>
              </aside>

              {/* Accordion content */}
              <div className="flex flex-col gap-[40px]">
                {filtered.length === 0 ? (
                  <div className="text-center py-[50px]">
                    <FontAwesomeIcon icon={faCircleQuestion} className="text-[3rem] text-[#DDD] mb-[15px] block" />
                    <h4 className="text-[1.2rem] text-[#333] mb-1 tracking-[1.5px]">No FAQs Found</h4>
                    <p className="text-[#444] text-[0.9rem]">No questions matched your search query. Try another term!</p>
                  </div>
                ) : (
                  filtered.map((group) => (
                    <div key={group.category}>
                      <h3 className="text-[1.3rem] font-extrabold text-[#333] mb-5 border-l-4 border-[#E8740C] pl-3 uppercase tracking-[0.5px]">
                        {group.title}
                      </h3>
                      <div className="flex flex-col gap-[15px]">
                        {group.items.map((item, i) => {
                          const key = `${group.category}-${i}`;
                          const isOpen = !!openItems[key];
                          return (
                            <div key={key} className={`bg-white border rounded-[8px] overflow-hidden ${isOpen ? "border-[#E8740C]" : "border-[#DDD]"}`}>
                              <button
                                className="w-full px-5 py-5 flex justify-between items-center bg-white text-left cursor-pointer"
                                onClick={() => toggleItem(key)}
                              >
                                <h4 className={`text-[1.1rem] font-medium pr-4 tracking-[0px] ${isOpen ? "text-[#E8740C]" : "text-[#333]"}`}
                                  style={{ fontFamily: "var(--font-main, Outfit, sans-serif)" }}>
                                  {item.q}
                                </h4>
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className={`text-[#E8740C] flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-5 pb-5">
                                  <p className="text-[#444] text-[0.95rem]">{item.a}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
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
