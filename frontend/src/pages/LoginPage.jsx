import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  Sparkles,
  Globe,
  Building2,
  UserCheck,
  Truck,
  HeartHandshake,
  MousePointer2,
  Layers,
  X,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import InstallPwaButton from "../components/InstallPwaButton";
import BootSplash from "../components/BootSplash";

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function getDashboardPath(role, email = "") {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "ADMIN") return "/admin";
  if (normalizedRole === "DONOR") return "/donor";
  if (normalizedRole === "INDIVIDUAL_DONOR") return "/individual";
  if (normalizedRole === "NGO") return "/ngo";
  if (normalizedRole === "DELIVERY_PARTNER") return "/delivery/partner";
  if (normalizedRole === "DELIVERY_BOY") return "/delivery/boy";

  const em = String(email || "").toLowerCase();
  if (em.includes("admin")) return "/admin";
  if (em.includes("ngo")) return "/ngo";
  if (em.includes("delivery")) return "/delivery/partner";
  if (em.includes("individual")) return "/individual";
  return "/donor";
}

function getErrorMessage(error) {
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error" || !error?.response) {
    return "Cannot connect to backend server. Please check your internet connection.";
  }
  if (error?.response?.status === 401) {
    return "Incorrect email or password. Please verify your credentials.";
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || "Validation error").join(", ");
  return error?.message || "Unable to sign in.";
}

