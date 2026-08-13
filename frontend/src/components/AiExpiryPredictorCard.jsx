import React from "react";
import {
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  Building2,
  HeartHandshake,
  Tag,
  Share2,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function AiExpiryPredictorCard({
  itemName = "Fresh Whole Milk",
  category = "Dairy",
  daysRemaining = 3,
  riskPercentage = 84,
  quantity = "25 Liters",
  onActionClick = null,
}) {
  const { t } = useTranslation();

  const isHighRisk = riskPercentage >= 75;
  const isMediumRisk = riskPercentage >= 40 && riskPercentage < 75;

  const riskBadgeColor = isHighRisk
    ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800"
    : isMediumRisk
    ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
    : "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800";

  const progressGradient = isHighRisk
    ? "from-red-500 to-rose-600"
    : isMediumRisk
    ? "from-amber-500 to-orange-500"
    : "from-emerald-500 to-teal-500";

  return (
    <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)] backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between group hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300">
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {t("AI Expiry Intelligence") || "AI Expiry Intelligence"}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Predictive Quality Analysis
            </p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${riskBadgeColor}`}>
          <AlertTriangle size={13} />
          {riskPercentage}% {t("Expiry Risk") || "Expiry Risk"}
        </span>
      </div>

      {/* ITEM DETAILS & RISK GAUGE */}
      <div className="my-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        
        {/* ITEM DETAILS */}
        <div className="sm:col-span-7 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white">{itemName}</span>
            <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {category} • {quantity}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Clock size={15} className="text-amber-500" />
            <span>{t("Estimated Days Remaining:")} <strong className="text-slate-900 dark:text-white">{daysRemaining} Days</strong></span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            AI predicts <strong className="text-red-600 dark:text-red-400">{riskPercentage}% risk</strong> of spoilage within 4 days.
          </p>
        </div>

        {/* CIRCULAR / PROGRESS RISK GAUGE */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="relative flex items-center justify-center h-16 w-16">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isHighRisk ? "text-red-500" : isMediumRisk ? "text-amber-500" : "text-emerald-500"}
                strokeDasharray={`${riskPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-900 dark:text-white">{riskPercentage}%</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
            Risk Index
          </span>
        </div>

      </div>

      {/* SUGGESTED ACTIONS BAR */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          {t("AI Recommended Actions:") || "AI Recommended Actions:"}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onActionClick && onActionClick("DISPATCH_NOW", itemName)}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-red-600 text-white text-[11px] font-black hover:bg-red-700 transition shadow-xs cursor-pointer"
          >
            <ShieldAlert size={13} />
            <span>Dispatch Now</span>
          </button>

          <button
            onClick={() => onActionClick && onActionClick("OFFER_NGO", itemName)}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <HeartHandshake size={13} />
            <span>Offer to NGO</span>
          </button>

          <button
            onClick={() => onActionClick && onActionClick("HOUSEHOLD_SHARE", itemName)}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500 text-white text-[11px] font-black hover:bg-amber-600 transition shadow-xs cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share Home</span>
          </button>

          <button
            onClick={() => onActionClick && onActionClick("MARKDOWN", itemName)}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-600 text-white text-[11px] font-black hover:bg-sky-700 transition shadow-xs cursor-pointer"
          >
            <Tag size={13} />
            <span>Markdown 50%</span>
          </button>
        </div>
      </div>

    </div>
  );
}
