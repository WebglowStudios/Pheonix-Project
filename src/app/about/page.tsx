"use client";

import { useEffect, useState } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faChartLine, faUserCheck, faScaleUnbalancedFlip } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const pillars = [
  { icon: faShieldHalved, title: "Integrity First", desc: "All transaction records, commission sheets, and advisory frameworks disclosed upfront." },
  { icon: faChartLine, title: "Research-Driven", desc: "Every recommendation is backed by data, not market hype or generic playbooks." },
  { icon: faUserCheck, title: "Genuine Guidance", desc: "One-on-one advisory built around your goals, timelines, and risk appetite." },
  { icon: faScaleUnbalancedFlip, title: "Fully Compliant", desc: "All products and strategies are in line with the latest SEBI, AMFI, and exchange guidelines." },
];

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
}

const DEFAULTS: AboutContent = {
  hero_title: "About Phoenix Financial Services",
  hero_subtitle: "Most financial firms offer products. We build plans. Phoenix Financial Services was established on the belief that lasting wealth demands structure, discipline, and expertise — not generic advice. Since inception, we have partnered with families, business owners, and institutions to build financial legacies that endure beyond market cycles.",
  section_heading: "Building Wealth With Integrity & Clarity",
  lead: "We understand that every investor brings a unique set of goals, risk appetites, and timelines to the table.",
  body_1: "Phoenix Financial Services was built around one founding belief — that comprehensive, tailored wealth solutions should be available under one roof, without compromise. Whether you are pursuing aggressive equity growth, building a stable fixed-income portfolio, or seeking sophisticated alternative strategies, our expert team is equipped to guide you at every stage.",
  body_2: "We take a disciplined, compliance-first approach — helping clients optimise portfolios, eliminate inefficiencies, and rebalance assets with precision — ensuring every decision is built around long-term net returns, not short-term noise.",
  why_invest_heading: "Why Invest With Us?",
  why_invest_body: "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.",
  image_url: "/meeting.png",
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULTS);

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "about_page").single()
      .then(({ data }) => {
        if (data?.content) setContent({ ...DEFAULTS, ...data.content });
      });
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
                {pillars.map((p) => (
                  <div key={p.title} className="flex gap-[15px] items-start">
                    <div className="w-[60px] h-[60px] rounded-full bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-[1.5rem] flex-shrink-0">
                      <FontAwesomeIcon icon={p.icon} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#333] mb-1.5 tracking-[1.5px]">{p.title}</h4>
                      <p className="text-[0.88rem] text-[#444] leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
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
