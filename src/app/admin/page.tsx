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
  faArrowRight,
  faImage,
  faInfo,
  faListOl,
  faBullseye,
  faAddressBook,
  faGear,
  faBullhorn,
  faPhone,
  faChartPie,
  faArrowTrendUp,
  faBuildingColumns,
  faShieldHalved,
  faArrowRotateRight,
  faEnvelope,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// ─── Number Formatter ────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}

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

// ─── Asset Meta & Color Palette ─────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string }> = {
  stock: { label: "Stocks", color: "#1565C0" },
  mutual_fund: { label: "Mutual Funds", color: "#2E7D32" },
  sip: { label: "SIP", color: "#E8740C" },
  aif: { label: "AIF", color: "#4E342E" },
  fd: { label: "Fixed Deposit", color: "#6A1B9A" },
  ppf: { label: "PPF", color: "#E65100" },
  epf: { label: "EPF", color: "#00838F" },
  nps: { label: "NPS", color: "#F57F17" },
  bond: { label: "Bonds", color: "#880E4F" },
  gold: { label: "Gold", color: "#F9A825" },
  crypto: { label: "Crypto", color: "#4527A0" },
  reit_invit: { label: "REIT / InvIT", color: "#00695C" },
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]/30",
  read: "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]",
  contacted: "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30",
};

