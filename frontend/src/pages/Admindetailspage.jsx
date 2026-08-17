import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";
import { useTranslation } from "../context/LanguageContext";



const PAGE_CONFIG = {
  users: {
    title: "Users",
    subtitle:
      "Registered Aura Food users and account approvals.",
    endpoint: "/admin/users",
  },

  organizations: {
    title: "Organizations",
    subtitle:
      "Registered Aura Food organizations.",
    endpoint: "/admin/organizations",
  },

  inventory: {
    title: "Inventory Items",
    subtitle:
      "Food inventory records across Aura Food.",
    endpoint: "/admin/inventory",
  },

  donations: {
    title: "Donations",
    subtitle:
      "Food redistribution activity across Aura Food.",
    endpoint: "/admin/donations",
  },
};


const HIDDEN_COLUMNS = new Set([
  "_id",
  "id",
  "tenant_id",
  "organization_id",
  "user_id",
  "donor_id",
  "ngo_id",
  "inventory_id",
  "password",
  "password_hash",
  "hashed_password",
]);


function extractRows(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const possibleKeys = [
    "items",
    "users",
    "organizations",
    "inventory",
    "inventory_items",
    "donations",
    "data",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}


function formatColumnName(column) {
  if (column === "public_id") {
    return "Aura Food ID";
  }

  return column
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}


function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object"
          ? JSON.stringify(item)
          : String(item)
      )
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}


function StatusBadge({ value }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
      {formatValue(value)}
    </span>
  );
}


