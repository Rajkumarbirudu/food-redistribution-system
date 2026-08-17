import { useEffect, useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Building2,
  User,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";

export default function AdminApprovalsPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPendingUsers();
  }, []);

  async function loadPendingUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/pending-users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load pending users."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateApproval(userId, action) {
    setActionId(userId);
    setError("");
    setMessage("");

    try {
      await api.patch(`/admin/users/${userId}/${action}`);
      setMessage(
        action === "approve"
          ? "User approved successfully. They can now log in."
          : "User registration rejected."
      );
      await loadPendingUsers();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          `Unable to ${action} user.`
      );
    } finally {
      setActionId("");
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.organization_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.phone_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      title={t("User Approvals") || "User Approvals"}
      subtitle={t("Review commercial donor, NGO and delivery volunteer registration requests.")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("Pending Registrations")}</span>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-xs font-black text-amber-700 dark:text-amber-300">
              {users.length} {t("Awaiting Review")}
            </span>
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("Review donor and NGO credentials to approve or reject their access to the Aura Food network.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPendingUsers}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {t("Refresh")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by name, organization, email or role...")}
            className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-black uppercase text-slate-400">
              <tr>
                <th className="p-4 pl-6">{t("Organization / Name")}</th>
                <th className="p-4">{t("Role")}</th>
                <th className="p-4">{t("Email")}</th>
                <th className="p-4">{t("Phone")}</th>
                <th className="p-4 text-right pr-6">{t("Actions")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
              {filteredUsers.map((user) => {
                const initials = (user.full_name || user.organization_name || "U")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={user.id || user._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950 font-black text-sky-700 dark:text-sky-300">
                          {initials}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {user.organization_name || user.full_name || "Applicant"}
                          </p>
                          {user.organization_name && user.full_name && (
                            <p className="text-[11px] text-slate-400 font-medium">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:text-amber-300">
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {user.phone_number || "—"}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionId === (user.id || user._id)}
                          onClick={() => updateApproval(user.id || user._id, "approve")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 text-xs font-black shadow-xs shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          {t("Approve")}
                        </button>

                        <button
                          type="button"
                          disabled={actionId === (user.id || user._id)}
                          onClick={() => updateApproval(user.id || user._id, "reject")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 px-3.5 py-2 text-xs font-black transition cursor-pointer disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          {t("Reject")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">{t("No pending registrations found.")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t("All registered accounts are reviewed and active.")}</p>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-sky-500" />
                    <p className="font-bold text-xs">{t("Loading pending registrations...")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}