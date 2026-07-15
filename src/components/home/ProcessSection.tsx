import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faChessKnight, faRocket, faRotate, faArrowRight } from "@fortawesome/free-solid-svg-icons";

const steps = [
  { icon: faMagnifyingGlass, title: "1. Discovery", desc: "We understand your financial goals, current portfolio, and risk tolerance through a detailed consultation." },
  { icon: faChessKnight, title: "2. Strategy", desc: "Our experts design a personalized asset allocation plan aligned to your financial goals and risk appetite, ensuring your capital is positioned for sustained growth." },
  { icon: faRocket, title: "3. Execution", desc: "Seamless implementation of your allocation plan, translating strategy into action with precision and discipline." },
  { icon: faRotate, title: "4. Review", desc: "Continuous monitoring and proactive rebalancing as market conditions evolve, keeping your portfolio aligned with your goals." },
];

export default function ProcessSection() {
  return (
    <section className="py-[100px] bg-white">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-[50px] max-w-[700px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
            Our Investment <span className="text-[#E8740C]">Process</span>
          </h2>
          <p className="text-[1.1rem] text-[#444]">A systematic, disciplined approach to building and protecting your wealth.</p>
        </div>
        <div className="flex items-stretch justify-between gap-5 flex-wrap">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-5 flex-1 min-w-[200px]">
              <div className="flex-1 text-center bg-[#F2F3F5] border border-[#DDD] rounded-[8px] px-5 py-[30px] flex flex-col transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#E8740C] hover:-translate-y-[5px]">
                <div className="w-[70px] h-[70px] bg-white text-[#E8740C] rounded-full flex items-center justify-center text-[1.8rem] mx-auto mb-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <FontAwesomeIcon icon={step.icon} />
                </div>
                <h3 className="text-[1.2rem] text-[#333] font-bold mb-[10px] tracking-[1.5px]">{step.title}</h3>
                <p className="text-[0.9rem] text-[#444] flex-grow">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="text-[1.5rem] text-[#DDD] hidden lg:flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faArrowRight} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
