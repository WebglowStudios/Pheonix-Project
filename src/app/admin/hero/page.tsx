"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";

interface HeroContent {
  title: string;
  subtitle: string;
  tagline: string;
  cta_primary: string;
  cta_primary_url?: string;
  cta_secondary: string;
  cta_secondary_url?: string;
  image_url: string;
}

const DEFAULTS: HeroContent = {
  title: "Investing for the Future",
  subtitle:
    "At Phoenix Financial Services, wealth creation is research-backed, client-first, and built around you. Our deep market expertise spans advisory, asset management, fixed income. From highly-customized guidance to easy, accessible investing — invest however suits you best.",
  tagline: "Your wealth deserves expert hands.",
  cta_primary: "Explore Our Services",
  cta_primary_url: "/services",
  cta_secondary: "Speak to an Advisor",
  cta_secondary_url: "#contactForm",
  image_url: "/hero.png",
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

export default function HeroPage() {
  const [content, setContent] = useState<HeroContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("hero")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as HeroContent | undefined;
        if (c) setContent({ ...DEFAULTS, ...c });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("hero", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("Hero section saved!", "success");
    } catch {
      showToast("Failed to save hero section.", "error");
    } finally {
      setSaving(false);
    }
  }

  const titleParts = content.title.split("Future");
  const hasFuture = titleParts.length > 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Hero Section</h1>
          <p className="text-[#666] text-sm mt-1">Edit the main banner content on the homepage</p>
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

      <div className="bg-white rounded-[10px] shadow-sm p-6 flex flex-col gap-5 mb-5">
        <div>
          <label className={labelClass}>Main Title</label>
          <input
            value={content.title}
            onChange={(e) => setContent((p) => ({ ...p, title: e.target.value }))}
            className={inputClass}
          />
          <p className="text-xs text-[#999] mt-1">The word "Future" will be highlighted in orange automatically</p>
        </div>

        <div>
          <label className={labelClass}>Subtitle</label>
          <textarea
            rows={4}
            value={content.subtitle}
            onChange={(e) => setContent((p) => ({ ...p, subtitle: e.target.value }))}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Tagline</label>
          <input
            value={content.tagline}
            onChange={(e) => setContent((p) => ({ ...p, tagline: e.target.value }))}
            className={inputClass}
          />
          <p className="text-xs text-[#999] mt-1">Displayed in italic orange below the CTA buttons</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Primary CTA Button</label>
            <input
              value={content.cta_primary}
              onChange={(e) => setContent((p) => ({ ...p, cta_primary: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Secondary CTA Button</label>
            <input
              value={content.cta_secondary}
              onChange={(e) => setContent((p) => ({ ...p, cta_secondary: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Primary CTA Redirect URL</label>
            <input
              value={content.cta_primary_url || ""}
              onChange={(e) => setContent((p) => ({ ...p, cta_primary_url: e.target.value }))}
              placeholder="/services"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Secondary CTA Redirect URL</label>
            <input
              value={content.cta_secondary_url || ""}
              onChange={(e) => setContent((p) => ({ ...p, cta_secondary_url: e.target.value }))}
              placeholder="#contactForm"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Hero Image Path</label>
          <div className="flex gap-2">
            <input
              value={content.image_url}
              onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="/hero.png"
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
          <p className="text-xs text-[#999] mt-1">Path relative to /public (e.g. /hero.png)</p>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-[10px] shadow-sm p-6">
        <p className="text-xs font-bold text-[#999] uppercase mb-4 tracking-wider">Live Preview</p>
        <div className="bg-[#F2F3F5] rounded-[8px] p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            {content.tagline && (
              <p className="text-[0.85rem] font-semibold text-[#E8740C] italic mb-2">{content.tagline}</p>
            )}
            <h2 className="text-[1.6rem] font-extrabold text-[#333] mb-3 leading-tight">
              {hasFuture ? (
                <>
                  {titleParts[0]}
                  <span className="text-[#E8740C]">Future</span>
                  {titleParts[1]}
                </>
              ) : (
                content.title || <span className="text-[#CCC]">Title will appear here</span>
              )}
            </h2>
            <p className="text-[#555] text-sm mb-4 leading-relaxed">
              {content.subtitle || <span className="text-[#CCC]">Subtitle will appear here</span>}
            </p>
            <div className="flex gap-3 flex-wrap">
              {content.cta_primary && (
                <span className="bg-[#E8740C] text-white px-4 py-2 rounded-[30px] text-sm font-semibold">
                  {content.cta_primary}
                </span>
              )}
              {content.cta_secondary && (
                <span className="border-2 border-[#333] text-[#333] px-4 py-2 rounded-[30px] text-sm font-semibold">
                  {content.cta_secondary}
                </span>
              )}
            </div>
          </div>
          {content.image_url && (
            <div className="relative w-[160px] h-[120px] flex-shrink-0 rounded-[6px] overflow-hidden">
              <Image
                src={content.image_url}
                alt="Hero preview"
                fill
                className="object-cover"
                onError={() => {}}
              />
            </div>
          )}
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
