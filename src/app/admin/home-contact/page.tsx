"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

interface HomeContactContent {
  section_heading: string;
  section_subheading: string;
}

const DEFAULTS: HomeContactContent = {
  section_heading: "Get in Touch",
  section_subheading: "Speak with our expert advisors today — and take the first step toward structured, long-term wealth management",
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

export default function HomeContactPage() {
  const [content, setContent] = useState<HomeContactContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.from("site_content").select("content").eq("id", "home_contact").single()
      .then(({ data }) => {
        if (data?.content) setContent({ ...DEFAULTS, ...data.content });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "home_contact", content }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("Contact section saved!", "success");
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
