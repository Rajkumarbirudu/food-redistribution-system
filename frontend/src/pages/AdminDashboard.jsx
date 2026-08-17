import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gift,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Leaf,
  Mail,
  MapPin,
  PackageOpen,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import DashboardLayout from "../components/DashboardLayout";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";


const EMPTY_DASHBOARD = {
  total_users: 0,
  total_organizations: 0,
  total_inventory_items: 0,
  total_donations: 0,
  pending_users: 0,
  recent_users: [],

  donation_overview: {
    available: 0,
    claimed: 0,
    completed: 0,
    cancelled: 0,
  },

  inventory_expiry_overview: {
    fresh: 0,
    expiring_soon: 0,
    expired: 0,
  },

  total_deliveries: 0,
  pending_deliveries: 0,
  assigned_deliveries: 0,
  in_transit_deliveries: 0,
  delivered_deliveries: 0,
};



function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}


function getErrorMessage(error) {
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
    "Unable to load admin dashboard."
  );
}


function MainStatCard({
  icon: Icon,
  title,
  value,
  description,
  actionText = "Manage section",
  onClick,
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl cursor-pointer"
    >


      <div className="flex items-start justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">

          <Icon size={23} />

        </div>


        <ArrowRight
          size={18}
          className="text-slate-300 dark:text-slate-600 transition group-hover:translate-x-1 group-hover:text-sky-600 dark:group-hover:text-sky-400"
        />

      </div>


      <p className="mt-6 text-sm font-black text-slate-500 dark:text-slate-400">
        {t(title)}
      </p>


      <p className="mt-2 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
        {value ?? 0}
      </p>


      <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500 dark:text-slate-400">
        {t(description)}
      </p>


      <div className="mt-5 flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-400">

        View details

        <ArrowRight
          size={16}
          className="transition group-hover:translate-x-1"
        />

      </div>

    </button>
  );
}


function OverviewCard({
  icon: Icon,
  title,
  value,
  description,
  onClick,
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md cursor-pointer"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">

          <Icon size={21} />

        </div>


        <ArrowRight
          size={17}
          className="text-slate-300 dark:text-slate-600 transition group-hover:translate-x-1 group-hover:text-sky-600 dark:group-hover:text-sky-400"
        />

      </div>


      <p className="mt-5 text-sm font-black text-slate-600 dark:text-slate-300">
        {t(title)}
      </p>


      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
        {value ?? 0}
      </p>


      <p className="mt-2 text-xs leading-5 text-slate-500">
        {t(description)}
      </p>

    </button>
  );
}


