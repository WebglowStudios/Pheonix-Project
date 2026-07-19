"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
} from "@fortawesome/free-solid-svg-icons";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  services: string[];
  message: string;
  source: string;
  status: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [faqsCount, setFaqsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, servicesRes, faqsRes] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("faqs").select("id", { count: "exact", head: true }),
      ]);
      setLeads(leadsRes.data ?? []);
      setServicesCount(servicesRes.count ?? 0);
      setFaqsCount(faqsRes.count ?? 0);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "new" || !l.status).length;
  const recentLeads = leads.slice(0, 5);

  const QUICK_LINKS = [
    { href: "/admin/leads", label: "View All Leads", icon: faInbox },
    { href: "/admin/hero", label: "Edit Hero", icon: faImage },
    { href: "/admin/about", label: "Edit About", icon: faInfo },
    { href: "/admin/services", label: "Manage Services", icon: faBriefcase },
    { href: "/admin/process", label: "Process Steps", icon: faListOl },
    { href: "/admin/goals", label: "Goals", icon: faBullseye },
    { href: "/admin/faqs", label: "Manage FAQs", icon: faCircleQuestion },
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
        <h1 className="text-[1.8rem] font-bold text-[#333]">{getGreeting()}, Admin</h1>
        <p className="text-[#666] text-sm mt-1">Here&apos;s a snapshot of your site.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Leads", value: totalLeads, icon: faInbox, color: "#E8740C", bg: "#FFF3EB" },
          { label: "New Leads", value: newLeads, icon: faCircleCheck, color: "#E8740C", bg: "#FFF3EB" },
          { label: "Services", value: servicesCount, icon: faBriefcase, color: "#1565C0", bg: "#E3F2FD" },
          { label: "FAQs", value: faqsCount, icon: faCircleQuestion, color: "#2E7D32", bg: "#E8F5E9" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-[10px] shadow-sm p-5 flex items-center gap-4">
            <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
              <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-lg" />
            </div>
            <div>
              <p className="text-[2rem] font-bold text-[#333] leading-none">{stat.value}</p>
              <p className="text-[#666] text-xs mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEE]">
            <h2 className="font-bold text-[#333] text-[1rem]">Recent Leads</h2>
            <Link href="/admin/leads" className="text-[#E8740C] text-sm font-semibold flex items-center gap-1 hover:text-[#FF9433] no-underline">
              View all <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#EEE]">
                  <th className="text-left px-5 py-3 text-[#666] font-semibold text-xs uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase hidden md:table-cell">Services</th>
                  <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[#999]">No leads yet</td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#333]">{lead.name}</td>
                      <td className="px-4 py-3 text-[#555]">{lead.phone}</td>
                      <td className="px-4 py-3 text-[#555] hidden md:table-cell">
                        {(lead.services ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#888] text-xs whitespace-nowrap">{timeAgo(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[lead.status ?? "new"] ?? STATUS_BADGE.new}`}>
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

        {/* Quick Actions */}
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEE]">
            <h2 className="font-bold text-[#333] text-[1rem]">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-medium text-[#444] hover:bg-[#FFF3EB] hover:text-[#E8740C] transition-all no-underline group"
              >
                <FontAwesomeIcon icon={item.icon} className="text-[#E8740C] w-[14px]" />
                {item.label}
                <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-xs text-[#CCC] group-hover:text-[#E8740C]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
