"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi, setToken, setStoredUser, clearToken } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      if (!res.success || !res.token || !res.user) {
        setError(res.message || "Invalid admin credentials.");
        setLoading(false);
        return;
      }

      if (res.user.role !== "admin") {
        clearToken();
        setError("Access denied: This account does not have administrator privileges.");
        setLoading(false);
        return;
      }

      setToken(res.token);
      setStoredUser(res.user);
      router.push("/admin");
    } catch {
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-[#16213e] border border-[#2a2a4e] rounded-[12px] p-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-[32px]">
            <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-[#E8740C] mb-[16px] bg-white flex items-center justify-center">
              <Image src="/logo.jpg" alt="Phoenix Financial Services" width={80} height={80} className="object-contain" />
            </div>
            <h1 className="text-white text-[1.4rem] font-bold tracking-[1px]">Phoenix Financial Services</h1>
            <p className="text-[#8892b0] text-sm mt-1">Admin Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-[18px]">
              <label className="block text-[0.85rem] font-semibold text-[#8892b0] mb-[8px] uppercase tracking-[0.5px]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-[14px] py-[12px] bg-[#0f3460] border border-[#2a2a4e] rounded-[8px] text-white text-[0.95rem] outline-none transition-all focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.15)] placeholder:text-[#4a5568]"
              />
            </div>
            <div className="mb-[24px]">
              <label className="block text-[0.85rem] font-semibold text-[#8892b0] mb-[8px] uppercase tracking-[0.5px]">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-[14px] py-[12px] bg-[#0f3460] border border-[#2a2a4e] rounded-[8px] text-white text-[0.95rem] outline-none transition-all focus:border-[#E8740C] focus:shadow-[0_0_0_3px_rgba(232,116,12,0.15)] placeholder:text-[#4a5568]"
              />
            </div>

            {error && (
              <div className="mb-[16px] bg-[#2d1515] border border-[#5c2626] rounded-[8px] px-[14px] py-[10px] text-[#ff6b6b] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8740C] hover:bg-[#FF9433] text-white font-bold py-[13px] rounded-[8px] transition-all text-[0.95rem] tracking-[0.5px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[#4a5568] text-xs mt-[24px]">
            Protected portal — authorised personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