// ─── Firm-Wide Asset Allocation Donut ────────────────────────────────────────
function AssetAllocationDonut({
  byType,
  total,
}: {
  byType: Record<string, { count: number; invested: number }>;
  total: number;
}) {
  const entries = Object.entries(byType).filter(([, d]) => d.invested > 0);
  if (total === 0 || entries.length === 0) {
    return (
      <div className="py-12 text-center text-[#94A3B8] text-sm font-medium">
        No client assets registered yet to calculate distribution.
      </div>
    );
  }

  let cumulative = 0;
  const segments = entries.map(([type, data]) => {
    const pct = (data.invested / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return {
      type,
      pct,
      start,
      end: cumulative,
      color: TYPE_META[type]?.color ?? "#94A3B8",
      invested: data.invested,
      count: data.count,
    };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`)
    .join(", ");

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* Donut Chart */}
      <div className="relative flex-shrink-0 w-44 h-44">
        <div
          className="w-44 h-44 rounded-full shadow-inner"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-[26px] rounded-full bg-white flex flex-col items-center justify-center shadow-md">
          <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest mb-0.5">
            Total Assets
          </p>
          <p className="text-sm font-extrabold text-[#1a1b23] leading-tight">
            {fmt(total)}
          </p>
        </div>
      </div>

      {/* Legend & Asset Breakdown */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {segments.map((s) => (
          <div
            key={s.type}
            className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-xs text-[#475569] font-semibold truncate">
                {TYPE_META[s.type]?.label ?? s.type}
              </span>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-xs font-bold text-[#1a1b23] tabular-nums">
                {fmt(s.invested)}
              </span>
              <span className="text-[10px] text-[#64748B] font-semibold bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] tabular-nums">
                {s.pct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    newLeads: 0,
    totalServices: 0,
    totalFaqs: 0,
    totalInvested: 0,
    totalCurrent: 0,
    totalHoldings: 0,
    byType: {} as Record<string, { count: number; invested: number }>,
    riskProfiles: { conservative: 0, moderate: 0, aggressive: 0 },
  });
  const [recentLeads, setRecentLeads] = useState<AdminLead[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.getStats();
      const statsObj = res.stats || res.data?.stats;
      if (res.success && statsObj) {
        setStats({
          ...statsObj,
          totalUsers: statsObj.totalClients ?? statsObj.totalUsers ?? 0,
          byType: statsObj.byType || {},
          riskProfiles: statsObj.riskProfiles || {
            conservative: 0,
            moderate: 0,
            aggressive: 0,
          },
        });
        setRecentLeads(res.recentLeads || res.data?.recentLeads || []);
        const rawUsers = res.recentUsers || res.data?.recentUsers || [];
        // Prioritize actual investor clients in the recent clients list
        const clientOnly = rawUsers.filter((u) => u.role !== "admin");
        setRecentUsers(clientOnly.length > 0 ? clientOnly : rawUsers);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalRisks =
    (stats.riskProfiles.conservative || 0) +
    (stats.riskProfiles.moderate || 0) +
    (stats.riskProfiles.aggressive || 0);

  const QUICK_LINKS = [
    { href: "/admin/users", label: "Registered Clients", icon: faUsers, badge: stats.totalUsers },
    { href: "/admin/leads", label: "Client Inquiries", icon: faInbox, badge: stats.newLeads ? `${stats.newLeads} new` : undefined, highlight: !!stats.newLeads },
    { href: "/admin/hero", label: "Hero Banner", icon: faImage },
    { href: "/admin/about", label: "About Section", icon: faInfo },
    { href: "/admin/services", label: "Service Offerings", icon: faBriefcase, badge: stats.totalServices },
    { href: "/admin/process", label: "4-Step Process", icon: faListOl },
    { href: "/admin/goals", label: "Financial Goals", icon: faBullseye },
    { href: "/admin/faqs", label: "FAQs Catalog", icon: faCircleQuestion, badge: stats.totalFaqs },
    { href: "/admin/promo", label: "Promo Popup", icon: faBullhorn },
    { href: "/admin/contact", label: "Office Contacts", icon: faAddressBook },
    { href: "/admin/settings", label: "Site Metadata", icon: faGear },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#64748B]">Loading executive insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-extrabold text-[#1a1b23]">
              {getGreeting()}, Administrator
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              Live Engine Connected
            </span>
          </div>
          <p className="text-[#64748B] text-sm">
            Unified platform governance: Client wealth, inbound investor inquiries, and website CMS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] transition-all"
          >
            <FontAwesomeIcon icon={faArrowRotateRight} className="text-xs" />
            Refresh
          </button>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8740C] hover:bg-[#d4660b] text-white text-xs font-bold transition-all shadow-sm no-underline"
          >
            <FontAwesomeIcon icon={faUsers} />
            View All Clients
          </Link>
        </div>
      </div>

      {/* ── Key Performance Indicators (Cards matching User Dashboard) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#8a92a6] uppercase tracking-wider">
              Total Client Assets
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#E8740C] flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faBuildingColumns} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1a1b23] tabular-nums">
            {fmt(stats.totalInvested)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-[#64748B]">
              Across {stats.totalHoldings} total holdings
            </span>
          </div>
        </div>

        {/* Registered Clients */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#8a92a6] uppercase tracking-wider">
              Registered Clients
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faUsers} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1a1b23] tabular-nums">
            {stats.totalUsers}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Link
              href="/admin/users"
              className="text-xs font-bold text-[#E8740C] hover:underline flex items-center gap-1 no-underline"
            >
              Manage client directory <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
        </div>

        {/* Inbound Leads */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#8a92a6] uppercase tracking-wider">
              Client Leads &amp; Inquiries
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faInbox} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#1a1b23] tabular-nums">
              {stats.totalLeads}
            </p>
            {stats.newLeads > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]/30 text-xs font-bold">
                {stats.newLeads} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Link
              href="/admin/leads"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 no-underline"
            >
              Review lead queue <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
        </div>

        {/* Content Modules */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#8a92a6] uppercase tracking-wider">
              CMS Offerings Active
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1a1b23] tabular-nums">
            {stats.totalServices}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-[#64748B]">
              + {stats.totalFaqs} public FAQs published
            </span>
          </div>
        </div>
      </div>

      {/* ── Asset Allocation & Client Risk Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Conic Donut Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faChartPie} className="text-[#E8740C]" />
              <h2 className="text-base font-bold text-[#1a1b23]">
                Firm-Wide Asset Allocation
              </h2>
            </div>
            <span className="text-xs font-bold text-[#64748B]">
              Across All Investor Portfolios
            </span>
          </div>
          <AssetAllocationDonut byType={stats.byType} total={stats.totalInvested} />
        </div>

        {/* Right: Client Risk Profile Distribution */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#F1F5F9]">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#1565C0]" />
              <h2 className="text-base font-bold text-[#1a1b23]">
                Risk Profile Balance
              </h2>
            </div>

            <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
              Investor distribution by self-declared risk capacity across Conservative, Moderate, and Aggressive profiles.
            </p>

            {/* Stacked Percentage Bar */}
            {totalRisks > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-3 rounded-full bg-[#F1F5F9] overflow-hidden flex">
                  <div
                    style={{
                      width: `${((stats.riskProfiles.conservative || 0) / totalRisks) * 100}%`,
                    }}
                    className="bg-[#2E7D32] transition-all"
                    title="Conservative"
                  />
                  <div
                    style={{
                      width: `${((stats.riskProfiles.moderate || 0) / totalRisks) * 100}%`,
                    }}
                    className="bg-[#1565C0] transition-all"
                    title="Moderate"
                  />
                  <div
                    style={{
                      width: `${((stats.riskProfiles.aggressive || 0) / totalRisks) * 100}%`,
                    }}
                    className="bg-[#E8740C] transition-all"
                    title="Aggressive"
                  />
                </div>

                {/* Legend list */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#475569] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                      Conservative (Capital Preservation)
                    </span>
                    <span className="font-bold text-[#1a1b23]">
                      {stats.riskProfiles.conservative || 0} (
                      {(((stats.riskProfiles.conservative || 0) / totalRisks) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#475569] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
                      Moderate (Balanced Wealth)
                    </span>
                    <span className="font-bold text-[#1a1b23]">
                      {stats.riskProfiles.moderate || 0} (
                      {(((stats.riskProfiles.moderate || 0) / totalRisks) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#475569] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E8740C]" />
                      Aggressive (High Alpha / Growth)
                    </span>
                    <span className="font-bold text-[#1a1b23]">
                      {stats.riskProfiles.aggressive || 0} (
                      {(((stats.riskProfiles.aggressive || 0) / totalRisks) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-[#94A3B8] py-8">
                No client profile data available yet.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">Total Profiled:</span>
            <span className="text-sm font-extrabold text-[#1a1b23]">{totalRisks} Clients</span>
          </div>
        </div>
      </div>

      {/* ── Main Activity Grid (Clients + Leads + CMS Quick Nav) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Recent Clients & Recent Leads */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Registered Clients */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faUsers} className="text-[#E8740C]" />
                <h3 className="font-bold text-[#1a1b23] text-base">
                  Recently Registered Clients
                </h3>
              </div>
              <Link
                href="/admin/users"
                className="text-xs font-bold text-[#E8740C] uppercase tracking-wider flex items-center gap-1.5 hover:text-[#d4660b] no-underline"
              >
                View all directory <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Client
                    </th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Phone Number
                    </th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Invested
                    </th>
                    <th className="text-right px-6 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#94A3B8]">
                        No clients registered yet
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#E8740C] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#1a1b23] text-sm leading-tight">
                                {u.name}
                              </p>
                              <p className="text-xs text-[#64748B]">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {u.phone ? (
                            <a
                              href={`tel:${u.phone.replace(/\s+/g, "")}`}
                              className="font-bold text-[#1a1b23] hover:text-[#E8740C] flex items-center gap-1.5 transition-colors no-underline text-xs"
                            >
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="text-[10px] text-[#E8740C]"
                              />
                              {u.phone}
                            </a>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#EF4444] bg-[#FEE2E2] px-2 py-0.5 rounded">
                              Missing Phone
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-[#1a1b23] text-xs">
                          {fmt(u.stats?.totalInvested || 0)}
                        </td>

                        <td className="px-6 py-3.5 text-right text-xs text-[#64748B] whitespace-nowrap">
                          {timeAgo(u.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Inquiries / Leads */}
          <div className="bg-white rounded-2xl border border-[#EAECEF] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={faInbox} className="text-[#2563EB]" />
                <h3 className="font-bold text-[#1a1b23] text-base">
                  Recent Inbound Leads
                </h3>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-bold text-[#E8740C] uppercase tracking-wider flex items-center gap-1.5 hover:text-[#d4660b] no-underline"
              >
                View all leads <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Phone Number
                    </th>
                    <th className="text-left px-4 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-[#64748B] font-bold text-xs uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#94A3B8]">
                        No client inquiries found
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="px-6 py-3.5 font-bold text-[#1a1b23]">
                          {l.name}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#64748B] whitespace-nowrap">
                          {l.phone}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              STATUS_BADGE[l.status ?? "new"] ?? STATUS_BADGE.new
                            }`}
                          >
                            {l.status ?? "new"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-xs text-[#64748B] whitespace-nowrap">
                          {timeAgo(l.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: CMS & Site Control Hub */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-sm">
            <h3 className="font-bold text-[#1a1b23] text-base mb-1">
              Platform Control Hub
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Direct access to edit content, manage public catalog, and platform configuration
            </p>

            <div className="space-y-1.5">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all no-underline ${
                    link.highlight
                      ? "bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]/30"
                      : "bg-[#F8FAFC] text-[#475569] hover:bg-[#FFF3EB] hover:text-[#E8740C] border border-[#F1F5F9]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={link.icon} className="w-3.5 text-[#E8740C]" />
                    <span>{link.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {link.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#475569] border border-[#E2E8F0]">
                        {link.badge}
                      </span>
                    )}
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px] text-[#CBD5E1]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-[#1a1b23] to-[#2d2d3f] rounded-2xl p-6 text-white shadow-md">
            <h4 className="font-extrabold text-sm mb-1.5 text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#E8740C]" />
              Institutional Security
            </h4>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              All investor financial records, AMFI/Sharekhan partner integrations, and client communications are end-to-end encrypted.
            </p>
            <div className="text-[11px] text-[#E8740C] font-bold flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>MongoDB Atlas Sharded Cluster Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
