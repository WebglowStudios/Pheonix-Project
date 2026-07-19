"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

interface ContactContent {
  phone_landline: string;
  phone_mobile: string;
  whatsapp_number: string;
  email: string;
  pune_address: string;
  mumbai_address: string;
  services?: string[];
}

const DEFAULT: ContactContent = {
  phone_landline: "",
  phone_mobile: "",
  whatsapp_number: "",
  email: "",
  pune_address: "",
  mumbai_address: "",
  services: ["Advisory", "Asset Management", "Fixed Income"],
};

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[8px] text-white text-sm font-semibold shadow-lg ${type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
      {message}
    </div>
  );
}

const inputClass = "border border-[#DDD] rounded-[8px] px-3 py-2 w-full focus:border-[#E8740C] outline-none text-sm text-[#333] bg-white";
const labelClass = "block text-sm font-semibold text-[#555] mb-1";

export default function ContactInfoPage() {
  const [content, setContent] = useState<ContactContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "contact_info").single().then(({ data }) => {
      if (data?.content) setContent({ ...DEFAULT, ...data.content });
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "contact_info", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Contact info saved!", "success");
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
            <input type="email" value={content.email} onChange={e => setContent(p => ({ ...p, email: e.target.value }))} placeholder="phoenixcfe@gmail.com" className={inputClass} />
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
          {(content.services || DEFAULT.services || []).map((srv) => (
            <span key={srv} className="px-3.5 py-1.5 bg-[#FFF3EB] border border-[#E8740C]/25 text-[#E8740C] rounded-[20px] text-xs font-bold flex items-center gap-2">
              {srv}
              <button
                type="button"
                onClick={() => {
                  const updated = (content.services || DEFAULT.services || []).filter((s) => s !== srv);
                  setContent((p) => ({ ...p, services: updated }));
                }}
                className="hover:text-red-600 transition-colors font-bold text-sm leading-none"
              >
                ×
              </button>
            </span>
          ))}
          {(content.services || DEFAULT.services || []).length === 0 && (
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
                  const current = content.services || DEFAULT.services || [];
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
                const current = content.services || DEFAULT.services || [];
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
