"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faArrowLeft, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const inputClass =
    "w-full px-4 py-3 border border-[#DDD] rounded-[10px] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.12)] placeholder:text-[#aaa]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
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
              <FontAwesomeIcon icon={faEnvelope} className="text-[#E8740C] text-2xl" />
            </div>
            <h1 className="text-white font-bold text-xl">Forgot Password?</h1>
            <p className="text-gray-400 text-sm mt-1">We'll send you a reset link</p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              /* Success state */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
                </div>
                <h2 className="font-bold text-[#1a1f2e] text-lg mb-2">Check your inbox</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  If <strong>{email}</strong> is registered with us, you'll receive a password reset link shortly.
                  <br/><br/>
                  The link will expire in <strong>1 hour</strong>.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Didn't get it? Check your spam folder or{" "}
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="text-[#E8740C] font-semibold hover:underline"
                  >
                    try again
                  </button>.
                </p>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-[#E8740C] font-semibold hover:underline"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                  Back to Login
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#E8740C] text-white font-bold rounded-[10px] text-[0.95rem] hover:bg-[#cf6509] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-[#E8740C] font-semibold hover:underline"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
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

