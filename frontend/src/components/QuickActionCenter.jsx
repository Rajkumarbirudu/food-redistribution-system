import React, { useState } from "react";
import { Plus, Barcode, PackagePlus, FileSpreadsheet, BarChart3, HeartHandshake, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActionCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: "Scan Barcode", path: "/donor/barcode", icon: Barcode, color: "bg-purple-600 hover:bg-purple-700" },
    { label: "Add Inventory", path: "/donor/inventory", icon: PackagePlus, color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Create Donation", path: "/donor/donations", icon: HeartHandshake, color: "bg-sky-600 hover:bg-sky-700" },
    { label: "Export CSV", path: "/inventory", icon: FileSpreadsheet, color: "bg-amber-600 hover:bg-amber-700" },
  ];

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
        className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-600/40 hover:scale-105 transition-all duration-300 cursor-pointer ${
          isOpen ? "rotate-45" : ""
        }`}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
