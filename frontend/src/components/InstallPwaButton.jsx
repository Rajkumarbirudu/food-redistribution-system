import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, CheckCircle, Monitor, Globe, Share } from "lucide-react";
import { useTranslation } from "../context/LanguageContext";


export default function InstallPwaButton({ variant = "default" }) {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if running inside standalone PWA window
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowModal(true);
    }
  }

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* ALWAYS VISIBLE INSTALL APP BUTTON */}
      <button
        type="button"
        onClick={handleInstallClick}
        title={t("Install Aura Food App")}
        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition-all duration-200 shadow-sm cursor-pointer border ${
          variant === "glass"
            ? "border-sky-400/50 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 backdrop-blur-md"
            : "border-sky-300 bg-sky-600 text-white hover:bg-sky-700 shadow-sky-600/20"
        }`}
      >
        <Download size={15} className="animate-bounce shrink-0 text-white" />
        <span className="whitespace-nowrap">{t("Install App")}</span>
      </button>

      {/* PWA INSTALL INSTRUCTIONS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t("Install Aura Food App")}</h3>
                  <p className="text-xs font-bold text-sky-700">{t("Fast, standalone & works offline")}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-bold text-sky-900 flex items-center gap-2">
                  <Globe size={17} className="text-sky-600 shrink-0" />
                  <span><strong>Chrome / Edge (Desktop):</strong> Click the <strong>Install Icon (⊕)</strong> on the right side of your browser address bar.</span>
                </p>
              </div>


              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Smartphone size={17} className="text-sky-600 shrink-0" />
                  <span><strong>Android:</strong> Tap browser menu <strong>(⋮)</strong> and select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Share size={17} className="text-sky-600 shrink-0" />
                  <span><strong>iOS / Safari:</strong> Tap the <strong>Share button</strong> and select <strong>"Add to Home Screen"</strong>.</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-black text-white hover:bg-sky-700 transition shadow-md shadow-sky-600/20"
              >
                {t("Got It!")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
