"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomeContactContent {
  section_heading: string;
  section_subheading: string;
}

interface ContactDetailsContent {
  phone_landline: string;
  phone_mobile: string;
  whatsapp_number: string;
  email: string;
  pune_address: string;
  mumbai_address: string;
  services?: string[];
}

const HOME_DEFAULTS: HomeContactContent = {
  section_heading: "Get in Touch",
  section_subheading: "Speak with our expert advisors today — and take the first step toward structured, long-term wealth management",
};

const DETAILS_DEFAULTS: ContactDetailsContent = {
  phone_landline: "",
  phone_mobile: "",
  whatsapp_number: "",
  email: "",
  pune_address: "",
  mumbai_address: "",
  services: ["Advisory", "Asset Management", "Fixed Income"],
};

// ── Components ────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[8px] text-white text-sm font-semibold shadow-lg ${type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
      {message}
    </div>
  );
}

const inputClass = "border border-[#DDD] rounded-[8px] px-3 py-2 w-full focus:border-[#E8740C] outline-none text-sm text-[#333] bg-white";
const labelClass = "block text-sm font-semibold text-[#555] mb-1";

// ── Home Snippet Tab ──────────────────────────────────────────────────────────

function HomeContactTab() {
  const [content, setContent] = useState<HomeContactContent>(HOME_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("home_contact")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as HomeContactContent | undefined;
        if (c) setContent({ ...HOME_DEFAULTS, ...c });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("home_contact", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("Contact section saved!", "success");
    } catch {
      showToast("Failed to save contact section.", "error");
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
    <div className="max-w-[700px]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Home Contact Section</h1>
          <p className="text-[#666] text-sm mt-1">Edit the heading and subheading of the contact section on the homepage</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all">
          <FontAwesomeIcon icon={faFloppyDisk} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-6 flex flex-col gap-5">
        <div>
          <label className={labelClass}>Section Heading</label>
          <input value={content.section_heading}
            onChange={(e) => setContent((p) => ({ ...p, section_heading: e.target.value }))}
            className={inputClass} />
          <p className="text-xs text-[#999] mt-1">"Touch" will be highlighted in orange automatically</p>
        </div>
        <div>
          <label className={labelClass}>Section Subheading</label>
          <textarea rows={3} value={content.section_subheading}
            onChange={(e) => setContent((p) => ({ ...p, section_subheading: e.target.value }))}
            className={inputClass + " resize-none"} />
        </div>
      </div>
    </div>
  );
}

// ── Contact Details Tab ───────────────────────────────────────────────────────

function ContactDetailsTab() {
  const [content, setContent] = useState<ContactDetailsContent>(DETAILS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi
      .getContent("contact_info")
      .then((res) => {
        const c = (res.content || (res.data as any)?.content) as ContactDetailsContent | undefined;
        if (c) setContent({ ...DETAILS_DEFAULTS, ...c });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.updateContent("contact_info", content);
      if (!res.success) showToast("Failed to save: " + (res.message || "Error"), "error");
      else showToast("Contact details saved!", "success");
    } catch {
      showToast("Failed to save contact details.", "error");
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
    <div className="max-w-[700px]">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Contact Info</h1>
          <p className="text-[#666] text-sm mt-1">Phone, email and office addresses</p>
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

      {/* Phone & Email */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Phone &amp; Email</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Landline Number</label>
            <input value={content.phone_landline} onChange={e => setContent(p => ({ ...p, phone_landline: e.target.value }))} placeholder="020 6689 3715" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mobile Number</label>
            <input value={content.phone_mobile} onChange={e => setContent(p => ({ ...p, phone_mobile: e.target.value }))} placeholder="+91 70212 10788" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp Number (with country code)</label>
            <input value={content.whatsapp_number} onChange={e => setContent(p => ({ ...p, whatsapp_number: e.target.value }))} placeholder="918485819118" className={inputClass} />
            <p className="text-xs text-[#999] mt-1">Used for WhatsApp chat link (e.g. 918485819118)</p>
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={content.email} onChange={e => setContent(p => ({ ...p, email: e.target.value }))} placeholder="connect@phoenixfiserv.co.in" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Office Addresses</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Pune Address</label>
            <textarea
              rows={3}
              value={content.pune_address}
              onChange={e => setContent(p => ({ ...p, pune_address: e.target.value }))}
              placeholder={"708, Global Business Hub,\nKharadi, Pune 411014"}
              className={inputClass + " resize-none"}
            />
          </div>
          <div>
            <label className={labelClass}>Mumbai Address</label>
            <textarea
              rows={4}
              value={content.mumbai_address}
              onChange={e => setContent(p => ({ ...p, mumbai_address: e.target.value }))}
              placeholder={"11, Brahamsiddhi,\nCentury Bazar Lane, Worli,\nMumbai 400025"}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* Contact Form Services */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Contact Form Options</h2>
        <p className="text-xs text-[#999] mb-4">Add or reduce services that clients can choose from in the contact form</p>
        
        {/* Current List */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          {(content.services || DETAILS_DEFAULTS.services || []).map((srv) => (
            <span key={srv} className="px-3.5 py-1.5 bg-[#FFF3EB] border border-[#E8740C]/25 text-[#E8740C] rounded-[20px] text-xs font-bold flex items-center gap-2">
              {srv}
              <button
                type="button"
                onClick={() => {
                  const updated = (content.services || DETAILS_DEFAULTS.services || []).filter((s) => s !== srv);
                  setContent((p) => ({ ...p, services: updated }));
                }}
                className="hover:text-red-600 transition-colors font-bold text-sm leading-none"
              >
                ×
              </button>
            </span>
          ))}
          {(content.services || DETAILS_DEFAULTS.services || []).length === 0 && (
            <p className="text-gray-400 text-xs italic">No service options configured.</p>
          )}
        </div>

        {/* Input to Add */}
        <div className="flex gap-2">
          <input
            type="text"
            id="new-service-input"
            placeholder="e.g. Wealth Management"
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  const current = content.services || DETAILS_DEFAULTS.services || [];
                  if (!current.includes(val)) {
                    setContent((p) => ({ ...p, services: [...current, val] }));
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById("new-service-input") as HTMLInputElement;
              const val = input?.value.trim();
              if (val) {
                const current = content.services || DETAILS_DEFAULTS.services || [];
                if (!current.includes(val)) {
                  setContent((p) => ({ ...p, services: [...current, val] }));
                }
                input.value = "";
              }
            }}
            className="bg-[#E8740C] text-white px-5 rounded-[8px] text-xs font-bold hover:bg-[#FF9433] transition-all whitespace-nowrap"
          >
            Add Service
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────

export default function ContactAdminPage() {
  const [tab, setTab] = useState<"home" | "details">("home");

  return (
    <div className="max-w-[700px]">
      {/* Tabs list */}
      <div className="flex border-b border-[#EEE] mb-6">
        <button
          onClick={() => setTab("home")}
          className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 ${
            tab === "home"
              ? "border-[#E8740C] text-[#E8740C]"
              : "border-transparent text-[#666] hover:text-[#333]"
          }`}
        >
          Home Snippet
        </button>
        <button
          onClick={() => setTab("details")}
          className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 ${
            tab === "details"
              ? "border-[#E8740C] text-[#E8740C]"
              : "border-transparent text-[#666] hover:text-[#333]"
          }`}
        >
          Contact Details
        </button>
      </div>

      {/* Tab content rendering */}
      {tab === "home" ? <HomeContactTab /> : <ContactDetailsTab />}
    </div>
  );
}
