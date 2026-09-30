"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi, setToken, setStoredUser, getStoredUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faChartLine,
  faShieldHalved,
  faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  const inputClass =
    "w-full px-4 py-3 border border-[#DDD] rounded-[10px] text-[0.95rem] text-[#333] bg-white transition-all outline-none focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.12)] placeholder:text-[#aaa]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });

      if (!res.success || !res.token || !res.user) {
        setError(res.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      setToken(res.token);
      setStoredUser(res.user);
      if (res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F2F3F5]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-[#1a1b23] px-12 py-14">
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
          <h1 className="text-[2.6rem] font-extrabold text-white leading-[1.2] mb-6">
            Your wealth,<br />
            <span className="text-[#E8740C]">intelligently managed.</span>
          </h1>
          <p className="text-[#9ca3af] text-[1rem] leading-relaxed mb-10">
            Track every rupee across stocks, mutual funds, SIPs, FDs, and more
            — all in one powerful dashboard.
          </p>

          <div className="flex flex-col gap-5">
            {[
              { icon: faChartLine, title: "Live Portfolio Tracking", desc: "Real-time prices for stocks & NAV for MFs" },
              { icon: faSackDollar, title: "All Asset Classes", desc: "Stocks, SIP, MF, PF, FD, Gold & more" },
              { icon: faShieldHalved, title: "Secure & Private", desc: "Your data is encrypted and never shared" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#E8740C]/15 border border-[#E8740C]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={f.icon} className="text-[#E8740C] text-sm" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#4b5563] text-xs">
          © 2026 Phoenix Financial Services. AMFI Registered · BSE · NSE · MCX
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/logo.jpg" alt="Phoenix Financial" width={120} height={48} className="max-h-12 w-auto object-contain rounded-[6px]" />
          </div>

          <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
            <div className="mb-7">
              <h2 className="text-[1.75rem] font-extrabold text-[#1a1b23]">
                Welcome back
              </h2>
              <p className="text-[#666] text-sm mt-1">
                Sign in to your portfolio dashboard
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-[10px] text-[#C62828] text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-[#333] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#333] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={inputClass + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#E8740C] transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[30px] bg-[#E8740C] text-white font-bold text-[1rem] border-2 border-[#E8740C] transition-all hover:bg-[#FF9433] hover:border-[#FF9433] hover:shadow-[0_8px_24px_rgba(232,116,12,0.25)] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-[#E5E7EB]"></div>
              <span className="px-3 text-xs text-[#9CA3AF] uppercase font-semibold tracking-wider">
                Or continue with
              </span>
              <div className="flex-1 border-t border-[#E5E7EB]"></div>
            </div>

            <GoogleSignInButton text="continue_with" onError={(msg) => setError(msg)} />

            <p className="text-center text-sm text-[#666] mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#E8740C] font-semibold hover:text-[#FF9433]">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-[#999] mt-5">
            By signing in, you agree to our{" "}
            <a href="#" className="text-[#666] hover:text-[#E8740C]">Terms</a>
            {" & "}
            <a href="#" className="text-[#666] hover:text-[#E8740C]">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
