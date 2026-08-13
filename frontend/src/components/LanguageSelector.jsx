import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "../context/LanguageContext";

export default function LanguageSelector({ variant = "default" }) {
  const { language, changeLanguage, supportedLanguages, currentLangObj } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 shadow-sm border ${
          variant === "glass"
            ? "border-white/30 bg-white/20 text-white backdrop-blur-md hover:bg-white/30 hover:border-white/50"
            : "border-sky-200/80 bg-sky-50/90 text-sky-950 hover:bg-sky-100 hover:border-sky-300"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Select Language / भाषा चुनें"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600/15 text-sky-700 dark:text-sky-300">
          <Globe size={16} className="text-sky-700 animate-pulse" />
        </span>
        <span className="font-extrabold tracking-wide text-xs sm:text-sm">
          {currentLangObj.flag} {currentLangObj.nativeName}
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-200 opacity-75 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-sky-100 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-sky-50 mb-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-sky-800">
              Select Language / भाषा चुनिए
            </p>
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {supportedLanguages.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm transition-all duration-150 ${
                    active
                      ? "bg-sky-600 font-extrabold text-white shadow-md shadow-sky-600/20"
                      : "font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-none">{lang.nativeName}</span>
                      <span className={`text-[10px] ${active ? "text-sky-100" : "text-slate-400"}`}>
                        {lang.name}
                      </span>
                    </div>
                  </div>
                  {active && <Check size={16} className="text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
