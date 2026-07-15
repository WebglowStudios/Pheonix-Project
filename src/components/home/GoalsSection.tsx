import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUmbrellaBeach, faGraduationCap, faFlagCheckered, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const goals = [
  { img: "/goal_retirement.png", alt: "Happy Indian couple enjoying a peaceful retirement", icon: faUmbrellaBeach, title: "Prepare for Retirement", desc: "Build a retirement corpus that lets you live life on your own terms. We help you plan a disciplined investment strategy across equity, fixed income, and structured products to ensure financial independence in your golden years." },
  { img: "/goal_education.png", alt: "Proud father with son at graduation", icon: faGraduationCap, title: "Invest for Education", desc: "Give your child's future the head start it deserves. Whether it's higher education in India or abroad, we help you plan and invest systematically to meet rising education costs without compromising your other financial goals." },
  { img: "/goal_milestones.png", alt: "Young Indian couple celebrating their new home", icon: faFlagCheckered, title: "Anticipate Milestones", desc: "From buying a home to planning a wedding or a dream vacation, life's big moments deserve careful financial planning. We help you build a portfolio that's ready when your milestones arrive." },
];

export default function GoalsSection() {
  return (
    <section className="py-[100px] bg-[#F2F3F5]">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-[50px] max-w-[700px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
            What Are Your <span className="text-[#E8740C]">Goals?</span>
          </h2>
          <p className="text-[1.1rem] text-[#444]">
            Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          {goals.map((g) => (
            <div key={g.title} className="bg-white border border-[#DDD] rounded-[8px] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-[#E8740C] group">
              <div className="relative h-[220px] overflow-hidden">
                <Image src={g.img} alt={g.alt} fill className="object-cover object-center transition-transform duration-[400ms] group-hover:scale-105" />
                <div className="absolute bottom-0 left-0 w-full h-full flex items-end p-5">
                  <div className="w-[48px] h-[48px] bg-white text-[#E8740C] rounded-full flex items-center justify-center text-[1.2rem] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <FontAwesomeIcon icon={g.icon} />
                  </div>
                </div>
              </div>
              <div className="px-[25px] pt-7 pb-[25px] flex flex-col flex-1">
                <h3 className="text-[1.3rem] text-[#333] font-bold mb-3 tracking-[1.5px]">{g.title}</h3>
                <p className="text-[0.95rem] text-[#444] leading-[1.65] mb-5 flex-1">{g.desc}</p>
                <Link href="/contact" className="text-[0.9rem] font-semibold !text-[#E8740C] inline-flex items-center gap-[6px] transition-all hover:!text-[#FF9433] hover:gap-[10px] mt-auto">
                  Start Planning <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
