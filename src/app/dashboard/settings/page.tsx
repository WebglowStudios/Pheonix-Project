"use client";

import { useState } from "react";
import { authApi, getStoredUser, setStoredUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faShieldHalved, faCheck, faTriangleExclamation,
  faCircleCheck, faPen,
} from "@fortawesome/free-solid-svg-icons";

const ic = "w-full border border-[#E2E5EB] rounded-lg px-3.5 py-2.5 text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 bg-white transition-all";

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Low risk, stable returns",        badge: "text-[#2e7d32] bg-[#EAF5EB]" },
  { value: "moderate",     label: "Moderate",     desc: "Balanced growth and safety",      badge: "text-[#E8740C] bg-[#FFF3EB]" },
  { value: "aggressive",   label: "Aggressive",   desc: "Higher risk, higher potential",   badge: "text-[#b71c1c] bg-[#FFEBEE]" },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatusMsg({ msg }: { msg: { text: string; ok: boolean } }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${msg.ok ? "bg-[#EAF5EB] text-[#2e7d32]" : "bg-[#fff8f8] text-[#c62828] border border-[#FFCDD2]"}`}>
      <FontAwesomeIcon icon={msg.ok ? faCircleCheck : faTriangleExclamation} className="flex-shrink-0 text-xs" />
      {msg.text}
    </div>
  );
}

export default function SettingsPage() {
  const user = getStoredUser();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    riskProfile: user?.riskProfile ?? "moderate",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
      setProfileMsg({ text: "Profile updated successfully.", ok: true });
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
      setPwMsg({ text: "Password changed successfully.", ok: true });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ text: res.message || "Failed to change password.", ok: false });
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg(null), 4000);
  }

  const currentRisk = RISK_OPTIONS.find(r => r.value === (user?.riskProfile ?? "moderate"));

  return (
    <div className="max-w-[580px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1b23]">Account Settings</h1>
        <p className="text-[#8a92a6] text-sm mt-0.5">Manage your profile and security preferences.</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-sm p-5 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E8740C] flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0 select-none">
          {user ? getInitials(user.name) : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#1a1b23] text-base leading-tight">{user?.name}</p>
          <p className="text-[#8a92a6] text-sm mt-0.5">{user?.email}</p>
          {currentRisk && (
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${currentRisk.badge}`}>
              {currentRisk.label} Risk
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aaa] bg-[#F5F6F8] flex-shrink-0">
          <FontAwesomeIcon icon={faPen} style={{ fontSize: 11 }} />
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-[#F0F2F5] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3EB] flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faUser} className="text-[#E8740C] text-xs" />
          </div>
          <h2 className="font-bold text-[#1a1b23] text-[15px]">Profile Information</h2>
        </div>

        <form onSubmit={saveProfile} className="p-6 flex flex-col gap-4">
          {profileMsg && <StatusMsg msg={profileMsg} />}

          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Full Name</label>
            <input
              value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              className={ic}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Email Address</label>
            <input value={user?.email ?? ""} disabled className={ic + " bg-[#F5F6F8] text-[#aaa] cursor-not-allowed"} />
            <p className="text-[#C0C4CC] text-xs mt-1">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Phone Number</label>
            <input
              value={profileForm.phone}
              onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className={ic}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-2">Risk Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map(r => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setProfileForm(p => ({ ...p, riskProfile: r.value as "conservative" | "moderate" | "aggressive" }))}
                  className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all text-center ${
                    profileForm.riskProfile === r.value
                      ? "border-[#E8740C] bg-[#FFF3EB] text-[#E8740C]"
                      : "border-[#E2E5EB] bg-white text-[#555] hover:border-[#E8740C]/30"
                  }`}
                >
                  <span className="block font-bold text-[13px]">{r.label}</span>
                  <span className="block text-[10px] mt-0.5 font-normal opacity-70 leading-tight">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full py-3 bg-[#E8740C] text-white font-semibold rounded-lg hover:bg-[#d4660b] disabled:opacity-50 transition-all shadow-sm mt-1 flex items-center justify-center gap-2"
          >
            {profileSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <><FontAwesomeIcon icon={faCheck} className="text-xs" />Save Profile</>
            )}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F2F5] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5F6F8] flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#1a1b23] text-xs" />
          </div>
          <h2 className="font-bold text-[#1a1b23] text-[15px]">Change Password</h2>
        </div>

        <form onSubmit={savePassword} className="p-6 flex flex-col gap-4">
          {pwMsg && <StatusMsg msg={pwMsg} />}

          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} className={ic} required />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Minimum 6 characters" className={ic} required />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} className={ic} required />
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="w-full py-3 bg-[#1a1b23] text-white font-semibold rounded-lg hover:bg-[#2d2d3f] disabled:opacity-50 transition-all mt-1 flex items-center justify-center gap-2"
          >
            {pwSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <><FontAwesomeIcon icon={faShieldHalved} className="text-xs" />Update Password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
