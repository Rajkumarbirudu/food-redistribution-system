import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Gift,
  LayoutDashboard,
  PackageOpen,
  RefreshCw,
  Search,
  Truck,
  XCircle,
  ShieldAlert,
  AlertOctagon,
} from "lucide-react";

import api from "../api/axios";

import DashboardLayout from "../components/DashboardLayout";
import ImpactChartsWidget from "../components/ImpactChartsWidget";
import ImpactAnalyticsHeader from "../components/ImpactAnalyticsHeader";
import ActivityTimeline from "../components/ActivityTimeline";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";



const EMPTY_STATS = {
  available: 0,
  claimed: 0,
  completed: 0,
  cancelled: 0,
};


function normalize(value) {
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
    "Unable to load donations."
  );
}


function getDonationArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.donations)) {
    return data.donations;
  }

  return [];
}


function formatDate(value) {
  if (!value) {
    return "Not specified";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function StatCard({
  icon: Icon,
  title,
  value,
  active,
  onClick,
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-[26px] border border-sky-300 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/80 p-6 text-left shadow-lg cursor-pointer transition"
          : "rounded-[26px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] transition hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 cursor-pointer"
      }
    >
      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
          <Icon size={22} />
        </div>

        <span className="text-3xl font-black text-slate-900 dark:text-white">
          {value}
        </span>

      </div>


      <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">
        {t(title)}
      </p>

    </button>
  );
}


function DonationCard({
  donation,
  onClaim,
  onComplete,
  onReportIssue,
}) {
  const status =
    normalize(
      donation?.status
    );

  return (
    <article className="rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-[0_18px_50px_rgba(14,165,233,0.06)] transition-colors duration-300">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <span className="inline-flex rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
            {status || "UNKNOWN"}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
            {
              donation?.food_name ||
              "Food Donation"
            }
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {
              donation?.category_name ||
              "Food"
            }
          </p>

        </div>


        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/50 px-4 py-3 text-center">

          <p className="text-2xl font-black text-sky-700 dark:text-sky-300">
            {
              donation?.quantity ??
              0
            }
          </p>

          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {
              donation?.unit ||
              "units"
            }
          </p>

        </div>

      </div>


      <div className="mt-6 grid gap-4 border-t border-slate-100 dark:border-slate-800 pt-5 sm:grid-cols-2">

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pickup Address
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {
              donation?.pickup_address ||
              "Not specified"
            }
          </p>
        </div>


        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pickup Time
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {
              donation?.pickup_time ||
              "Not specified"
            }
          </p>
        </div>


        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Contact Person
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {
              donation?.contact_person ||
              "Not specified"
            }
          </p>
        </div>


        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pickup Deadline
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {
              formatDate(
                donation?.pickup_deadline
              )
            }
          </p>
        </div>

      </div>

      {/* DELIVERY PARTNER PICKUP DETAILS BOX */}
      {["CLAIMED", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(status) && (
        <div className="mt-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Truck size={16} className="text-sky-600 dark:text-sky-400" /> Delivery Partner Pickup Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-400">Driver / Transporter</p>
              <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {donation?.delivery_boy_name || donation?.driver_name || "Pending Driver Assignment"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Vehicle Plate Number</p>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">
                {donation?.vehicle_number || "Not assigned"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Scheduled Pickup</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {donation?.scheduled_pickup_time || donation?.pickup_time || "12:00"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Driver Phone</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {donation?.phone_number || "Available in Transit"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CARD ACTIONS */}
      {(status === "AVAILABLE" || status === "CLAIMED" || status === "ASSIGNED" || status === "IN_TRANSIT") && (
        <div className="mt-6 border-t border-slate-100 pt-5 flex justify-end gap-3 flex-wrap">
          {status === "AVAILABLE" && onClaim && (
            <button
              type="button"
              onClick={() => onClaim(donation.id || donation._id)}
              className="w-full sm:w-auto rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-black text-white hover:bg-sky-700 transition shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
            >
              Claim Donation
            </button>
          )}

          {(status === "CLAIMED" || status === "ASSIGNED" || status === "IN_TRANSIT") && onComplete && (
            <button
              type="button"
              onClick={() => onComplete(donation.id || donation._id)}
              className="w-full sm:w-auto rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/10 hover:-translate-y-0.5"
            >
              Mark as Completed
            </button>
          )}

          {(status === "CLAIMED" || status === "ASSIGNED" || status === "IN_TRANSIT") && (
            <a
              href={`/donations/${donation.id || donation._id}/track`}
              className="w-full sm:w-auto text-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 transition hover:-translate-y-0.5"
            >
              Track Shipment
            </a>
          )}

          {(status === "CLAIMED" || status === "ASSIGNED" || status === "IN_TRANSIT" || status === "DELIVERED" || status === "COMPLETED") && onReportIssue && (
            <button
              type="button"
              onClick={() => onReportIssue(donation)}
              className="w-full sm:w-auto text-center rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 transition hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
            >
              <AlertOctagon size={16} />
              Raise Complaint
            </button>
          )}
        </div>
      )}

    </article>
  );
}


export default function NgoDashboard() {
  const { t } = useTranslation();
  const {
    user,
    loading: authLoading,
  } = useAuth();



  const [
    donations,
    setDonations,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("ALL");


  const [
    search,
    setSearch,
  ] = useState("");

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [claimForm, setClaimForm] = useState({
    pickup_date: "",
    pickup_time: "",
    vehicle_number: "",
    driver_name: "",
    volunteer_name: "",
    special_instructions: "",
  });

  // Complaint States
  const [activeComplaintDonation, setActiveComplaintDonation] = useState(null);
  const [complaintType, setComplaintType] = useState("Coming Late");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);

  const loadMyComplaints = useCallback(async () => {
    try {
      const response = await api.get("/complaints");
      setMyComplaints(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load NGO complaints:", err);
    }
  }, []);

  // ==========================================================
  // LOAD DONATIONS
  // ==========================================================

  const loadDonations =
    useCallback(
      async () => {
        /*
         * Wait until AuthContext finishes.
         */

        if (authLoading) {
          return;
        }


        /*
         * Do not call API without authenticated user.
         */

        if (!user) {
          return;
        }


        /*
         * NGO only.
         */

        if (
          normalize(
            user?.role
          ) !== "NGO"
        ) {
          return;
        }


        /*
         * Verify token exists.
         */

        const token =
          localStorage.getItem(
            "access_token"
          );


        console.log(
          "NGO PAGE TOKEN:",
          Boolean(token)
        );


        if (!token) {
          return;
        }


        setLoading(true);

        setError("");


        try {
          console.log(
            "NGO REQUESTING DONATIONS"
          );


          const response =
            await api.get(
              "/donations"
            );


          console.log(
            "NGO DONATIONS RESPONSE:",
            response.data
          );


          const items =
            getDonationArray(
              response.data
            );


          setDonations(items);


        } catch (requestError) {
          console.error(
            "NGO PAGE ERROR:",
            requestError
          );


          /*
           * If user clicked Logout and token
           * has already disappeared, ignore
           * stale API errors.
           */

          const currentToken =
            localStorage.getItem(
              "access_token"
            );


          if (
            !currentToken &&
            requestError
              ?.response
              ?.status === 401
          ) {
            return;
          }


          setError(
            getErrorMessage(
              requestError
            )
          );


        } finally {
          setLoading(false);
        }
      },
      [
        authLoading,
        user,
      ]
    );


  // ==========================================================
  // CLAIM AND COMPLETE ACTIONS
  // ==========================================================

  function handleClaim(id) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const driverNames = ["Ramesh Kumar", "Suresh Singh", "Amit Sharma", "Vikram Patel", "Rajesh Gupta"];
    const volunteerNames = ["Karan Malhotra", "Rahul Verma", "Neha Joshi", "Sneha Roy", "Anjali Mehta"];
    const vehicleNumbers = ["TS-09-EA-4523", "DL-3C-BJ-8912", "MH-12-GP-3847", "KA-03-MM-7182", "HR-26-AQ-9011"];
    const pickupTimes = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "10:00 AM"];
    
    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    setClaimId(id);
    setClaimForm({
      pickup_date: dateStr,
      pickup_time: randomItem(pickupTimes),
      vehicle_number: randomItem(vehicleNumbers),
      driver_name: randomItem(driverNames),
      volunteer_name: randomItem(volunteerNames),
      special_instructions: "Handle food packaging with care. Keep in shaded vehicle compartment.",
    });
    setShowClaimModal(true);
  }

  async function submitClaim(e) {
    if (e) e.preventDefault();
    setError("");
    try {
      const payload = {
        pickup_date: `${claimForm.pickup_date}T12:00:00Z`,
        pickup_time: claimForm.pickup_time,
        vehicle_number: claimForm.vehicle_number,
        driver_name: claimForm.driver_name,
        volunteer_name: claimForm.volunteer_name,
        special_instructions: claimForm.special_instructions || null,
      };

      await api.post(`/donations/${claimId}/claim`, payload);
      setShowClaimModal(false);
      await loadDonations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleComplete(id) {
    setError("");
    try {
      await api.post(`/donations/${id}/complete`);
      await loadDonations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }


  async function handleFileComplaint(e) {
    if (e) e.preventDefault();
    if (!complaintDesc.trim()) {
      setError("Please enter complaint details.");
      return;
    }

    setSubmittingComplaint(true);
    setError("");
    try {
      await api.post("/complaints", {
        donation_id: activeComplaintDonation.id || activeComplaintDonation._id,
        delivery_boy_id: activeComplaintDonation.delivery_boy_id || activeComplaintDonation.delivery_partner_id,
        title: complaintType,
        description: complaintDesc.trim()
      });
      setActiveComplaintDonation(null);
      setComplaintDesc("");
      await loadMyComplaints();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingComplaint(false);
    }
  }

  // ==========================================================
  // LOAD ONCE AFTER AUTH READY
  // ==========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      normalize(
        user?.role
      ) !== "NGO"
    ) {
      return;
    }

    loadDonations();
    loadMyComplaints();

    const handleOnlineSync = () => {
      console.log("Network online sync event received in NgoDashboard. Refreshing donations...");
      loadDonations();
      loadMyComplaints();
    };

    window.addEventListener("app:online-sync", handleOnlineSync);
    return () => window.removeEventListener("app:online-sync", handleOnlineSync);

  }, [
    authLoading,
    user,
    loadDonations,
    loadMyComplaints,
  ]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats =
    useMemo(
      () => {
        return donations.reduce(
          (
            result,
            donation
          ) => {
            const status =
              normalize(
                donation?.status
              );


            if (
              status ===
              "AVAILABLE"
            ) {
              result.available += 1;
            }


            if (
              status ===
              "CLAIMED"
            ) {
              result.claimed += 1;
            }


            if (
              status ===
              "COMPLETED"
            ) {
              result.completed += 1;
            }


            if (
              status ===
              "CANCELLED"
            ) {
              result.cancelled += 1;
            }


            return result;
          },
          {
            ...EMPTY_STATS,
          }
        );
      },
      [
        donations,
      ]
    );


  // ==========================================================
  // FILTERED DONATIONS
  // ==========================================================

  const filteredDonations =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();


        return donations.filter(
          (donation) => {
            const status =
              normalize(
                donation?.status
              );


            const matchesStatus =
              selectedStatus ===
                "ALL" ||
              status ===
                selectedStatus;


            const searchableText =
              [
                donation?.food_name,
                donation?.category_name,
                donation?.pickup_address,
                donation?.contact_person,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !normalizedSearch ||
              searchableText.includes(
                normalizedSearch
              );


            return (
              matchesStatus &&
              matchesSearch
            );
          }
        );
      },
      [
        donations,
        selectedStatus,
        search,
      ]
    );

  const openClaimModal = handleClaim;

  const claimedDonations = useMemo(() => {
    return donations.filter((donation) => {
      const status = normalize(donation?.status);
      return ["CLAIMED", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(status);
    });
  }, [donations]);

  const complaints = myComplaints;

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigation = [
    {
      label: t("Dashboard"),
      path: "/ngo",
      icon: LayoutDashboard,
    },
    {
      label: t("Available Donations"),
      path: "/ngo/available",
      icon: Gift,
    },
    {
      label: t("My Claims"),
      path: "/ngo/claims",
      icon: Truck,
    },
  ];


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FCFF]">

        <div className="rounded-3xl border border-sky-100 bg-white px-8 py-6 font-black text-slate-700 shadow-lg">
          {t("Checking NGO session...")}
        </div>

      </main>
    );
  }


  /*
   * During logout AuthContext sets user to null.
   * Render nothing while DashboardLayout navigates
   * to /login.
   */

  if (!user) {
    return null;
  }


  if (
    normalize(
      user?.role
    ) !== "NGO"
  ) {
    return null;
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <DashboardLayout
      title={t("NGO Dashboard")}

      subtitle={t("Browse available food donations and coordinate food redistribution.")}

      badge={t("Food Redistribution Network")}

      quote={t("Connecting surplus food with communities that need it most.")}

      navigation={
        navigation
      }

      activePath="/ngo"

      onRefresh={
        loadDonations
      }

      refreshing={
        loading
      }
    >

      {/* ERROR */}

      {error && (

        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">

          <p className="font-black text-red-700">
            Unable to load donations
          </p>

          <p className="mt-1 text-sm font-semibold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadDonations
            }
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
          >
            Retry
          </button>

        </div>

      )}


      {/* LIVE IMPACT ANALYTICS HEADER */}
      <ImpactAnalyticsHeader
        foodSavedKg={donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0) > 0 ? Math.round(donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0)) : 4850}
        mealsServed={donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0) > 0 ? Math.round(donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0) * 2.8) : 13580}
        co2ReducedKg={donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0) > 0 ? Math.round(donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0) * 2.5) : 12100}
        activeDonations={donations.filter((d) => normalize(d.status) === "AVAILABLE").length || donations.length || 12}
      />

      {/* STAT CARDS */}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={Gift}
          title="Available"
          value={stats.available}
          active={
            selectedStatus ===
            "AVAILABLE"
          }
          onClick={() =>
            setSelectedStatus(
              "AVAILABLE"
            )
          }
        />


        <StatCard
          icon={Truck}
          title="Claimed"
          value={stats.claimed}
          active={
            selectedStatus ===
            "CLAIMED"
          }
          onClick={() =>
            setSelectedStatus(
              "CLAIMED"
            )
          }
        />


        <StatCard
          icon={CheckCircle2}
          title="Completed"
          value={stats.completed}
          active={
            selectedStatus ===
            "COMPLETED"
          }
          onClick={() =>
            setSelectedStatus(
              "COMPLETED"
            )
          }
        />


        <StatCard
          icon={XCircle}
          title="Cancelled"
          value={stats.cancelled}
          active={
            selectedStatus ===
            "CANCELLED"
          }
          onClick={() =>
            setSelectedStatus(
              "CANCELLED"
            )
          }
        />
      </section>

      {/* QUICK SEARCH AND CONTROLS */}
      <section className="rounded-[30px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition-colors duration-300">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search food, category, address..."
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
            />

          </div>


          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  "ALL"
                )
              }
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Show All
            </button>


            <button
              type="button"
              onClick={
                loadDonations
              }
              disabled={
                loading
              }
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white hover:bg-sky-700 transition cursor-pointer disabled:opacity-50"
            >

              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh

            </button>

          </div>

        </div>

      </section>

      {/* IMPACT / CHARTS EXPANDABLE RADAR */}
      <div className="mt-8">
        <ImpactChartsWidget donations={donations} />
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <div className="mt-8">
        <ActivityTimeline />
      </div>

      {/* AVAILABLE DONATIONS */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t("Available Food Donations")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("Surplus food posted by donors ready for immediate NGO claim.")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDonations.map((donation) => (
            <DonationCard
              key={donation.id || donation._id}
              donation={donation}
              onClaim={openClaimModal}
              onComplete={handleComplete}
              onReportIssue={setActiveComplaintDonation}
            />
          ))}

          {!filteredDonations.length && !loading && (
            <div className="col-span-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
              {t("No food donations found.")}
            </div>
          )}
        </div>
      </section>

      {/* RECENT CLAIMS & DELIVERIES */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t("My Active Claims & Shipments")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("Track assigned transporters and live GPS telemetry runs.")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {claimedDonations.map((donation) => (
            <DonationCard
              key={donation.id || donation._id}
              donation={donation}
              onClaim={openClaimModal}
              onComplete={handleComplete}
              onReportIssue={setActiveComplaintDonation}
            />
          ))}

          {!claimedDonations.length && (
            <div className="col-span-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
              {t("No claimed shipments currently.")}
            </div>
          )}
        </div>
      </section>

      {/* COMPLAINTS FILED AUDIT LOG TABLE */}
      <section className="mt-10 rounded-[30px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-xs">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={22} /> {t("Delivery Compliance & Complaint Records")}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("Audit trail of filed delivery partner issues reviewed by system administrators.")}
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-black">
              <tr>
                <th className="p-3.5">Donation Item</th>
                <th className="p-3.5">Delivery Partner</th>
                <th className="p-3.5">Complaint Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Admin Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {complaints.map((c) => (
                <tr key={c.id || c._id}>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{c.food_name || "Food Donation"}</td>
                  <td className="p-3.5">{c.delivery_boy_name || c.driver_name || "Assigned Driver"}</td>
                  <td className="p-3.5 font-bold text-red-600 dark:text-red-400">{c.title}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-[280px] truncate">{c.description}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      c.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}>
                      {c.status || "PENDING"}
                    </span>
                  </td>
                </tr>
              ))}
              {!complaints.length && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    {t("No complaints filed.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* COMPLAINT REPORT MODAL */}
      {activeComplaintDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="text-red-600" size={24} /> Report Delivery Partner Issue
            </h2>
            <p className="text-xs text-slate-500">
              Submit a complaint regarding delivery for item "<span className="font-bold text-slate-700">{activeComplaintDonation.food_name}</span>". This will flag system administrators to take compliance action.
            </p>

            <form onSubmit={handleFileComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Complaint Issue Category</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-red-500 focus:outline-none"
                  required
                >
                  <option value="Coming Late">Delivery Partner Coming Late</option>
                  <option value="Not Delivering Order">Order Not Delivered / Refused</option>
                  <option value="Rudeness">Unprofessional / Rude Behavior</option>
                  <option value="Damaged Package">Damaged Food Containers</option>
                  <option value="Other">Other Operational Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Detailed Description</label>
                <textarea
                  rows="4"
                  placeholder="Describe the delivery partner issue..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold focus:border-red-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveComplaintDonation(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/10 hover:bg-red-700 transition"
                >
                  {submittingComplaint ? "Submitting..." : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM DONATION MODAL */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-[28px] border border-white/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-md">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t("Claim Surplus Food Donation")}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Provide pickup logistics to schedule collection.
            </p>

            <form onSubmit={submitClaim} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    required
                    value={claimForm.pickup_date}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        pickup_date: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pickup Time
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.pickup_time}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        pickup_time: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.driver_name}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        driver_name: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.vehicle_number}
                    onChange={(e) =>
                      setClaimForm({
                        ...claimForm,
                        vehicle_number: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Volunteer Name
                </label>
                <input
                  type="text"
                  required
                  value={claimForm.volunteer_name}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      volunteer_name: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Special Instructions
                </label>
                <textarea
                  rows="3"
                  value={claimForm.special_instructions}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      special_instructions: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white hover:bg-sky-700 transition-all cursor-pointer"
                >
                  Confirm Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}