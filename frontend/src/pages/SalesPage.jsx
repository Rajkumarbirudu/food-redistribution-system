import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useTranslation } from "../context/LanguageContext";
import {
  TrendingUp,
  Gift,
  PackageCheck,
  Layers,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart,
  ShoppingBag,
  Info,
  LayoutDashboard,
  PackageOpen,
  Barcode,
  Boxes,
} from "lucide-react";

export default function SalesPage() {
  const { t } = useTranslation();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDonations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/donations");
      const data = Array.isArray(response.data) ? response.data : [];
      setDonations(data);
    } catch (err) {
      console.error("Error fetching donation data:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load donation records."
      );
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  // Filter valid completed/active donations (exclude cancelled, rejected, failed)
  const validDonations = useMemo(() => {
    if (!Array.isArray(donations)) return [];
    return donations.filter((d) => {
      const status = String(d.status || "").trim().toUpperCase();
      return (
        status !== "CANCELLED" &&
        status !== "REJECTED" &&
        status !== "FAILED"
      );
    });
  }, [donations]);

  // Section 1: Aggregate Overview Stats
  const totalRecords = validDonations.length;

  const totalQuantity = useMemo(() => {
    return validDonations.reduce((acc, curr) => {
      const q = parseFloat(curr.quantity);
      return acc + (isNaN(q) ? 0 : q);
    }, 0);
  }, [validDonations]);

  // Group by product name for frequency & quantity analysis
  const productStatsMap = useMemo(() => {
    const map = {};
    validDonations.forEach((d) => {
      const rawName = (d.food_name || d.name || d.title || "Unnamed Item").trim();
      const normalizedKey = rawName.toLowerCase();
      const qty = parseFloat(d.quantity) || 0;
      const unit = d.unit || "units";

      if (!map[normalizedKey]) {
        map[normalizedKey] = {
          name: rawName,
          count: 0,
          totalQty: 0,
          unit: unit,
        };
      }
      map[normalizedKey].count += 1;
      map[normalizedKey].totalQty += qty;
    });
    return map;
  }, [validDonations]);

  const uniqueProductsCount = Object.keys(productStatsMap).length;
  const totalUniqueProducts = uniqueProductsCount;

  // Ranked product list (Sorted by count desc, then totalQty desc)
  const rankedProducts = useMemo(() => {
    return Object.values(productStatsMap).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.totalQty - a.totalQty;
    });
  }, [productStatsMap]);

  // Top 5 Products
  const top5Products = useMemo(() => {
    return rankedProducts.slice(0, 5);
  }, [rankedProducts]);

  // Smart Surplus Notifications
  // Threshold: Products donated frequently (frequency >= 2 or high total quantity)
  const smartNotifications = useMemo(() => {
    const notifications = [];
    rankedProducts.forEach((prod, index) => {
      if (prod.count >= 25) {
        notifications.push({
          id: `noti-${index}`,
          title: `High Surplus Warning for ${prod.name}`,
          message: `${prod.name} is being donated frequently (${prod.count} donations, ${prod.totalQty.toLocaleString()} ${prod.unit}). Consider reducing future purchases to minimize excess inventory and food waste.`,
          severity: "warning",
          product: prod.name,
          count: prod.count,
        });
      } else if (prod.count >= 10 || prod.count >= 2) {
        if (index === 0) {
          notifications.push({
            id: `noti-${index}`,
            title: `Frequent Surplus Detected for ${prod.name}`,
            message: `${prod.name} is being donated frequently. Consider reducing future purchases to minimize excess inventory and food waste.`,
            severity: "warning",
            product: prod.name,
            count: prod.count,
          });
        } else if (index === 1) {
          notifications.push({
            id: `noti-${index}`,
            title: `Procurement Optimization: ${prod.name}`,
            message: `Frequent surplus detected for ${prod.name}. Review procurement planning and purchasing quantities.`,
            severity: "info",
            product: prod.name,
            count: prod.count,
          });
        } else {
          notifications.push({
            id: `noti-${index}`,
            title: `Excess Donation Trend: ${prod.name}`,
            message: `Large quantities of ${prod.name} are consistently being donated (${prod.count} times, ${prod.totalQty.toLocaleString()} ${prod.unit}). Consider adjusting procurement levels.`,
            severity: "info",
            product: prod.name,
            count: prod.count,
          });
        }
      }
    });
    return notifications;
  }, [rankedProducts]);

  // Max values for chart scaling
  const maxCount = useMemo(() => {
    if (rankedProducts.length === 0) return 1;
    return Math.max(...rankedProducts.map((p) => p.count), 1);
  }, [rankedProducts]);

  const maxQty = useMemo(() => {
    if (rankedProducts.length === 0) return 1;
    return Math.max(...rankedProducts.map((p) => p.totalQty), 1);
  }, [rankedProducts]);

  const navigation = [
    { label: t("Dashboard"), path: "/donor", icon: LayoutDashboard },
    { label: t("Inventory"), path: "/inventory", icon: PackageOpen },
    { label: t("Barcode Scanner"), path: "/donor/barcode", icon: Barcode },
    { label: t("Sales"), path: "/sales", icon: TrendingUp },
  ];

  return (
    <DashboardLayout
      title="Sales & Procurement Analytics"
      subtitle="Analyze donation frequency and surplus patterns to optimize purchasing decisions and reduce food waste."
      badge="Surplus & Procurement Intelligence"
      quote="Smart procurement starts by identifying recurring surplus."
      navigation={navigation}
      activePath="/sales"
      onRefresh={loadDonations}
      refreshing={loading}
    >
      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-bold">{error}</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Please retry or check backend connectivity.
            </p>
          </div>
        </div>
      )}

      {/* EMPTY STATE WARNING */}
      {!loading && validDonations.length === 0 && (
        <div className="mb-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-8 sm:p-12 text-center shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
            No donation data available
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            There are currently no valid donation records stored in the database.
            Sales and procurement analytics will populate automatically as soon as donation records are submitted.
          </p>
          <button
            type="button"
            onClick={loadDonations}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition cursor-pointer"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      )}

      {/* ANALYTICS SECTION 1: TOTAL DONATIONS OVERVIEW */}
      <section className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-xl transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Donation Records
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {loading ? "..." : totalRecords.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
              <Gift size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completed & valid donation records
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-xl transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Quantity Donated
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {loading ? "..." : totalQuantity.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
              <PackageCheck size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cumulative units redistributed
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-xl transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Unique Products Donated
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {loading ? "..." : totalUniqueProducts.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Boxes size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Distinct catalog items
          </p>
        </div>
      </section>

      {/* SMART SURPLUS NOTIFICATIONS */}
      <section className="mb-8">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Smart Surplus Notifications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Procurement reduction advice generated dynamically from donation frequency
            </p>
          </div>
        </div>

        {smartNotifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 text-slate-500 dark:text-slate-400 text-sm font-medium">
            No excess purchasing alerts detected. Donation history indicates healthy procurement balance.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {smartNotifications.map((noti) => (
              <div
                key={noti.id}
                className="flex items-start gap-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-4 transition hover:border-amber-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                    {noti.title}
                  </h4>
                  <p className="mt-1 text-xs font-medium text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {noti.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ANALYTICS SECTION 2: TOP DONATED PRODUCTS (RANKED LIST + TOP 5 + LEAST 5) */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* RANKED LIST */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={20} className="text-sky-600" />
                Most Donated Products Ranking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products ranked by donation history frequency
              </p>
            </div>
            <span className="text-xs font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full">
              Ranked List
            </span>
          </div>

          {rankedProducts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              No donation data available to rank products.
            </p>
          ) : (
            <div className="space-y-3">
              {rankedProducts.map((prod, idx) => (
                <div
                  key={prod.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 transition hover:bg-sky-50/40 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 font-black text-xs text-white shadow-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {prod.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {prod.count} {prod.count === 1 ? "donation" : "donations"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-sky-700 dark:text-sky-400">
                      {prod.totalQty.toLocaleString()} {prod.unit}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Total Donated
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TOP 5 FREQUENTLY DONATED ITEMS */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-teal-600" />
                Top 5 Frequently Donated Items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted descending by donation count
              </p>
            </div>
            <span className="text-xs font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full">
              Top 5
            </span>
          </div>

          {top5Products.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              No donation records available for top 5 items.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                    <th className="pb-3 px-2">#</th>
                    <th className="pb-3 px-2">Item Name</th>
                    <th className="pb-3 px-2 text-center">Donation Count</th>
                    <th className="pb-3 px-2 text-right">Total Quantity Donated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                  {top5Products.map((prod, idx) => (
                    <tr key={prod.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-2 font-black text-slate-400">
                        0{idx + 1}
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900 dark:text-white">
                        {prod.name}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold">
                          {prod.count}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800 dark:text-slate-100">
                        {prod.totalQty.toLocaleString()} {prod.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ANALYTICS SECTION 3: DONATION FREQUENCY ANALYSIS TABLE */}
      <section className="mb-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-sky-600" />
              Donation Frequency Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed donation frequency and quantity summary for every product
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {rankedProducts.length} Items
          </span>
        </div>

        {rankedProducts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No donation data available for frequency analysis.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <th className="pb-3 px-3">Product Name</th>
                  <th className="pb-3 px-3 text-center">Number of Donations</th>
                  <th className="pb-3 px-3 text-right">Total Quantity Donated</th>
                  <th className="pb-3 px-3 text-right">Surplus Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                {rankedProducts.map((prod) => {
                  const sharePercent =
                    totalQuantity > 0
                      ? Math.round((prod.totalQty / totalQuantity) * 100)
                      : 0;
                  return (
                    <tr
                      key={prod.name}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3.5 px-3 font-black text-slate-900 dark:text-white">
                        {prod.name}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                          {prod.count}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-sky-700 dark:text-sky-400">
                        {prod.totalQty.toLocaleString()} {prod.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-sky-500 h-2 rounded-full"
                              style={{ width: `${Math.min(sharePercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {sharePercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* VISUALIZATION SECTION: CHARTS */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart size={20} className="text-purple-600" />
              Donation Visualizations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual analytics generated directly from real donation history
            </p>
          </div>
        </div>

        {rankedProducts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-sm font-semibold text-slate-400">
              No donation data available for chart visualizations.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* CHART 1: MOST DONATED PRODUCTS */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                1. Most Donated Products Chart
              </h4>
              <div className="space-y-3">
                {rankedProducts.slice(0, 5).map((prod) => {
                  const pct = Math.round((prod.count / maxCount) * 100);
                  return (
                    <div key={prod.name}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700 dark:text-slate-200 truncate">
                          {prod.name}
                        </span>
                        <span className="text-sky-600 dark:text-sky-400">
                          {prod.count} donations
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHART 2: DONATION FREQUENCY CHART */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                2. Donation Frequency Chart
              </h4>
              <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                {rankedProducts.slice(0, 6).map((prod) => {
                  const pct = Math.max(Math.round((prod.count / maxCount) * 100), 10);
                  return (
                    <div key={prod.name} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                        {prod.count}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-xl transition-all duration-500 shadow-xs"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center">
                        {prod.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHART 3: TOTAL QUANTITY SUMMARY */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                3. Total Quantity Distribution Chart
              </h4>
              <div className="space-y-3">
                {rankedProducts.slice(0, 5).map((prod) => {
                  const pct = Math.round((prod.totalQty / maxQty) * 100);
                  return (
                    <div key={prod.name}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700 dark:text-slate-200 truncate">
                          {prod.name}
                        </span>
                        <span className="text-sky-600 dark:text-sky-400">
                          {prod.totalQty.toLocaleString()} {prod.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
