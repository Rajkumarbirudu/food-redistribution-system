import React, { useState } from "react";
import { Search, X, Package, HeartHandshake, Truck, Tag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sampleResults = [
    { title: "Fresh Whole Milk 25L", type: "Inventory", path: "/inventory", icon: Package },
    { title: "Cooked Rice 50 Servings", type: "Donations", path: "/donations", icon: HeartHandshake },
    { title: "City Shelter Delivery #402", type: "Deliveries", path: "/delivery/partner", icon: Truck },
    { title: "Dairy & Bakery", type: "Category", path: "/inventory", icon: Tag },
  ].filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {/* SEARCH BAR BUTTON TRIGGER */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-3 h-10 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 hover:border-sky-400 transition cursor-pointer text-xs font-semibold w-48 lg:w-64"
      >
        <Search size={15} className="text-sky-600 dark:text-sky-400" />
        <span className="flex-1 text-left truncate">{t("Search platform...") || "Search platform..."}</span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-black bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* SEARCH MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-5 shadow-2xl animate-scale-modal">
            
            {/* SEARCH INPUT */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Search size={20} className="text-sky-600 dark:text-sky-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inventory, donations, NGOs, deliveries..."
                className="w-full text-sm font-bold bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* RESULTS LIST */}
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {sampleResults.length > 0 ? (
                sampleResults.map((r, i) => {
                  const IconComp = r.icon;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(r.path);
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer group border border-transparent hover:border-sky-200 dark:hover:border-sky-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-600 group-hover:text-white transition">
                          <IconComp size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{r.title}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{r.type}</span>
                        </div>
                      </div>
                      <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 text-sky-600 transition" />
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs font-semibold text-slate-400">
                  No matching platform records found.
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
