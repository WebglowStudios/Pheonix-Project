"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

interface SiteSettings {
  footer_about: string;
  disclaimer: string;
  whatsapp_channel: string;
  amfi_reg_no: string;
  bse_reg_no: string;
  nse_reg_no: string;
  mcx_reg_no: string;
}

const DEFAULT: SiteSettings = {
  footer_about: "",
  disclaimer: "",
  whatsapp_channel: "",
  amfi_reg_no: "",
  bse_reg_no: "",
  nse_reg_no: "",
  mcx_reg_no: "",
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

export default function SettingsPage() {
  const [content, setContent] = useState<SiteSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "site_settings").single().then(({ data }) => {
      if (data?.content) setContent({ ...DEFAULT, ...data.content });
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "site_settings", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Settings saved!", "success");
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
          <h1 className="text-[1.8rem] font-bold text-[#333]">Site Settings</h1>
          <p className="text-[#666] text-sm mt-1">Footer content, disclaimer and compliance info</p>
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

      {/* Footer */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Footer</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Footer About Text</label>
            <textarea rows={4} value={content.footer_about} onChange={e => setContent(p => ({ ...p, footer_about: e.target.value }))} placeholder="Phoenix Financial Services is a SEBI-registered..." className={inputClass + " resize-none"} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp Channel Link</label>
            <input value={content.whatsapp_channel} onChange={e => setContent(p => ({ ...p, whatsapp_channel: e.target.value }))} placeholder="https://whatsapp.com/channel/..." className={inputClass} />
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Compliance Registrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>AMFI Registration No.</label>
            <input value={content.amfi_reg_no} onChange={e => setContent(p => ({ ...p, amfi_reg_no: e.target.value }))} placeholder="ARN-XXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>BSE Registration No.</label>
            <input value={content.bse_reg_no} onChange={e => setContent(p => ({ ...p, bse_reg_no: e.target.value }))} placeholder="BSE-XXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>NSE Registration No.</label>
            <input value={content.nse_reg_no} onChange={e => setContent(p => ({ ...p, nse_reg_no: e.target.value }))} placeholder="NSE-XXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>MCX Registration No.</label>
            <input value={content.mcx_reg_no} onChange={e => setContent(p => ({ ...p, mcx_reg_no: e.target.value }))} placeholder="MCX-XXXXX" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5">
        <h2 className="font-bold text-[#333] mb-4 pb-2 border-b border-[#EEE]">Disclaimer</h2>
        <div>
          <label className={labelClass}>Disclaimer Text</label>
          <textarea
            rows={6}
            value={content.disclaimer}
            onChange={e => setContent(p => ({ ...p, disclaimer: e.target.value }))}
            placeholder="Investments in securities market are subject to market risks..."
            className={inputClass + " resize-none"}
          />
          <p className="text-xs text-[#999] mt-1">Displayed in the website footer</p>
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
