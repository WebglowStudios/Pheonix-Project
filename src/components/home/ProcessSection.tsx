"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faChessKnight, faRocket, faRotate, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { publicApi } from "@/lib/api";

const STEP_ICONS: IconDefinition[] = [faMagnifyingGlass, faChessKnight, faRocket, faRotate];

interface Step {
  step_number: number;
  title: string;
  description: string;
}

const DEFAULT_STEPS: Step[] = [
  { step_number: 1, title: "1. Discovery", description: "We understand your financial goals, current portfolio, and risk tolerance through a detailed consultation." },
  { step_number: 2, title: "2. Strategy", description: "Our experts design a personalized asset allocation plan aligned to your financial goals and risk appetite, ensuring your capital is positioned for sustained growth." },
  { step_number: 3, title: "3. Execution", description: "Seamless implementation of your allocation plan, translating strategy into action with precision and discipline." },
  { step_number: 4, title: "4. Review", description: "Continuous monitoring and proactive rebalancing as market conditions evolve, keeping your portfolio aligned with your goals." },
];

export default function ProcessSection() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [heading, setHeading] = useState("Our Investment Process");
  const [subheading, setSubheading] = useState("A systematic, disciplined approach to building and protecting your wealth.");

  useEffect(() => {
    publicApi.getContent("process_steps").then((res) => {
      const c = (res.content || (res.data as { content?: { steps?: Step[]; section_heading?: string; section_subheading?: string } })?.content) as { steps?: Step[]; section_heading?: string; section_subheading?: string } | undefined;
      if (c) {
        if (c.steps?.length) setSteps(c.steps);
        if (c.section_heading) setHeading(c.section_heading);
        if (c.section_subheading) setSubheading(c.section_subheading);
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="py-[100px] bg-white">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center mb-[50px] max-w-[700px] mx-auto">
          <h2 className="text-[2.5rem] font-extrabold text-[#333] mb-[15px] tracking-[1.5px]">
            {heading.includes("Process") ? (
              <>Our Investment <span className="text-[#E8740C]">Process</span></>
            ) : heading}
          </h2>
          <p className="text-[1.1rem] text-[#444]">{subheading}</p>
        </div>
        <div className="flex items-stretch justify-between gap-5 flex-wrap">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-5 flex-1 min-w-[200px]">
              <div className="flex-1 text-center bg-[#F2F3F5] border border-[#DDD] rounded-[8px] px-5 py-[30px] flex flex-col transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#E8740C] hover:-translate-y-[5px]">
                <div className="w-[70px] h-[70px] bg-white text-[#E8740C] rounded-full flex items-center justify-center text-[1.8rem] mx-auto mb-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <FontAwesomeIcon icon={STEP_ICONS[i] ?? faMagnifyingGlass} />
                </div>
                <h3 className="text-[1.2rem] text-[#333] font-bold mb-[10px] tracking-[1.5px]">{step.title}</h3>
                <p className="text-[0.9rem] text-[#444] flex-grow">{step.description}</p>
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