// Role configurations for the dedicated login portals
const ROLE_PORTALS = {
  DONOR: {
    key: "DONOR",
    title: "Business Dashboard Login Portal",
    subtitle: "For Restaurants, Hotels, Supermarkets & Cafeterias",
    description: "Access commercial surplus food publishing, automated expiry tracking, and NGO pickup coordination.",
    path: "/donor",
    letter: "B",
    themeColor: "sky",
    bgBadge: "bg-sky-600",
    btnColor: "bg-sky-600 hover:bg-sky-700 shadow-sky-600/25",
    textColor: "text-sky-700",
    borderColor: "border-sky-500",
  },
  INDIVIDUAL_DONOR: {
    key: "INDIVIDUAL_DONOR",
    title: "Individual User Dashboard Login Portal",
    subtitle: "For Household Members & Personal Donors",
    description: "Manage home grocery inventory, track expiry dates, share extra food, or claim items from local businesses.",
    path: "/individual",
    letter: "I",
    themeColor: "amber",
    bgBadge: "bg-amber-500",
    btnColor: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25",
    textColor: "text-amber-700",
    borderColor: "border-amber-500",
  },
  DELIVERY_PARTNER: {
    key: "DELIVERY_PARTNER",
    title: "Delivery Dashboard Login Portal",
    subtitle: "For Logistics Partners, Volunteers & Drivers",
    description: "Accept food pickup requests, optimize delivery routes, and log proof of food handover.",
    path: "/delivery/partner",
    letter: "D",
    themeColor: "sky",
    bgBadge: "bg-sky-600",
    btnColor: "bg-sky-600 hover:bg-sky-700 shadow-sky-600/25",
    textColor: "text-sky-700",
    borderColor: "border-sky-500",
  },
  NGO: {
    key: "NGO",
    title: "NGO Dashboard Login Portal",
    subtitle: "For Food Banks, Community Kitchens & Charities",
    description: "Discover available food donations, request stock, and distribute meals to beneficiaries.",
    path: "/ngo",
    letter: "N",
    themeColor: "blue",
    bgBadge: "bg-blue-600",
    btnColor: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout, user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  // Active Login Portal Modal State
  const [activePortal, setActivePortal] = useState(() => {
    const initialRole = searchParams.get("role");
    return ROLE_PORTALS[initialRole] || null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(getDashboardPath(user?.role, user?.email), { replace: true });
  }, [authLoading, user, navigate]);

  // Open Portal Modal when clicking a card
  const handleCardClick = (portalConfig) => {
    setActivePortal(portalConfig);
    setEmail("");
    setPassword("");
    setError("");
  };

  // Submit Login Form
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const authenticatedUser = await login(normalizedEmail, password);
      let role = normalizeRole(authenticatedUser?.role);

      if (!role || !["ADMIN", "DONOR", "INDIVIDUAL_DONOR", "NGO", "DELIVERY_PARTNER", "DELIVERY_BOY"].includes(role)) {
        if (normalizedEmail.includes("admin")) role = "ADMIN";
        else if (normalizedEmail.includes("ngo")) role = "NGO";
        else if (normalizedEmail.includes("delivery")) role = "DELIVERY_PARTNER";
        else if (normalizedEmail.includes("individual")) role = "INDIVIDUAL_DONOR";
        else role = "DONOR";
      }

      // ENFORCE STRICT ROLE MATCHING PER LOGIN PORTAL
      if (activePortal?.key) {
        const expectedRole = activePortal.key;
        let isAuthorized = false;

        if (expectedRole === "DONOR") {
          isAuthorized = role === "DONOR" || role === "ADMIN";
        } else if (expectedRole === "INDIVIDUAL_DONOR") {
          isAuthorized = role === "INDIVIDUAL_DONOR" || role === "ADMIN";
        } else if (expectedRole === "DELIVERY_PARTNER") {
          isAuthorized = role === "DELIVERY_PARTNER" || role === "DELIVERY_BOY" || role === "ADMIN";
        } else if (expectedRole === "NGO") {
          isAuthorized = role === "NGO" || role === "ADMIN";
        }

        if (!isAuthorized) {
          if (typeof logout === "function") logout();
          else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }

          const roleDisplayNames = {
            DONOR: "Commercial Business Donor",
            INDIVIDUAL_DONOR: "Individual User",
            DELIVERY_PARTNER: "Delivery Partner",
            NGO: "NGO",
            ADMIN: "Administrator",
          };

          const userRoleLabel = roleDisplayNames[role] || role;
          const portalRoleLabel = roleDisplayNames[expectedRole] || expectedRole;

          setError(
            `Access Denied: You entered credentials for a ${userRoleLabel} account on the ${portalRoleLabel} Portal. Please select the correct portal card for your role.`
          );
          return;
        }
      }

      navigate(getDashboardPath(role, normalizedEmail), { replace: true });
    } catch (requestError) {
      console.error("LOGIN PAGE ERROR:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <BootSplash />;
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FF] to-[#F0F9FF] dark:from-[#020617] dark:via-[#0F172A] dark:to-[#111827] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden flex flex-col justify-between selection:bg-sky-500 selection:text-white transition-colors duration-500">
      {/* RADIAL OVERLAY & BACKGROUND DECORATIVE ANIMATED GLOWS */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-100"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(56, 189, 248, 0.06) 0%, transparent 50%)
          `
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[120px] animate-ambient-blob" />
      <div className="pointer-events-none absolute top-1/4 -right-40 h-[650px] w-[650px] rounded-full bg-blue-400/10 dark:bg-blue-400/15 blur-[130px] animate-ambient-blob" style={{ animationDelay: '-6s' }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[550px] w-[550px] rounded-full bg-sky-300/10 dark:bg-sky-300/15 blur-[110px] animate-ambient-blob" style={{ animationDelay: '-3s' }} />

      {/* TOP HEADER / NAVBAR */}
      <header className="relative z-50 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActivePortal(null)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xl shadow-sky-600/30 ring-4 ring-sky-500/10 group-hover:scale-105 transition-all duration-300">
            <Leaf size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              {t("Aura Food") || "Aura Food"}
              <Globe size={16} className="text-sky-600 shrink-0" />
            </h1>
            <p className="text-[11px] font-extrabold text-sky-700 tracking-wide">
              {t("Share food. Spread hope.") || "Share food. Spread hope."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InstallPwaButton variant="glass" />
          <LanguageSelector />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 w-full items-stretch">
          
          {/* LEFT HERO CARD - Exact Hero Pane from Image */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-2xl border border-sky-900/10 rounded-[32px] p-8 sm:p-10 lg:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group corp-card-hover">
            
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-sky-200/50 via-blue-200/30 to-indigo-200/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Badge Button "FoodStore" */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4.5 py-2 text-sm font-black text-white shadow-lg shadow-sky-600/30 tracking-wide border border-sky-500/30">
                <Sparkles size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
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

            {/* Bottom Section */}
            <div className="relative z-10 mt-10 pt-6 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <MousePointer2 size={16} className="text-sky-600 animate-bounce" />
                <span>{t("Click any card to open login portal") || "Click any card to open login portal"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-700">
                <Layers size={15} />
                <span>v2.5 Live</span>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: 2X2 DASHBOARD CARDS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 h-full">
              
              {/* CARD 1: BUSINESS DASHBOARD (Light Blue Theme "B") */}
              <div
                onClick={() => handleCardClick(ROLE_PORTALS.DONOR)}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-sky-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-black text-xl shadow-lg shadow-sky-600/25 ring-4 ring-sky-500/10">
                      B
                    </div>
                    {/* Bar chart graphic */}
                    <div className="flex items-end gap-1.5 h-10 px-2.5 py-1.5 bg-sky-50/80 rounded-xl border border-sky-100">
                      <span className="w-2.5 h-[50%] bg-sky-400 rounded-sm group-hover:h-[65%] transition-all" />
                      <span className="w-2.5 h-[100%] bg-sky-600 rounded-sm group-hover:h-[90%] transition-all" />
                      <span className="w-2.5 h-[75%] bg-sky-500 rounded-sm group-hover:h-[100%] transition-all" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
                    <span>{t("Business Dashboard") || "Business Dashboard"}</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-600" />
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                    {t("Restaurants, hotels, supermarkets, and cafeterias manage stock and publish expiring inventory for NGOs and individuals.")}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={15} />
                    {t("Commercial Donors")}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                    Open Portal →
                  </span>
                </div>
              </div>

              {/* CARD 2: INDIVIDUAL USER DASHBOARD (Orange Theme "I") */}
              <div
                onClick={() => handleCardClick(ROLE_PORTALS.INDIVIDUAL_DONOR)}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-amber-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-xl shadow-lg shadow-amber-500/25 ring-4 ring-amber-400/10">
                      I
                    </div>
                    {/* Circle bubbles graphic */}
                    <div className="flex items-center justify-center h-10 px-3 bg-amber-50/80 rounded-xl border border-amber-100 relative">
                      <div className="w-4 h-4 rounded-full bg-amber-400/80 -mr-1.5" />
                      <div className="w-5 h-5 rounded-full bg-amber-500 shadow-xs z-10" />
                      <div className="w-3.5 h-3.5 rounded-full bg-orange-400/80 -ml-1.5" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                    <span>{t("Individual User Dashboard") || "Individual User Dashboard"}</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600" />
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                    {t("Individuals can manage their own inventory, analyze expiry risk, and book required items from business sellers.")}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                  <span className="flex items-center gap-1.5">
                    <UserCheck size={15} />
                    {t("Household & Individuals")}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                    Open Portal →
                  </span>
                </div>
              </div>

              {/* CARD 3: DELIVERY DASHBOARD (Sky/Cyan Logistics Theme "D") */}
              <div
                onClick={() => handleCardClick(ROLE_PORTALS.DELIVERY_PARTNER)}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-sky-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-xl pointer-events-none group-hover:bg-sky-100 transition" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white font-black text-xl shadow-lg shadow-sky-600/25 ring-4 ring-sky-500/10">
                      D
                    </div>
                    {/* Route Graphic */}
                    <div className="flex items-center justify-center h-10 px-3 bg-sky-50/80 rounded-xl border border-sky-100">
                      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" className="text-sky-600">
                        <path d="M4 20 L32 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="4" cy="20" r="3" fill="#0284c7" />
                        <circle cx="32" cy="4" r="3" fill="#f59e0b" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
                    <span>{t("Delivery Dashboard") || "Delivery Dashboard"}</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-600" />
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                    {t("Delivery users accept pickup tasks, coordinate routes, and complete food handovers for NGOs or users.")}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                  <span className="flex items-center gap-1.5">
                    <Truck size={15} />
                    {t("Volunteers & Logistics")}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                    Open Portal →
                  </span>
                </div>
              </div>

              {/* CARD 4: NGO DASHBOARD (Light Blue Theme "N") */}
              <div
                onClick={() => handleCardClick(ROLE_PORTALS.NGO)}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/25 ring-4 ring-blue-500/10">
                      N
                    </div>
                    {/* Overlapping Squares Graphic */}
                    <div className="flex items-center justify-center h-10 px-3 bg-blue-50/80 rounded-xl border border-blue-100 relative">
                      <div className="w-5 h-5 rounded-md border-2 border-blue-400 bg-blue-100/50 absolute top-1 right-2" />
                      <div className="w-5 h-5 rounded-md border-2 border-blue-600 bg-blue-500/20 absolute bottom-1 right-4" />
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                    <span>{t("NGO Dashboard") || "NGO Dashboard"}</span>
                    <ArrowRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                    {t("NGOs, food banks, and community kitchens manage local stock, publish needs, and book expiring business inventory.")}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake size={15} />
                    {t("NGOs & Food Banks")}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                    Open Portal →
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* DEDICATED LOGIN PORTAL MODAL - OPENS WHEN ANY CARD IS CLICKED */}
      {activePortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-lg bg-white/95 border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between animate-scale-modal backdrop-blur-2xl">
            
            {/* CLOSE BUTTON & BACK BUTTON */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActivePortal(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft size={16} />
                {t("Back to Dashboards")}
              </button>

              <button
                type="button"
                onClick={() => setActivePortal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* PORTAL HEADER */}
            <div className="mt-5">
              <div className="flex items-center gap-3.5 mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activePortal.bgBadge} text-white font-black text-xl shadow-lg ring-4 ring-slate-100`}>
                  {activePortal.letter}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    {activePortal.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {activePortal.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {activePortal.description}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* LOGIN FORM FOR THIS DEDICATED PORTAL */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  {t("Email address")} *
                </label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    disabled={submitting}
                    required
                    className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  {t("Password")} *
                </label>
                <div className="relative">
                  <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter password"
                    disabled={submitting}
                    required
                    className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-11 text-xs font-bold text-slate-900 dark:text-white outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((curr) => !curr)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl ${activePortal.btnColor} text-xs font-black text-white shadow-lg transition cursor-pointer disabled:opacity-60 mt-2`}
              >
                {submitting ? t("Signing in...") : `Sign In & Launch ${activePortal.letter} Dashboard`}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                {t("Don't have an account?")}{" "}
                <Link to="/register" className="font-black text-sky-700 hover:underline">
                  {t("Register here")}
                </Link>
              </span>
              <button
                type="button"
                onClick={() => setActivePortal(null)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 max-w-[1750px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-4 border-t border-slate-200/60 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-500">
        <div>
          © {new Date().getFullYear()} {t("Aura Food")}. {t("AI-Based Food Redistribution System for Waste Reduction")}.
        </div>
        <div className="flex items-center gap-3">
          <Link to="/register" className="hover:text-slate-900 transition font-bold">
            {t("Register Account")}
          </Link>
          <span>•</span>
          <button onClick={() => handleCardClick(ROLE_PORTALS.DONOR)} className="hover:text-slate-900 transition font-bold">
            {t("Business Portal")}
          </button>
        </div>
      </footer>
    </main>
  );
}