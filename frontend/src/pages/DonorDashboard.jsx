import { useEffect, useState } from "react";
import {
  ArrowRight,
  Barcode,
  Clock3,
  HeartHandshake,
  LayoutDashboard,
  Leaf,
  Navigation,
  PackageOpen,
  PlusCircle,
  ScanLine,
  Truck,
  Upload,
  Utensils,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../context/LanguageContext";

import PersonalizedWelcomeBanner from "../components/PersonalizedWelcomeBanner";
import ActivityTimeline from "../components/ActivityTimeline";


const EMPTY_STATS = {
  total_inventory: 0,
  fresh: 0,
  expiring_soon: 0,
  expired: 0,
  total_donated: 0,
};

function StatCard({ icon: Icon, title, value, description, onClick }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg focus:outline-none cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
          <Icon size={23} />
        </div>

        <ArrowRight
          size={18}
          className="text-slate-300 dark:text-slate-600 transition group-hover:translate-x-1 group-hover:text-sky-600 dark:group-hover:text-sky-400"
        />
      </div>

      <p className="mt-6 text-sm font-bold text-slate-500 dark:text-slate-400">{t(title)}</p>

      <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{value ?? 0}</p>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t(description)}</p>
    </button>
  );
}


export default function DonorDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [stats, setStats] = useState(EMPTY_STATS);

  const [activeDonations, setActiveDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch Inventory Items
      let items = [];
      try {
        const invRes = await api.get("/inventory");
        const rawItems = Array.isArray(invRes.data) ? invRes.data : invRes.data?.items || [];
        const seenIds = new Set();
        for (const item of rawItems) {
          const key = item.id || item._id;
          if (key && !seenIds.has(String(key))) {
            seenIds.add(String(key));
            items.push(item);
          }
        }
      } catch (invErr) {
        console.warn("Inventory fetch warning:", invErr);
      }

      // 2. Fetch Donations
      let donList = [];
      try {
        const donRes = await api.get("/donations");
        const rawDon = Array.isArray(donRes.data) ? donRes.data : [];
        const seenDon = new Set();
        for (const d of rawDon) {
          const key = d.id || d._id;
          if (key && !seenDon.has(String(key))) {
            seenDon.add(String(key));
            donList.push(d);
          }
        }
      } catch (donErr) {
        console.warn("Donations fetch warning:", donErr);
      }

      const totalInventory = items.length;

      const expired = items.filter((item) => {
        const status = String(item.expiry_status || "").trim().toUpperCase();
        const days = Number(item.days_until_expiry);
        return status === "EXPIRED" || (!isNaN(days) && days < 0);
      }).length;

      const expiringSoon = items.filter((item) => {
        const status = String(item.expiry_status || "").trim().toUpperCase();
        const days = Number(item.days_until_expiry);
        const isExpired = status === "EXPIRED" || (!isNaN(days) && days < 0);
        return !isExpired && (status === "EXPIRING_SOON" || (!isNaN(days) && days >= 0 && days <= 2));
      }).length;

      const fresh = Math.max(0, totalInventory - (expired + expiringSoon));

      const activeList = donList.filter((d) =>
        ["IN_TRANSIT", "ASSIGNED"].includes((d?.status || "").toUpperCase())
      );

      setStats({
        total_inventory: totalInventory,
        fresh,
        expiring_soon: expiringSoon,
        expired,
        total_donated: donList.length,
      });

      setActiveDonations(activeList);
    } catch (requestError) {
      console.error("DONOR DASHBOARD ERROR:", requestError);
      setError(
        requestError?.response?.data?.detail ||
          requestError.message ||
          "Unable to load donor dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const handleOnlineSync = () => {
      console.log("Network online sync event received in DonorDashboard. Refreshing dashboard...");
      loadDashboard();
    };

    window.addEventListener("app:online-sync", handleOnlineSync);
    return () => window.removeEventListener("app:online-sync", handleOnlineSync);
  }, []);

  const navigation = [
    { label: t("Dashboard"), path: "/donor", icon: LayoutDashboard },
    { label: t("Inventory"), path: "/inventory", icon: PackageOpen },
    { label: t("Barcode Scanner"), path: "/donor/barcode", icon: Barcode },
    { label: t("Sales"), path: "/sales", icon: TrendingUp },
  ];

  return (
    <DashboardLayout
      title={t("Donor Dashboard")}
      subtitle={t("Manage surplus food inventory, monitor expiry risk and add inventory using barcode scanning.")}
      badge={t("Food Donor Workspace")}
      quote={t("Good food belongs on plates, not in landfills.")}
      navigation={navigation}
      activePath="/donor"
      onRefresh={loadDashboard}
      refreshing={loading}
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* 1. PERSONALIZED WELCOME BANNER (ABOVE THE FOLD) */}
      <PersonalizedWelcomeBanner
        weeklyGoalTarget={100}
        weeklyGoalCurrent={stats.total_donated * 12 || 68}
        streakDays={7}
      />

      {/* 2. STAT CARDS GRID */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={PackageOpen}
          title="Inventory Items"
          value={stats.total_inventory}
          description="Food items currently registered in your inventory."
          onClick={() => navigate("/inventory")}
        />

        <StatCard
          icon={Leaf}
          title="Fresh"
          value={stats.fresh}
          description="Inventory items currently safe and fresh."
          onClick={() => navigate("/inventory?expiry_status=FRESH")}
        />

        <StatCard
          icon={Clock3}
          title="Expiring Soon"
          value={stats.expiring_soon}
          description="Food items requiring priority redistribution."
          onClick={() => navigate("/inventory?expiry_status=EXPIRING_SOON")}
        />

        <StatCard
          icon={PackageOpen}
          title="Expired"
          value={stats.expired}
          description="Expired inventory requiring review and removal."
          onClick={() => navigate("/inventory?expiry_status=EXPIRED")}
        />

        <StatCard
          icon={HeartHandshake}
          title="Total Donated"
          value={stats.total_donated}
          description="Total surplus food donations published."
          onClick={() => navigate("/donations")}
        />
      </section>

      {/* RECENT ACTIVITY FEED */}
      <section className="mt-7">
        <ActivityTimeline />
      </section>

      {/* ADDED REQUESTED ACTIVE DONATIONS SECTION */}
      <section id="active-donations-section" className="mt-7 rounded-[30px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-7 shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="text-sky-600 dark:text-sky-400" size={20} /> {t("Ongoing Dispatches in Transit")} ({activeDonations.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {t("Track delivery partners currently on the way with your food items in real time.")}
            </p>
          </div>
          <button
            onClick={() => navigate("/donations")}
            className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 flex items-center gap-1"
          >
            {t("View All Dispatches")} <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {activeDonations.map((don) => (
            <div
              key={don.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/70 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800 font-black text-base">
                  🍲
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{t(don.food_name || "Food Item")}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {t("Quantity:")} <span className="font-bold text-slate-700">{don.quantity} {t(don.unit || "Units")}</span> • {t("Address:")} {don.pickup_address || "Registered Address"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  don.status === "IN_TRANSIT"
                    ? "bg-amber-100 text-amber-800 animate-pulse"
                    : don.status === "CLAIMED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-sky-100 text-sky-800"
                }`}>
                  {don.status === "IN_TRANSIT" 
                    ? `🚚 ${t("In Transit")}`
                    : don.status === "CLAIMED"
                    ? `📦 ${t("Claimed by NGO — Scheduled for Pickup")}`
                    : `✨ ${t("Available Surplus Food — Waiting for NGO Claim")}`
                  }
                </span>

                <a
                  href={`/donations/${don.id}/track`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                >
                  <Navigation size={14} className="text-blue-600" /> {t("Track Dispatch")}
                </a>
              </div>
            </div>
          ))}

          {!loading && activeDonations.length === 0 && (
            <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Utensils size={28} className="mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-bold text-slate-600">{t("No active home donations in transit currently.")}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t("Click 'Post Home Meal / Food' below to donate surplus meals to local NGOs!")}</p>
            </div>
          )}
        </div>
      </section>

      {/* ACTION CARDS (ADD INVENTORY, BULK CSV, BARCODE SCANNER) */}
      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          className="group rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
            <PlusCircle size={23} />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            {t("Add Inventory + Photo")}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("Manually enter home food stock items with real product photos and snapshots.")}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-400">
            {t("Manage inventory")}
            <ArrowRight size={16} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/inventory?openCsvUpload=true")}
          className="group rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
            <Upload size={23} />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            {t("Bulk CSV Import")}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("Upload multiple food inventory records using the Aura Food CSV bulk import feature.")}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-400">
            {t("Open inventory")}
            <ArrowRight size={16} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/donor/barcode")}
          className="group rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 text-left shadow-[0_18px_50px_rgba(14,165,233,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
            <ScanLine size={23} />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            {t("Scan Barcode")}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("Scan packaged food barcodes using the device camera and continue to inventory registration.")}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-black text-sky-700 dark:text-sky-400">
            {t("Open scanner")}
            <ArrowRight size={16} />
          </div>
        </button>
      </section>
    </DashboardLayout>
  );
}