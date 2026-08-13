import React from "react";
import { ShieldCheck, Thermometer, Box, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function AiFoodHealthScore({
  score = 92,
  storageTemp = "4°C (Cold Storage)",
  packagingStatus = "Sealed & Intact",
  freshnessGrade = "Grade A+ Fresh",
  shelfLifeRemaining = "8 Days",
}) {
  const { t } = useTranslation();

  const getScoreColor = (s) => {
    if (s >= 85) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500" };
    if (s >= 65) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", border: "border-amber-500" };
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", border: "border-red-500" };
  };

  const theme = getScoreColor(score);

  return (
    <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)] backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between group hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {t("Food Health Score") || "Food Health Score"}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Safety & Hygiene Rating
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 size={13} />
          Verified Safe
        </span>
      </div>

      {/* SCORE DIAL & PARAMETERS */}
      <div className="my-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        
        {/* SCORE RING */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="relative flex items-center justify-center h-20 w-20">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={theme.text}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white block leading-none">{score}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">/100</span>
            </div>
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2">
            Optimal Quality
          </span>
        </div>

        {/* 4 QUALITY FACTORS */}
        <div className="sm:col-span-7 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Thermometer size={14} className="text-blue-500" />
              Storage Temp
            </span>
            <span className="font-black text-slate-900 dark:text-white">{storageTemp}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Box size={14} className="text-purple-500" />
              Packaging
            </span>
            <span className="font-black text-slate-900 dark:text-white">{packagingStatus}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Sparkles size={14} className="text-emerald-500" />
              Freshness
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">{freshnessGrade}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
