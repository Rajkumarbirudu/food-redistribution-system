import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gift,
  LayoutDashboard,
  Loader2,
  PackageOpen,
  RefreshCw,
  Search,
  X,
  XCircle,
  Barcode,
  TrendingUp,
} from "lucide-react";

import api from "../api/axios";

import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";


function getErrorMessage(
  error,
  fallback,
) {
  const detail =
    error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item?.msg ||
          "Validation error"
      )
      .join(", ");
  }

  return (
    error?.message ||
    fallback
  );
}


function formatDateTime(
  value,
) {
  if (!value) {
    return "—";
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return String(value);
  }

  return parsed.toLocaleString();
}


function StatusBadge({
  status,
}) {
  const value = String(
    status || ""
  ).toUpperCase();

  const className = {
    AVAILABLE:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    CANCELLED:
      "border-red-200 bg-red-50 text-red-700",

    COMPLETED:
      "border-blue-200 bg-blue-50 text-blue-700",
  }[value];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
        className ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {value || "UNKNOWN"}
    </span>
  );
}


export default function DonationsPage() {
  const { t } = useTranslation();
  const [
    donations,
    setDonations,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");


  const navigation = [
    {
      label: t("Dashboard"),
      path: "/donor",
      icon: LayoutDashboard,
    },
    {
      label: t("Inventory"),
      path: "/inventory",
      icon: PackageOpen,
    },
    {
      label: t("Barcode Scanner"),
      path: "/donor/barcode",
      icon: Barcode,
    },
    {
      label: t("Donations"),
      path: "/donations",
      icon: Gift,
    },
    {
      label: t("Sales"),
      path: "/sales",
      icon: TrendingUp,
    },
  ];


  async function loadDonations() {
    setLoading(true);

    setError("");

    try {
      const response =
        await api.get(
          "/donations"
        );

      setDonations(
        Array.isArray(
          response.data
        )
          ? response.data
          : []
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load donations."
        )
      );

      setDonations([]);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDonations();
  }, []);


  async function handleCancel(
    donation,
  ) {
    const confirmed =
      window.confirm(
        `Cancel donation for "${donation.food_name}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/donations/${donation.id}/cancel`
      );

      setSuccess(
        "Donation cancelled and inventory quantity restored."
      );

      await loadDonations();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to cancel donation."
        )
      );
    }
  }


  const stats = useMemo(
    () => ({
      total:
        donations.length,

      available:
        donations.filter(
          (item) =>
            item.status ===
            "AVAILABLE"
        ).length,

      cancelled:
        donations.filter(
          (item) =>
            item.status ===
            "CANCELLED"
        ).length,

      completed:
        donations.filter(
          (item) =>
            item.status ===
            "COMPLETED"
        ).length,
    }),
    [donations]
  );


  const filteredDonations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return donations;
      }

      return donations.filter(
        (donation) =>
          [
            donation.food_name,
            donation.category_name,
            donation.pickup_address,
            donation.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      donations,
      search,
    ]);


  return (
    <DashboardLayout
      title="Donation Management"
      subtitle="Publish surplus food for redistribution and monitor your donation activity."
      badge="Aura Food Donations"
      quote="Every shared meal is food waste prevented."
      navigation={navigation}
      activePath="/donations"
      onRefresh={loadDonations}
      refreshing={loading}
    >
      {error && (
        <div className="mb-6 flex items-start justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex gap-3">
            <AlertTriangle
              size={20}
            />

            <p className="font-semibold">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={18} />
          </button>
        </div>
      )}


      {success && (
        <div className="mb-6 flex items-start justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <div className="flex gap-3">
            <CheckCircle2
              size={20}
            />

            <p className="font-semibold">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={18} />
          </button>
        </div>
      )}


      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total Donations",
            stats.total,
            Gift,
          ],

          [
            "Available",
            stats.available,
            PackageOpen,
          ],

          [
            "Cancelled",
            stats.cancelled,
            XCircle,
          ],

          [
            "Completed",
            stats.completed,
            CheckCircle2,
          ],
        ].map(
          ([
            title,
            value,
            Icon,
          ]) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Icon size={22} />
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                {title}
              </p>

              <p className="mt-2 text-4xl font-black text-slate-900">
                {value}
              </p>
            </div>
          )
        )}
      </section>


      <section className="mt-7 rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_55px_rgba(14,165,233,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Donation Records
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Donations published from your organization's inventory.
            </p>
          </div>


          <div className="flex gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-3.5 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search donations..."
                className="h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={
                loadDonations
              }
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-black text-slate-600"
            >
              <RefreshCw
                size={17}
              />

              Refresh
            </button>
          </div>
        </div>


        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100 bg-white">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <Loader2
                size={34}
                className="animate-spin text-sky-700"
              />

              <p className="mt-4 font-bold text-slate-500">
                Loading donations...
              </p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Gift
                size={40}
                className="text-sky-600"
              />

              <h4 className="mt-4 text-xl font-black text-slate-900">
                No donations yet
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Open Inventory and donate an available food item.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-sky-50/70">
                  <tr className="text-left text-xs font-black uppercase text-sky-800">
                    <th className="px-5 py-4">
                      Food
                    </th>

                    <th className="px-5 py-4">
                      Quantity
                    </th>

                    <th className="px-5 py-4">
                      Pickup
                    </th>

                    <th className="px-5 py-4">
                      Deadline
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDonations.map(
                    (donation) => (
                      <tr
                        key={
                          donation.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-5 py-5">
                          <p className="font-black text-slate-900">
                            {
                              donation.food_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              donation.category_name
                            }
                          </p>
                        </td>

                        <td className="px-5 py-5 font-black text-slate-700">
                          {
                            donation.quantity
                          }{" "}
                          {
                            donation.unit
                          }
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-slate-700">
                            {
                              donation.pickup_address
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              donation.pickup_time
                            }
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <Clock3
                              size={16}
                            />

                            {
                              formatDateTime(
                                donation.pickup_deadline
                              )
                            }
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            status={
                              donation.status
                            }
                          />
                        </td>

                        <td className="px-5 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {["CLAIMED", "ASSIGNED", "IN_TRANSIT"].includes(donation.status) && (
                              <a
                                href={`/donations/${donation.id}/track`}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition"
                              >
                                Track
                              </a>
                            )}
                            {donation.status ===
                              "AVAILABLE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCancel(
                                    donation
                                  )
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}