export default function AdminDetailsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();


  const location = useLocation();

  const { section } = useParams();

  const page = PAGE_CONFIG[section];

  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");

  const [userFilterTab, setUserFilterTab] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionUserId, setActionUserId] =
    useState(null);

  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState(null);


  async function loadDetails() {
    if (!page) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `${page.endpoint}${location.search}`
      );

      setRows(
        extractRows(response.data)
      );
    } catch (requestError) {
      console.error(
        "ADMIN DETAILS ERROR:",
        requestError
      );

      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Unable to load records."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDetails();
  }, [section, location.search]);


  async function updateApproval(
    mongoUserId,
    action
  ) {
    setActionUserId(mongoUserId);

    setError("");

    try {
      await api.patch(
        `/admin/users/${mongoUserId}/${action}`
      );

      await loadDetails();
    } catch (requestError) {
      console.error(
        "APPROVAL ERROR:",
        requestError
      );

      setError(
        requestError.response?.data?.detail ||
          `Unable to ${action} account.`
      );
    } finally {
      setActionUserId(null);
    }
  }


  async function handleModalApproval(userId, action) {
    await updateApproval(userId, action);
    setSelectedUserForDetail(null);
  }


  const filteredRows = useMemo(() => {
    let result = rows;

    if (section === "users" && userFilterTab !== "ALL") {
      if (userFilterTab === "PENDING") {
        result = result.filter(
          (r) =>
            String(r.approval_status || "").toUpperCase() === "PENDING" ||
            r.is_active === false
        );
      } else if (userFilterTab === "DELIVERY_PARTNER") {
        result = result.filter((r) =>
          ["DELIVERY_PARTNER", "DELIVERY_BOY"].includes(
            String(r.role || "").toUpperCase()
          )
        );
      } else {
        result = result.filter(
          (r) =>
            String(r.role || "").toUpperCase() === userFilterTab
        );
      }
    }

    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return result;
    }

    return result.filter((row) =>
      Object.values(row).some((value) =>
        formatValue(value)
          .toLowerCase()
          .includes(query)
      )
    );
  }, [rows, search, section, userFilterTab]);


  const columns = useMemo(() => {
    const columnSet = new Set();

    filteredRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!HIDDEN_COLUMNS.has(key)) {
          columnSet.add(key);
        }
      });
    });

    const allColumns =
      Array.from(columnSet);

    return [
      ...allColumns.filter(
        (column) =>
          column === "public_id"
      ),

      ...allColumns.filter(
        (column) =>
          column !== "public_id"
      ),
    ];
  }, [filteredRows]);


  if (!page) {
    return (
      <div className="min-h-screen bg-slate-50 p-10">
        Invalid administration section.
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <h1 className="text-2xl font-black text-sky-700">
              Aura Food
            </h1>

            <p className="text-xs font-semibold text-slate-500">
              {t("Administration Workspace")}
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} />

            {t("Dashboard")}
          </button>

        </div>

      </header>


      <main className="mx-auto max-w-7xl px-6 py-8">

        <div>

          <p className="text-sm font-black uppercase tracking-widest text-sky-700">
            {t("Administration")}
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {t(page.title)}
          </h2>

          <p className="mt-2 text-slate-500">
            {t(page.subtitle)}
          </p>

        </div>


        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={`${t("Search")} ${t(page.title).toLowerCase()}...`}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-sky-500 sm:w-96"
              />

            </div>


            <button
              type="button"
              onClick={loadDetails}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {t("Refresh")}
            </button>

          </div>

          {section === "users" && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              {[
                { key: "ALL", label: "All Users", count: rows.length },
                {
                  key: "DONOR",
                  label: "Commercial Donors",
                  count: rows.filter((r) => String(r.role || "").toUpperCase() === "DONOR").length,
                },
                {
                  key: "INDIVIDUAL_DONOR",
                  label: "Individual Donors",
                  count: rows.filter((r) => String(r.role || "").toUpperCase() === "INDIVIDUAL_DONOR").length,
                },
                {
                  key: "NGO",
                  label: "NGOs",
                  count: rows.filter((r) => String(r.role || "").toUpperCase() === "NGO").length,
                },
                {
                  key: "DELIVERY_PARTNER",
                  label: "Delivery Partners",
                  count: rows.filter((r) => ["DELIVERY_PARTNER", "DELIVERY_BOY"].includes(String(r.role || "").toUpperCase())).length,
                },
                {
                  key: "PENDING",
                  label: "Pending Approvals",
                  count: rows.filter((r) => String(r.approval_status || "").toUpperCase() === "PENDING" || r.is_active === false).length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setUserFilterTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer ${
                    userFilterTab === tab.key
                      ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t(tab.label)}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      userFilterTab === tab.key
                        ? "bg-white/25 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {location.search && (
            <div className="mt-5 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-800">
              {t("Filter:")}{" "}
              {decodeURIComponent(
                location.search.substring(1)
              )}
            </div>
          )}


          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </div>
          )}


          <div className="mt-6 overflow-x-auto">

            {loading ? (

              <div className="p-12 text-center text-slate-500 font-semibold">
                {t("Loading records...")}
              </div>

            ) : filteredRows.length === 0 ? (

              <div className="p-12 text-center text-slate-500 font-semibold">
                {t("No records found.")}
              </div>

            ) : (

              <table className="w-full min-w-[1000px] text-left">

                <thead className="bg-slate-50">

                  <tr>

                    {columns.map(
                      (column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap p-4 text-xs font-black uppercase text-slate-500"
                        >
                          {t(formatColumnName(column))}
                        </th>
                      )
                    )}


                    {section === "users" && (

                      <th className="p-4 text-xs font-black uppercase text-slate-500">
                        Actions
                      </th>

                    )}

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {filteredRows.map(
                    (row, index) => {

                      const mongoUserId =
                        row.id ||
                        row._id;

                      const rowKey =
                        row.public_id ||
                        mongoUserId ||
                        index;

                      const role =
                        String(
                          row.role || ""
                        ).toUpperCase();

                      const approvalStatus =
                        String(
                          row.approval_status ||
                            ""
                        ).toUpperCase();

                      const canApprove =
                        section === "users" &&
                        ["DONOR", "NGO", "DELIVERY_PARTNER", "DELIVERY_BOY"].includes(
                          role
                        ) &&
                        approvalStatus ===
                          "PENDING" &&
                        mongoUserId;


                      return (

                        <tr
                          key={rowKey}
                          onClick={() => setSelectedUserForDetail(row)}
                          className="hover:bg-slate-50 cursor-pointer animate-fade-in"
                        >

                          {columns.map(
                            (column) => (

                              <td
                                key={column}
                                className="max-w-[320px] p-4 text-sm text-slate-700"
                              >

                                {[
                                  "status",
                                  "approval_status",
                                  "expiry_status",
                                  "role",
                                ].includes(
                                  column
                                ) ? (

                                  <StatusBadge
                                    value={
                                      row[column]
                                    }
                                  />

                                ) : (

                                  <div
                                    className={
                                      column ===
                                      "public_id"
                                        ? "whitespace-nowrap font-black text-sky-700"
                                        : "max-w-[300px] truncate"
                                    }
                                  >
                                    {formatValue(
                                      row[column]
                                    )}
                                  </div>

                                )}

                              </td>

                            )
                          )}


                          {section === "users" && (

                            <td className="p-4">

                              {canApprove ? (

                                <div className="flex gap-2">

                                  <button
                                    type="button"
                                    disabled={
                                      actionUserId ===
                                      mongoUserId
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApproval(
                                        mongoUserId,
                                        "approve"
                                      );
                                    }}
                                    className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50 hover:bg-sky-700 transition"
                                  >
                                    <Check size={15} />

                                    Approve
                                  </button>


                                  <button
                                    type="button"
                                    disabled={
                                      actionUserId ===
                                      mongoUserId
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApproval(
                                        mongoUserId,
                                        "reject"
                                      );
                                    }}
                                    className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                                  >
                                    <X size={15} />

                                    Reject
                                  </button>

                                </div>

                              ) : (

                                <span className="text-xs font-semibold text-slate-400">
                                  No action required
                                </span>

                              )}

                            </td>

                          )}

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>


        {selectedUserForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 uppercase">
                    {selectedUserForDetail.role || "User Profile"}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-xl mt-2">
                    {selectedUserForDetail.full_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="rounded-xl border border-slate-200 bg-white p-2 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <p className="text-slate-400 uppercase font-bold text-[9px]">Email Address</p>
                    <p className="mt-1 text-slate-900 font-bold break-all">{selectedUserForDetail.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-bold text-[9px]">Phone Number</p>
                    <p className="mt-1 text-slate-900 font-bold">{selectedUserForDetail.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-bold text-[9px]">Organization Name</p>
                    <p className="mt-1 text-slate-900 font-bold">{selectedUserForDetail.organization_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase font-bold text-[9px]">Approval Status</p>
                    <div className="mt-1">
                      <StatusBadge value={selectedUserForDetail.approval_status} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 uppercase font-bold text-[9px]">Home Address</p>
                  <p className="mt-1 text-xs text-slate-800 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed font-semibold">
                    {selectedUserForDetail.address || "No address provided."}
                  </p>
                </div>

                {/* Delivery details */}
                {["DELIVERY_PARTNER", "DELIVERY_BOY"].includes(String(selectedUserForDetail.role || "").toUpperCase()) && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Food Transport & Wallet Compliance</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Driver License</p>
                        <p className="mt-1 font-mono font-bold text-slate-900 bg-white rounded-lg px-2.5 py-1 border border-amber-200/60 w-fit flex items-center gap-1">
                          {selectedUserForDetail.license_number || "Pending verification"}
                          {selectedUserForDetail.is_license_verified && <span className="text-emerald-600 font-extrabold text-[10px]">✓ Verified</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Vehicle / Bike Number</p>
                        <p className="mt-1 font-mono font-bold text-slate-900 bg-white rounded-lg px-2.5 py-1 border border-amber-200/60 w-fit">
                          {selectedUserForDetail.vehicle_number || "Pending verification"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Aadhar Card Number</p>
                        <p className="mt-1 font-mono font-bold text-slate-900 bg-white rounded-lg px-2.5 py-1 border border-amber-200/60 w-fit flex items-center gap-1">
                          {selectedUserForDetail.aadhar_number || "Not provided"}
                          {(selectedUserForDetail.is_aadhar_verified || selectedUserForDetail.aadhar_number) && <span className="text-emerald-600 font-extrabold text-[10px]">✓ Verified</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">PAN Card Number</p>
                        <p className="mt-1 font-mono font-bold text-slate-900 bg-white rounded-lg px-2.5 py-1 border border-amber-200/60 w-fit flex items-center gap-1">
                          {selectedUserForDetail.pan_number || "Not provided"}
                          {(selectedUserForDetail.is_pan_verified || selectedUserForDetail.pan_number) && <span className="text-emerald-600 font-extrabold text-[10px]">✓ Verified</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">OTP & Phone Verification</p>
                        <p className={`mt-1 font-extrabold px-2.5 py-1 rounded-lg border w-fit ${
                          selectedUserForDetail.is_otp_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {selectedUserForDetail.is_otp_verified ? "Mobile OTP Verified ✓" : "OTP Pending"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Biometric Face Scan</p>
                        <p className={`mt-1 font-extrabold px-2.5 py-1 rounded-lg border w-fit ${
                          selectedUserForDetail.is_face_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {selectedUserForDetail.is_face_verified ? "Face Matched ✓" : "Scan Completed ✓"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Wallet Balance</p>
                        <p className="mt-1 font-extrabold text-sky-700 bg-white rounded-lg px-2.5 py-1 border border-sky-200/60 w-fit">
                          ₹{(selectedUserForDetail.wallet_balance ?? 1000.0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold text-[10px]">Warnings Issued</p>
                        <p className={`mt-1 font-extrabold px-2.5 py-1 rounded-lg border w-fit ${
                          (selectedUserForDetail.warnings_count || 0) >= 3 ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-slate-900 border-slate-200"
                        }`}>
                          {selectedUserForDetail.warnings_count || 0} / 3 Warnings
                        </p>
                      </div>
                    </div>
                    {selectedUserForDetail.is_suspended && (
                      <div className="mt-2 bg-red-100/90 text-red-900 p-2.5 rounded-xl text-[11px] font-bold">
                        1-Month Suspension Active until: {selectedUserForDetail.suspended_until ? new Date(selectedUserForDetail.suspended_until).toLocaleDateString() : "30 days"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close
                </button>

                {String(selectedUserForDetail.approval_status || "").toUpperCase() === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={actionUserId === (selectedUserForDetail.id || selectedUserForDetail._id)}
                      onClick={() => handleModalApproval(selectedUserForDetail.id || selectedUserForDetail._id, "reject")}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/10 hover:bg-red-700 transition flex items-center gap-1"
                    >
                      <X size={15} /> Reject
                    </button>

                    <button
                      type="button"
                      disabled={actionUserId === (selectedUserForDetail.id || selectedUserForDetail._id)}
                      onClick={() => handleModalApproval(selectedUserForDetail.id || selectedUserForDetail._id, "approve")}
                      className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/10 hover:bg-sky-700 transition flex items-center gap-1"
                    >
                      <Check size={15} /> Approve Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}