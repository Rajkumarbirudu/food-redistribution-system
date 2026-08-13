import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Truck,
  HeartHandshake,
  X,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "EXPIRING",
      title: "Inventory Expiring Soon",
      message: "Fresh Whole Milk (25L) has 84% expiry risk in 3 days.",
      time: "10m ago",
      read: false,
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    },
    {
      id: 2,
      type: "CLAIMED",
      title: "Donation Claimed by NGO",
      message: "Hope Community Kitchen claimed Cooked Meals (50 Servings).",
      time: "25m ago",
      read: false,
      icon: HeartHandshake,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    },
    {
      id: 3,
      type: "DELIVERY",
      title: "Pickup Assigned",
      message: "Delivery partner Rahul V. accepted handover task #402.",
      time: "1h ago",
      read: true,
      icon: Truck,
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800",
    },
    {
      id: 4,
      type: "SUCCESS",
      title: "Food Delivered Successfully",
      message: "12kg Fresh Vegetables delivered to City Shelter.",
      time: "2h ago",
      read: true,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      {/* BELL BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:border-sky-400 hover:text-sky-600 transition shadow-xs cursor-pointer"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl backdrop-blur-2xl z-50 p-4 animate-scale-modal">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {t("Notifications") || "Notifications"}
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.map((n) => {
              const IconComp = n.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition flex items-start gap-3 ${
                    n.read
                      ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
                      : "bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${n.color}`}>
                    <IconComp size={15} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
