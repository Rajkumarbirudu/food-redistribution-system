import {
  Leaf,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  X,
  Globe,
  User,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";
import {
  useTranslation,
} from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import InstallPwaButton from "./InstallPwaButton";
import UserProfileModal from "./UserProfileModal";



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

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);




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
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .toUpperCase();


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {
    /*
     * Close mobile menu first.
     */

    setMobileMenuOpen(false);


    /*
     * AuthContext owns authentication state.
     *
     * This clears:
     * access_token
     * token
     * user
     *
     * and sets user = null.
     */

    logout();


    /*
     * Navigate immediately.
     */

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function openPage(path) {
    setMobileMenuOpen(false);

    navigate(path);
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">

      {/* SUBTLE BACKGROUND ACCENTS */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 top-32 h-[550px] w-[550px] rounded-full bg-sky-100/50 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-teal-50/60 blur-3xl" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_2px_15px_rgba(15,23,42,0.03)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3.5 md:px-10 lg:px-12 gap-4 lg:gap-8">

          {/* BRAND */}
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-all duration-200">
              <Leaf size={23} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                Aura Food
                <Globe size={18} className="text-emerald-600 animate-pulse shrink-0" title="Global Food Network" />
              </h1>
              <p className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                {displayTagline}
              </p>
            </div>
          </button>

          {/* DESKTOP NAVIGATION TABS */}
          {navigation.length > 0 && (
            <nav className="hidden items-center gap-2 xl:gap-3 lg:flex mx-2 overflow-x-auto py-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activePath === item.path;

                return (
                  <button
                    type="button"
                    key={item.path}
                    onClick={() => openPage(item.path)}
                    className={
                      active
                        ? "flex items-center gap-2.5 rounded-2xl bg-[#007CC3] px-4 xl:px-5 py-2.5 text-xs xl:text-sm font-black text-white shadow-sm whitespace-nowrap transition-all duration-200"
                        : "flex items-center gap-2.5 rounded-2xl border border-transparent px-4 xl:px-5 py-2.5 text-xs xl:text-sm font-bold text-slate-600 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100/80 hover:text-slate-900 whitespace-nowrap"
                    }
                  >
                    {Icon && <Icon size={17} className="shrink-0" />}
                    <span>{t(item.label)}</span>
                  </button>
                );
              })}
            </nav>
          )}


          {/* ==================================================
              USER + ACTIONS
          ================================================== */}

          <div className="flex items-center gap-3 lg:gap-4 shrink-0">

            {/* TOP RIGHT LANGUAGE SELECTOR & PWA INSTALL BUTTON */}
            <InstallPwaButton />
            <LanguageSelector />



            {/* USER PROFILE BUTTON (VIEW & EDIT) */}

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title={t("View & Edit Profile")}
              className="hidden items-center gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-3 py-1.5 sm:flex hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-xs transition group cursor-pointer text-left"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white shadow-xs group-hover:scale-105 transition">

                {
                  initials ||
                  "A"
                }

              </div>


              <div className="pr-2">

                <p className="max-w-[150px] truncate text-sm font-black text-slate-800">

                  {
                    userName
                  }

                </p>


                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">

                  {
                    userRoleDisplay
                  } • {t("Edit")}

                </p>

              </div>

            </button>



            {/* REFRESH */}

            {onRefresh && (

              <button
                type="button"

                onClick={
                  onRefresh
                }

                disabled={
                  refreshing
                }

                title={t("nav.refresh")}

                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
              >

                <RefreshCw
                  size={18}

                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

              </button>

            )}


            {/* LOGOUT BUTTON (VISIBLE ON MOBILE & DESKTOP) */}
            <button
              type="button"
              onClick={handleLogout}
              title={t("Logout")}
              className="flex h-10 sm:h-11 items-center gap-1.5 rounded-xl bg-red-600 px-3 sm:px-4 text-xs sm:text-sm font-black text-white transition hover:bg-red-700 shadow-xs shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
              <span>{t("Logout")}</span>
            </button>




            {/* MOBILE MENU */}

            {/* 3 LINES ANIMATED MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label="Toggle navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-[#007CC3]/10 text-[#007CC3] hover:bg-[#007CC3]/20 transition-all duration-300 shadow-sm lg:hidden active:scale-95 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X size={22} className="transition-transform duration-300 rotate-90 text-[#007CC3]" />
              ) : (
                <div className="flex flex-col gap-1 items-center justify-center">
                  <span className="h-0.5 w-5 rounded-full bg-[#007CC3] transition-all duration-300" />
                  <span className="h-0.5 w-4 rounded-full bg-emerald-600 transition-all duration-300" />
                  <span className="h-0.5 w-5 rounded-full bg-[#007CC3] transition-all duration-300" />
                </div>
              )}
            </button>

          </div>

        </div>


        {/* ==================================================
            MOBILE MENU
        ================================================== */}

        {mobileMenuOpen && (

          <div className="border-t border-emerald-100 bg-white/95 px-5 py-4 backdrop-blur-xl lg:hidden">

            <nav className="space-y-2">

              {navigation.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    activePath ===
                    item.path;


                  return (
                    <button
                      type="button"

                      key={
                        item.path
                      }

                      onClick={() =>
                        openPage(
                          item.path
                        )
                      }

                      className={
                        active
                          ? "flex w-full items-center gap-3 rounded-xl bg-emerald-100 px-4 py-3 text-left font-black text-emerald-800"
                          : "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-slate-600 hover:bg-emerald-50"
                      }
                    >

                      {Icon && (
                        <Icon
                          size={18}
                        />
                      )}

                      {
                        t(item.label)
                      }

                    </button>
                  );
                }
              )}


              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowProfileModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left font-extrabold text-emerald-800"
              >
                <User size={18} />
                <span>{t("My Profile & Account")}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-600 px-4 py-3 text-left font-black text-white hover:bg-red-700 shadow-xs"
              >
                <LogOut size={18} />
                <span>{t("Logout")}</span>
              </button>



            </nav>

          </div>

        )}

      </header>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 py-6 md:px-10 lg:px-12 lg:py-10 pb-24 lg:pb-10">



        {/* HERO */}

        <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white/75 p-7 shadow-[0_24px_80px_rgba(15,118,110,0.10)] backdrop-blur-xl lg:p-10">

          <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-emerald-100/80" />

          <div className="absolute bottom-0 right-32 h-32 w-32 translate-y-20 rounded-full bg-lime-100/80" />


          <div className="relative max-w-3xl">


            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">

              <Leaf
                size={15}
              />

              {
                t(badge)
              }

            </div>


            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">

              {
                t(title)
              }

            </h2>


            {subtitle && (

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 lg:text-lg">

                {
                  t(subtitle)
                }

              </p>

            )}


            {quote && (

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">

                <Sparkles
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-xs font-bold leading-relaxed text-emerald-900">
                  {t(quote)}
                </p>

              </div>

            )}


          </div>

        </section>


        {/* PAGE CONTENT */}

        <div className="mt-7">

          {
            children
          }

        </div>


        {/* FOOTER */}

        <footer className="mt-8 flex flex-col gap-4 rounded-[30px] border border-emerald-100 bg-gradient-to-r from-emerald-700 to-teal-700 p-7 text-white shadow-xl shadow-emerald-900/10 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-lg font-black">

              Aura Food

            </p>


            <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-50/80">

              Reducing food waste, improving surplus
              inventory management and connecting food
              with communities that need it.

            </p>

          </div>


          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">

            <Leaf
              size={24}
            />

          </div>

        </footer>

      </main>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-emerald-100 bg-white/95 px-2 py-2.5 shadow-[0_-10px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => {
            if (userRole === "INDIVIDUAL_DONOR") navigate("/individual");
            else if (userRole === "DONOR") navigate("/donor");
            else if (userRole === "NGO") navigate("/ngo");
            else if (userRole === "ADMIN") navigate("/admin");
            else if (userRole === "DELIVERY_PARTNER") navigate("/delivery/partner");
            else navigate("/login");
          }}
          className="flex flex-col items-center gap-1 p-1 text-slate-600 hover:text-emerald-700 active:scale-95 transition cursor-pointer"
        >
          <Leaf size={20} className="text-emerald-600" />
          <span className="text-[10px] font-black text-slate-800">{t("Home")}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="flex flex-col items-center gap-1 p-1 text-slate-600 hover:text-emerald-700 active:scale-95 transition cursor-pointer"
        >
          <User size={20} className="text-emerald-600" />
          <span className="text-[10px] font-black text-slate-800">{t("Profile")}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-1 text-red-600 hover:text-red-700 active:scale-95 transition cursor-pointer"
        >
          <LogOut size={20} className="text-red-600" />
          <span className="text-[10px] font-black text-red-600">{t("Logout")}</span>
        </button>
      </nav>

    </div>
  );
}