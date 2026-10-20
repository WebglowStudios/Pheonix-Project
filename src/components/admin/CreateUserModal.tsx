"use client";

import { useState } from "react";
import { adminApi, AdminUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUserPlus,
  faEye,
  faEyeSlash,
  faDice,
  faCopy,
  faCheck,
  faSpinner,
  faShieldHalved,
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faExternalLinkAlt,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: AdminUser) => void;
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const specials = "!@#$%&*";
  let pwd = "Pfx";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += specials.charAt(Math.floor(Math.random() * specials.length));
  pwd += Math.floor(10 + Math.random() * 90);
  return pwd;
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  if (!isOpen) return null;

  function handleGeneratePassword() {
    const pwd = generateRandomPassword();
    setPassword(pwd);
    setShowPassword(true);
  }

  function handleReset() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setRole("user");
    setRiskProfile("moderate");
    setError(null);
    setCreatedUser(null);
    setCreatedPassword("");
    setCopied(false);
    setImpersonating(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the client's full name.");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s\-()]/g, "");
      if (!/^[+]?\d{10,15}$/.test(cleanPhone)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await adminApi.createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        role,
        riskProfile,
      });

      if (res.success && res.user) {
        const newUser = res.user;
        setCreatedUser(newUser);
        setCreatedPassword(password.trim());
        onUserCreated(newUser);
      } else {
        setError(res.message || "Failed to create user account.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error creating user.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCredentials() {
    if (!createdUser) return;
    const cleanPhone = createdUser.phone ? createdUser.phone.trim() : "—";
    const text = `*Phoenix Financial Services — Investor Account*\n\n` +
      `Hello ${createdUser.name},\nYour portfolio account has been provisioned:\n` +
      `• Portal: https://phoenixfiserv.co.in/login\n` +
      `• Email: ${createdUser.email}\n` +
      `• Password: ${createdPassword}\n` +
      `• Registered Phone: ${cleanPhone}\n\n` +
      `You can login anytime to track your stocks, mutual funds, and wealth statements.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleLaunchClientSession() {
    if (!createdUser) return;
    const userId = createdUser.id || (createdUser as { _id?: string })._id;
    if (!userId) return;

    setImpersonating(true);
    try {
      const res = await adminApi.impersonateUser(userId);
      if (res.success && res.token) {
        // Save token to a temporary session and open dashboard in new tab
        const url = `/dashboard?access_token=${encodeURIComponent(res.token)}`;
        window.open(url, "_blank");
      } else {
        alert(res.message || "Could not launch client session.");
      }
    } catch {
      alert("Failed to launch client portfolio management session.");
    } finally {
      setImpersonating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] border border-gray-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Top Radiant Accent Bar ── */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[#E8740C] to-transparent shadow-[0_0_14px_#E8740C] flex-shrink-0" />

        {/* Modal Header */}
        <div className="bg-[#12131a] text-white px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E8740C] to-[#b95704] text-white flex items-center justify-center text-lg flex-shrink-0 shadow-[0_0_15px_rgba(232,116,12,0.3)] border border-white/10">
              <FontAwesomeIcon icon={faUserPlus} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Create Client Account</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Provision new investor credentials for employee stock &amp; portfolio handling
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {createdUser ? (
            /* ─── SUCCESS / CREDENTIAL HAND-OFF STATE ─── */
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-[#E8F5E9] border border-[#2E7D32]/30 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faCheck} className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1B5E20] text-sm">Account Created Successfully!</h3>
                  <p className="text-xs text-[#2E7D32] mt-0.5">
                    Investor account is active in MongoDB Atlas and ready for portfolio entries.
                  </p>
                </div>
              </div>

              {/* Credential Card */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Client Credentials
                  </span>
                  <span className="text-[11px] font-semibold text-[#E8740C] bg-[#FFF3EB] px-2 py-0.5 rounded">
                    Active Client
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-[#64748B]">Investor Name</p>
                    <p className="font-bold text-[#1a1b23] truncate">{createdUser.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#64748B]">Registered Phone</p>
                    <p className="font-bold text-[#1a1b23]">{createdUser.phone || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#64748B]">Login Email</p>
                    <p className="font-mono text-xs font-semibold text-[#1a1b23] bg-white border border-[#E2E8F0] p-2 rounded-lg truncate">
                      {createdUser.email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#64748B]">Assigned Password</p>
                    <p className="font-mono text-xs font-bold text-[#E8740C] bg-[#FFF3EB] border border-[#E8740C]/30 p-2 rounded-lg">
                      {createdPassword}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1a1b23] font-bold text-xs transition-all shadow-sm"
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? "text-[#2E7D32]" : "text-[#64748B]"} />
                  <span>{copied ? "Copied to Clipboard!" : "Copy WhatsApp/Email Template"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLaunchClientSession}
                  disabled={impersonating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E8740C] hover:bg-[#d06405] !text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                >
                  <FontAwesomeIcon icon={impersonating ? faSpinner : faExternalLinkAlt} className={`${impersonating ? "animate-spin" : ""} text-white`} />
                  <span className="!text-white">Manage Stocks in Dashboard</span>
                </button>
              </div>

              <div className="text-right pt-1">
                <button
                  onClick={handleClose}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#1a1b23] transition-colors"
                >
                  Done & Return to Client List
                </button>
              </div>
            </div>
          ) : (
            /* ─── CREATION FORM STATE ─── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-[#FEE2E2] border border-[#EF4444]/30 rounded-xl p-3 text-xs font-semibold text-[#B91C1C] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Investor Full Name <span className="text-[#E8740C]">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C] transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-[#E8740C]">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="email"
                      required
                      placeholder="client@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Mobile Phone <span className="text-gray-400 font-normal text-[10px]">(10 Digits)</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password Field with Random Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    Initial Password <span className="text-[#E8740C]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-[#E8740C] hover:text-[#d06405] flex items-center gap-1 transition-colors"
                  >
                    <FontAwesomeIcon icon={faDice} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  You can copy and send these credentials to the client once created.
                </p>
              </div>

              {/* Role & Risk Profile Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "user" | "admin")}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] bg-white"
                  >
                    <option value="user">Investor / Client (Default)</option>
                    <option value="admin">Administrator (Governance Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Investor Risk Profile
                  </label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as "conservative" | "moderate" | "aggressive")}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] bg-white"
                  >
                    <option value="moderate">Moderate Growth (Balanced)</option>
                    <option value="conservative">Conservative (Capital Shield)</option>
                    <option value="aggressive">Aggressive (High Equity/Alpha)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#E8740C] hover:bg-[#d06405] !text-white text-sm font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 active:scale-95"
                >
                  {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-white" />}
                  <span className="!text-white">{loading ? "Creating Account..." : "Create Client Account"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
