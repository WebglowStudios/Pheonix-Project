"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

interface GoalCard {
  title: string;
  description: string;
  image: string;
}

interface GoalsContent {
  section_heading: string;
  section_subheading: string;
  goals: GoalCard[];
}

const DEFAULTS: GoalsContent = {
  section_heading: "What Are Your Goals?",
  section_subheading:
    "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family. Our team combines research-driven insight with genuine, one-on-one guidance — so every recommendation is built around your goals, not a generic playbook.",
  goals: [
    {
      title: "Prepare for Retirement",
      description:
        "Build a retirement corpus that lets you live life on your own terms. We help you plan a disciplined investment strategy across equity, fixed income, and structured products to ensure financial independence in your golden years.",
      image: "/goal_retirement.png",
    },
    {
      title: "Invest for Education",
      description:
        "Give your child's future the head start it deserves. Whether it's higher education in India or abroad, we help you plan and invest systematically to meet rising education costs without compromising your other financial goals.",
      image: "/goal_education.png",
    },
    {
      title: "Anticipate Milestones",
      description:
        "From buying a home to planning a wedding or a dream vacation, life's big moments deserve careful financial planning. We help you build a portfolio that's ready when your milestones arrive.",
      image: "/goal_milestones.png",
    },
  ],
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

export default function GoalsPage() {
  const [content, setContent] = useState<GoalsContent>(DEFAULTS);
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
      .eq("id", "goals")
      .single()
      .then(({ data }) => {
        if (data?.content) {
          const loaded = data.content as Partial<GoalsContent>;
          setContent({
            section_heading: loaded.section_heading || DEFAULTS.section_heading,
            section_subheading: loaded.section_subheading || DEFAULTS.section_subheading,
            goals: loaded.goals?.length ? loaded.goals : DEFAULTS.goals,
          });
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "goals", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Goals saved!", "success");
    setSaving(false);
  }

  function updateGoal(index: number, field: keyof GoalCard, value: string) {
    setContent((p) => {
      const goals = [...p.goals];
      goals[index] = { ...goals[index], [field]: value };
      return { ...p, goals };
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
          <h1 className="text-[1.8rem] font-bold text-[#333]">Goals</h1>
          <p className="text-[#666] text-sm mt-1">Edit the goal cards displayed on the homepage</p>
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
              rows={3}
              value={content.section_subheading}
              onChange={(e) => setContent((p) => ({ ...p, section_subheading: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Goal cards */}
      {content.goals.map((goal, i) => (
        <div key={i} className="bg-white rounded-[10px] shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#EEE]">
            <div className="w-7 h-7 bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-xs font-bold">
              {i + 1}
            </div>
            <h2 className="font-bold text-[#333]">Goal Card {i + 1}</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                value={goal.title}
                onChange={(e) => updateGoal(i, "title", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={goal.description}
                onChange={(e) => updateGoal(i, "description", e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>
            <div>
              <label className={labelClass}>Image Path</label>
              <input
                value={goal.image}
                onChange={(e) => updateGoal(i, "image", e.target.value)}
                placeholder="/goal_retirement.png"
                className={inputClass}
              />
              <p className="text-xs text-[#999] mt-1">Path relative to /public</p>
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
