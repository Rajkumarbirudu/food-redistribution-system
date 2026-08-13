import React from "react";
import {
  Sparkles,
  HeartHandshake,
  Clock,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function AiDonationRecommender({
  recommendedNgo = "Hope Community Kitchen",
  ngoDistance = "1.8 km away",
  pickupWindow = "Today, 4:00 PM - 5:30 PM",
  routeEfficiency = "98% (Optimal Direct Route)",
  confidenceScore = 96,
  onClaimRecommendation = null,
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-xl border border-slate-700/80 relative overflow-hidden flex flex-col justify-between group">
      
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/20 blur-2xl group-hover:bg-sky-500/30 transition" />

      <div className="relative z-10">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles size={18} className="animate-spin" style={{ animationDuration: "5s" }} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {t("AI Smart Recommender") || "AI Smart Recommender"}
              </h3>
              <p className="text-[11px] font-bold text-slate-400">
                Automated NGO & Logistics Matcher
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 text-xs font-black">
            <Zap size={13} className="text-sky-400" />
            {confidenceScore}% Match Score
          </span>
        </div>

        {/* RECOMMENDATION DETAILS */}
        <div className="my-5 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <HeartHandshake size={18} className="text-sky-400" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Recommended NGO</p>
                <p className="text-xs font-black text-white">{recommendedNgo}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800">
              {ngoDistance}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase mb-1">
                <Clock size={13} className="text-amber-400" />
                Pickup Window
              </div>
              <p className="font-bold text-slate-200">{pickupWindow}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase mb-1">
                <Navigation size={13} className="text-sky-400" />
                Route Efficiency
              </div>
              <p className="font-bold text-slate-200">{routeEfficiency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">
          AI dispatch ready
        </span>

        <button
          onClick={() => onClaimRecommendation && onClaimRecommendation()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-900 shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition cursor-pointer"
        >
          <span>Auto-Match & Dispatch</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}
