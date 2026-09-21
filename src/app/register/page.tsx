"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi, setToken, setStoredUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Low risk, stable returns" },
  { value: "moderate", label: "Moderate", desc: "Balanced growth & safety" },
  { value: "aggressive", label: "Aggressive", desc: "High risk, high reward" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    riskProfile: "moderate",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full px-3.5 py-2.5 border border-[#E2E5EB] rounded-lg text-sm text-[#1a1b23] bg-white transition-all outline-none focus:border-[#E8740C] focus:ring-2 focus:ring-[#E8740C]/10 placeholder:text-[#C0C4CC]";

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        riskProfile: form.riskProfile,
      });

      if (!res.success || !res.token || !res.user) {
        const msg =
          res.errors?.[0]?.msg || res.message || "Registration failed. Please try again.";
        setError(msg);
        setLoading(false);
        return;
      }

      // Auto-login after registration
      setToken(res.token);
      setStoredUser(res.user);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F2F3F5]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#1a1b23] px-12 py-14">
        <div>
          <Image
            src="/logo.jpg"
            alt="Phoenix Financial Services"
            width={140}
            height={56}
            className="max-h-14 w-auto object-contain rounded-[6px]"
          />
        </div>
        <div>
          <h1 className="text-[2.4rem] font-extrabold text-white leading-[1.2] mb-5">
            Start your<br />
            <span className="text-[#E8740C]">wealth journey.</span>
          </h1>
          <p className="text-[#9ca3af] text-[0.95rem] leading-relaxed">
            Join Phoenix Portfolio and get a unified view of all your
            investments — stocks, SIPs, mutual funds, FDs, and more.
          </p>
          <div className="mt-8 p-5 rounded-[12px] bg-white/[0.05] border border-white/10">
            <p className="text-[#E8740C] font-bold text-sm mb-2">Risk Profiles Explained</p>
            {RISK_OPTIONS.map((r) => (
              <div key={r.value} className="flex items-start gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#E8740C] mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-white text-xs font-semibold">{r.label}: </span>
                  <span className="text-[#9ca3af] text-xs">{r.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#4b5563] text-xs">
          © 2026 Phoenix Financial Services
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[460px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/logo.jpg" alt="Phoenix Financial" width={120} height={48} className="max-h-12 w-auto object-contain rounded-[6px]" />
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-6">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-[#1a1b23]">Create your account</h2>
              <p className="text-[#8a92a6] text-sm mt-0.5">It&apos;s free to get started</p>
            </div>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-[#fff8f8] border border-[#FFCDD2] rounded-lg text-[#C62828] text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Name + Phone side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ravi Sharma"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">
                    Phone <span className="text-[#C0C4CC] font-normal normal-case tracking-normal">optional</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="ravi@example.com"
                  required
                  className={inputClass}
                />
              </div>

              {/* Risk profile */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-2">Risk Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_OPTIONS.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => update("riskProfile", r.value)}
                      className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-all text-center ${
                        form.riskProfile === r.value
                          ? "border-[#E8740C] bg-[#FFF3EB] text-[#E8740C]"
                          : "border-[#E2E5EB] bg-white text-[#555] hover:border-[#E8740C]/40"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password + Confirm side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className={inputClass + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C0C4CC] hover:text-[#E8740C] transition-colors"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8a92a6] uppercase tracking-widest mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      placeholder="Re-enter"
                      required
                      className={inputClass + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C0C4CC] hover:text-[#E8740C] transition-colors"
                    >
                      <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#E8740C] text-white font-semibold text-sm transition-all hover:bg-[#d4660b] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin inline-block" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#8a92a6] mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-[#E8740C] font-semibold hover:text-[#d4660b]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
