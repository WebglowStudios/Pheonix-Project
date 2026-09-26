"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { clearToken, getStoredUser, authApi, setStoredUser, type User } from "@/lib/api";
import PhonePromptModal from "@/components/PhonePromptModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faChartPie,
  faPlus,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: faHouse, exact: true },
  { href: "/dashboard/portfolio", label: "My Portfolio", icon: faChartPie, exact: false },
  { href: "/dashboard/add", label: "Add Investment", icon: faPlus, exact: false },
  { href: "/dashboard/report", label: "Portfolio Report", icon: faFilePdf, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: faGear, exact: false },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Sidebar — extracted outside layout to prevent remount on every render ──
function Sidebar({
  user, pathname, onClose, onLogout,
}: {
  user: User | null;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-[252px] h-full bg-[#16171e] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex items-center justify-center ring-2 ring-[#E8740C]/40 flex-shrink-0">
          <Image src="/logo.jpg" alt="Logo" width={36} height={36} className="object-contain" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Phoenix</p>
          <p className="text-[#E8740C] text-[10px] font-semibold uppercase tracking-[1px]">Portfolio</p>
        </div>
      </div>

      {/* User pill */}
      {user && (
        <div className="mx-3 mt-4 mb-1 px-3 py-2.5 rounded-[10px] bg-white/[0.06] border border-white/[0.08] flex items-center gap-2.5">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#E8740C] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none">
              {getInitials(user.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold truncate leading-tight">{user.name}</p>
            <p className="text-white/40 text-[11px] truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-[9px] rounded-[8px] mb-0.5 text-[13px] font-semibold transition-all no-underline ${
                isActive
                  ? "bg-[#E8740C] !text-white"
                  : "!text-white/60 hover:bg-white/[0.06] hover:!text-white"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-[14px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 py-[9px] rounded-[8px] text-[13px] font-semibold text-white/50 hover:bg-[#c62828]/20 hover:text-[#f87171] transition-all"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-[14px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setChecking(false);        // ← Fix B2: clear spinner before redirect
      router.replace("/login");
      return;
    }
    setUser(stored);
    setChecking(false);

    // Refresh user data from server in background
    authApi.me().then((res) => {
      if (res.success && res.user) {
        setUser(res.user);
        setStoredUser(res.user);
      }
    });
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F2F3F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#666] text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen bg-[#F3F4F7]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex sticky top-0 h-screen print:hidden">
        <Sidebar user={user} pathname={pathname} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full"
            style={{ animation: "slideIn 0.2s ease-out" }}
          >
            <Sidebar user={user} pathname={pathname} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 bg-[#16171e] px-4 py-3 border-b border-white/[0.08] sticky top-0 z-40 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 p-1.5 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="text-base" />
          </button>
          <span className="text-white font-bold text-sm flex-1 tracking-tight">Phoenix Portfolio</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white p-1.5 transition-colors">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
          {user && (
            <div className="w-7 h-7 rounded-lg bg-[#E8740C] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 select-none">
              {getInitials(user.name)}
            </div>
          )}
        </div>

        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Phone prompt modal for users without a registered phone number */}
      {user && (!user.phone || user.phone.trim() === "") && (
        <PhonePromptModal
          user={user}
          onSuccess={(updated) => setUser(updated)}
        />
      )}

      {/* slideIn keyframe for mobile sidebar */}
      <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
