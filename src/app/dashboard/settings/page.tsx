"use client";

import { useState } from "react";
import { authApi, getStoredUser, setStoredUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShieldHalved, faCheck } from "@fortawesome/free-solid-svg-icons";

const ic = "w-full border border-[#DDD] rounded-[10px] px-3.5 py-2.5 text-sm text-[#333] outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.1)] bg-white transition-all";

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Low risk, stable returns" },
  { value: "moderate",     label: "Moderate",     desc: "Balanced growth & safety" },
  { value: "aggressive",   label: "Aggressive",   desc: "High risk, high reward" },
];

export default function SettingsPage() {
  const user = getStoredUser();

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    riskProfile: user?.riskProfile ?? "moderate",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Password state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const res = await authApi.updateProfile(profileForm);
    if (res.success && res.user) {
      setStoredUser(res.user);
      setProfileMsg({ text: "Profile updated successfully!", ok: true });
    } else {
      setProfileMsg({ text: res.message || "Failed to update profile.", ok: false });
    }
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(null), 4000);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: "New passwords do not match.", ok: false });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: "Password must be at least 6 characters.", ok: false });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const res = await authApi.changePassword({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
    if (res.success) {
      setPwMsg({ text: "Password changed successfully!", ok: true });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ text: res.message || "Failed to change password.", ok: false });
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg(null), 4000);
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">Settings</h1>
        <p className="text-[#666] text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-[16px] border border-[#F0F0F0] shadow-sm p-6 mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#E8740C] flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
          {user ? getInitials(user.name) : "?"}
        </div>
        <div>
          <p className="font-extrabold text-[#1a1b23] text-lg">{user?.name}</p>
          <p className="text-[#666] text-sm">{user?.email}</p>
          <span className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold ${
            user?.riskProfile === "aggressive" ? "bg-[#FFEBEE] text-[#C62828]"
            : user?.riskProfile === "conservative" ? "bg-[#E8F5E9] text-[#2E7D32]"
            : "bg-[#FFF3EB] text-[#E8740C]"
          }`}>
            {user?.riskProfile ?? "moderate"} risk profile
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-[16px] border border-[#F0F0F0] shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FFF3EB] flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-[#E8740C] text-sm" />
          </div>
          <h2 className="font-bold text-[#333]">Profile Information</h2>
        </div>

        <form onSubmit={saveProfile} className="p-6 flex flex-col gap-4">
          {profileMsg && (
            <div className={`px-4 py-3 rounded-[10px] text-sm font-medium ${profileMsg.ok ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFEBEE] text-[#C62828]"}`}>
              {profileMsg.ok && <FontAwesomeIcon icon={faCheck} className="mr-2" />}
              {profileMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">Full Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className={ic} required />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">Email Address</label>
            <input value={user?.email ?? ""} disabled className={ic + " bg-[#F9F9F9] text-[#999] cursor-not-allowed"} />
            <p className="text-[#bbb] text-xs mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">Phone Number</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" className={ic} />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#555] mb-2 uppercase tracking-wide">Risk Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map(r => (
                <button type="button" key={r.value}
                  onClick={() => setProfileForm(p => ({ ...p, riskProfile: r.value as "conservative" | "moderate" | "aggressive" }))}
                  className={`py-2.5 px-3 rounded-[10px] border-2 text-sm font-semibold transition-all text-center ${
                    profileForm.riskProfile === r.value
                      ? "border-[#E8740C] bg-[#FFF3EB] text-[#E8740C]"
                      : "border-[#DDD] bg-white text-[#555] hover:border-[#E8740C]/40"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={profileSaving}
            className="w-full py-3 bg-[#E8740C] text-white font-bold rounded-[10px] border-2 border-[#E8740C] hover:bg-[#FF9433] disabled:opacity-60 transition-all shadow-[0_4px_14px_rgba(232,116,12,0.2)] mt-1">
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-white rounded-[16px] border border-[#F0F0F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FFF3EB] flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#E8740C] text-sm" />
          </div>
          <h2 className="font-bold text-[#333]">Change Password</h2>
        </div>

        <form onSubmit={savePassword} className="p-6 flex flex-col gap-4">
          {pwMsg && (
            <div className={`px-4 py-3 rounded-[10px] text-sm font-medium ${pwMsg.ok ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFEBEE] text-[#C62828]"}`}>
              {pwMsg.ok && <FontAwesomeIcon icon={faCheck} className="mr-2" />}
              {pwMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} className={ic} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" className={ic} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555] mb-1.5 uppercase tracking-wide">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} className={ic} required />
          </div>

          <button type="submit" disabled={pwSaving}
            className="w-full py-3 bg-[#1a1b23] text-white font-bold rounded-[10px] border-2 border-[#1a1b23] hover:bg-[#2d2d3f] disabled:opacity-60 transition-all mt-1">
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
