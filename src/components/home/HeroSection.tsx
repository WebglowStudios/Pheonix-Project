import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="bg-[#F2F3F5] py-[80px]">
      <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row items-center gap-[50px]">
        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-[3.5rem] font-extrabold leading-[1.2] text-[#333] mb-5">
            Investing for <br />the <span className="text-[#E8740C]">Future</span>
          </h1>
          <p className="text-[1.1rem] text-[#444] mb-[30px] max-w-[500px] mx-auto md:mx-0">
            At Phoenix Financial Services, wealth creation is research-backed, client-first, and built
            around you. Our deep market expertise spans advisory, asset management, fixed income. From
            highly-customized guidance to easy, accessible investing — invest however suits you best.
          </p>
          <div className="flex gap-[15px] justify-center md:justify-start mb-[40px] flex-wrap">
            <Link href="/services" className="inline-block px-6 py-3 rounded-[30px] font-semibold text-base bg-[#E8740C] !text-white border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433]">
              Explore Our Services
            </Link>
            <a href="#contactForm" className="inline-block px-6 py-3 rounded-[30px] font-semibold text-base bg-transparent !text-[#333] border-2 border-[#333] transition-all hover:bg-[#333] hover:!text-white">
              Speak to an Advisor
            </a>
          </div>
          <div className="pt-[30px] border-t border-[#DDD]">
            <p className="text-[1.25rem] font-semibold text-[#E8740C] italic tracking-[0.3px]">
              Your wealth deserves expert hands.
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 relative">
          <Image
            src="/hero.png"
            alt="Financial advisor in a professional meeting with a client"
            width={600}
            height={450}
            className="w-full rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] relative z-[2]"
          />
          <div className="absolute bottom-[-20px] right-[-20px] w-full h-full bg-[#FFF3EB] rounded-[8px] z-[1]" />
        </div>
      </div>
    </section>
  );
}
