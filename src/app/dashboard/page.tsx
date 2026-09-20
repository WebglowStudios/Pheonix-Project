"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faPlus,
  faArrowRight,
  faChartLine,
  faSackDollar,
  faCoins,
  faLandmark,
} from "@fortawesome/free-solid-svg-icons";
import { getStoredUser } from "@/lib/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_LINKS = [
  { href: "/dashboard/add", label: "Add Investment", icon: faPlus, color: "#E8740C", bg: "#FFF3EB" },
  { href: "/dashboard/portfolio", label: "View Portfolio", icon: faChartPie, color: "#1565C0", bg: "#E3F2FD" },
];

const ASSET_TYPES = [
  { label: "Stocks", icon: faChartLine, color: "#1565C0" },
  { label: "Mutual Funds", icon: faChartPie, color: "#2E7D32" },
  { label: "SIP", icon: faCoins, color: "#E8740C" },
  { label: "Fixed Deposits", icon: faLandmark, color: "#6A1B9A" },
];

export default function DashboardPage() {
  const user = getStoredUser();

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[1.8rem] font-extrabold text-[#1a1b23]">
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-[#666] text-sm mt-1">
          Your portfolio dashboard is ready. Start by adding your investments.
        </p>
      </div>

      {/* Stats — empty state */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Invested", value: "₹0", sub: "Add investments to begin" },
          { label: "Current Value", value: "₹0", sub: "Live prices coming soon" },
          { label: "Total Gain/Loss", value: "—", sub: "Calculated automatically" },
          { label: "Holdings", value: "0", sub: "Investments added" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-[12px] shadow-sm p-5 border border-[#F0F0F0]">
            <p className="text-xs font-semibold text-[#999] uppercase tracking-[1px] mb-2">{stat.label}</p>
            <p className="text-[2rem] font-extrabold text-[#1a1b23] leading-none">{stat.value}</p>
            <p className="text-[#aaa] text-xs mt-1.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Getting started / empty state */}
        <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="w-16 h-16 rounded-full bg-[#FFF3EB] flex items-center justify-center mb-5">
            <FontAwesomeIcon icon={faSackDollar} className="text-[#E8740C] text-2xl" />
          </div>
          <h2 className="text-[1.3rem] font-extrabold text-[#1a1b23] mb-2">
            No investments yet
          </h2>
          <p className="text-[#666] text-sm max-w-[320px] mb-7">
            Add your first investment to start tracking your portfolio — stocks, mutual funds, SIPs, FDs, and more.
          </p>
          <Link
            href="/dashboard/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8740C] text-white font-bold rounded-[30px] border-2 border-[#E8740C] hover:bg-[#FF9433] hover:border-[#FF9433] transition-all shadow-[0_4px_16px_rgba(232,116,12,0.25)] no-underline"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add First Investment
          </Link>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Quick actions */}
          <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0]">
              <h3 className="font-bold text-[#333] text-sm">Quick Actions</h3>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-semibold text-[#444] hover:bg-[#FFF3EB] hover:text-[#E8740C] transition-all no-underline group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg }}
                  >
                    <FontAwesomeIcon icon={item.icon} style={{ color: item.color }} className="text-xs" />
                  </div>
                  {item.label}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-xs text-[#CCC] group-hover:text-[#E8740C]" />
                </Link>
              ))}
            </div>
          </div>

          {/* Supported asset types */}
          <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F0F0]">
              <h3 className="font-bold text-[#333] text-sm">Supported Asset Types</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {["Stocks", "Mutual Funds", "SIP", "PPF / EPF", "Fixed Deposit", "Gold / SGB", "NPS", "Bonds"].map((type) => (
                <div key={type} className="flex items-center gap-2 py-2 px-3 rounded-[8px] bg-[#F9F9F9] text-xs font-semibold text-[#555]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8740C] flex-shrink-0" />
                  {type}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
