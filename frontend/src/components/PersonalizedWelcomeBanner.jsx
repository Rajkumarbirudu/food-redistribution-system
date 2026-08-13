import React from "react";
import {
  Sparkles,
  Flame,
  Award,
  Calendar,
  CloudSun,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";

export default function PersonalizedWelcomeBanner({
  weeklyGoalTarget = 100,
  weeklyGoalCurrent = 68,
  streakDays = 5,
}) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const userName = user?.full_name || user?.name || user?.organization_name || "Rajkumar";
  const userRole = user?.role || "DONOR";
  const orgName = user?.organization_name || "Aura Food Partner";

  const progressPercent = Math.min(100, Math.round((weeklyGoalCurrent / weeklyGoalTarget) * 100));

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="w-full mb-6 rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-[0_15px_45px_rgba(15,23,42,0.04)] backdrop-blur-2xl relative overflow-hidden">
      {/* GLOW DECORATIONS */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/20" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* LEFT COLUMN: GREETING & ROLE */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              <Sparkles size={13} className="text-sky-600 animate-spin" style={{ animationDuration: "6s" }} />
              {userRole.replace("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Calendar size={13} />
              {currentDateStr}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <CloudSun size={13} />
              Partly Sunny • 27°C
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t("Welcome back") || "Welcome back"}, {userName}</span>
            <span className="text-2xl">👋</span>
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            {orgName} • {t("Real-time AI surplus redistribution & expiry tracking active.") || "Real-time AI surplus redistribution & expiry tracking active."}
          </p>
        </div>
      </div>
    </div>
  );
}
