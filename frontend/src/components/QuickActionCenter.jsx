import React, { useState } from "react";
import {
  Plus,
  Barcode,
  PackagePlus,
  FileSpreadsheet,
  HeartHandshake,
  Gift,
  Truck,
  ShieldCheck,
  Users,
  FileText,
  PackageCheck,
  Tags,
  Search,
  LayoutDashboard,
  Utensils,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";

export default function QuickActionCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const role = String(user?.role || "").toUpperCase();

  const getActionsForRole = () => {
    // 1. NGO Actions (Discover, Claims, Deliveries)
    if (role === "NGO") {
      return [
        {
          label: t("Discover Available Food"),
          path: "/ngo/available",
          icon: Search,
          color: "bg-sky-600 hover:bg-sky-700",
        },
        {
          label: t("My Claimed Requests"),
          path: "/ngo/claims",
          icon: HeartHandshake,
          color: "bg-blue-600 hover:bg-blue-700",
        },
        {
          label: t("Active Deliveries"),
          path: "/ngo",
          icon: Truck,
          color: "bg-amber-600 hover:bg-amber-700",
        },
      ];
    }

    // 2. Delivery Partner Actions
    if (role === "DELIVERY_PARTNER" || role === "DELIVERY_BOY") {
      return [
        {
          label: t("Available Pickups"),
          path: "/delivery/partner",
          icon: Truck,
          color: "bg-sky-600 hover:bg-sky-700",
        },
        {
          label: t("Delivery Dashboard"),
          path: "/delivery/partner",
          icon: LayoutDashboard,
          color: "bg-blue-600 hover:bg-blue-700",
        },
      ];
    }

    // 3. Individual Home Donor Actions
    if (role === "INDIVIDUAL_DONOR") {
      return [
        {
          label: t("Scan Grocery Barcode"),
          path: "/donor/barcode",
          icon: Barcode,
          color: "bg-purple-600 hover:bg-purple-700",
        },
        {
          label: t("My Home Pantry"),
          path: "/individual",
          icon: PackagePlus,
          color: "bg-amber-500 hover:bg-amber-600",
        },
        {
          label: t("Share Extra Food"),
          path: "/individual",
          icon: HeartHandshake,
          color: "bg-sky-600 hover:bg-sky-700",
        },
        {
          label: t("Discover Food"),
          path: "/individual",
          icon: Gift,
          color: "bg-blue-600 hover:bg-blue-700",
        },
      ];
    }

    // 4. Admin Actions
    if (role === "ADMIN") {
      return [
        {
          label: t("User Approvals"),
          path: "/admin/approvals",
          icon: ShieldCheck,
          color: "bg-amber-600 hover:bg-amber-700",
        },
        {
          label: t("Manage Users"),
          path: "/admin/details/users",
          icon: Users,
          color: "bg-sky-600 hover:bg-sky-700",
        },
        {
          label: t("Donation Records"),
          path: "/admin/details/donations",
          icon: FileText,
          color: "bg-blue-600 hover:bg-blue-700",
        },
        {
          label: t("Inventory Records"),
          path: "/admin/details/inventory",
          icon: PackageCheck,
          color: "bg-indigo-600 hover:bg-indigo-700",
        },
      ];
    }

    // 5. Commercial Business Donor (DONOR) Actions
    return [
      {
        label: t("Scan Barcode"),
        path: "/donor/barcode",
        icon: Barcode,
        color: "bg-purple-600 hover:bg-purple-700",
      },
      {
        label: t("Manage Inventory"),
        path: "/inventory",
        icon: PackagePlus,
        color: "bg-sky-600 hover:bg-sky-700",
      },
      {
        label: t("Post Food Donation"),
        path: "/donations",
        icon: HeartHandshake,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        label: t("Discounted Sales"),
        path: "/sales",
        icon: Tags,
        color: "bg-amber-600 hover:bg-amber-700",
      },
    ];
  };

  const actions = getActionsForRole();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* ACTION MENU POPUP */}
      {isOpen && (
        <div className="mb-3 space-y-2.5 animate-scale-modal flex flex-col items-end">
          {actions.map((act, i) => {
            const IconComp = act.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(act.path);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl ${act.color} text-white text-xs font-black shadow-xl hover:scale-105 transition active:scale-95 cursor-pointer`}
              >
                <IconComp size={16} />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Quick Actions"
        className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-500 text-white shadow-2xl shadow-sky-600/40 hover:scale-105 transition-all duration-300 cursor-pointer ${
          isOpen ? "rotate-45" : ""
        }`}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
