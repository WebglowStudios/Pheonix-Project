"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
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
  { href: "/admin", label: "Dashboard", icon: faHouse },
  { href: "/admin/leads", label: "Leads", icon: faInbox },
  { href: "/admin/promo", label: "Promo Popup", icon: faBullhorn },
  { isHeader: true, label: "Homepage Sections" },
  { href: "/admin/hero", label: "Hero Section", icon: faImage },
  { href: "/admin/home-services", label: "Home Services", icon: faHouse },
  { href: "/admin/process", label: "Process Steps", icon: faListOl },
  { href: "/admin/goals", label: "Goals", icon: faBullseye },
  { href: "/admin/faqs", label: "FAQs", icon: faCircleQuestion },
  { isHeader: true, label: "Pages & Settings" },
  { href: "/admin/about", label: "About Page", icon: faInfo },
  { href: "/admin/services", label: "Services", icon: faBriefcase },
  { href: "/admin/contact", label: "Contact Page", icon: faAddressBook },
  { href: "/admin/settings", label: "Site Settings", icon: faGear },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Don't check auth on the login page itself
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        setChecking(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login page renders without the sidebar shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const Sidebar = () => (
    <aside className="w-[260px] h-full bg-[#1a1b23] flex flex-col flex-shrink-0">
      {/* Logo area */}
      <div className="flex flex-col items-center justify-center py-4 px-4 border-b border-white/10">
        <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-white flex items-center justify-center mb-2 ring-2 ring-[#E8740C]/40">
          <Image src="/logo.jpg" alt="Logo" width={44} height={44} className="object-contain" />
        </div>
        <p className="text-white font-bold text-sm leading-tight text-center">Phoenix Financial</p>
        <p className="text-[#E8740C] text-[11px] font-semibold mt-0.5 uppercase tracking-[1px]">Admin Panel</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div key={`hdr-${idx}`} className="text-white/40 uppercase tracking-[1.5px] text-[10px] font-bold px-3 pt-3 pb-1.5">
                {item.label}
              </div>
            );
          }
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href!));
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-[7px] rounded-[8px] mb-1 text-sm font-semibold transition-all no-underline ${
                isActive
                  ? "bg-[#E8740C] !text-white"
                  : "!text-[#e2e8f0] hover:bg-[#2d2d3f] hover:!text-white"
              }`}
            >
              <FontAwesomeIcon icon={item.icon!} className="w-[14px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-[7px] rounded-[8px] text-sm font-semibold !text-[#e2e8f0] hover:bg-[#2d2d3f] hover:!text-white transition-all"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-[14px]" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 bg-[#1e1e2e] px-4 py-3 border-b border-[#2a2a4e]">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span className="text-white font-semibold text-sm">Phoenix Admin</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white p-1">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
