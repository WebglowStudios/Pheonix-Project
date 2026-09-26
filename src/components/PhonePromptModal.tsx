"use client";

import { useState } from "react";
import { authApi, getStoredUser, setStoredUser, User } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

interface PhonePromptModalProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export default function PhonePromptModal({ user, onSuccess }: PhonePromptModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const clean = phone.replace(/[\s\-()]/g, "");
    if (!clean || clean.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.updateProfile({ phone: phone.trim() });
      if (res.success && res.user) {
        setStoredUser(res.user);
        onSuccess(res.user);
      } else {
        setError(res.errors?.[0]?.msg || res.message || "Failed to update phone number.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8 animate-scaleUp">
        <div className="w-12 h-12 rounded-xl bg-[#FFF3EB] border border-[#E8740C]/30 flex items-center justify-center mx-auto mb-5 text-[#E8740C]">
          <FontAwesomeIcon icon={faMobileScreenButton} className="text-xl" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-[#1a1b23]">
            Complete Your Profile
          </h2>
          <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
            Welcome, <span className="font-semibold text-[#1a1b23]">{user.name}</span>!
            Please provide your phone number so Phoenix advisors can reach you and send critical portfolio alerts.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#C62828] text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">
              Mobile Number <span className="text-[#E8740C]">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="+91 98765 43210"
                required
                autoFocus
                className="w-full px-4 py-3 border border-[#E2E5EB] rounded-xl text-sm text-[#1a1b23] bg-white transition-all outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 placeholder:text-[#C0C4CC]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#10B981] flex-shrink-0" />
            <span>Your information is encrypted &amp; never shared with third parties.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E8740C] text-white font-bold text-sm transition-all hover:bg-[#d4660b] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin inline-block" />
                Saving...
              </span>
            ) : (
              "Save & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
