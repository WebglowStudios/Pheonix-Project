"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminUser } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUsers,
  faPhone,
  faEnvelope,
  faShieldHalved,
  faTrash,
  faUserShield,
  faArrowRotateRight,
  faChartPie,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

function fmtCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-xl transition-all ${
        type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"
      }`}
    >
      {message}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      if (res.success) {
        setUsers(res.users || res.data?.users || []);
      }
    } catch {
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleRole(user: AdminUser) {
    const userId = user.id || (user as any)._id;
    const newRole = user.role === "admin" ? "user" : "admin";
    if (
      !confirm(
        `Are you sure you want to change ${user.name}'s role to "${newRole.toUpperCase()}"?`
      )
    ) {
      return;
    }

    setSavingId(userId);
    try {
      const res = await adminApi.updateUser(userId, { role: newRole });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => ((u.id || (u as any)._id) === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated to ${newRole}`, "success");
      } else {
        showToast(res.message || "Failed to update role", "error");
      }
    } catch {
      showToast("Server error updating role", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const userId = user.id || (user as any)._id;
    if (
      !confirm(
        `DANGER: Are you sure you want to permanently delete user "${user.name}" (${user.email}) and all their portfolio records?`
      )
    ) {
      return;
    }

    setSavingId(userId);
    try {
      const res = await adminApi.deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => (u.id || (u as any)._id) !== userId));
        showToast("User deleted successfully", "success");
      } else {
        showToast(res.message || "Failed to delete user", "error");
      }
    } catch {
      showToast("Server error deleting user", "error");
    } finally {
      setSavingId(null);
    }
  }

  const totalClients = users.length;
  const totalInvestedOverall = users.reduce(
    (acc, u) => acc + (u.stats?.totalInvested || 0),
    0
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[1.8rem] font-bold text-[#1a1b23]">Registered Clients</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Active investor accounts, verified mobile numbers, and unified portfolio totals
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 border border-[#E2E8F0] bg-white rounded-lg px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all shadow-sm"
        >
          <FontAwesomeIcon icon={faArrowRotateRight} className="text-xs" />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF3EB] flex items-center justify-center text-[#E8740C] text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1a1b23] leading-none">
              {totalClients}
            </p>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1.5">
              Total Registered
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faChartPie} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1a1b23] leading-none">
              {fmtCurrency(totalInvestedOverall)}
            </p>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1.5">
              Total Invested Assets
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EDE7F6] flex items-center justify-center text-[#673AB7] text-lg flex-shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1a1b23] leading-none">
              {users.filter((u) => u.phone && u.phone.trim().length > 0).length}
            </p>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1.5">
              Verified Phone Contacts
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm"
          />
          <input
            type="text"
            placeholder="Search by client name, email, or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1a1b23] outline-none focus:border-[#E8740C] focus:ring-1 focus:ring-[#E8740C]"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "user", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                roleFilter === r
                  ? "bg-[#E8740C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
              }`}
            >
              {r === "all" ? "All Users" : r === "admin" ? "Admins" : "Clients"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="text-left px-5 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  Investor / Client
                </th>
                <th className="text-left px-4 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="text-left px-4 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider hidden lg:table-cell">
                  Risk Profile
                </th>
                <th className="text-left px-4 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  Portfolio Holdings
                </th>
                <th className="text-left px-4 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider hidden xl:table-cell">
                  Registered On
                </th>
                <th className="text-left px-4 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  Role
                </th>
                <th className="text-right px-5 py-3.5 text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-8 h-8 border-4 border-[#E8740C] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#94A3B8]">
                    No users matching criteria found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id || (user as any)._id}
                    className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* User Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#E8740C] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#1a1b23] text-sm leading-snug">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#64748B]">{user.email}</span>
                            {user.authProvider === "google" && (
                              <span className="px-1.5 py-0.2 bg-[#E8F0FE] text-[#1A73E8] rounded text-[10px] font-semibold">
                                Google
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone.replace(/\s+/g, "")}`}
                          className="font-bold text-[#1a1b23] hover:text-[#E8740C] flex items-center gap-1.5 transition-colors no-underline"
                        >
                          <FontAwesomeIcon icon={faPhone} className="text-xs text-[#E8740C]" />
                          <span>{user.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-[#EF4444] bg-[#FEE2E2] px-2 py-0.5 rounded">
                          Missing Phone
                        </span>
                      )}
                    </td>

                    {/* Risk Profile */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569]">
                        {user.riskProfile || "Moderate"}
                      </span>
                    </td>

                    {/* Portfolio Stats */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div>
                        <p className="font-extrabold text-[#1a1b23] text-sm">
                          {fmtCurrency(user.stats?.totalInvested || 0)}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          {user.stats?.investmentCount || 0} holding
                          {user.stats?.investmentCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-4 py-3.5 text-xs text-[#64748B] hidden xl:table-cell whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          user.role === "admin"
                            ? "bg-[#FFF3EB] text-[#E8740C] border border-[#E8740C]/30"
                            : "bg-[#E2E8F0] text-[#475569]"
                        }`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={savingId === user.id}
                          title={
                            user.role === "admin"
                              ? "Demote to regular user"
                              : "Promote to administrator"
                          }
                          className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#E8740C] hover:border-[#E8740C] transition-colors"
                        >
                          <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={savingId === user.id}
                          title="Delete user"
                          className="p-2 rounded-lg border border-[#FEE2E2] bg-white text-[#EF4444] hover:bg-[#FEE2E2] transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
