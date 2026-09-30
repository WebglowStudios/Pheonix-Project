"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";

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

interface OpenAccountStrip {
  heading: string;
  button_text: string;
  button_url: string;
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

const DEFAULT_STRIP: OpenAccountStrip = {
  heading: "It's simple to get started.",
  button_text: "Open an account",
  button_url: "https://diy.sharekhan.com/app/Account/Register?grpcd=2578&type=fr&grpid=2717",
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
  const [stripContent, setStripContent] = useState<OpenAccountStrip>(DEFAULT_STRIP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [activeGoalIndex, setActiveGoalIndex] = useState<number | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      adminApi.getContent("goals"),
      adminApi.getContent("open_account_strip"),
    ])
      .then(([goalsRes, stripRes]) => {
        const goalsData = (goalsRes.content || (goalsRes.data as any)?.content) as Partial<GoalsContent> | undefined;
        if (goalsData) {
          setContent({
            section_heading: goalsData.section_heading || DEFAULTS.section_heading,
            section_subheading: goalsData.section_subheading || DEFAULTS.section_subheading,
            goals: goalsData.goals?.length ? goalsData.goals : DEFAULTS.goals,
          });
        }
        const stripData = (stripRes.content || (stripRes.data as any)?.content) as OpenAccountStrip | undefined;
        if (stripData) {
          setStripContent({ ...DEFAULT_STRIP, ...stripData });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const [res1, res2] = await Promise.all([
        adminApi.updateContent("goals", content),
        adminApi.updateContent("open_account_strip", stripContent),
      ]);

      if (!res1.success || !res2.success) {
        showToast("Failed to save: " + (res1.message || res2.message || "Error"), "error");
      } else {
        showToast("Goals section and Open Account strip saved!", "success");
      }
    } catch {
      showToast("Failed to save goals section.", "error");
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-[1.8rem] font-bold text-[#333]">Goals &amp; Open Account Strip</h1>
          <p className="text-[#666] text-sm mt-1">
            Edit the goal cards and the &quot;Open an Account&quot; callout banner on the homepage
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-6 py-2.5 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Goals Heading */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Goals Section Header</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Section Heading</label>
            <input
              value={content.section_heading}
              onChange={(e) => setContent((p) => ({ ...p, section_heading: e.target.value }))}
              placeholder="What Are Your Goals?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Subheading Paragraph</label>
            <textarea
              rows={3}
              value={content.section_subheading}
              onChange={(e) => setContent((p) => ({ ...p, section_subheading: e.target.value }))}
              placeholder="Section subheading..."
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Goal Cards */}
      {content.goals.map((goal, i) => (
        <div key={i} className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
          <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">
            Goal Card #{i + 1}: {goal.title}
          </h2>
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
              <div className="flex gap-2">
                <input
                  value={goal.image}
                  onChange={(e) => updateGoal(i, "image", e.target.value)}
                  placeholder="/goal_retirement.png"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveGoalIndex(i);
                    setIsMediaOpen(true);
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                >
                  Browse Media
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Open Account Strip Editor */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">
          &quot;Open An Account&quot; Banner Strip
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Banner Heading Text</label>
            <input
              value={stripContent.heading}
              onChange={(e) => setStripContent((p) => ({ ...p, heading: e.target.value }))}
              placeholder="It's simple to get started."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Button Label</label>
            <input
              value={stripContent.button_text}
              onChange={(e) => setStripContent((p) => ({ ...p, button_text: e.target.value }))}
              placeholder="Open an account"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Button Target URL (Sharekhan Registration)</label>
            <input
              value={stripContent.button_url}
              onChange={(e) => setStripContent((p) => ({ ...p, button_url: e.target.value }))}
              placeholder="https://diy.sharekhan.com/app/Account/Register?..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-6 py-3 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <ImageSelectorModal
        isOpen={isMediaOpen}
        onClose={() => {
          setIsMediaOpen(false);
          setActiveGoalIndex(null);
        }}
        onSelect={(url) => {
          if (activeGoalIndex !== null) {
            updateGoal(activeGoalIndex, "image", url);
          }
          setIsMediaOpen(false);
          setActiveGoalIndex(null);
        }}
      />
    </div>
  );
}
