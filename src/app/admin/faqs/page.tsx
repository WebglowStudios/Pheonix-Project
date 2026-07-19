"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash, faCheck, faXmark, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

interface HomeFaqContent {
  section_heading: string;
  section_subheading: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["general", "products", "fees", "loans", "investment", "services", "account", "compliance", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-[#E3F2FD] text-[#1565C0]",
  products: "bg-[#E8F5E9] text-[#2E7D32]",
  fees: "bg-[#FFF3E0] text-[#E65100]",
  loans: "bg-[#F3E5F5] text-[#6A1B9A]",
  investment: "bg-[#E8F5E9] text-[#2E7D32]",
  services: "bg-[#FFF3E0] text-[#E65100]",
  account: "bg-[#F3E5F5] text-[#6A1B9A]",
  compliance: "bg-[#FCE4EC] text-[#AD1457]",
  other: "bg-[#f0f0f0] text-[#555]",
};

const EMPTY_FAQ = { question: "", answer: "", category: "general", sort_order: 0 };

const HOME_FAQ_DEFAULTS: HomeFaqContent = {
  section_heading: "Frequently Asked Questions",
  section_subheading:
    "Clarity before commitment. Find answers to the questions that matter most about investing with Phoenix Financial Services.",
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
const labelClass = "block text-xs font-semibold text-[#555] mb-1";

// ── Main Component ────────────────────────────────────────────────────────────

export default function FaqsPage() {
  // Home FAQ section content
  const [homeFaq, setHomeFaq] = useState<HomeFaqContent>(HOME_FAQ_DEFAULTS);
  const [homeFaqLoading, setHomeFaqLoading] = useState(true);
  const [homeFaqSaving, setHomeFaqSaving] = useState(false);

  // FAQ items
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FAQ);
  const [showAdd, setShowAdd] = useState(false);
  const [newData, setNewData] = useState(EMPTY_FAQ);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchFaqs();
    // Load home_faq section content
    supabase
      .from("site_content")
      .select("content")
      .eq("id", "home_faq")
      .single()
      .then(({ data }) => {
        if (data?.content) setHomeFaq({ ...HOME_FAQ_DEFAULTS, ...data.content });
        setHomeFaqLoading(false);
      });
  }, []);

  async function fetchFaqs() {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .order("category")
      .order("sort_order");
    setFaqs(data ?? []);
    setLoading(false);
  }

