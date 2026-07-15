"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const faqs = [
  { q: "How do I get started?", a: "Simply reach out through our Contact page or WhatsApp. Our advisors will schedule a free consultation to understand your goals and recommend the right solutions." },
  { q: "Is there a minimum investment amount?", a: "Minimums vary by product — SIPs can start as low as ₹500, while PMS requires a minimum of ₹50 lakhs as per SEBI guidelines. Our advisors will guide you to the right entry point." },
  { q: "What products does Phoenix Financial Services offer?", a: "We offer a complete suite across Mutual Funds, Equity Advisory, PMS, AIF, SIF, Capital Shield, Bonds & NCDs, Corporate Fixed Deposits, Loan Against Shares & Mutual Funds, and a Self-Directed Investing platform." },
  { q: "Is my money safe with Phoenix Financial Services?", a: "Your investments are held directly in your name with SEBI-registered custodians, AMCs, and depositories — Phoenix Financial Services acts as your advisor, not a custodian of your funds." },
];

export default function FaqSection() {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section className="py-[100px] bg-[#F2F3F5]">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[60px]">
          {/* Header col */}
          <div>
            <h2 className="text-[2.5rem] font-extrabold text-[#333] leading-[1.2] mb-5 tracking-[1.5px]">
              Frequently Asked <span className="text-[#E8740C]">Questions</span>
            </h2>
            <p className="text-[1.1rem] text-[#444] mb-5">
              Clarity before commitment. Find answers to the questions that matter most about investing with Phoenix Financial Services.
            </p>
            <Link href="/faq" className="inline-block mt-5 px-6 py-3 rounded-[30px] font-semibold bg-transparent !text-[#333] border-2 border-[#333] transition-all hover:bg-[#333] hover:!text-white">
              View All FAQs
            </Link>
          </div>

          {/* Accordion */}
          <div className="flex flex-col gap-[15px]">
            {faqs.map((faq, i) => (
              <div key={i} className={`bg-white border rounded-[8px] overflow-hidden ${active === i ? "border-[#E8740C]" : "border-[#DDD]"}`}>
                <button
                  className="w-full px-5 py-5 flex justify-between items-center bg-white text-left cursor-pointer"
                  onClick={() => setActive(active === i ? null : i)}
                >
                  <h4 className={`text-[1.1rem] font-bold pr-4 !tracking-[0px] ${active === i ? "text-[#E8740C]" : "text-[#333]"}`} style={{ fontFamily: "var(--font-main, Outfit, sans-serif)" }}>
                    {faq.q}
                  </h4>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-[#E8740C] flex-shrink-0 transition-transform duration-300 ${active === i ? "rotate-180" : ""}`}
                  />
                </button>
                {active === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#444] text-[0.95rem]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
