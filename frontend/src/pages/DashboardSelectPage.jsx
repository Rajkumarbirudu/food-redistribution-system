import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Leaf,
  Globe,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  Truck,
  HeartHandshake,
  User,
  Sparkles,
  MousePointer2,
  LogIn,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import InstallPwaButton from "../components/InstallPwaButton";

export default function DashboardSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Direct navigation to dedicated login portal
  const handleDashboardClick = (rolePath, demoRole) => {
    if (user) {
      navigate(rolePath);
      return;
    }
    navigate(`/login?role=${demoRole}`);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FCFF] text-slate-900 font-sans overflow-x-hidden selection:bg-sky-500 selection:text-white flex flex-col justify-between">
      
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[550px] w-[550px] rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-sky-100/40 blur-3xl" />

      {/* TOP NAVBAR */}
      <header className="relative z-50 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/25 ring-4 ring-sky-500/10">
            <Leaf size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              {t("Aura Food") || "Aura Food"}
              <Globe size={16} className="text-sky-600 shrink-0" />
            </h1>
            <p className="text-[11px] font-bold text-sky-700 tracking-wide">
              {t("Share food. Spread hope.") || "Share food. Spread hope."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InstallPwaButton variant="glass" />
          <LanguageSelector />
          {user ? (
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition cursor-pointer"
            >
              <User size={15} />
              {t("My Account") || "My Account"}
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/90 px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm hover:bg-slate-50 transition backdrop-blur-md"
            >
              <LogIn size={15} className="text-sky-600" />
              {t("Sign In") || "Sign In"}
            </Link>
          )}
        </div>
      </header>

      {/* MAIN CONTENT HERO & GRID */}
      <main className="relative z-10 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 w-full items-stretch">
          
          {/* LEFT HERO CARD - Matches exact left pane in photo */}
          <div className="lg:col-span-5 bg-white/70 backdrop-blur-xl border border-sky-900/10 rounded-[32px] p-8 sm:p-10 lg:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group">
            
            {/* Subtle background glow inside left card */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-sky-100/60 to-blue-100/40 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Badge Button "FoodStore" */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-sky-600/20 tracking-wide border border-sky-500/30">
                <Sparkles size={16} />
                FoodStore
              </div>

              {/* Subtitle */}
              <p className="mt-6 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {t("AI FOOD REDISTRIBUTION PLATFORM") || "AI FOOD REDISTRIBUTION PLATFORM"}
              </p>

              {/* Main Heading */}
              <h2 className="mt-3 text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-slate-900 leading-[1.12]">
                {t("Choose your dashboard.") || "Choose your dashboard."}
              </h2>

              {/* Description Paragraph */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-md">
                {t("MongoDB-powered system for donors, recipient organizations, delivery volunteers, and household food sharing.") ||
                  "MongoDB-powered system for donors, recipient organizations, delivery volunteers, and household food sharing."}
              </p>
            </div>

            {/* Bottom section with interactive indicator & mouse pointer icon matching photo */}
            <div className="relative z-10 mt-10 pt-6 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <MousePointer2 size={16} className="text-sky-600 animate-bounce" />
                <span>{t("Select any workspace card to launch") || "Select any workspace card to launch"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-700">
                <Layers size={15} />
                <span>v2.5 Live</span>
              </div>
            </div>
          </div>

          {/* RIGHT 2X2 GRID OF DASHBOARD CARDS - Matches exact 4 cards in photo */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
            
            {/* CARD 1: BUSINESS DASHBOARD (Light Blue Theme "B") */}
            <div
              onClick={() => handleDashboardClick("/donor", "DONOR")}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-sky-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-xl pointer-events-none group-hover:bg-sky-100 transition" />

              <div className="relative z-10">
                {/* Header row: Icon Box "B" + Bar Chart Graphic */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-black text-xl shadow-lg shadow-sky-600/25 ring-4 ring-sky-500/10">
                    B
                  </div>
                  
                  {/* 3-Bar Chart Graphic */}
                  <div className="flex items-end gap-1.5 h-10 px-2.5 py-1.5 bg-sky-50/80 rounded-xl border border-sky-100">
                    <span className="w-2.5 h-[50%] bg-sky-400 rounded-sm group-hover:h-[65%] transition-all duration-300" />
                    <span className="w-2.5 h-[100%] bg-sky-600 rounded-sm group-hover:h-[90%] transition-all duration-300" />
                    <span className="w-2.5 h-[75%] bg-sky-500 rounded-sm group-hover:h-[100%] transition-all duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
                  <span>{t("Business Dashboard") || "Business Dashboard"}</span>
                  <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-600" />
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  {t("Restaurants, hotels, supermarkets, and cafeterias manage stock and publish expiring inventory for NGOs and individuals.") ||
                    "Restaurants, hotels, supermarkets, and cafeterias manage stock and publish expiring inventory for NGOs and individuals."}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                <span className="flex items-center gap-1.5">
                  <Building2 size={15} />
                  {t("Commercial Donors") || "Commercial Donors"}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                  Launch →
                </span>
              </div>
            </div>

            {/* CARD 2: INDIVIDUAL USER DASHBOARD (Orange Theme "I") */}
            <div
              onClick={() => handleDashboardClick("/individual", "INDIVIDUAL_DONOR")}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-amber-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-xl pointer-events-none group-hover:bg-amber-100 transition" />

              <div className="relative z-10">
                {/* Header row: Icon Box "I" + Circles Graphic */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-xl shadow-lg shadow-amber-500/25 ring-4 ring-amber-400/10">
                    I
                  </div>

                  {/* Overlapping Circles Graphic */}
                  <div className="flex items-center justify-center h-10 px-3 bg-amber-50/80 rounded-xl border border-amber-100 relative">
                    <div className="w-4 h-4 rounded-full bg-amber-400/80 -mr-1.5 group-hover:scale-110 transition" />
                    <div className="w-5 h-5 rounded-full bg-amber-500 shadow-sm z-10 group-hover:scale-105 transition" />
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-400/80 -ml-1.5 group-hover:scale-110 transition" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                  <span>{t("Individual User Dashboard") || "Individual User Dashboard"}</span>
                  <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600" />
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  {t("Individuals can manage their own inventory, analyze expiry risk, and book required items from business sellers.") ||
                    "Individuals can manage their own inventory, analyze expiry risk, and book required items from business sellers."}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={15} />
                  {t("Household & Individuals") || "Household & Individuals"}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                  Launch →
                </span>
              </div>
            </div>

            {/* CARD 3: DELIVERY DASHBOARD (Sky/Cyan Logistics Theme "D") */}
            <div
              onClick={() => handleDashboardClick("/delivery/partner", "DELIVERY_PARTNER")}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-sky-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-xl pointer-events-none group-hover:bg-sky-100 transition" />

              <div className="relative z-10">
                {/* Header row: Icon Box "D" + Diagonal Route Graphic */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-black text-xl shadow-lg shadow-sky-600/25 ring-4 ring-sky-500/10">
                    D
                  </div>

                  {/* Diagonal Line Route Graphic */}
                  <div className="flex items-center justify-center h-10 px-3 bg-sky-50/80 rounded-xl border border-sky-100">
                    <svg width="36" height="24" viewBox="0 0 36 24" fill="none" className="text-sky-600">
                      <path d="M4 20 L32 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="4" cy="20" r="3" fill="#0284c7" />
                      <circle cx="32" cy="4" r="3" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
                  <span>{t("Delivery Dashboard") || "Delivery Dashboard"}</span>
                  <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-600" />
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  {t("Delivery users accept pickup tasks, coordinate routes, and complete food handovers for NGOs or users.") ||
                    "Delivery users accept pickup tasks, coordinate routes, and complete food handovers for NGOs or users."}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                <span className="flex items-center gap-1.5">
                  <Truck size={15} />
                  {t("Volunteers & Logistics") || "Volunteers & Logistics"}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                  Launch →
                </span>
              </div>
            </div>

            {/* CARD 4: NGO DASHBOARD (Light Blue Theme "N") */}
            <div
              onClick={() => handleDashboardClick("/ngo", "NGO")}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-xl pointer-events-none group-hover:bg-blue-100 transition" />

              <div className="relative z-10">
                {/* Header row: Icon Box "N" + Translucent Stacked Squares Graphic */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/25 ring-4 ring-blue-500/10">
                    N
                  </div>

                  {/* Overlapping Squares Graphic */}
                  <div className="flex items-center justify-center h-10 px-3 bg-blue-50/80 rounded-xl border border-blue-100 relative">
                    <div className="w-5 h-5 rounded-md border-2 border-blue-400 bg-blue-100/50 absolute top-1 right-2 group-hover:rotate-6 transition" />
                    <div className="w-5 h-5 rounded-md border-2 border-blue-600 bg-blue-500/20 absolute bottom-1 right-4 group-hover:-rotate-6 transition" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  <span>{t("NGO Dashboard") || "NGO Dashboard"}</span>
                  <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                  {t("NGOs, food banks, and community kitchens manage local stock, publish needs, and book expiring business inventory.") ||
                    "NGOs, food banks, and community kitchens manage local stock, publish needs, and book expiring business inventory."}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span className="flex items-center gap-1.5">
                  <HeartHandshake size={15} />
                  {t("NGOs & Food Banks") || "NGOs & Food Banks"}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                  {loadingRole === "NGO" ? "Opening..." : "Launch →"}
                </span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-5 border-t border-slate-200/60 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <div>
          © {new Date().getFullYear()} {t("Aura Food") || "Aura Food"}. {t("AI-Based Food Redistribution System for Waste Reduction") || "AI-Based Food Redistribution System for Waste Reduction"}.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/register" className="hover:text-slate-900 transition font-bold">
            {t("Register Account") || "Register Account"}
          </Link>
          <span>•</span>
          <Link to="/login" className="hover:text-slate-900 transition font-bold">
            {t("Sign In") || "Sign In"}
          </Link>
        </div>
      </footer>

    </div>
  );
}
