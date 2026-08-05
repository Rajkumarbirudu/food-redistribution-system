import {
  Leaf,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  X,
  Globe,
  User,
  LayoutGrid,
  Sun,
  Moon,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import InstallPwaButton from "./InstallPwaButton";
import UserProfileModal from "./UserProfileModal";
import GlobalSearch from "./GlobalSearch";
import NotificationCenter from "./NotificationCenter";
import QuickActionCenter from "./QuickActionCenter";
import MobileBottomNav from "./MobileBottomNav";



export default function DashboardLayout({
  children,

  title = "Dashboard",

  subtitle = "",

  quote = "",

  badge = "",

  navigation = [],

  activePath = "",

  onRefresh = null,

  refreshing = false,
}) {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const { t } = useTranslation();

  const displayQuote = quote || t("quote");
  const displayBadge = badge || t("badge");
  const displayTagline = t("tagline");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("aura_theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("aura_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("aura_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ==========================================================
  // USER DETAILS
  //
  // IMPORTANT:
  // Use AuthContext user.
  // Do not read authentication user from localStorage here.
  // ==========================================================

  const userName =
    user?.full_name ||
    user?.name ||
    user?.organization_name ||
    "Aura Food User";

  const userRole =
    user?.role ||
    "USER";

  const userRoleDisplay =
    userRole === "INDIVIDUAL_DONOR"
      ? "Individual Home Donor"
      : userRole.replace("_", " ");

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  // ==========================================================
  // NAVIGATION
  // Determine unique ambient background theme by user role
  const ambientTheme = (() => {
    if (userRole === "DONOR") {
      // Business Donor: Emerald + Mint
      return {
        blob1: "from-emerald-500/10 via-emerald-400/8 to-teal-400/5 dark:from-emerald-500/15 dark:to-teal-400/10",
        blob2: "from-teal-400/10 via-emerald-300/8 to-emerald-500/5 dark:from-teal-400/15 dark:to-emerald-500/10",
        blob3: "from-emerald-400/10 via-teal-300/8 to-emerald-300/5 dark:from-emerald-400/15 dark:to-teal-300/10",
      };
    }
    if (userRole === "INDIVIDUAL_DONOR") {
      // Individual Donor: Sky + Emerald
      return {
        blob1: "from-sky-500/10 via-emerald-400/8 to-teal-400/5 dark:from-sky-500/15 dark:to-emerald-400/10",
        blob2: "from-emerald-400/10 via-sky-400/8 to-emerald-500/5 dark:from-emerald-400/15 dark:to-sky-400/10",
        blob3: "from-sky-400/10 via-emerald-500/8 to-teal-400/5 dark:from-sky-400/15 dark:to-emerald-500/10",
      };
    }
    if (userRole === "NGO") {
      // NGO: Emerald + Teal
      return {
        blob1: "from-emerald-500/10 via-teal-500/8 to-emerald-400/5 dark:from-emerald-500/15 dark:to-teal-500/10",
        blob2: "from-teal-500/10 via-emerald-400/8 to-teal-600/5 dark:from-teal-500/15 dark:to-emerald-400/10",
        blob3: "from-emerald-400/10 via-teal-400/8 to-emerald-600/5 dark:from-emerald-400/15 dark:to-teal-400/10",
      };
    }
    if (userRole === "DELIVERY_PARTNER" || userRole === "DELIVERY_BOY") {
      // Delivery Partner: Emerald + Amber
      return {
        blob1: "from-emerald-500/10 via-amber-500/8 to-teal-400/5 dark:from-emerald-500/15 dark:to-amber-500/10",
        blob2: "from-amber-500/10 via-emerald-400/8 to-amber-600/5 dark:from-amber-500/15 dark:to-emerald-400/10",
        blob3: "from-emerald-400/10 via-amber-400/8 to-teal-500/5 dark:from-emerald-400/15 dark:to-amber-400/10",
      };
    }
    // Default fallback
    return {
      blob1: "from-emerald-500/10 via-teal-400/8 to-emerald-300/5 dark:from-emerald-500/15 dark:to-teal-400/10",
      blob2: "from-teal-400/10 via-emerald-300/8 to-teal-500/5 dark:from-teal-400/15 dark:to-emerald-300/10",
      blob3: "from-emerald-300/10 via-teal-500/8 to-emerald-400/5 dark:from-emerald-300/15 dark:to-teal-500/10",
    };
  })();

  function openPage(path) {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    navigate(path);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F0FDF4] via-[#F8FAFC] to-[#ECFDF5] dark:from-[#020617] dark:via-[#0F172A] dark:to-[#111827] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500">

      {/* RADIAL GRADIENT OVERLAY FOR DEPTH & VISUAL RICHNESS */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-100"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(52, 211, 153, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)
          `
        }}
      />

      {/* AMBIENT FLOATING BLURRED GRADIENT BLOBS */}
      <div className={`pointer-events-none fixed -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br ${ambientTheme.blob1} blur-[120px] animate-ambient-blob z-0`} />
      <div className={`pointer-events-none fixed -right-40 top-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br ${ambientTheme.blob2} blur-[140px] animate-ambient-blob z-0`} style={{ animationDelay: '-6s' }} />
      <div className={`pointer-events-none fixed bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-br ${ambientTheme.blob3} blur-[110px] animate-ambient-blob z-0`} style={{ animationDelay: '-3s' }} />

      {/* CLEAN MINIMALIST TOP NAVBAR HEADER */}
      <header className="sticky top-3 z-40 mx-auto max-w-[1420px] px-3 sm:px-4">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl px-4 py-2.5 flex items-center justify-between">

          <div className="flex items-center gap-3">
            {/* INTERACTIVE MORPHING 3-LINE MENU BUTTON WITH CLICK ANIMATIONS */}
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle menu drawer"
              title={t("Toggle Sidebar Menu")}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm cursor-pointer active:scale-90 group shrink-0 ${
                sidebarOpen
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-slate-700 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              {/* ANIMATED 3 HORIZONTAL LINES THAT MORPH INTO 'X' ON CLICK */}
              <div className="relative flex flex-col justify-between h-4 w-5 items-center">
                <span
                  className={`h-0.5 w-5 rounded-full transition-all duration-300 ease-in-out transform origin-center ${
                    sidebarOpen
                      ? "bg-white translate-y-[7px] rotate-45"
                      : "bg-slate-800 dark:bg-slate-200 group-hover:bg-emerald-600"
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full transition-all duration-300 ease-in-out ${
                    sidebarOpen
                      ? "bg-white opacity-0 scale-x-0"
                      : "bg-slate-800 dark:bg-slate-200 group-hover:bg-emerald-600 opacity-100"
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full transition-all duration-300 ease-in-out transform origin-center ${
                    sidebarOpen
                      ? "bg-white -translate-y-[7px] -rotate-45"
                      : "bg-slate-800 dark:bg-slate-200 group-hover:bg-emerald-600"
                  }`}
                />
              </div>
            </button>

            {/* BRAND LOGO & TITLE */}
            <button
              type="button"
              onClick={() => {
                if (userRole === "INDIVIDUAL_DONOR") navigate("/individual");
                else if (userRole === "DONOR") navigate("/donor");
                else if (userRole === "NGO") navigate("/ngo");
                else if (userRole === "ADMIN") navigate("/admin");
                else if (userRole === "DELIVERY_PARTNER") navigate("/delivery/partner");
                else if (userRole === "DELIVERY_BOY") navigate("/delivery/boy");
                else navigate("/login");
              }}
              className="flex items-center gap-3 text-left group shrink-0"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#007CC3] text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-all duration-300">
                <Leaf size={23} />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                  Aura Food
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </h1>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {displayTagline}
                </p>
              </div>
            </button>
          </div>

          {/* RIGHT HEADER ACTIONS: SEARCH, NOTIFICATIONS, THEME TOGGLE & REFRESH */}
          <div className="flex items-center gap-2 sm:gap-3">
            <GlobalSearch />
            <NotificationCenter />

            {/* DARK / LIGHT MODE TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition shadow-xs cursor-pointer active:scale-95"
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                title={t("nav.refresh")}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            )}
          </div>

        </div>

      </header>

      {/* ==================================================
          SIDEBAR DRAWER (THREE LINES MENU SIDEBAR)
      ================================================== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* BACKDROP OVERLAY WITH FADE ANIMATION */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-overlay"
            onClick={() => setSidebarOpen(false)}
          />

          {/* SLIDING SIDEBAR CONTAINER WITH SPRING ANIMATION */}
          <div className="fixed inset-y-0 left-0 z-50 flex max-w-full">
            <aside className="w-80 sm:w-88 max-w-[88vw] bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200/80 animate-slide-left">
              
              {/* SIDEBAR HEADER */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#007CC3] text-white shadow-md">
                    <Leaf size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                      Aura Food
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                    </h2>
                    <p className="text-[11px] font-bold text-emerald-300">
                      {displayTagline}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* SIDEBAR BODY */}
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                
                {/* USER ACCOUNT CARD */}
                <div 
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 hover:border-emerald-300 hover:bg-emerald-100/60 transition cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-xs group-hover:scale-105 transition">
                    {initials || "A"}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="truncate text-sm font-black text-slate-800">
                      {userName}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 truncate">
                      {userRoleDisplay} • {t("Edit")}
                    </p>
                  </div>
                  <User size={18} className="text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>



                {/* SECTION 2: NAVIGATION BUTTONS */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="h-0.5 w-3 bg-emerald-600 rounded-full" />
                        <span className="h-0.5 w-4 bg-[#007CC3] rounded-full" />
                        <span className="h-0.5 w-3 bg-emerald-600 rounded-full" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {t("Navigation Menu")}
                      </h3>
                    </div>
                    {navigation.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {navigation.length} {navigation.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    )}
                  </div>

                  <nav className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const active = activePath === item.path;

                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => {
                            setSidebarOpen(false);
                            openPage(item.path);
                          }}
                          className={
                            active
                              ? "flex w-full items-center gap-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-left text-sm font-black text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                              : "flex w-full items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-slate-800 hover:text-emerald-600 transition-all cursor-pointer"
                          }
                        >
                          {Icon && <Icon size={20} className={active ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-emerald-600"} />}
                          <span className="flex-1">{t(item.label)}</span>
                          {active && (
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* SECTION 3: REAL-TIME IMPACT METRICS WIDGET */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-4 text-white shadow-md border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                      ⚡ Impact Snapshot
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                      <p className="text-lg font-black text-emerald-400">128.4k+</p>
                      <p className="text-[10px] font-bold text-slate-400">Meals Rescued</p>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                      <p className="text-lg font-black text-emerald-300">42.8 T</p>
                      <p className="text-[10px] font-bold text-slate-400">CO2 Reduced</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: QUICK UTILITIES */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                    {t("Settings & Preferences")}
                  </h3>
                  
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">{t("Language")}</span>
                    <LanguageSelector />
                  </div>

                  <InstallPwaButton />
                </div>

              </div>

              {/* SIDEBAR FOOTER */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 transition active:scale-98 cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>{t("Logout")}</span>
                </button>

                <p className="text-center text-[10px] font-semibold text-slate-400">
                  Aura Food Redistribution System 4.0
                </p>
              </div>

            </aside>
          </div>
        </div>
      )}


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <main className="relative z-10 mx-auto max-w-[1440px] px-3 sm:px-5 py-4 md:px-8 lg:px-10 lg:py-6 pb-20 lg:pb-8">

        {/* HERO HEADER - COMPACT DENSITY FOR ENTERPRISE EXPERIENCE */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/90 p-5 sm:p-6 md:p-7 shadow-[0_16px_50px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Leaf size={14} className="text-emerald-600 dark:text-emerald-400" />
                {t(badge)}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {t(title)}
              </h2>

              {subtitle && (
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                  {t(subtitle)}
                </p>
              )}
            </div>

            {quote && (
              <div className="md:max-w-xs shrink-0 flex items-start gap-2.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/40 p-3.5">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold leading-snug text-emerald-900 dark:text-emerald-200">
                  {t(quote)}
                </p>
              </div>
            )}
          </div>
        </section>


        {/* PAGE CONTENT */}
        <div className="mt-5">
          {children}
        </div>


        {/* FOOTER */}
        <footer className="mt-8 flex flex-col gap-4 rounded-[24px] border border-emerald-200/40 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Aura Food <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">v4.0 Enterprise</span>
            </p>
            <p className="mt-1 text-xs text-slate-300 max-w-xl">
              Zero-waste food rescue network powering real-time surplus inventory redistribution, community safety, and environmental impact.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Leaf size={20} />
          </div>
        </footer>

      </main>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* QUICK ACTION CENTER (FAB) & MOBILE BOTTOM NAVIGATION */}
      <QuickActionCenter />
      <MobileBottomNav />

    </div>
  );
}