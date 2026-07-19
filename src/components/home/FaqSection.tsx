"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const DEFAULTS = {
  section_heading: "Frequently Asked Questions",
  section_subheading:
    "Clarity before commitment. Find answers to the questions that matter most about investing with Phoenix Financial Services.",
};

export default function FaqSection() {
  const [active, setActive] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [heading, setHeading] = useState(DEFAULTS.section_heading);
  const [subheading, setSubheading] = useState(DEFAULTS.section_subheading);

  useEffect(() => {
    // Fetch section heading/subheading
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "home_faq")
      .single()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as { section_heading?: string; section_subheading?: string };
          if (c.section_heading) setHeading(c.section_heading);
          if (c.section_subheading) setSubheading(c.section_subheading);
        }
      });

    // Fetch specific FAQ questions
    supabase
      .from("faqs")
      .select("id, question, answer")
      .order("sort_order", { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFaqs(data);
          setActive(data[0]?.id ?? null);
        }
      });
  }, []);

  // Parse heading for orange highlight on last word
  const headingWords = heading.split(" ");
  const lastWord = headingWords.pop();
  const headingStart = headingWords.join(" ");

  return (
    <section className="py-[100px] bg-[#F2F3F5]">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-[60px]">
          {/* Header col */}
          <div>
            <h2 className="text-[2.5rem] font-extrabold text-[#333] leading-[1.2] mb-5 tracking-[1.5px]">
              {headingStart} <span className="text-[#E8740C]">{lastWord}</span>
            </h2>
            <p className="text-[1.1rem] text-[#444] mb-5">{subheading}</p>
            <Link
              href="/faq"
              className="inline-block mt-5 px-6 py-3 rounded-[30px] font-semibold bg-transparent !text-[#333] border-2 border-[#333] transition-all hover:bg-[#333] hover:!text-white"
            >
              View All FAQs
            </Link>
          </div>

          {/* Accordion */}
          <div className="flex flex-col gap-[15px]">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className={`bg-white border rounded-[8px] overflow-hidden ${
                  active === faq.id ? "border-[#E8740C]" : "border-[#DDD]"
                }`}
              >
                <button
                  className="w-full px-5 py-5 flex justify-between items-center bg-white text-left cursor-pointer"
                  onClick={() => setActive(active === faq.id ? null : faq.id)}
                >
                  <h4
                    className={`text-[1.1rem] font-bold pr-4 !tracking-[0px] ${
                      active === faq.id ? "text-[#E8740C]" : "text-[#333]"
                    }`}
                    style={{ fontFamily: "var(--font-main, Outfit, sans-serif)" }}
                  >
                    {faq.question}
                  </h4>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-[#E8740C] flex-shrink-0 transition-transform duration-300 ${
                      active === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {active === faq.id && (
                  <div className="px-5 pb-5">
                    <p className="text-[#444] text-[0.95rem]">{faq.answer}</p>
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
