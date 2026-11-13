"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEye, faEyeSlash, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const { token }   = useParams<{ token: string }>();
  const router      = useRouter();

  const [form, setForm]       = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw]   = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const inputClass =
    "w-full px-4 py-3 border border-[#DDD] rounded-[10px] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.12)] placeholder:text-[#aaa]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (form.newPassword !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword:     form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Phoenix Finance" width={160} height={48} className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a1f2e] px-8 py-6 text-center">
            <div className="w-14 h-14 bg-[#E8740C]/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faLock} className="text-[#E8740C] text-2xl" />
            </div>
            <h1 className="text-white font-bold text-xl">Set New Password</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a strong password</p>
          </div>

          <div className="px-8 py-8">
            {done ? (
              /* Success state */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
                </div>
                <h2 className="font-bold text-[#1a1f2e] text-lg mb-2">Password Reset!</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Your password has been updated successfully. Redirecting you to login…
                </p>
                <Link
                  href="/login"
                  className="text-[#E8740C] font-semibold text-sm hover:underline"
                >
                  Go to Login →
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw.new ? "text" : "password"}
                        value={form.newPassword}
                        onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="At least 6 characters"
                        className={inputClass + " pr-11"}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={showPw.new ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw.confirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        className={inputClass + " pr-11"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={showPw.confirm ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#E8740C] text-white font-bold rounded-[10px] text-[0.95rem] hover:bg-[#cf6509] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </button>
                </form>

                <div className="text-center mt-5">
                  <Link href="/login" className="text-sm text-[#E8740C] font-semibold hover:underline">
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

