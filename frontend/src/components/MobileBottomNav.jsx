import React from "react";
import { LayoutGrid, Barcode, HeartHandshake, Package, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getRoleDashboard = () => {
    const role = user?.role;
    if (role === "INDIVIDUAL_DONOR") return "/individual";
    if (role === "NGO") return "/ngo";
    if (role === "DELIVERY_PARTNER") return "/delivery/partner";
    return "/donor";
  };

  const navItems = [
    { label: "Home", path: getRoleDashboard(), icon: LayoutGrid },
    { label: "Inventory", path: "/inventory", icon: Package },
    { label: "Scan", path: "/donor/barcode", icon: Barcode, isHighlight: true },
    { label: "Donations", path: "/donations", icon: HeartHandshake },
    { label: "Portal", path: "/select", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-2xl px-2 py-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {navItems.map((item, i) => {
          const IconComp = item.icon;
          const isActive = location.pathname === item.path;

          if (item.isHighlight) {
            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="-mt-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/40 ring-4 ring-white dark:ring-slate-900 active:scale-90 transition cursor-pointer"
              >
                <IconComp size={22} />
              </button>
            );
          }

          return (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                isActive
                  ? "text-sky-600 dark:text-sky-400 font-black"
                  : "text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900"
              }`}
            >
              <IconComp size={19} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
