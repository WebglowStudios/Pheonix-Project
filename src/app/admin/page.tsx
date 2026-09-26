"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, AdminLead, AdminUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faInbox,
  faBriefcase,
  faCircleQuestion,
  faCircleCheck,
  faArrowRight,
  faImage,
  faInfo,
  faListOl,
  faBullseye,
  faAddressBook,
  faGear,
  faBullhorn,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_BADGE: Record<string, string> = {
  new: "bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]",
  read: "bg-[#f0f0f0] text-[#666] border border-[#DDD]",
  contacted: "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    newLeads: 0,
    totalServices: 0,
    totalFaqs: 0,
  });
  const [recentLeads, setRecentLeads] = useState<AdminLead[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await adminApi.getStats();
        if (res.success && res.data) {
          setStats(res.data.stats);
          setRecentLeads(res.data.recentLeads || []);
          setRecentUsers(res.data.recentUsers || []);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const QUICK_LINKS = [
    { href: "/admin/users", label: "Registered Clients", icon: faUsers },
    { href: "/admin/leads", label: "View All Leads", icon: faInbox },
    { href: "/admin/hero", label: "Edit Hero", icon: faImage },
    { href: "/admin/about", label: "Edit About", icon: faInfo },
    { href: "/admin/services", label: "Manage Services", icon: faBriefcase },
    { href: "/admin/process", label: "Process Steps", icon: faListOl },
    { href: "/admin/goals", label: "Goals", icon: faBullseye },
    { href: "/admin/faqs", label: "Manage FAQs", icon: faCircleQuestion },
    { href: "/admin/promo", label: "Promo Popup", icon: faBullhorn },
    { href: "/admin/contact", label: "Contact Info", icon: faAddressBook },
    { href: "/admin/settings", label: "Site Settings", icon: faGear },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.8rem] font-bold text-[#1a1b23]">{getGreeting()}, Admin</h1>
        <p className="text-[#64748B] text-sm mt-1">
          Unified control center for registered clients, inquiries, and platform content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Registered Clients", value: stats.totalUsers, icon: faUsers, color: "#E8740C", bg: "#FFF3EB" },
          { label: "New Inquiries", value: stats.newLeads, icon: faCircleCheck, color: "#16A34A", bg: "#DCFCE7" },
          { label: "Total Leads", value: stats.totalLeads, icon: faInbox, color: "#2563EB", bg: "#DBEAFE" },
          { label: "Active Services", value: stats.totalServices, icon: faBriefcase, color: "#9333EA", bg: "#F3E8FF" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
              <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-lg" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#1a1b23] leading-none">{stat.value}</p>
              <p className="text-[#64748B] text-xs font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-6">
          {/* Recent Registered Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-[#E8740C]" />
                <h2 className="font-bold text-[#1a1b23] text-base">Recent Registered Clients</h2>
              </div>
              <Link href="/admin/users" className="text-[#E8740C] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-[#d4660b] no-underline">
                View all <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="text-left px-5 py-3 text-[#64748B] font-bold text-xs uppercase">Client</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Phone Number</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Joined</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#94A3B8]">No registered clients yet</td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[#1a1b23]">
                          <div>
                            <p className="leading-tight">{u.name}</p>
                            <p className="text-xs text-[#64748B] font-normal">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#1a1b23] font-medium whitespace-nowrap">
                          {u.phone ? (
                            <span className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faPhone} className="text-xs text-[#E8740C]" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-[#EF4444]">Missing Phone</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#64748B] text-xs whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                            {u.role || "user"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faInbox} className="text-[#2563EB]" />
                <h2 className="font-bold text-[#1a1b23] text-base">Recent Leads &amp; Inquiries</h2>
              </div>
              <Link href="/admin/leads" className="text-[#E8740C] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-[#d4660b] no-underline">
                View all <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="text-left px-5 py-3 text-[#64748B] font-bold text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Phone</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Time</th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#94A3B8]">No leads yet</td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[#1a1b23]">{lead.name}</td>
                        <td className="px-4 py-3 text-[#64748B]">{lead.phone}</td>
                        <td className="px-4 py-3 text-[#64748B] text-xs whitespace-nowrap">{timeAgo(lead.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[lead.status ?? "new"] ?? STATUS_BADGE.new}`}>
                            {lead.status ?? "new"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-bold text-[#1a1b23] text-base">Quick Navigation</h2>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#475569] hover:bg-[#FFF3EB] hover:text-[#E8740C] transition-all no-underline group"
              >
                <FontAwesomeIcon icon={item.icon} className="text-[#E8740C] w-3.5" />
                <span>{item.label}</span>
                <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-[10px] text-[#CBD5E1] group-hover:text-[#E8740C]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
