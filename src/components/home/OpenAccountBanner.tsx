"use client";

import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";

interface BannerContent {
  heading: string;
  button_text: string;
  button_url: string;
}

const DEFAULT_BANNER: BannerContent = {
  heading: "It's simple to get started.",
  button_text: "Open an account",
  button_url: "https://diy.sharekhan.com/app/Account/Register?grpcd=2578&type=fr&grpid=2717",
};

export default function OpenAccountBanner() {
  const [content, setContent] = useState<BannerContent>(DEFAULT_BANNER);

  useEffect(() => {
    publicApi.getContent("open_account_strip").then((res) => {
      const c = (res.content || (res.data as { content?: BannerContent })?.content) as BannerContent | undefined;
      if (c) {
        setContent({ ...DEFAULT_BANNER, ...c });
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="bg-[#EAEBED] border-y border-[#DDD] py-8 md:py-10">
      <div className="max-w-[1200px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
        <h3 className="text-2xl md:text-3xl font-medium text-[#333] tracking-[0.5px]">
          {content.heading}
        </h3>
        <a
          href={content.button_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-[#E8740C] !text-white px-7 py-3 rounded-[30px] font-semibold text-sm md:text-base border-2 border-[#E8740C] shadow-sm transition-all hover:bg-[#FF9433] hover:border-[#FF9433] hover:scale-[1.02] whitespace-nowrap"
        >
          {content.button_text}
        </a>
      </div>
    </section>
  );
}
