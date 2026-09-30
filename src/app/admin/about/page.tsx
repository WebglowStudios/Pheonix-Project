"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";
import IconSelectorModal from "@/components/admin/IconSelectorModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AboutHomeContent {
  heading: string;
  lead: string;
  body: string;
  image_url: string;
  badge_value: string;
  badge_label: string;
}

interface AboutPillar {
  title: string;
  desc: string;
  icon_name: string;
}

interface AboutPageContent {
  hero_title: string;
  hero_subtitle: string;
  section_heading: string;
  lead: string;
  body_1: string;
  body_2: string;
  why_invest_heading: string;
  why_invest_body: string;
  image_url: string;
  pillars?: AboutPillar[];
}

const HOME_DEFAULTS: AboutHomeContent = {
  heading: "Building Wealth with Integrity",
  lead: "At Phoenix Financial Services, wealth management isn't one-size-fits-all.",
  body: "Every investor has different goals, risk appetites, and timelines — so we built our firm around comprehensive, tailored solutions under one roof. Whether you're chasing aggressive equity growth or seeking stable fixed-income returns, our expert team is equipped to guide you there.",
  image_url: "/meeting.png",
  badge_value: "100%",
  badge_label: "Client Focus",
};

const PAGE_DEFAULTS: AboutPageContent = {
  hero_title: "About Phoenix Financial Services",
  hero_subtitle:
    "Most financial firms offer products. We build plans. Phoenix Financial Services was established on the belief that lasting wealth demands structure, discipline, and expertise — not generic advice.",
  section_heading: "Building Wealth With Integrity & Clarity",
  lead: "We understand that every investor brings a unique set of goals, risk appetites, and timelines to the table.",
  body_1:
    "Phoenix Financial Services was built around one founding belief — that comprehensive, tailored wealth solutions should be available under one roof, without compromise.",
  body_2:
    "We take a disciplined, compliance-first approach — helping clients optimise portfolios, eliminate inefficiencies, and rebalance assets with precision.",
  why_invest_heading: "Why Invest With Us?",
  why_invest_body:
    "Together, we can help define your priorities for today and help you build a better tomorrow for you and your family.",
  image_url: "/meeting.png",
  pillars: [
    { title: "Integrity First", desc: "All transaction records, commission sheets, and advisory frameworks disclosed upfront.", icon_name: "faShieldHalved" },
    { title: "Research-Driven", desc: "Every recommendation is backed by data, not market hype or generic playbooks.", icon_name: "faChartLine" },
    { title: "Genuine Guidance", desc: "One-on-one advisory built around your goals, timelines, and risk appetite.", icon_name: "faUserCheck" },
    { title: "Fully Compliant", desc: "All products and strategies are in line with the latest SEBI, AMFI, and exchange guidelines.", icon_name: "faScaleUnbalancedFlip" },
  ]
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

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

// ── Home Snippet Tab ──────────────────────────────────────────────────────────

function HomeSnippetTab() {
  const [content, setContent] = useState<AboutHomeContent>(HOME_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("about_home")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as AboutHomeContent | undefined;
        if (c) setContent({ ...HOME_DEFAULTS, ...c });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("about_home", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("Home snippet saved!", "success");
    } catch {
      showToast("Failed to save home snippet.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="flex justify-end mb-5">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-6 flex flex-col gap-5">
        <div>
          <label className={labelClass}>Heading</label>
          <input
            value={content.heading}
            onChange={(e) => setContent((p) => ({ ...p, heading: e.target.value }))}
            className={inputClass}
          />
          <p className="text-xs text-[#999] mt-1">"Integrity" will be highlighted in orange automatically</p>
        </div>

        <div>
          <label className={labelClass}>Lead Text (orange intro line)</label>
          <textarea
            rows={2}
            value={content.lead}
            onChange={(e) => setContent((p) => ({ ...p, lead: e.target.value }))}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Body Paragraph</label>
          <textarea
            rows={4}
            value={content.body}
            onChange={(e) => setContent((p) => ({ ...p, body: e.target.value }))}
            className={inputClass + " resize-none"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Badge Value</label>
            <input
              value={content.badge_value}
              onChange={(e) => setContent((p) => ({ ...p, badge_value: e.target.value }))}
              placeholder="100%"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Badge Label</label>
            <input
              value={content.badge_label}
              onChange={(e) => setContent((p) => ({ ...p, badge_label: e.target.value }))}
              placeholder="Client Focus"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Image Path</label>
          <div className="flex gap-2">
            <input
              value={content.image_url}
              onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="/meeting.png"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setIsMediaOpen(true)}
              className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
            >
              Browse Media
            </button>
          </div>
        </div>
      </div>
      <ImageSelectorModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => {
          setContent((p) => ({ ...p, image_url: url }));
          setIsMediaOpen(false);
        }}
      />
    </div>
  );
}

// ── About Page Tab ────────────────────────────────────────────────────────────

function AboutPageTab() {
  const [content, setContent] = useState<AboutPageContent>(PAGE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isIconOpen, setIsIconOpen] = useState(false);
  const [activePillarIndex, setActivePillarIndex] = useState<number | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("about_page")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as AboutPageContent | undefined;
        if (c) setContent({ ...PAGE_DEFAULTS, ...c });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("about_page", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("About page saved!", "success");
    } catch {
      showToast("Failed to save about page.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="flex justify-end mb-5">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Page Hero */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5 flex flex-col gap-4">
        <h3 className="font-bold text-[#333] mb-2 pb-2 border-b border-[#EEE]">Page Hero</h3>
        <div>
          <label className={labelClass}>Hero Title</label>
          <input
            value={content.hero_title}
            onChange={(e) => setContent((p) => ({ ...p, hero_title: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hero Subtitle</label>
          <textarea
            rows={3}
            value={content.hero_subtitle}
            onChange={(e) => setContent((p) => ({ ...p, hero_subtitle: e.target.value }))}
            className={inputClass + " resize-none"}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h3 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Main Content</h3>
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
            <label className={labelClass}>Lead Paragraph</label>
            <textarea
              rows={3}
              value={content.lead}
              onChange={(e) => setContent((p) => ({ ...p, lead: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Body Paragraph 1</label>
            <textarea
              rows={4}
              value={content.body_1}
              onChange={(e) => setContent((p) => ({ ...p, body_1: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Body Paragraph 2</label>
            <textarea
              rows={4}
              value={content.body_2}
              onChange={(e) => setContent((p) => ({ ...p, body_2: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Image Path</label>
            <div className="flex gap-2">
              <input
                value={content.image_url}
                onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="/meeting.png"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setIsMediaOpen(true)}
                className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
              >
                Browse Media
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Why Invest */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h3 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Why Invest Section</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Section Heading</label>
            <input
              value={content.why_invest_heading}
              onChange={(e) => setContent((p) => ({ ...p, why_invest_heading: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Section Body</label>
            <textarea
              rows={4}
              value={content.why_invest_body}
              onChange={(e) => setContent((p) => ({ ...p, why_invest_body: e.target.value }))}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h3 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Pillars (Why Invest Details)</h3>
        <div className="flex flex-col gap-5">
          {(content.pillars || PAGE_DEFAULTS.pillars || []).map((pillar, i) => (
            <div key={i} className="border-b border-[#EEE] pb-4 last:border-0 last:pb-0">
              <span className="text-xs font-bold text-[#E8740C] uppercase block mb-2">Pillar {i + 1} ({pillar.title})</span>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      value={pillar.title}
                      onChange={(e) => {
                        const newPillars = [...(content.pillars || PAGE_DEFAULTS.pillars || [])];
                        newPillars[i] = { ...newPillars[i], title: e.target.value };
                        setContent((p) => ({ ...p, pillars: newPillars }));
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Icon</label>
                    <div className="flex gap-2">
                      <input
                        value={pillar.icon_name}
                        onChange={(e) => {
                          const newPillars = [...(content.pillars || PAGE_DEFAULTS.pillars || [])];
                          newPillars[i] = { ...newPillars[i], icon_name: e.target.value };
                          setContent((p) => ({ ...p, pillars: newPillars }));
                        }}
                        className={inputClass}
                        placeholder="faShieldHalved"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActivePillarIndex(i);
                          setIsIconOpen(true);
                        }}
                        className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                      >
                        Select Icon
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    rows={2}
                    value={pillar.desc}
                    onChange={(e) => {
                      const newPillars = [...(content.pillars || PAGE_DEFAULTS.pillars || [])];
                      newPillars[i] = { ...newPillars[i], desc: e.target.value };
                      setContent((p) => ({ ...p, pillars: newPillars }));
                    }}
                    className={inputClass + " resize-none"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ImageSelectorModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => {
          setContent((p) => ({ ...p, image_url: url }));
          setIsMediaOpen(false);
        }}
      />
      <IconSelectorModal
        isOpen={isIconOpen}
        onClose={() => {
          setIsIconOpen(false);
          setActivePillarIndex(null);
        }}
        onSelect={(icon) => {
          if (activePillarIndex !== null) {
            const newPillars = [...(content.pillars || PAGE_DEFAULTS.pillars || [])];
            newPillars[activePillarIndex] = { ...newPillars[activePillarIndex], icon_name: icon };
            setContent((p) => ({ ...p, pillars: newPillars }));
          }
          setIsIconOpen(false);
          setActivePillarIndex(null);
        }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AboutAdminPage() {
  const [tab, setTab] = useState<"home" | "page">("home");

  return (
    <div className="max-w-[800px]">
      <div className="mb-6">
        <h1 className="text-[1.8rem] font-bold text-[#333]">About</h1>
        <p className="text-[#666] text-sm mt-1">
          Edit the homepage about snippet and the full About page content
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-[10px] p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setTab("home")}
          className={`px-5 py-2 rounded-[8px] text-sm font-semibold transition-all ${
            tab === "home"
              ? "bg-[#E8740C] text-white"
              : "text-[#666] hover:bg-[#f5f5f5]"
          }`}
        >
          Home Snippet
        </button>
        <button
          onClick={() => setTab("page")}
          className={`px-5 py-2 rounded-[8px] text-sm font-semibold transition-all ${
            tab === "page"
              ? "bg-[#E8740C] text-white"
              : "text-[#666] hover:bg-[#f5f5f5]"
          }`}
        >
          About Page
        </button>
      </div>

      {tab === "home" ? <HomeSnippetTab /> : <AboutPageTab />}
    </div>
  );
}
