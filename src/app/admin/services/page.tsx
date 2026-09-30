"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash, faCheck, faXmark, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import IconSelectorModal from "@/components/admin/IconSelectorModal";

interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  icon_img: string;
  category: string;
  features: string[];
  sort_order: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  growth: "bg-[#E8F5E9] text-[#2E7D32]",
  anchor: "bg-[#E3F2FD] text-[#1565C0]",
  pinnacle: "bg-[#FFF3E0] text-[#E65100]",
  suite: "bg-[#F3E5F5] text-[#6A1B9A]",
};

const CATEGORIES = ["growth", "anchor", "pinnacle", "suite"];

const EMPTY_SERVICE: Omit<Service, "id"> = {
  title: "",
  description: "",
  icon_name: "",
  icon_img: "",
  category: "growth",
  features: [],
  sort_order: 0,
};

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[8px] text-white text-sm font-semibold shadow-lg ${type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"}`}>
      {message}
    </div>
  );
}

const inputClass = "border border-[#DDD] rounded-[8px] px-3 py-2 w-full focus:border-[#E8740C] outline-none text-sm text-[#333] bg-white";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Service, "id">>(EMPTY_SERVICE);
  const [showAdd, setShowAdd] = useState(false);
  const [newData, setNewData] = useState<Omit<Service, "id">>(EMPTY_SERVICE);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [editNewFeature, setEditNewFeature] = useState("");
  const [isIconOpen, setIsIconOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<"add" | "edit" | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await adminApi.getServices();
      const list = (res.services || (res.data as any)?.services || []) as Service[];
      setServices(list);
    } catch {
      showToast("Failed to load services", "error");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setEditData({
      title: s.title,
      description: s.description,
      icon_name: s.icon_name ?? "",
      icon_img: s.icon_img ?? "",
      category: s.category,
      features: [...(s.features ?? [])],
      sort_order: s.sort_order,
    });
    setEditNewFeature("");
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await adminApi.updateService(editId, editData);
      if (!res.success) {
        showToast("Failed to save", "error");
      } else {
        showToast("Service updated", "success");
        setEditId(null);
        fetchServices();
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    setSaving(true);
    const maxOrder = services.length > 0 ? Math.max(...services.map(s => s.sort_order ?? 0)) + 1 : 0;
    try {
      const res = await adminApi.createService({ ...newData, sort_order: maxOrder });
      if (!res.success) {
        showToast("Failed to add service", "error");
      } else {
        showToast("Service added", "success");
        setShowAdd(false);
        setNewData(EMPTY_SERVICE);
        fetchServices();
      }
    } catch {
      showToast("Failed to add service", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id: string) {
    try {
      const res = await adminApi.deleteService(id);
      if (!res.success) {
        showToast("Failed to delete", "error");
      } else {
        showToast("Service deleted", "success");
        setDeleteId(null);
        fetchServices();
      }
    } catch {
      showToast("Failed to delete", "error");
    }
  }

  async function moveService(id: string, dir: "up" | "down") {
    const idx = services.findIndex(s => s.id === id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= services.length) return;

    const newServices = [...services];
    const a = newServices[idx];
    const b = newServices[swapIdx];
    const tempOrder = a.sort_order;

    await Promise.all([
      adminApi.updateService(a.id, { sort_order: b.sort_order }),
      adminApi.updateService(b.id, { sort_order: tempOrder }),
    ]);
    fetchServices();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const FeatureEditor = ({
    features,
    onChange,
    newFeatureVal,
    onNewFeatureChange,
  }: {
    features: string[];
    onChange: (f: string[]) => void;
    newFeatureVal: string;
    onNewFeatureChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-[#555] mb-1">Features</label>
      <div className="flex flex-col gap-1 mb-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm bg-[#f9f9f9] border border-[#EEE] rounded-[6px] px-3 py-1.5">{f}</span>
            <button
              type="button"
              onClick={() => onChange(features.filter((_, j) => j !== i))}
              className="text-[#C62828] hover:text-[#E53935] text-xs"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newFeatureVal}
          onChange={e => onNewFeatureChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && newFeatureVal.trim()) {
              e.preventDefault();
              onChange([...features, newFeatureVal.trim()]);
              onNewFeatureChange("");
            }
          }}
          placeholder="Add feature (Enter to add)"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            if (newFeatureVal.trim()) {
              onChange([...features, newFeatureVal.trim()]);
              onNewFeatureChange("");
            }
          }}
          className="px-3 py-2 bg-[#E8740C] text-white rounded-[8px] text-sm hover:bg-[#FF9433] flex-shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-[#333] text-lg mb-2">Delete Service?</h3>
            <p className="text-[#666] text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5]">Cancel</button>
              <button onClick={() => deleteService(deleteId)} className="flex-1 bg-[#C62828] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#E53935]">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#333]">Services</h1>
          <p className="text-[#666] text-sm mt-1">{services.length} services configured</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setNewData(EMPTY_SERVICE); }}
          className="flex items-center gap-2 bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#FF9433] transition-all"
        >
          <FontAwesomeIcon icon={faPlus} /> Add Service
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-[10px] shadow-sm p-6 mb-5 border-l-4 border-[#E8740C]">
          <h3 className="font-bold text-[#333] mb-4">New Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1">Title</label>
              <input value={newData.title} onChange={e => setNewData(p => ({ ...p, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1">Category</label>
              <select value={newData.category} onChange={e => setNewData(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#555] mb-1">Description</label>
              <textarea rows={3} value={newData.description} onChange={e => setNewData(p => ({ ...p, description: e.target.value }))} className={inputClass + " resize-none"} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1">Icon Name</label>
              <div className="flex gap-2">
                <input
                  value={newData.icon_name}
                  onChange={(e) => setNewData((p) => ({ ...p, icon_name: e.target.value }))}
                  className={inputClass}
                  placeholder="faArrowTrendUp"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveFormType("add");
                    setIsIconOpen(true);
                  }}
                  className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                >
                  Select Icon
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1">Sort Order</label>
              <input type="number" value={newData.sort_order} onChange={e => setNewData(p => ({ ...p, sort_order: Number(e.target.value) }))} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <FeatureEditor
                features={newData.features}
                onChange={f => setNewData(p => ({ ...p, features: f }))}
                newFeatureVal={newFeature}
                onNewFeatureChange={setNewFeature}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444]">Cancel</button>
            <button onClick={addService} disabled={saving || !newData.title} className="bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-[#FF9433]">
              {saving ? "Adding..." : "Add Service"}
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="flex flex-col gap-4">
        {services.map((s, idx) => (
          <div key={s.id} className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            {editId === s.id ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#555] mb-1">Title</label>
                    <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555] mb-1">Category</label>
                    <select value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#555] mb-1">Description</label>
                    <textarea rows={3} value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} className={inputClass + " resize-none"} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555] mb-1">Icon Name</label>
                    <div className="flex gap-2">
                      <input
                        value={editData.icon_name}
                        onChange={(e) => setEditData((p) => ({ ...p, icon_name: e.target.value }))}
                        className={inputClass}
                        placeholder="faArrowTrendUp"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFormType("edit");
                          setIsIconOpen(true);
                        }}
                        className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 rounded-[8px] text-xs font-semibold hover:bg-gray-200 transition-all whitespace-nowrap"
                      >
                        Select Icon
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555] mb-1">Sort Order</label>
                    <input type="number" value={editData.sort_order} onChange={e => setEditData(p => ({ ...p, sort_order: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <FeatureEditor
                      features={editData.features}
                      onChange={f => setEditData(p => ({ ...p, features: f }))}
                      newFeatureVal={editNewFeature}
                      onNewFeatureChange={setEditNewFeature}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setEditId(null)} className="border border-[#DDD] bg-white rounded-[8px] px-4 py-2 text-sm font-semibold text-[#444]">Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="bg-[#E8740C] text-white rounded-[8px] px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-[#FF9433]">
                    {saving ? "Saving..." : <><FontAwesomeIcon icon={faCheck} className="mr-1" />Save</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex flex-col gap-1 text-[#CCC]">
                  <button onClick={() => moveService(s.id, "up")} disabled={idx === 0} className="hover:text-[#E8740C] disabled:opacity-30 transition-colors text-xs">▲</button>
                  <FontAwesomeIcon icon={faGripVertical} className="text-[#DDD]" />
                  <button onClick={() => moveService(s.id, "down")} disabled={idx === services.length - 1} className="hover:text-[#E8740C] disabled:opacity-30 transition-colors text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-[#333]">{s.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${CATEGORY_COLORS[s.category] ?? "bg-gray-100 text-gray-600"}`}>{s.category}</span>
                  </div>
                  <p className="text-[#666] text-sm truncate">{s.description}</p>
                  {(s.features ?? []).length > 0 && (
                    <p className="text-[#999] text-xs mt-1">{s.features.length} features</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="border border-[#DDD] bg-white rounded-[8px] px-3 py-2 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5] transition-all">
                    <FontAwesomeIcon icon={faPencil} />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="border border-[#FFCDD2] bg-[#FFEBEE] rounded-[8px] px-3 py-2 text-sm font-semibold text-[#C62828] hover:bg-[#FFCDD2] transition-all">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <IconSelectorModal
        isOpen={isIconOpen}
        onClose={() => {
          setIsIconOpen(false);
          setActiveFormType(null);
        }}
        onSelect={(icon) => {
          if (activeFormType === "add") {
            setNewData((p) => ({ ...p, icon_name: icon }));
          } else if (activeFormType === "edit") {
            setEditData((p) => ({ ...p, icon_name: icon }));
          }
          setIsIconOpen(false);
          setActiveFormType(null);
        }}
      />
    </div>
  );
}
