"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import IconSelectorModal from "@/components/admin/IconSelectorModal";

interface ServiceCard {
  title: string;
  desc: string;
  icon_name: string;
}

interface HomeServicesContent {
  section_heading: string;
  section_subtitle: string;
  cards: ServiceCard[];
}

const DEFAULTS: HomeServicesContent = {
  section_heading: "Our Core Services",
  section_subtitle:
    "Comprehensive wealth solutions built on expertise, compliance, and a client-first approach.",
  cards: [
    {
      title: "Advisory",
      desc: "Strategic, research-driven guidance to help you navigate equity markets and make informed investment decisions.",
      icon_name: "faArrowTrendUp",
    },
    {
      title: "Asset Management",
      desc: "Professionally managed portfolios — including mutual funds, PMS, and alternate investments — tailored to your wealth goals.",
      icon_name: "faBriefcase",
    },
    {
      title: "Fixed Income",
      desc: "Stable, predictable returns through government bonds, corporate bonds, and fixed deposits — with a focus on capital preservation.",
      icon_name: "faBuildingColumns",
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

const ICON_LABELS: Record<string, string> = {
  faArrowTrendUp: "Arrow Trend Up (Advisory)",
  faBriefcase: "Briefcase (Asset Management)",
  faBuildingColumns: "Building Columns (Fixed Income)",
};

export default function HomeServicesPage() {
  const [content, setContent] = useState<HomeServicesContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isIconOpen, setIsIconOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("home_services")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as Partial<HomeServicesContent> | undefined;
        if (c) {
          setContent({
            section_heading: c.section_heading || DEFAULTS.section_heading,
            section_subtitle: c.section_subtitle || DEFAULTS.section_subtitle,
            cards: c.cards?.length ? c.cards : DEFAULTS.cards,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("home_services", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("Home services saved!", "success");
    } catch {
      showToast("Failed to save home services.", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateCard(index: number, field: keyof ServiceCard, value: string) {
    setContent((p) => {
      const cards = [...p.cards];
      cards[index] = { ...cards[index], [field]: value };
      return { ...p, cards };
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
          <h1 className="text-[1.8rem] font-bold text-[#333]">Home Services</h1>
          <p className="text-[#666] text-sm mt-1">
            Edit the 3 service cards shown on the homepage
          </p>
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
            <label className={labelClass}>Section Subtitle</label>
            <textarea
              rows={2}
              value={content.section_subtitle}
              onChange={(e) => setContent((p) => ({ ...p, section_subtitle: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Service cards */}
      {content.cards.map((card, i) => (
        <div key={i} className="bg-white rounded-[10px] shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#EEE]">
            <div className="w-7 h-7 bg-[#FFF3EB] text-[#E8740C] rounded-full flex items-center justify-center text-xs font-bold">
              {i + 1}
            </div>
            <h2 className="font-bold text-[#333]">Service Card {i + 1}</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                value={card.title}
                onChange={(e) => updateCard(i, "title", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={card.desc}
                onChange={(e) => updateCard(i, "desc", e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>
            <div>
              <label className={labelClass}>Icon</label>
              <div className="flex gap-2">
                <input
                  value={card.icon_name}
                  onChange={(e) => updateCard(i, "icon_name", e.target.value)}
                  placeholder="faBriefcase"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardIndex(i);
                    setIsIconOpen(true);
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                >
                  Select Icon
                </button>
              </div>
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
      <IconSelectorModal
        isOpen={isIconOpen}
        onClose={() => {
          setIsIconOpen(false);
          setActiveCardIndex(null);
        }}
        onSelect={(icon) => {
          if (activeCardIndex !== null) {
            updateCard(activeCardIndex, "icon_name", icon);
          }
          setIsIconOpen(false);
          setActiveCardIndex(null);
        }}
      />
    </div>
  );
}
