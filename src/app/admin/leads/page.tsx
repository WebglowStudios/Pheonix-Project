"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminLead } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faChevronDown,
  faChevronUp,
  faCheck,
  faEye,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

type Lead = AdminLead;

const STATUS_BADGE: Record<string, string> = {
  new: "bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]",
  read: "bg-[#f0f0f0] text-[#666] border border-[#DDD]",
  contacted: "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]",
};

const SOURCE_BADGE: Record<string, string> = {
  home_page: "bg-[#E3F2FD] text-[#1565C0]",
  contact_page: "bg-[#F3E5F5] text-[#6A1B9A]",
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[8px] text-white text-sm font-semibold shadow-lg transition-all ${type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
      {message}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "contacted">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeads = useCallback(async () => {
    try {
      const res = await adminApi.getLeads({
        status: filter === "all" ? undefined : filter,
        search: search.trim() || undefined,
      });
      if (res.success && res.data) {
        setLeads(res.data.leads || []);
        const notesMap: Record<string, string> = {};
        (res.data.leads || []).forEach((l) => {
          notesMap[l.id] = l.notes ?? "";
        });
        setNotes(notesMap);
      }
    } catch {
      showToast("Failed to fetch leads", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  async function updateStatus(id: string, status: "new" | "read" | "contacted") {
    setSaving(id);
    try {
      const res = await adminApi.updateLead(id, { status });
      if (!res.success) {
        showToast("Failed to update status", "error");
      } else {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
        showToast("Status updated", "success");
      }
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setSaving(null);
    }
  }

  async function saveNotes(id: string) {
    setSaving(id + "_notes");
    try {
      const res = await adminApi.updateLead(id, { notes: notes[id] ?? "" });
      if (!res.success) {
        showToast("Failed to save notes", "error");
      } else {
        showToast("Notes saved", "success");
      }
    } catch {
      showToast("Failed to save notes", "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    setSaving(id + "_delete");
    try {
      const res = await adminApi.deleteLead(id);
      if (!res.success) {
        showToast("Failed to delete lead", "error");
      } else {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        showToast("Lead entry deleted", "success");
      }
    } catch {
      showToast("Failed to delete lead", "error");
    } finally {
      setSaving(null);
    }
  }

  const filtered = leads.filter(l => {
    const matchFilter = filter === "all" || (l.status ?? "new") === filter;
    const term = search.toLowerCase();
    const matchSearch = !term || l.name?.toLowerCase().includes(term) || l.email?.toLowerCase().includes(term) || l.phone?.includes(term);
    return matchFilter && matchSearch;
  });

  const newCount = leads.filter(l => (l.status ?? "new") === "new").length;

  const inputClass = "border border-[#DDD] rounded-[8px] px-3 py-2 w-full focus:border-[#E8740C] outline-none text-sm text-[#333] bg-white";

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Leads</h1>
          <p className="text-[#666] text-sm mt-1">
            {newCount > 0 ? (
              <span className="text-[#E8740C] font-semibold">{newCount} unread lead{newCount > 1 ? "s" : ""}</span>
            ) : (
              "All leads reviewed"
            )}
          </p>
        </div>
        <button onClick={fetchLeads} className="border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5] transition-all">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[10px] shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-xs" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={inputClass + " pl-8"}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "new", "read", "contacted"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-[8px] text-sm font-semibold capitalize transition-all ${filter === f ? "bg-[#E8740C] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#EEE]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#EEE]">
                <th className="text-left px-5 py-3 text-[#666] font-semibold text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden md:table-cell">Services</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden xl:table-cell">Connect Time</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden xl:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase">Status</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#999]">No leads found</td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <>
                    <tr
                      key={lead.id}
                      className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    >
                      <td className="px-5 py-3 font-semibold text-[#333]">{lead.name}</td>
                      <td className="px-4 py-3 text-[#555]">{lead.phone}</td>
                      <td className="px-4 py-3 text-[#555] hidden lg:table-cell">{lead.email}</td>
                      <td className="px-4 py-3 text-[#555] hidden md:table-cell text-xs">{(lead.services ?? []).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-[#555] hidden xl:table-cell text-xs capitalize">{lead.connect_time?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SOURCE_BADGE[lead.source] ?? "bg-gray-100 text-gray-600"}`}>
                          {lead.source?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#888] text-xs hidden xl:table-cell whitespace-nowrap">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[lead.status ?? "new"] ?? STATUS_BADGE.new}`}>
                          {lead.status ?? "new"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#999]">
                        <FontAwesomeIcon icon={expandedId === lead.id ? faChevronUp : faChevronDown} className="text-xs" />
                      </td>
                    </tr>

                    {expandedId === lead.id && (
                      <tr key={lead.id + "_expanded"} className="bg-[#FAFBFC] border-b border-[#EEE]">
                        <td colSpan={9} className="px-5 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <h4 className="font-bold text-[#333] mb-2 text-sm">Message / Goals</h4>
                              <p className="text-[#555] text-sm leading-relaxed bg-white border border-[#EEE] rounded-[8px] p-4">
                                {lead.message || "No message provided"}
                              </p>
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <button
                                  onClick={() => updateStatus(lead.id, "read")}
                                  disabled={saving === lead.id || (lead.status ?? "new") === "read"}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f0f0] text-[#555] border border-[#DDD] rounded-[6px] text-xs font-semibold hover:bg-[#EEE] disabled:opacity-50 transition-all"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-[10px]" /> Mark as Read
                                </button>
                                <button
                                  onClick={() => updateStatus(lead.id, "contacted")}
                                  disabled={saving === lead.id || (lead.status ?? "new") === "contacted"}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32] rounded-[6px] text-xs font-semibold hover:bg-[#C8E6C9] disabled:opacity-50 transition-all"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> Mark as Contacted
                                </button>
                                <button
                                  onClick={() => updateStatus(lead.id, "new")}
                                  disabled={saving === lead.id || (lead.status ?? "new") === "new"}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C] rounded-[6px] text-xs font-semibold hover:bg-[#FFE4CC] disabled:opacity-50 transition-all"
                                >
                                  Reset to New
                                </button>
                                <button
                                  onClick={() => deleteLead(lead.id)}
                                  disabled={saving === lead.id + "_delete"}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] rounded-[6px] text-xs font-semibold hover:bg-[#FFCDD2] disabled:opacity-50 transition-all ml-auto"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-[10px]" /> Delete Lead
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-[#333] mb-2 text-sm">Internal Notes</h4>
                              <textarea
                                rows={5}
                                value={notes[lead.id] ?? ""}
                                onChange={e => setNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                placeholder="Add private notes about this lead..."
                                className={inputClass + " resize-none"}
                              />
                              <button
                                onClick={() => saveNotes(lead.id)}
                                disabled={saving === lead.id + "_notes"}
                                className="mt-2 px-4 py-2 bg-[#E8740C] text-white rounded-[8px] text-xs font-semibold hover:bg-[#FF9433] disabled:opacity-60 transition-all"
                              >
                                {saving === lead.id + "_notes" ? "Saving..." : "Save Notes"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
