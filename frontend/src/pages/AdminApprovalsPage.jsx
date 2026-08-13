import { useEffect, useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPendingUsers();
  }, []);

  async function loadPendingUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/admin/pending-users"
      );

      setUsers(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      setError(
        error.response?.data?.detail ||
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
      await api.patch(
        `/admin/users/${userId}/${action}`
      );

      setMessage(
        action === "approve"
          ? "User approved successfully."
          : "User rejected successfully."
      );

      await loadPendingUsers();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          `Unable to ${action} user.`
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <DashboardLayout
      title="User Approvals"
      subtitle="Review donor and NGO registration requests."
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">
            Pending Registrations
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Donors and NGOs cannot sign in until approved.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPendingUsers}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="p-4">Organization</th>
                <th className="p-4">Applicant</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="p-4 font-semibold">
                    {user.organization_name}
                  </td>

                  <td className="p-4">
                    {user.full_name}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-4">
                    {user.email}
                  </td>

                  <td className="p-4">
                    {user.phone_number}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionId === user.id}
                        onClick={() =>
                          updateApproval(
                            user.id,
                            "approve"
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={actionId === user.id}
                        onClick={() =>
                          updateApproval(
                            user.id,
                            "reject"
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !users.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-slate-500"
                  >
                    <ShieldCheck
                      size={34}
                      className="mx-auto mb-3"
                    />
                    No pending registrations.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-slate-500"
                  >
                    Loading pending registrations...
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