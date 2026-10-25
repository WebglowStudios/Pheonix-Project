"use client";

import { useEffect, useState } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faChartLine, faUserCheck, faScaleUnbalancedFlip } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { publicApi } from "@/lib/api";

const PILLAR_ICONS: Record<string, IconDefinition> = {
  faShieldHalved,
  faChartLine,
  faUserCheck,
  faScaleUnbalancedFlip,
};

interface AboutPillar {
  title: string;
  desc: string;
  icon_name: string;
}

interface AboutContent {
  hero_title: string;
  hero_subtitle: string;
  section_heading: string;
  lead: string;
  body_1: string;
  body_2: string;
  why_invest_heading: string;
  why_invest_body: string;
  image_url: string;
  pillars?: AboutPillar[];
  founder_eyebrow?: string;
  founder_experience?: string;
  founder_section_heading?: string;
  founder_name?: string;
  founder_title?: string;
  founder_bio_1?: string;
  founder_bio_2?: string;
  founder_bio_3?: string;
  founder_tagline?: string;
  founder_image?: string;
}

function formatRichText(text?: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return (
        <strong key={i} className="font-bold italic text-[#1F2937]">
          {part.slice(3, -3)}
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#1F2937]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-[#1F2937] font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

const DEFAULTS: AboutContent = {
  hero_title: "About Phoenix Financial Services",
  hero_subtitle: "Most financial firms offer products. We build plans. Phoenix Financial Services was established on the belief that lasting wealth demands structure, discipline, and expertise — not generic advice. Since inception, we have partnered with families, business owners, and institutions to build financial legacies that endure beyond market cycles.",
  section_heading: "Building Wealth With Integrity & Clarity",
  lead: "We understand that every investor brings a unique set of goals, risk appetites, and timelines to the table.",
  body_1: "Phoenix Financial Services was built around one founding belief — that comprehensive, tailored wealth solutions should be available under one roof, without compromise. Whether you are pursuing aggressive equity growth, building a stable fixed-income portfolio, or seeking sophisticated alternative strategies, our expert team is equipped to guide you at every stage.",
  body_2: "We take a disciplined, compliance-first approach — helping clients optimise portfolios, eliminate inefficiencies, and rebalance assets with precision — ensuring every decision is built around long-term net returns, not short-term noise.",
  founder_eyebrow: "Advisory Leadership",
  founder_experience: "20+ Years of Market Experience",
  founder_name: "Chirag Chheda",
  founder_title: "Founder, Phoenix Financial Services",
  founder_bio_1: "With over **two decades of experience** across equity and debt markets, Chirag Chheda brings a *disciplined, research-driven approach* to wealth management — one built on ***conviction, patience, and a deep understanding*** of what it takes to grow and protect long-term wealth.",
  founder_bio_2: "In 2010, he founded **Phoenix Financial Services** on a simple but powerful belief: *wealth creation should be thoughtful, personalised, and aligned with each investor's objectives, risk profile, and long-term interests.* **Not driven by product quotas or market noise.**",
  founder_bio_3: "Today, Chirag shapes Phoenix Financial Services' investment philosophy, ensuring ***every portfolio is designed around the individual — never a standard template.***",
  founder_tagline: "Personalised thinking. Disciplined investing. Long-term perspective.",
  founder_image: "/founder.png",
  why_invest_heading: "Why Invest With Us?",
  why_invest_body: "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.",
  image_url: "/meeting.png",
  pillars: [
    { title: "Integrity First", desc: "All transaction records, commission sheets, and advisory frameworks disclosed upfront.", icon_name: "faShieldHalved" },
    { title: "Research-Driven", desc: "Every recommendation is backed by data, not market hype or generic playbooks.", icon_name: "faChartLine" },
    { title: "Genuine Guidance", desc: "One-on-one advisory built around your goals, timelines, and risk appetite.", icon_name: "faUserCheck" },
    { title: "Fully Compliant", desc: "All products and strategies are in line with the latest SEBI, AMFI, and exchange guidelines.", icon_name: "faScaleUnbalancedFlip" },
  ]
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULTS);

  useEffect(() => {
    publicApi
      .getContent("about_page")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as AboutContent | undefined;
        if (c) setContent({ ...DEFAULTS, ...c });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="bg-[#F2F3F5] py-[80px] text-center border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <h1 className="text-[3rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">{content.hero_title}</h1>
            <p className="text-[1.2rem] text-[#444] max-w-[700px] mx-auto">{content.hero_subtitle}</p>
          </div>
        </section>

        {/* Main About */}
        <section className="py-[80px] bg-white">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[50px] items-center">
              <div className="relative order-2 md:order-1">
                <Image src={content.image_url || "/meeting.png"} alt="Father meeting a financial advisor to plan his family's future" width={560} height={420} className="w-full rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.1)]" />
                <div className="absolute bottom-[-15px] right-[-15px] md:bottom-[-20px] md:right-[-20px] bg-[#E8740C] text-white px-5 py-4 md:px-[30px] md:py-5 rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] text-center">
                  <span className="block text-[1.5rem] md:text-[2.2rem] font-extrabold leading-none">100%</span>
                  <span className="text-[0.7rem] md:text-[0.78rem] font-bold uppercase tracking-[1px] whitespace-nowrap">Client Focus</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-[2.5rem] font-extrabold text-[#333] leading-[1.3] mb-5 tracking-[1.5px]">
                  {content.section_heading.includes("Integrity") ? (
                    <>Building Wealth With <span className="text-[#E8740C]">Integrity &amp; Clarity</span></>
                  ) : content.section_heading}
                </h2>
                <p className="text-[1.15rem] text-[#333] font-semibold mb-5">{content.lead}</p>
                <p className="text-[#444] mb-[30px]">{content.body_1}</p>
                <p className="text-[#444] mb-[30px]">{content.body_2}</p>
              </div>
            </div>
          </div>
        </section>

        {/* About the Founder Section */}
        <section id="founder" className="py-[50px] sm:py-[70px] lg:py-[90px] bg-[#F8F9FA] border-t border-[#E5E7EB]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[400px_1fr] gap-8 sm:gap-10 lg:gap-16 items-center">
              {/* Founder Image Sub-section */}
              <div className="relative group max-w-[280px] sm:max-w-[340px] md:max-w-none mx-auto w-full">
                <div className="absolute inset-0 bg-[#E8740C]/20 rounded-[16px] transform rotate-2 group-hover:rotate-1 transition-transform duration-300" />
                <div className="relative bg-white p-3 sm:p-3.5 rounded-[16px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-[#E5E7EB] overflow-hidden">
                  <div className="relative aspect-[4/4.8] w-full rounded-[12px] overflow-hidden bg-gray-100 shadow-inner">
                    <Image
                      src={content.founder_image || "/founder.png"}
                      alt={`${content.founder_name || "Chirag Chheda"} — ${content.founder_title || "Founder, Phoenix Financial Services"}`}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Founder Narrative Content */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="text-[#E8740C] font-bold text-[11px] sm:text-xs uppercase tracking-[1.5px]">
                    {content.founder_eyebrow || "Advisory Leadership"}
                  </span>
                  <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold text-[#E8740C] bg-[#FFF3EB] px-2.5 py-0.5 rounded-full border border-[#E8740C]/25">
                    {content.founder_experience || "20+ Years of Market Experience"}
                  </span>
                </div>

                <h2 className="text-[1.85rem] sm:text-[2.2rem] lg:text-[2.6rem] font-extrabold text-[#222] leading-tight mb-1.5 tracking-[0.5px]">
                  {content.founder_name || "Chirag Chheda"}
                </h2>

                <div className="mb-4 sm:mb-5 pb-3 border-b border-gray-200/80">
                  <span className="text-xs sm:text-sm font-semibold text-[#E8740C] uppercase tracking-wider">
                    {content.founder_title || "Founder, Phoenix Financial Services"}
                  </span>
                </div>

                <div className="space-y-3.5 sm:space-y-4 text-[#4B5563] text-[0.93rem] sm:text-[1rem] leading-[1.75]">
                  <p>
                    {formatRichText(
                      content.founder_bio_1 ||
                        "With over **two decades of experience** across equity and debt markets, Chirag Chheda brings a *disciplined, research-driven approach* to wealth management — one built on ***conviction, patience, and a deep understanding*** of what it takes to grow and protect long-term wealth."
                    )}
                  </p>
                  <p>
                    {formatRichText(
                      content.founder_bio_2 ||
                        "In 2010, he founded **Phoenix Financial Services** on a simple but powerful belief: *wealth creation should be thoughtful, personalised, and aligned with each investor's objectives, risk profile, and long-term interests.* **Not driven by product quotas or market noise.**"
                    )}
                  </p>
                  <p>
                    {formatRichText(
                      content.founder_bio_3 ||
                        "Today, Chirag shapes Phoenix Financial Services' investment philosophy, ensuring ***every portfolio is designed around the individual — never a standard template.***"
                    )}
                  </p>
                </div>

                <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
                  <div className="relative pl-3.5 sm:pl-4 border-l-[3px] border-[#E8740C] py-1.5 bg-gradient-to-r from-[#FFF3EB]/80 to-transparent rounded-r-[8px]">
                    <p className="text-[0.93rem] sm:text-[1.02rem] font-bold text-[#1F2937] italic tracking-wide leading-snug">
                      &ldquo;{content.founder_tagline || "Personalised thinking. Disciplined investing. Long-term perspective."}&rdquo;
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#E8740C] uppercase tracking-[1.5px] block mt-1 not-italic">
                      Investment Philosophy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Invest With Us */}
        <section className="py-[80px] bg-[#F2F3F5] border-t border-b border-[#DDD]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-[60px] items-start">
              <div>
                <h2 className="text-[2.5rem] font-extrabold text-[#333] leading-[1.2] mb-5 tracking-[1.5px]">
                  {content.why_invest_heading.includes("Why") ? (
                    <>Why Invest <span className="text-[#E8740C]">With Us?</span></>
                  ) : content.why_invest_heading}
                </h2>
                <p className="text-[#444]">{content.why_invest_body}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[25px]">
                {(content.pillars || DEFAULTS.pillars || []).map((p) => {
                  const icon = PILLAR_ICONS[p.icon_name] || faShieldHalved;
                  return (
                    <div key={p.title} className="flex gap-[15px] items-start">
                      <div className="w-[60px] h-[60px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[1.5rem] flex-shrink-0">
                        <FontAwesomeIcon icon={icon} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#333] mb-1.5 tracking-[1.5px]">{p.title}</h4>
                        <p className="text-[0.88rem] text-[#444] leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
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
