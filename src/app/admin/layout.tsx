"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearToken, getStoredUser, authApi, setStoredUser, type User } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faUsers,
  faInbox,
  faImage,
  faInfo,
  faBriefcase,
  faListOl,
  faBullseye,
  faCircleQuestion,
  faAddressBook,
  faGear,
  faBullhorn,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const NAV_ITEMS = [
  { href: "/admin", label: "Executive Dashboard", icon: faHouse },
  { href: "/admin/users", label: "Registered Clients", icon: faUsers },
  { href: "/admin/leads", label: "Client Inquiries", icon: faInbox },
  { href: "/admin/promo", label: "Promo Popup", icon: faBullhorn },
  { isHeader: true, label: "Homepage Sections" },
  { href: "/admin/hero", label: "Hero Banner", icon: faImage },
  { href: "/admin/home-services", label: "Home Services", icon: faHouse },
  { href: "/admin/process", label: "Process Steps", icon: faListOl },
  { href: "/admin/goals", label: "Financial Goals", icon: faBullseye },
  { href: "/admin/faqs", label: "FAQs Catalog", icon: faCircleQuestion },
  { isHeader: true, label: "Catalog & Settings" },
  { href: "/admin/about", label: "About Page", icon: faInfo },
  { href: "/admin/services", label: "Service Offerings", icon: faBriefcase },
  { href: "/admin/contact", label: "Contact Info", icon: faAddressBook },
  { href: "/admin/settings", label: "Site Metadata", icon: faGear },
];

function AdminSidebar({
  adminUser,
  pathname,
  onClose,
  onLogout,
}: {
  adminUser: User | null;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-[260px] h-full bg-[#16171e] flex flex-col flex-shrink-0">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex items-center justify-center ring-2 ring-[#E8740C]/40 flex-shrink-0">
          <Image src="/logo.jpg" alt="Logo" width={36} height={36} className="object-contain" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Phoenix</p>
          <p className="text-[#E8740C] text-[10px] font-semibold uppercase tracking-[1px]">
            Governance
          </p>
        </div>
      </div>

      {/* Admin user pill */}
      {adminUser && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-[10px] bg-white/[0.06] border border-white/[0.08] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8740C] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none">
            {adminUser.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[13px] font-semibold truncate leading-tight">
              {adminUser.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="text-[10px] font-bold text-[#E8740C] uppercase tracking-wider">
                Administrator
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div
                key={`hdr-${idx}`}
                className="text-white/40 uppercase tracking-[1.5px] text-[10px] font-bold px-3.5 pt-3.5 pb-1.5"
              >
                {item.label}
              </div>
            );
          }
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href!));
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-[8px] rounded-[8px] mb-0.5 text-[13px] font-semibold transition-all no-underline ${
                isActive
                  ? "bg-[#E8740C] !text-white shadow-sm"
                  : "!text-white/60 hover:bg-white/[0.06] hover:!text-white"
              }`}
            >
              <FontAwesomeIcon icon={item.icon!} className="w-[14px] flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Switch to Client Dashboard & Logout */}
      <div className="p-3 border-t border-white/[0.08] flex flex-col gap-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 w-full px-3.5 py-[8px] rounded-[8px] text-[13px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all no-underline"
        >
          <FontAwesomeIcon icon={faHouse} className="w-[14px] text-[#E8740C]" />
          Switch to User Dashboard
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3.5 py-[9px] rounded-[8px] text-[13px] font-semibold text-white/50 hover:bg-[#c62828]/20 hover:text-[#f87171] transition-all"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-[14px]" />
          Sign Out Admin
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Don't check auth on the login page itself
    if (pathname.startsWith("/admin/login")) {
      setChecking(false);
      return;
    }

    const stored = getStoredUser();
    if (stored && stored.role === "admin") {
      setAdminUser(stored);
      setChecking(false);
    } else if (!stored) {
      router.replace("/admin/login");
      return;
    }

    // Always verify with backend /api/auth/me
    authApi
      .me()
      .then((res) => {
        if (res.success && res.user && res.user.role === "admin") {
          setAdminUser(res.user);
          setStoredUser(res.user);
          setChecking(false);
        } else {
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (!stored || stored.role !== "admin") {
          router.replace("/admin/login");
        }
      });
  }, [router, pathname]);

  function handleLogout() {
    clearToken();
    router.replace("/admin/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F3F4F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">
            Verifying Administrator Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Login page renders without the sidebar shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F7]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex sticky top-0 h-screen">
        <AdminSidebar
          adminUser={adminUser}
          pathname={pathname}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full"
            style={{ animation: "slideIn 0.2s ease-out" }}
          >
            <AdminSidebar
              adminUser={adminUser}
              pathname={pathname}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 bg-[#16171e] px-4 py-3 border-b border-white/[0.08] sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 p-1.5 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="text-base" />
          </button>
          <span className="text-white font-bold text-sm flex-1 tracking-tight">
            Phoenix Governance
          </span>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/60 hover:text-white p-1.5 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
          {adminUser && (
            <div className="w-7 h-7 rounded-lg bg-[#E8740C] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 select-none">
              {adminUser.name?.charAt(0).toUpperCase() || "A"}
            </div>
          )}
        </div>

        <main className="flex-1 p-5 lg:p-8 overflow-auto">{children}</main>
      </div>

      {/* slideIn keyframe for mobile sidebar */}
      <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
