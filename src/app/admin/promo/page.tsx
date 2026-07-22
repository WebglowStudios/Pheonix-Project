"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faPlus,
  faTrash,
  faFire,
  faCircleCheck,
  faXmark,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";

interface PromoContent {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  features: string[];
  image_url: string;
  cta_text: string;
  cta_url: string;
}

const DEFAULTS: PromoContent = {
  enabled: true,
  badge: "New Offering",
  title: "Capital Shield",
  description:
    "Protect your hard-earned capital while enjoying high market-linked upside returns. Our new Capital Shield plans are open for subscription across Nifty, Gold, and Bonds.",
  features: [
    "Capital protection built in",
    "Linked to Nifty / Gold / Bonds",
    "Reduced market risk exposure",
  ],
  image_url: "/promo_nifty.png",
  cta_text: "Learn More",
  cta_url: "/service-detail",
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

export default function PromoAdminPage() {
  const [content, setContent] = useState<PromoContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "promo_modal")
      .single()
      .then(({ data }) => {
        if (data?.content) {
          setContent({ ...DEFAULTS, ...data.content });
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "promo_modal", content }, { onConflict: "id" });

    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Promo Popup Modal updated successfully!", "success");
    setSaving(false);
  }

  function addFeature() {
    if (!newFeatureText.trim()) return;
    setContent((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeatureText.trim()],
    }));
    setNewFeatureText("");
  }

  function removeFeature(index: number) {
    setContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  function updateFeature(index: number, val: string) {
    setContent((prev) => {
      const updated = [...prev.features];
      updated[index] = val;
      return { ...prev, features: updated };
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
    <div className="max-w-[1000px]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333] flex items-center gap-2">
            <FontAwesomeIcon icon={faBullhorn} className="text-[#E8740C] text-2xl" />
            Promo Popup Modal
          </h1>
          <p className="text-[#666] text-sm mt-1">
            Enable or disable the homepage promotional popup modal and customize its content, features, and CTA.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-5 py-2.5 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all shadow-sm"
        >
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Enable/Disable Master Switch */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-6 border border-[#DDD]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#333] text-base">Enable Promo Popup Modal</h2>
            <p className="text-xs text-[#666] mt-0.5">
              When enabled, visitors to the homepage will see this modal popup after a short 1.5 second delay.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={content.enabled}
              onChange={(e) => setContent((p) => ({ ...p, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-[#DDD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#E8740C]" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* Left: Content Editor Form */}
        <div className="flex flex-col gap-6">
          {/* General Fields */}
          <div className="bg-white rounded-[10px] shadow-sm p-6 border border-[#DDD]">
            <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Modal Header & Body</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Badge Label</label>
                <input
                  type="text"
                  value={content.badge}
                  onChange={(e) => setContent((p) => ({ ...p, badge: e.target.value }))}
                  placeholder="e.g. New Offering"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Main Title</label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => setContent((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Capital Shield"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  value={content.description}
                  onChange={(e) => setContent((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Modal body description..."
                  className={inputClass + " resize-y"}
                />
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-[10px] shadow-sm p-6 border border-[#DDD]">
            <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Highlights / Features List</h2>
            <div className="flex flex-col gap-3 mb-4">
              {content.features?.map((feat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeFeature(index)}
                    className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-red-50 text-red-600 hover:bg-red-100 transition-all flex-shrink-0"
                    title="Remove feature"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                placeholder="Add a new feature bullet..."
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
              />
              <button
                onClick={addFeature}
                className="px-4 py-2 bg-[#333] text-white rounded-[8px] font-semibold text-sm hover:bg-[#444] transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" /> Add
              </button>
            </div>
          </div>

          {/* Image & CTA Settings */}
          <div className="bg-white rounded-[10px] shadow-sm p-6 border border-[#DDD]">
            <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Media & Call to Action</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Banner Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={content.image_url}
                    onChange={(e) => setContent((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="/promo_nifty.png"
                    className={inputClass}
                  />
                  <button
                    onClick={() => setIsMediaOpen(true)}
                    className="px-4 py-2 bg-[#F2F3F5] border border-[#DDD] text-[#333] rounded-[8px] font-semibold text-sm hover:bg-[#E8740C] hover:text-white hover:border-[#E8740C] transition-all whitespace-nowrap"
                  >
                    Choose Image
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Primary CTA Button Label</label>
                <input
                  type="text"
                  value={content.cta_text}
                  onChange={(e) => setContent((p) => ({ ...p, cta_text: e.target.value }))}
                  placeholder="Learn More"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Primary CTA Link URL</label>
                <input
                  type="text"
                  value={content.cta_url}
                  onChange={(e) => setContent((p) => ({ ...p, cta_url: e.target.value }))}
                  placeholder="/service-detail"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview Box */}
        <div className="flex flex-col gap-4">
          <div className="sticky top-6">
            <h2 className="font-bold text-[#333] text-base mb-3 flex items-center justify-between">
              <span>Live Preview</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  content.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {content.enabled ? "● Modal Active" : "○ Modal Disabled"}
              </span>
            </h2>

            <div className="bg-[#1a1b23] p-6 rounded-[16px] border border-[#DDD] flex items-center justify-center min-h-[480px]">
              {/* Modal Card Preview */}
              <div className="relative w-full bg-white rounded-[16px] shadow-2xl overflow-hidden border border-[#E8740C]/20 text-left">
                {/* Close Button Mock */}
                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 border border-[#DDD] flex items-center justify-center text-[#333] text-xs">
                  <FontAwesomeIcon icon={faXmark} />
                </div>

                <div className="grid grid-cols-1">
                  {/* Image Side */}
                  <div className="relative h-44 bg-[#F2F3F5] overflow-hidden">
                    <Image
                      src={content.image_url || "/promo_nifty.png"}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E8740C]/15 to-[#333]/30" />
                  </div>

                  {/* Content Side */}
                  <div className="p-5">
                    {content.badge && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-[#FFF3EB] text-[#E8740C] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          <FontAwesomeIcon icon={faFire} />
                          {content.badge}
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-extrabold text-[#333] mb-1.5 leading-snug">
                      {content.title || "Modal Title"}
                    </h3>

                    <p className="text-xs text-[#444] leading-relaxed mb-3 line-clamp-3">
                      {content.description || "Description will appear here."}
                    </p>

                    {content.features && content.features.length > 0 && (
                      <div className="bg-[#F2F3F5] border border-dashed border-[#DDD] rounded-[6px] p-2.5 mb-4 flex flex-col gap-1.5">
                        {content.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-[#333]">
                            <FontAwesomeIcon icon={faCircleCheck} className="text-[#E8740C] text-xs flex-shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1 text-center py-2 rounded-[30px] font-semibold text-xs bg-[#E8740C] text-white">
                        {content.cta_text || "Learn More"}
                      </div>
                      <div className="flex-1 text-center py-2 rounded-[30px] font-semibold text-xs border border-[#333] text-[#333]">
                        Dismiss
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageSelectorModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => setContent((p) => ({ ...p, image_url: url }))}
      />
    </div>
  );
}