function getRoleConfig(role) {
  const r = String(role || "").toUpperCase();
  if (r === "DONOR") {
    return {
      label: "Commercial Donor",
      icon: Store,
      bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    };
  }
  if (r === "INDIVIDUAL_DONOR") {
    return {
      label: "Individual Donor",
      icon: Home,
      bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    };
  }
  if (r === "NGO") {
    return {
      label: "NGO / Food Bank",
      icon: HeartHandshake,
      bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };
  }
  if (r === "DELIVERY_PARTNER" || r === "DELIVERY_BOY") {
    return {
      label: "Delivery Partner",
      icon: Truck,
      bg: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    };
  }
  return {
    label: role || "User",
    icon: Users,
    bg: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };
}


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    user,
    loading: authLoading,
  } = useAuth();



  const [
    dashboardData,
    setDashboardData,
  ] = useState(
    EMPTY_DASHBOARD
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");

  const [complaints, setComplaints] = useState([]);

  const handleResolveComplaint = async (complaintId) => {
    try {
      await api.post(`/complaints/${complaintId}/resolve`);
      const compRes = await api.get("/complaints");
      setComplaints(compRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to resolve complaint.");
    }
  };


  const handleWarnDriver = async (driverId) => {
    if (!driverId) return;
    try {
      await api.patch(`/admin/users/${driverId}/warn`);
      alert("Warning issued successfully! Warning count has been incremented.");
    } catch (err) {
      console.error(err);
      setError("Failed to issue warning.");
    }
  };


  const handleSuspendDriver = async (driverId) => {
    if (!driverId) return;
    try {
      const res = await api.patch(`/admin/users/${driverId}/suspend`);
      const status = res.data.is_suspended ? "Suspended" : "Re-activated";
      alert(`Delivery Partner has been successfully ${status}!`);
    } catch (err) {
      console.error(err);
      setError("Failed to change suspension status.");
    }
  };


  const controllerRef =
    useRef(null);


  const requestRunningRef =
    useRef(false);


  const mountedRef =
    useRef(false);


  const role =
    useMemo(
      () =>
        normalizeRole(
          user?.role
        ),
      [
        user?.role,
      ]
    );


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard =
    useCallback(
      async () => {
        /*
         * AuthContext is still initializing.
         */

        if (authLoading) {
          return;
        }


        /*
         * No authenticated user.
         */

        if (!user) {
          return;
        }


        /*
         * ADMIN only.
         */

        if (
          normalizeRole(
            user?.role
          ) !== "ADMIN"
        ) {
          return;
        }


        /*
         * Never send unauthenticated request.
         */

        const token =
          localStorage.getItem(
            "access_token"
          );


        console.log(
          "ADMIN DASHBOARD TOKEN:",
          Boolean(token)
        );


        if (!token) {
          return;
        }


        /*
         * Prevent simultaneous duplicate requests.
         */

        if (
          requestRunningRef.current
        ) {
          console.log(
            "ADMIN REQUEST SKIPPED: ALREADY RUNNING"
          );

          return;
        }


        /*
         * Cancel older request.
         */

        if (controllerRef.current) {
          controllerRef
            .current
            .abort();
        }


        const controller =
          new AbortController();


        controllerRef.current =
          controller;


        requestRunningRef.current =
          true;


        if (mountedRef.current) {
          setLoading(true);

          setError("");
        }


        try {
          console.log(
            "ADMIN REQUESTING /admin/dashboard"
          );


          const response =
            await api.get(
              "/admin/dashboard",
              {
                signal:
                  controller.signal,
              }
            );


          console.log(
            "ADMIN DASHBOARD RESPONSE:",
            response.data
          );


          const data =
            response.data || {};

          try {
            const compResponse = await api.get("/complaints");
            setComplaints(compResponse.data || []);
          } catch (compErr) {
            console.log("Complaints fetch bypassed/failed:", compErr);
          }

          if (
            mountedRef.current &&
            !controller.signal.aborted
          ) {
            setDashboardData({
              total_users:
                Number(
                  data.total_users ??
                  data.users ??
                  0
                ),

              total_organizations:
                Number(
                  data.total_organizations ??
                  data.organizations ??
                  0
                ),

              total_inventory_items:
                Number(
                  data.total_inventory_items ??
                  data.inventory_items ??
                  data.total_inventory ??
                  0
                ),

              total_donations:
                Number(
                  data.total_donations ??
                  data.donations ??
                  0
                ),

              pending_users:
                Number(
                  data.pending_users ??
                  data.pending_approvals ??
                  0
                ),

              donation_overview: {
                available:
                  Number(
                    data
                      ?.donation_overview
                      ?.available ??
                    0
                  ),

                claimed:
                  Number(
                    data
                      ?.donation_overview
                      ?.claimed ??
                    0
                  ),

                completed:
                  Number(
                    data
                      ?.donation_overview
                      ?.completed ??
                    0
                  ),

                cancelled:
                  Number(
                    data
                      ?.donation_overview
                      ?.cancelled ??
                    0
                  ),
              },

              inventory_expiry_overview: {
                fresh:
                  Number(
                    data
                      ?.inventory_expiry_overview
                      ?.fresh ??
                    0
                  ),

                expiring_soon:
                  Number(
                    data
                      ?.inventory_expiry_overview
                      ?.expiring_soon ??
                    0
                  ),

                expired:
                  Number(
                    data
                      ?.inventory_expiry_overview
                      ?.expired ??
                    0
                  ),
              },

              recent_users:
                Array.isArray(
                  data.recent_users
                )
                  ? data.recent_users
                  : [],
            });
          }


        } catch (requestError) {
          /*
           * Ignore cancelled requests.
           */

          if (
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            controller.signal.aborted
          ) {
            return;
          }


          /*
           * If logout removed the token while
           * request was running, ignore stale 401.
           */

          const currentToken =
            localStorage.getItem(
              "access_token"
            );


          if (
            requestError
              ?.response
              ?.status === 401 &&
            !currentToken
          ) {
            return;
          }


          console.error(
            "ADMIN DASHBOARD ERROR:",
            requestError
          );


          if (mountedRef.current) {
            setError(
              getErrorMessage(
                requestError
              )
            );
          }


        } finally {
          if (
            controllerRef.current ===
            controller
          ) {
            controllerRef.current =
              null;

            requestRunningRef.current =
              false;


            if (mountedRef.current) {
              setLoading(false);
            }
          }
        }
      },
      [
        authLoading,
        user,
      ]
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;


    if (
      !authLoading &&
      user &&
      role === "ADMIN"
    ) {
      loadDashboard();
    }


    return () => {
      mountedRef.current =
        false;


      if (controllerRef.current) {
        controllerRef
          .current
          .abort();

        controllerRef.current =
          null;
      }


      requestRunningRef.current =
        false;
    };

  }, [
    authLoading,
    user,
    role,
    loadDashboard,
  ]);


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigation = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },

    {
      label: "Users",
      path: "/admin/details/users",
      icon: Users,
    },

    {
      label: "Organizations",
      path: "/admin/details/organizations",
      icon: Building2,
    },

    {
      label: "Inventory",
      path: "/admin/details/inventory",
      icon: PackageOpen,
    },

    {
      label: "Donations",
      path: "/admin/details/donations",
      icon: Gift,
    },
  ];


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FCFF] dark:bg-[#020617]">

        <div className="rounded-[30px] border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 px-10 py-8 text-center shadow-xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white">

            <ShieldCheck size={27} />

          </div>


          <p className="mt-5 font-black text-slate-800 dark:text-slate-200">
            Checking administrator session...
          </p>

        </div>

      </main>
    );
  }


  /*
   * During logout user becomes null.
   *
   * DashboardLayout logout navigation sends
   * browser to /login.
   *
   * Do not render API errors.
   */

  if (!user) {
    return null;
  }


  /*
   * Never render admin UI for another role.
   */

  if (role !== "ADMIN") {
    return null;
  }


  const donationOverview = dashboardData?.donation_overview || {
    available: 0,
    claimed: 0,
    completed: 0,
    cancelled: 0,
  };

  const expiryOverview = dashboardData?.inventory_expiry_overview || {
    fresh: 0,
    expiring_soon: 0,
    expired: 0,
  };



  // ==========================================================
  // UI
  // ==========================================================

  return (
    <DashboardLayout
      title={
        `Welcome back, ${
          user?.full_name ||
          user?.organization_name ||
          "Administrator"
        }`
      }

      subtitle="Monitor users, organizations, food inventory, donations and account approvals across the Aura Food platform."

      badge="Administration Workspace"

      quote="Every meal saved is a chance to nourish a life and protect our planet."

      navigation={
        navigation
      }

      activePath="/admin"

      onRefresh={
        loadDashboard
      }

      refreshing={
        loading
      }
    >

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <section className="mb-7 rounded-[24px] border border-red-200 bg-red-50 p-5">

          <p className="font-black text-red-700">
            Unable to load admin dashboard
          </p>


          <p className="mt-1 text-sm font-semibold text-red-600">
            {error}
          </p>


          <button
            type="button"

            onClick={
              loadDashboard
            }

            disabled={
              loading
            }

            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
          >

            <RefreshCw
              size={16}

              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Retry

          </button>

        </section>

      )}


      {/* ====================================================
          PLATFORM OVERVIEW
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-xl font-black text-slate-900">
            {t("Platform Overview")}
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            {t("Monitor Aura Food platform records and activity.")}
          </p>

        </div>



        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <MainStatCard
            icon={Users}

            title="Users"

            value={
              dashboardData
                .total_users
            }

            description="Registered platform accounts and user activity."

            onClick={() =>
              navigate(
                "/admin/details/users"
              )
            }
          />


          <MainStatCard
            icon={Building2}

            title="Organizations"

            value={
              dashboardData
                .total_organizations
            }

            description="Registered food donor and NGO organizations."

            onClick={() =>
              navigate(
                "/admin/details/organizations"
              )
            }
          />


          <MainStatCard
            icon={PackageOpen}

            title="Inventory Items"

            value={
              dashboardData
                .total_inventory_items
            }

            description="Food inventory records available across Aura Food."

            onClick={() =>
              navigate(
                "/admin/details/inventory"
              )
            }
          />


          <MainStatCard
            icon={Gift}

            title="Donations"

            value={
              dashboardData
                .total_donations
            }

            description="Food redistribution and donation activity."

            onClick={() =>
              navigate(
                "/admin/details/donations"
              )
            }
          />

        </div>

      </section>


      {/* ====================================================
          PENDING APPROVALS
      ==================================================== */}

      <section className="mt-7 overflow-hidden rounded-[30px] border border-sky-100 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/80 via-white dark:via-slate-900 to-sky-50/80 dark:to-slate-900 p-7 shadow-[0_18px_50px_rgba(14,165,233,0.06)]">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">

              <UserCheck size={26} />

            </div>


            <div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t("Pending Account Approvals")}
              </h2>


              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("Review Donor and NGO registrations before granting access to Aura Food.")}
              </p>

            </div>

          </div>


          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 px-6 py-3 text-center">

              <p className="text-3xl font-black text-amber-700 dark:text-amber-400">
                {
                  dashboardData
                    .pending_users
                }
              </p>


              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {t("Pending")}
              </p>

            </div>


            <button
              type="button"

              onClick={() =>
                navigate(
                  "/admin/details/users?approval_status=PENDING"
                )
              }

              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-sky-600 px-5 py-4 text-sm font-black text-white transition hover:bg-sky-700"
            >

              {t("Review registrations")}

              <ArrowRight size={17} />

            </button>

          </div>

        </div>

      </section>


      {/* ====================================================
          RECENTLY REGISTERED USERS & DONORS
      ==================================================== */}

      <section className="mt-7 rounded-[30px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-7 shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl">

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t("Recently Registered Users & Donors")}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {t("Real-time feed of commercial donors, individual donors, NGOs and delivery partners joining Aura Food.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/details/users")}
            className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/50 px-4 py-2.5 text-xs font-black text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer"
          >
            {t("View All Users")}
            <ArrowRight size={15} />
          </button>

        </div>

        {(!dashboardData.recent_users || dashboardData.recent_users.length === 0) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 p-8 text-center text-sm font-semibold text-slate-400">
            {t("No recently registered users found.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-black uppercase text-slate-400">
                  <th className="pb-3 pr-4">{t("User / Organization")}</th>
                  <th className="pb-3 px-4">{t("Role")}</th>
                  <th className="pb-3 px-4">{t("Contact Details")}</th>
                  <th className="pb-3 px-4">{t("Registered")}</th>
                  <th className="pb-3 px-4">{t("Status")}</th>
                  <th className="pb-3 pl-4 text-right">{t("Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dashboardData.recent_users.map((u) => {
                  const roleConfig = getRoleConfig(u.role);
                  const RoleIcon = roleConfig.icon;
                  const formattedDate = u.created_at
                    ? new Date(u.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  return (
                    <tr
                      key={u.id || u._id || u.email}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-black text-slate-900 dark:text-white">
                          {u.full_name || u.organization_name || "Unnamed User"}
                        </div>
                        {u.organization_name && u.organization_name !== u.full_name && (
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {u.organization_name}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${roleConfig.bg}`}>
                          <RoleIcon size={13} />
                          {t(roleConfig.label)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div>{u.email}</div>
                        {u.phone_number && (
                          <div className="text-slate-400 dark:text-slate-500">{u.phone_number}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${
                            String(u.approval_status).toUpperCase() === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : String(u.approval_status).toUpperCase() === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {String(u.approval_status).toUpperCase() === "APPROVED" && <CheckCircle2 size={12} />}
                          {t(u.approval_status || (u.is_active ? "Active" : "Inactive"))}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/details/users`)}
                          className="inline-flex items-center gap-1 text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                        >
                          {t("Manage")}
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </section>


      {/* ====================================================
          COMPLAINTS DESK
      ==================================================== */}

      <section className="mt-7 rounded-[30px] border border-red-100 bg-white p-7 shadow-[0_18px_50px_rgba(15,118,110,0.08)]">

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-black text-slate-900">

              {t("Complaints Desk")}

            </h2>


            <p className="mt-1 text-sm text-slate-500">

              {t("Investigate issues raised by Donors and NGOs regarding delivery boys.")}

            </p>

          </div>

          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">

            {complaints.filter(c => c.status === "PENDING").length} {t("Pending")}

          </span>

        </div>


        {complaints.length === 0 ? (

          <div className="rounded-2xl border-2 border-dashed border-slate-100 p-8 text-center text-sm font-semibold text-slate-400">

            {t("No complaints registered. Platform courier activity is normal.")}

          </div>


        ) : (

          <div className="space-y-4">

            {complaints.map((complaint) => (

              <div

                key={complaint.id}

                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center hover:border-slate-200 transition"

              >

                <div>

                  <div className="flex items-center gap-2.5">

                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${

                      complaint.status === "RESOLVED" 

                        ? "bg-emerald-100 text-emerald-800" 

                        : "bg-red-100 text-red-800"

                    }`}>

                      {t(complaint.status)}

                    </span>

                    <h4 className="text-sm font-black text-slate-800">

                      {t(complaint.title)}

                    </h4>

                  </div>


                  <p className="mt-2 text-sm text-slate-600 font-semibold leading-relaxed">

                    {t(complaint.description)}

                  </p>


                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500">

                    <p>

                      {t("Courier")}: <span className="text-slate-800">{complaint.delivery_boy_name}</span>

                    </p>

                    <p>•</p>

                    <p>

                      {t("Reporter")}: <span className="text-slate-800">{t(complaint.raised_by_role)}</span>

                    </p>

                    <p>•</p>

                    <p>

                      {t("Date")}: <span className="text-slate-800">{new Date(complaint.created_at).toLocaleDateString()}</span>

                    </p>

                  </div>

                </div>


                <div className="flex flex-wrap gap-2 items-center">
                  {complaint.delivery_boy_id && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleWarnDriver(complaint.delivery_boy_id)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 transition"
                      >
                        {t("Warn Driver")}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSuspendDriver(complaint.delivery_boy_id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                      >
                        {t("Suspend/Toggle")}
                      </button>
                    </>
                  )}

                  {complaint.status === "PENDING" && (

                    <button

                      type="button"

                      onClick={() => handleResolveComplaint(complaint.id)}

                      className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition"

                    >

                      {t("Mark Resolved")}

                    </button>

                  )}
                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* ====================================================
          DONATION OVERVIEW
      ==================================================== */}

      <section className="mt-7 rounded-[30px] border border-white/80 bg-white/75 p-7 shadow-[0_18px_50px_rgba(15,118,110,0.08)] backdrop-blur-xl">

        <div className="mb-5">

          <h2 className="text-xl font-black text-slate-900">
            {t("Donation Overview")}
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            {t("Track redistribution activity by current status.")}
          </p>

        </div>



        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <OverviewCard
            icon={Gift}

            title="Available"

            value={
              donationOverview
                .available
            }

            description="Donations ready for NGO claiming."

            onClick={() =>
              navigate(
                "/admin/details/donations?status=AVAILABLE"
              )
            }
          />


          <OverviewCard
            icon={Truck}

            title="Claimed"

            value={
              donationOverview
                .claimed
            }

            description="Donations reserved for collection."

            onClick={() =>
              navigate(
                "/admin/details/donations?status=CLAIMED"
              )
            }
          />


          <OverviewCard
            icon={CheckCircle2}

            title="Completed"

            value={
              donationOverview
                .completed
            }

            description="Successfully redistributed food."

            onClick={() =>
              navigate(
                "/admin/details/donations?status=COMPLETED"
              )
            }
          />


          <OverviewCard
            icon={XCircle}

            title="Cancelled"

            value={
              donationOverview
                .cancelled
            }

            description="Cancelled donation records."

            onClick={() =>
              navigate(
                "/admin/details/donations?status=CANCELLED"
              )
            }
          />

        </div>

      </section>


      {/* ====================================================
          INVENTORY EXPIRY OVERVIEW
      ==================================================== */}

      <section className="mt-7 rounded-[30px] border border-white/80 bg-white/75 p-7 shadow-[0_18px_50px_rgba(15,118,110,0.08)] backdrop-blur-xl">

        <div className="mb-5">

          <h2 className="text-xl font-black text-slate-900">
            {t("Inventory Expiry Overview")}
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            {t("Monitor food freshness and expiry risk across Aura Food.")}
          </p>

        </div>



        <div className="grid gap-4 md:grid-cols-3">

          <OverviewCard
            icon={Leaf}

            title="Fresh"

            value={
              expiryOverview
                .fresh
            }

            description="Food inventory currently fresh."

            onClick={() =>
              navigate(
                "/admin/details/inventory?expiry_status=FRESH"
              )
            }
          />


          <OverviewCard
            icon={Clock3}

            title="Expiring Soon"

            value={
              expiryOverview
                .expiring_soon
            }

            description="Inventory requiring priority attention."

            onClick={() =>
              navigate(
                "/admin/details/inventory?expiry_status=EXPIRING_SOON"
              )
            }
          />


          <OverviewCard
            icon={XCircle}

            title="Expired"

            value={
              expiryOverview
                .expired
            }

            description="Expired inventory requiring review."

            onClick={() =>
              navigate(
                "/admin/details/inventory?expiry_status=EXPIRED"
              )
            }
          />

        </div>

      </section>


      {/* ====================================================
          ADMINISTRATION ACTIONS
      ==================================================== */}

      <section className="mt-7">

        <div className="mb-5">

          <h2 className="text-xl font-black text-slate-900">
            {t("Administration Actions")}
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            {t("Open detailed Aura Food management pages.")}
          </p>

        </div>


        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/details/users"
              )
            }

            className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md"
          >

            <div>

              <p className="font-black text-slate-900 dark:text-white">
                {t("Manage Users")}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("Accounts and approvals")}
              </p>

            </div>


            <Users
              size={22}
              className="text-sky-700 dark:text-sky-400"
            />

          </button>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/details/organizations"
              )
            }

            className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md"
          >

            <div>

              <p className="font-black text-slate-900 dark:text-white">
                {t("Organizations")}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("Donors and NGOs")}
              </p>

            </div>


            <Building2
              size={22}
              className="text-sky-700 dark:text-sky-400"
            />

          </button>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/details/inventory"
              )
            }

            className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md"
          >

            <div>

              <p className="font-black text-slate-900 dark:text-white">
                {t("Inventory")}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("Platform food records")}
              </p>

            </div>


            <PackageOpen
              size={22}
              className="text-sky-700 dark:text-sky-400"
            />

          </button>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/admin/details/donations"
              )
            }

            className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md"
          >

            <div>

              <p className="font-black text-slate-900 dark:text-white">
                {t("Donations")}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("Redistribution activity")}
              </p>

            </div>


            <Gift
              size={22}
              className="text-sky-700 dark:text-sky-400"
            />

          </button>

        </div>

      </section>

    </DashboardLayout>
  );
}