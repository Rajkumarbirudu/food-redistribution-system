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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import InstallPwaButton from "../components/InstallPwaButton";


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
    return "Incorrect email or password. If you don't have an account yet, click 'Register here' below or use a Quick Demo account.";
  }
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || "Validation error").join(", ");
  return error?.message || "Unable to sign in.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(getDashboardPath(user?.role), { replace: true });
  }, [authLoading, user, navigate]);

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

      navigate(getDashboardPath(role, normalizedEmail), { replace: true });
    } catch (requestError) {
      console.error("LOGIN PAGE ERROR:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5fbf7] px-5">
        <div className="rounded-[30px] border border-white/80 bg-white/85 px-8 py-8 text-center shadow-[0_25px_80px_rgba(15,118,110,0.12)] backdrop-blur-xl max-w-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Leaf size={27} />
          </div>
          <p className="mt-5 font-black text-slate-800">Checking your session...</p>
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="mt-4 inline-block text-xs font-bold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
          >
            Click here to reset session & continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5fbf7]">
      {/* TOP LANGUAGE SELECTOR BAR & PWA INSTALL BUTTON */}
      <div className="relative z-50 p-4 sm:p-0 sm:absolute sm:top-5 sm:right-5 ltr:sm:right-5 rtl:sm:left-5 flex items-center justify-end gap-2.5">
        <InstallPwaButton variant="glass" />
        <LanguageSelector />
      </div>

      {/* BACKGROUND DECORATIONS */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[400px] w-[400px] sm:h-[520px] sm:w-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[450px] w-[450px] sm:h-[600px] sm:w-[600px] rounded-full bg-lime-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[350px] w-[350px] sm:h-[450px] sm:w-[450px] rounded-full bg-teal-100/50 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-60px)] sm:min-h-screen max-w-7xl lg:grid-cols-2">
        
        {/* LEFT HERO */}
        <section className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Leaf size={25} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                Aura Food
                <Globe size={18} className="text-emerald-600 animate-pulse shrink-0" />
              </h1>
              <p className="text-xs font-bold text-emerald-700">
                {t("Share food. Spread hope.")}
              </p>
            </div>
          </div>

          <div className="max-w-xl my-auto py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 backdrop-blur-xl">
              <Sparkles size={15} />
              {t("Smart Food Redistribution")}
            </div>

            <h2 className="mt-7 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 xl:text-5xl">
              {t("Turn surplus food into meaningful impact.")}
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 font-medium">
              {t("Manage food inventory, track expiry risk, donate surplus food and connect available meals with organizations that need them.")}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-3xl border border-white/80 bg-white/65 p-5 backdrop-blur-xl shadow-xs">
                <p className="text-xl font-black text-emerald-700">{t("Track")}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{t("Inventory")}</p>
              </div>

              <div className="rounded-3xl border border-white/80 bg-white/65 p-5 backdrop-blur-xl shadow-xs">
                <p className="text-xl font-black text-emerald-700">{t("Share")}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{t("Surplus Food")}</p>
              </div>

              <div className="rounded-3xl border border-white/80 bg-white/65 p-5 backdrop-blur-xl shadow-xs">
                <p className="text-xl font-black text-emerald-700">{t("Reduce")}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{t("Food Waste")}</p>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold italic leading-6 text-emerald-900/70">
            “{t("Every meal saved is a chance to nourish a life and protect our planet.")}”
          </p>
        </section>

        {/* RIGHT LOGIN SECTION */}
        <section className="flex min-h-[calc(100vh-80px)] sm:min-h-screen items-center justify-center px-3.5 py-4 sm:px-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-[460px] rounded-3xl sm:rounded-[36px] border border-white/90 bg-white/90 p-5 sm:p-10 shadow-[0_20px_80px_rgba(15,118,110,0.12)] backdrop-blur-2xl">
            
            {/* MOBILE BRAND */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0">
                <Leaf size={22} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900">Aura Food</h1>
                <p className="text-[11px] font-bold text-emerald-700">{t("Share food. Spread hope.")}</p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 border border-emerald-100">
                <LockKeyhole size={14} />
                {t("Secure Access")}
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {t("Welcome back")}
              </h2>

              <p className="mt-2.5 text-sm leading-6 text-slate-500 font-semibold">
                {t("Sign in to manage inventory, donations and food redistribution.")}
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2" role="alert">
                <span>{error}</span>
              </div>
            )}

            {/* DEMO QUICK FILL BUTTONS */}
            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 text-center">
                ⚡ {t("Quick Demo Login")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@example.com");
                    setPassword("AdminPassword@123");
                    setError("");
                  }}
                  className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100/60 transition text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("donor@example.com");
                    setPassword("DonorPassword@123");
                    setError("");
                  }}
                  className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100/60 transition text-center"
                >
                  Donor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("ngo@example.com");
                    setPassword("NgoPassword@123");
                    setError("");
                  }}
                  className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100/60 transition text-center"
                >
                  NGO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("delivery@example.com");
                    setPassword("DeliveryPassword@123");
                    setError("");
                  }}
                  className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100/60 transition text-center"
                >
                  Delivery
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* EMAIL */}
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  {t("Email address")} *
                </label>
                <div className="relative">
                  <Mail size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={submitting}
                    required
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  {t("Password")} *
                </label>
                <div className="relative">
                  <LockKeyhole size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={submitting}
                    required
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((curr) => !curr)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t("Signing in...") || "Signing in..." : t("Sign In")}
                {!submitting && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <span className="text-xs font-semibold text-slate-500">
                {t("Don't have an account?")}{" "}
              </span>
              <Link to="/register" className="text-xs font-black text-emerald-700 hover:text-emerald-800 hover:underline">
                {t("Register here")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}