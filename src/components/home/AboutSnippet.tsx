import Image from "next/image";

export default function AboutSnippet() {
  return (
    <section className="py-[100px] bg-white">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-[60px] items-center">
          <div className="relative order-2 md:order-1">
            <Image
              src="/meeting.png"
              alt="Father meeting a financial advisor to plan his family's future"
              width={560}
              height={420}
              className="w-full rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            />
            <div className="absolute bottom-[-15px] right-[-15px] md:bottom-[-20px] md:right-[-20px] bg-[#E8740C] text-white w-[110px] h-[110px] md:w-[155px] md:h-[155px] rounded-full flex flex-col items-center justify-center border-[4px] md:border-[6px] border-white shadow-[0_8px_24px_rgba(232,116,12,0.15)]">
              <span className="text-[1.4rem] md:text-[2rem] font-extrabold leading-none">100%</span>
              <span className="text-[0.85rem] md:text-[1.05rem] font-bold text-center whitespace-nowrap">Client Focus</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-[2.5rem] font-extrabold text-[#333] leading-[1.2] mb-[25px] tracking-[1.5px]">
              Building Wealth with <span className="text-[#E8740C]">Integrity</span>
            </h2>
            <p className="text-[1.35rem] font-semibold text-[#E8740C] mb-[25px] leading-[1.6]">
              At Phoenix Financial Services, wealth management isn&apos;t one-size-fits-all.
            </p>
            <p className="text-[#444] text-[1.12rem] leading-[1.8] mb-[30px]">
              Every investor has different goals, risk appetites, and timelines — so we built our firm
              around comprehensive, tailored solutions under one roof. Whether you&apos;re chasing
              aggressive equity growth or seeking stable fixed-income returns, our expert team is
              equipped to guide you there.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
