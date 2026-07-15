"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const faqs = [
  { q: "Are your services fully regulated and compliant?", a: "Yes, absolutely. Phoenix Financial Services strictly adheres to all regulatory guidelines set by the Securities and Exchange Board of India (SEBI) and the Association of Mutual Funds in India (AMFI). All our products are fully compliant and regulated." },
  { q: "What is the minimum investment required?", a: "The minimum investment varies by product. Mutual Funds can be started via SIP with as little as ₹500/month. However, specialized products like Portfolio Management Services (PMS) or Alternate Investment Funds (AIF) have regulatory minimums set by SEBI (typically ₹50 Lakhs and ₹1 Crore respectively)." },
  { q: "How do you charge for your services?", a: "We maintain a highly transparent fee structure. Depending on the service (Advisory vs. Distribution), fees are either charged directly as an advisory fee or we receive commissions from the AMC. All fees and charges are fully disclosed before you make any investment." },
  { q: "Can I get a loan against my current investments?", a: "Yes. We offer Loan Against Shares and Mutual Funds (LAS/LAMF). This allows you to unlock liquidity for short-term needs at highly competitive interest rates without having to liquidate your long-term portfolio." },
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
              Everything you need to know about investing with Phoenix Financial Services.
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
                  <h4 className={`text-[1.1rem] font-medium pr-4 tracking-[0px] ${active === i ? "text-[#E8740C]" : "text-[#333]"}`} style={{ fontFamily: "var(--font-main, Outfit, sans-serif)" }}>
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