  async function saveHomeFaq() {
    setHomeFaqSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "home_faq", content: homeFaq }, { onConflict: "id" });
    if (error) showToast("Failed to save: " + error.message, "error");
    else showToast("FAQ section header saved!", "success");
    setHomeFaqSaving(false);
  }

  function startEdit(faq: FAQ) {
    setEditId(faq.id);
    setEditData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
    });
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    const { error } = await supabase.from("faqs").update(editData).eq("id", editId);
    if (error) showToast("Failed to save", "error");
    else {
      showToast("FAQ updated", "success");
      setEditId(null);
      fetchFaqs();
    }
    setSaving(false);
  }

  async function addFaq() {
    setSaving(true);
    const catFaqs = faqs.filter((f) => f.category === newData.category);
    const maxOrder =
      catFaqs.length > 0 ? Math.max(...catFaqs.map((f) => f.sort_order ?? 0)) + 1 : 0;
    const { error } = await supabase.from("faqs").insert([{ ...newData, sort_order: maxOrder }]);
    if (error) showToast("Failed to add FAQ", "error");
    else {
      showToast("FAQ added", "success");
      setShowAdd(false);
      setNewData(EMPTY_FAQ);
      fetchFaqs();
    }
    setSaving(false);
  }

  async function deleteFaq(id: string) {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) showToast("Failed to delete", "error");
    else {
      showToast("FAQ deleted", "success");
      setDeleteId(null);
      fetchFaqs();
    }
  }

  async function moveWithinCategory(id: string, dir: "up" | "down") {
    const faq = faqs.find((f) => f.id === id);
    if (!faq) return;
    const catFaqs = faqs
      .filter((f) => f.category === faq.category)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = catFaqs.findIndex((f) => f.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catFaqs.length) return;
    const a = catFaqs[idx];
    const b = catFaqs[swapIdx];
    await Promise.all([
      supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    fetchFaqs();
  }

  // Group by category
  const grouped: Record<string, FAQ[]> = {};
  faqs.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-[#333] text-lg mb-2">Delete FAQ?</h3>
            <p className="text-[#666] text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFaq(deleteId)}
                className="flex-1 bg-[#C62828] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#E53935]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Home FAQ Section Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-[1.8rem] font-bold text-[#333]">FAQs</h1>
        <p className="text-[#666] text-sm mt-1">Manage FAQ section heading and all FAQ items</p>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-6 mb-8 border-l-4 border-[#E8740C]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EEE]">
          <h2 className="font-bold text-[#333]">Homepage FAQ Section Header</h2>
          <button
            onClick={saveHomeFaq}
            disabled={homeFaqSaving || homeFaqLoading}
            className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            {homeFaqSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {homeFaqLoading ? (
          <div className="h-12 flex items-center">
            <div className="w-5 h-5 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Section Heading</label>
              <input
                value={homeFaq.section_heading}
                onChange={(e) => setHomeFaq((p) => ({ ...p, section_heading: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Section Subheading</label>
              <textarea
                rows={2}
                value={homeFaq.section_subheading}
                onChange={(e) => setHomeFaq((p) => ({ ...p, section_subheading: e.target.value }))}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── FAQ Items ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[1.2rem] font-bold text-[#333]">All FAQ Items</h2>
          <p className="text-[#666] text-sm mt-0.5">
            {faqs.length} questions across {Object.keys(grouped).length} categories
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] transition-all"
        >
          <FontAwesomeIcon icon={faPlus} /> Add FAQ
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5 border-l-4 border-[#E8740C]">
          <h3 className="font-bold text-[#333] mb-4">New FAQ</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={newData.category}
                onChange={(e) => setNewData((p) => ({ ...p, category: e.target.value }))}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Question</label>
              <input
                value={newData.question}
                onChange={(e) => setNewData((p) => ({ ...p, question: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Answer</label>
              <textarea
                rows={4}
                value={newData.answer}
                onChange={(e) => setNewData((p) => ({ ...p, answer: e.target.value }))}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowAdd(false)}
              className="border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444]"
            >
              Cancel
            </button>
            <button
              onClick={addFaq}
              disabled={saving || !newData.question || !newData.answer}
              className="bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-[#FF9433]"
            >
              {saving ? "Adding..." : "Add FAQ"}
            </button>
          </div>
        </div>
      )}

      {/* Grouped FAQs */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {category}
                </span>
                <span className="text-[#999] text-xs">{items.length} questions</span>
              </div>

              <div className="flex flex-col gap-3">
                {items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((faq, idx) => (
                    <div key={faq.id} className="bg-white rounded-[10px] shadow-sm overflow-hidden">
                      {editId === faq.id ? (
                        <div className="p-5">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className={labelClass}>Category</label>
                              <select
                                value={editData.category}
                                onChange={(e) =>
                                  setEditData((p) => ({ ...p, category: e.target.value }))
                                }
                                className={inputClass}
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c} value={c} className="capitalize">
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Question</label>
                              <input
                                value={editData.question}
                                onChange={(e) =>
                                  setEditData((p) => ({ ...p, question: e.target.value }))
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Answer</label>
                              <textarea
                                rows={4}
                                value={editData.answer}
                                onChange={(e) =>
                                  setEditData((p) => ({ ...p, answer: e.target.value }))
                                }
                                className={inputClass + " resize-none"}
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => setEditId(null)}
                              className="border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444]"
                            >
                              <FontAwesomeIcon icon={faXmark} className="mr-1" />
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-[#FF9433]"
                            >
                              <FontAwesomeIcon icon={faCheck} className="mr-1" />
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 p-5">
                          <div className="flex flex-col gap-1 text-[#CCC] flex-shrink-0 mt-1">
                            <button
                              onClick={() => moveWithinCategory(faq.id, "up")}
                              disabled={idx === 0}
                              className="hover:text-[#E8740C] disabled:opacity-30 text-xs"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveWithinCategory(faq.id, "down")}
                              disabled={idx === items.length - 1}
                              className="hover:text-[#E8740C] disabled:opacity-30 text-xs"
                            >
                              ▼
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#333] text-sm mb-1">{faq.question}</p>
                            <p className="text-[#666] text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => startEdit(faq)}
                              className="border border-[#DDD] bg-white rounded-[8px] px-3 py-2 text-sm text-[#444] hover:bg-[#f5f5f5]"
                            >
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button
                              onClick={() => setDeleteId(faq.id)}
                              className="border border-[#FFCDD2] bg-[#FFEBEE] rounded-[8px] px-3 py-2 text-sm text-[#C62828] hover:bg-[#FFCDD2]"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <div className="bg-white rounded-[10px] shadow-sm p-12 text-center text-[#999]">
              No FAQs yet. Add your first one.
            </div>
          )}
        </>
      )}
    </div>
  );
}
