"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBriefcase,
  faBuildingColumns,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";

const ICON_MAP: Record<string, IconDefinition> = {
  faArrowTrendUp,
  faBriefcase,
  faBuildingColumns,
};

interface ServiceCard {
  title: string;
  desc: string;
  icon_name: string;
}

interface ServicesContent {
  section_heading: string;
  section_subtitle: string;
  cards: ServiceCard[];
}

const DEFAULTS: ServicesContent = {
  section_heading: "Our Core Services",
  section_subtitle: "Comprehensive wealth solutions built on expertise, compliance, and a client-first approach.",
  cards: [
    { title: "Advisory", desc: "Strategic, research-driven guidance to help you navigate equity markets and make informed investment decisions.", icon_name: "faArrowTrendUp" },
    { title: "Asset Management", desc: "Professionally managed portfolios — including mutual funds, PMS, and alternate investments — tailored to your wealth goals.", icon_name: "faBriefcase" },
    { title: "Fixed Income", desc: "Stable, predictable returns through government bonds, corporate bonds, and fixed deposits — with a focus on capital preservation.", icon_name: "faBuildingColumns" },
  ],
};

export default function ServicesSection() {
  const [content, setContent] = useState<ServicesContent>(DEFAULTS);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "home_services")
      .single()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as Partial<ServicesContent>;
          setContent({
            section_heading: c.section_heading || DEFAULTS.section_heading,
            section_subtitle: c.section_subtitle || DEFAULTS.section_subtitle,
            cards: c.cards?.length ? c.cards : DEFAULTS.cards,
          });
        }
      });
  }, []);

  // Parse heading to highlight last word in orange
  const headingWords = content.section_heading.split(" ");
  const lastWord = headingWords.pop();
  const headingStart = headingWords.join(" ");

  return (
    <section className="py-[100px] bg-[#F2F3F5]">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-[50px] max-w-[700px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
            {headingStart} <span className="text-[#E8740C]">{lastWord}</span>
          </h2>
          <p className="text-[1.1rem] text-[#444]">{content.section_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          {content.cards.map((s) => {
            const icon = ICON_MAP[s.icon_name] ?? faArrowTrendUp;
            return (
              <div
                key={s.title}
                className="bg-white border border-[#DDD] rounded-[8px] px-[30px] py-[40px] text-center flex flex-col items-center transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C]"
              >
                <div className="w-[70px] h-[70px] rounded-full bg-gradient-to-br from-[#FF9433] to-[#E8740C] text-white flex items-center justify-center text-[1.8rem] mb-[25px] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <FontAwesomeIcon icon={icon} />
                </div>
                <h3 className="text-[1.4rem] font-bold text-[#E8740C] mb-[15px] tracking-[1.5px]">{s.title}</h3>
                <p className="text-[0.95rem] text-[#444] leading-[1.6] mb-[20px] flex-1">{s.desc}</p>
                <Link
                  href="/services"
                  className="text-[0.9rem] font-semibold !text-[#E8740C] inline-flex items-center gap-[6px] transition-all hover:!text-[#FF9433] hover:gap-[10px] mt-auto"
                >
                  Learn More <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-[50px]">
          <Link
            href="/services"
            className="inline-block px-6 py-3 rounded-[30px] font-semibold bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433]"
          >
            Explore All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
