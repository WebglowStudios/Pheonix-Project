"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AboutHomeContent {
  heading: string;
  lead: string;
  body: string;
  image_url: string;
  badge_value: string;
  badge_label: string;
}

interface AboutPageContent {
  hero_subtitle: string;
  section_heading: string;
  lead: string;
  body_1: string;
  body_2: string;
  why_invest_heading: string;
  why_invest_body: string;
  image_url: string;
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

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "about_home")
      .single()
      .then(({ data }) => {
        if (data?.content) setContent({ ...HOME_DEFAULTS, ...data.content });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "about_home", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Home snippet saved!", "success");
    setSaving(false);
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
          <input
            value={content.image_url}
            onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
            placeholder="/meeting.png"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

// ── About Page Tab ────────────────────────────────────────────────────────────

function AboutPageTab() {
  const [content, setContent] = useState<AboutPageContent>(PAGE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "about_page")
      .single()
      .then(({ data }) => {
        if (data?.content) setContent({ ...PAGE_DEFAULTS, ...data.content });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "about_page", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("About page saved!", "success");
    setSaving(false);
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
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h3 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Page Hero</h3>
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
            <input
              value={content.image_url}
              onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="/meeting.png"
              className={inputClass}
            />
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
