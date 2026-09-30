"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCircleCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { publicApi } from "@/lib/api";

export interface PromoContent {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  features: string[];
  image_url: string;
  cta_text: string;
  cta_url: string;
}

export const PROMO_DEFAULTS: PromoContent = {
  enabled: true,
  badge: "New Offering",
  title: "Capital Shield",
  description:
    "Protect your hard-earned capital while enjoying high market-linked upside returns. Our new Capital Shield plans are open for subscription across Nifty, Gold, and Bonds.",
  features: [
    "Capital protection built in",
    "Linked to Nifty / Gold / Bonds",
    "Reduced market risk exposure",
  ],
  image_url: "/promo_nifty.png",
  cta_text: "Learn More",
  cta_url: "/service-detail",
};

export default function PromoModal() {
  const [content, setContent] = useState<PromoContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    publicApi.getContent("promo_modal").then((res) => {
      const raw = (res.content || (res.data as { content?: PromoContent })?.content) as PromoContent | undefined;
      const c: PromoContent = raw
        ? { ...PROMO_DEFAULTS, ...raw }
        : PROMO_DEFAULTS;

      setContent(c);

      if (c.enabled && !sessionStorage.getItem("promoDismissed")) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          document.body.style.overflow = "hidden";
        }, 1500);
        return () => clearTimeout(timer);
      }
    }).catch(() => {
      setContent(PROMO_DEFAULTS);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
    sessionStorage.setItem("promoDismissed", "true");
  };

  if (!content || !content.enabled || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative z-[10001] w-full max-w-[820px] bg-white rounded-[16px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[#E8740C]/10 overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1.2fr]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close promotion"
          className="absolute top-3 right-3 z-[10002] w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#DDD] flex items-center justify-center text-[#333] text-sm transition-all hover:bg-[#E8740C] hover:text-white hover:border-[#E8740C]"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {/* Image Side */}
        <div className="relative min-h-[200px] md:min-h-[350px] overflow-hidden bg-[#F2F3F5]">
          <Image
            src={content.image_url || "/promo_nifty.png"}
            alt={content.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8740C]/15 to-[#333]/30" />
        </div>

        {/* Content Side */}
        <div className="p-6 md:p-[40px_35px] flex flex-col justify-center">
          {content.badge && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 bg-[#FFF3EB] text-[#E8740C] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <FontAwesomeIcon icon={faFire} className="text-[#E8740C]" />
                {content.badge}
              </span>
            </div>
          )}

          <h3 className="text-xl md:text-[1.6rem] font-extrabold text-[#333] mb-2 leading-tight tracking-[0.5px]">
            {content.title}
          </h3>

          <p className="text-xs md:text-[0.95rem] text-[#444] leading-relaxed mb-4">
            {content.description}
          </p>

          {content.features && content.features.length > 0 && (
            <div className="bg-[#F2F3F5] border border-dashed border-[#DDD] rounded-[8px] p-3.5 mb-5 flex flex-col gap-2">
              {content.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs md:text-sm font-medium text-[#333]">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-[#E8740C] text-sm flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={content.cta_url || "/service-detail"}
              onClick={handleClose}
              className="flex-1 text-center px-5 py-2.5 rounded-[30px] font-semibold text-sm bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433]"
            >
              {content.cta_text || "Learn More"}
            </Link>

            <button
              onClick={handleClose}
              className="flex-1 text-center px-5 py-2.5 rounded-[30px] font-semibold text-sm bg-transparent !text-[#333] border-2 border-[#333] transition-all hover:bg-[#333] hover:!text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
