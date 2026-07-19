"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

interface ProcessStep {
  step_number: number;
  title: string;
  description: string;
}

interface ProcessContent {
  section_heading: string;
  section_subheading: string;
  steps: ProcessStep[];
}

const DEFAULT_STEPS: ProcessStep[] = [
  { step_number: 1, title: "1. Discovery", description: "We understand your financial goals, current portfolio, and risk tolerance through a detailed consultation." },
  { step_number: 2, title: "2. Strategy", description: "Our experts design a personalized asset allocation plan aligned to your financial goals and risk appetite, ensuring your capital is positioned for sustained growth." },
  { step_number: 3, title: "3. Execution", description: "Seamless implementation of your allocation plan, translating strategy into action with precision and discipline." },
  { step_number: 4, title: "4. Review", description: "Continuous monitoring and proactive rebalancing as market conditions evolve, keeping your portfolio aligned with your goals." },
];

const DEFAULTS: ProcessContent = {
  section_heading: "Our Investment Process",
  section_subheading: "A systematic, disciplined approach to building and protecting your wealth.",
  steps: DEFAULT_STEPS,
};

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[8px] text-white text-sm font-semibold shadow-lg ${
        type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"
      }`}
    >
      {message}
    </div>
  );
}

const inputClass =
  "border border-[#DDD] rounded-[8px] px-3 py-2 w-full focus:border-[#E8740C] outline-none text-sm text-[#333] bg-white";
const labelClass = "block text-sm font-semibold text-[#555] mb-1";

export default function ProcessPage() {
  const [content, setContent] = useState<ProcessContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "process_steps")
      .single()
      .then(({ data }) => {
        if (data?.content) {
          const loaded = data.content as Partial<ProcessContent>;
          setContent({
            section_heading: loaded.section_heading || DEFAULTS.section_heading,
            section_subheading: loaded.section_subheading || DEFAULTS.section_subheading,
            steps: loaded.steps?.length ? loaded.steps : DEFAULT_STEPS,
          });
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "process_steps", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Process steps saved!", "success");
    setSaving(false);
  }

  function updateStep(index: number, field: keyof ProcessStep, value: string | number) {
    setContent((p) => {
      const steps = [...p.steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...p, steps };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[700px]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Process Steps</h1>
          <p className="text-[#666] text-sm mt-1">Edit the 4 steps shown in the Process section</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Section header */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Section Header</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Section Heading</label>
            <input
              value={content.section_heading}
              onChange={(e) => setContent((p) => ({ ...p, section_heading: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Section Subheading</label>
            <textarea
              rows={2}
              value={content.section_subheading}
              onChange={(e) => setContent((p) => ({ ...p, section_subheading: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      {content.steps.map((step, i) => (
        <div key={i} className="bg-white rounded-[10px] shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[#EEE]">
            <div className="w-8 h-8 bg-[#E8740C] text-white rounded-full flex items-center justify-center text-sm font-bold">
              {step.step_number}
            </div>
            <h2 className="font-bold text-[#333]">Step {step.step_number}</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Step Title</label>
              <input
                value={step.title}
                onChange={(e) => updateStep(i, "title", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={step.description}
                onChange={(e) => updateStep(i, "description", e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-6 py-3 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
