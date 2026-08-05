import React, { useState } from "react";
import { TrendingUp, BarChart3, PieChart, Activity, Calendar } from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function ImpactChartsWidget() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("monthly");

  const monthlyData = [
    { month: "Jan", kg: 340, co2: 850 },
    { month: "Feb", kg: 520, co2: 1300 },
    { month: "Mar", kg: 680, co2: 1700 },
    { month: "Apr", kg: 910, co2: 2275 },
    { month: "May", kg: 1150, co2: 2875 },
    { month: "Jun", kg: 1420, co2: 3550 },
  ];

  const categoryDistribution = [
    { label: "Cooked Meals", percent: 40, color: "bg-emerald-500" },
    { label: "Dairy & Bakery", percent: 25, color: "bg-sky-500" },
    { label: "Fresh Vegetables", percent: 20, color: "bg-amber-500" },
    { label: "Fruits & Packaged", percent: 15, color: "bg-purple-500" },
  ];

  const maxKg = Math.max(...monthlyData.map((d) => d.kg));

  return (
    <div className="w-full rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_15px_45px_rgba(15,23,42,0.04)] backdrop-blur-2xl mb-6">
      
      {/* HEADER WITH TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {t("Impact Visualization Analytics") || "Impact Visualization Analytics"}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Food Waste & Carbon Emissions Reduction Trend
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === "monthly"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Monthly Trend
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === "category"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Category Share
          </button>
        </div>
      </div>

      {/* CHART CONTAINER */}
      {activeTab === "monthly" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" />
              Surplus Food Rescued (kg)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">+42% Growth vs Last Quarter</span>
          </div>

          {/* ANIMATED SVG BAR GRAPH */}
          <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
            {monthlyData.map((d, i) => {
              const heightPercent = Math.round((d.kg / maxKg) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded shadow-xs mb-1">
                    {d.kg} kg
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-t-xl h-full flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 rounded-t-lg transition-all duration-700 ease-out"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{d.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-2">
            <span>Total Rescued YTD: <strong className="text-slate-900 dark:text-white">5,020 kg</strong></span>
            <span>Total CO₂ Saved: <strong className="text-emerald-600 dark:text-emerald-400">12.55 Tons</strong></span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
            Distribution of Food Items Saved by Category
          </p>

          <div className="space-y-3">
            {categoryDistribution.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                  <span>{c.label}</span>
                  <span>{c.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`${c.color} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
