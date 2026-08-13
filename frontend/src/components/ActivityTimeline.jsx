import React from "react";
import {
  HeartHandshake,
  CheckCircle2,
  Truck,
  Barcode,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function ActivityTimeline() {
  const { t } = useTranslation();

  const activities = [
    {
      type: "DONATION_CREATED",
      title: "Surplus Food Donation Created",
      details: "50 Servings Cooked Meals published for local NGOs",
      time: "12m ago",
      icon: PlusCircle,
      color: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    },
    {
      type: "NGO_CLAIMED",
      title: "Donation Claimed by Hope Shelter",
      details: "Hope Shelter claimed 25 Liters Fresh Whole Milk",
      time: "45m ago",
      icon: HeartHandshake,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    },
    {
      type: "PICKUP_STARTED",
      title: "Logistics Partner Assigned",
      display: "Rahul V. en route to pick up food items",
      time: "1h ago",
      icon: Truck,
      color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    },
    {
      type: "BARCODE_SCANNED",
      title: "Inventory Barcode Scanned",
      details: "Scanned GTIN #890123456789 (Potatoes 10kg)",
      time: "2h ago",
      icon: Barcode,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    },
  ];

  return (
    <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-6 shadow-[0_15px_45px_rgba(15,23,42,0.04)] backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          {t("Recent Activity Timeline") || "Recent Activity Timeline"}
        </h3>
        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
          Live Feed
        </span>
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {activities.map((act, i) => {
          const IconComp = act.icon;
          return (
            <div key={i} className="relative group">
              <div className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${act.color} ring-4 ring-white dark:ring-slate-900`}>
                <IconComp size={13} />
              </div>
              <div className="pl-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{act.title}</p>
                  <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {act.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
