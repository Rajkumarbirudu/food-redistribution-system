import React, { useEffect, useState } from "react";
import {
  Utensils,
  Leaf,
  Users,
  PackageCheck,
  TrendingUp,
  Flame,
  Award,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

function AnimatedNumber({ value, suffix = "", prefix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const target = typeof value === "number" ? value : parseFloat(value) || 0;
    const duration = 1200; // ms
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function ImpactAnalyticsHeader({
  foodSavedKg = 4850,
  mealsServed = 14500,
  co2ReducedKg = 12100,
  peopleReached = 3200,
  activeDonations = 42,
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full mb-6">
      {/* STRIPE-STYLE HIGH DENSITY ANALYTICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* METRIC 1: FOOD SAVED */}
        <div className="rounded-[24px] bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl hover:border-sky-400 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Food Saved") || "Food Saved"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition">
              <Utensils size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={foodSavedKg} suffix=" kg" />
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={13} />
            <span>+18.4% this week</span>
          </div>
        </div>

        {/* METRIC 2: MEALS SERVED */}
        <div className="rounded-[24px] bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl hover:border-sky-400 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Meals Served") || "Meals Served"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition">
              <PackageCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={mealsServed} />
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
            <Flame size={13} />
            <span>Rescued & Delivered</span>
          </div>
        </div>

        {/* METRIC 3: CO2 REDUCED */}
        <div className="rounded-[24px] bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl hover:border-teal-400 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("CO₂ Reduced") || "CO₂ Reduced"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition">
              <Leaf size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={(co2ReducedKg / 1000).toFixed(1)} suffix=" Tons" />
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
            <Award size={13} />
            <span>Landfill Methane Saved</span>
          </div>
        </div>

        {/* METRIC 4: PEOPLE REACHED */}
        <div className="rounded-[24px] bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl hover:border-indigo-400 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("People Reached") || "People Reached"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={peopleReached} />
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            <span>Verified Beneficiaries</span>
          </div>
        </div>

        {/* METRIC 5: ACTIVE DONATIONS */}
        <div className="col-span-2 sm:col-span-1 rounded-[24px] bg-gradient-to-br from-sky-600 to-sky-700 text-white p-4 shadow-lg shadow-sky-600/20 backdrop-blur-xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-100">
              {t("Active Listings") || "Active Listings"}
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-white">
            <AnimatedNumber value={activeDonations} />
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sky-100">
            <span>Live Inventory Available</span>
          </div>
        </div>

      </div>
    </div>
  );
}
