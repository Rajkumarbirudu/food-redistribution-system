import React, { useEffect, useState } from "react";
import { Leaf, Cpu, Globe, RefreshCw } from "lucide-react";

export default function BootSplash({ message = "Booting Aura Food Network..." }) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState("Initializing system core...");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText("Connecting AI Redistribution Engine...");
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText("Syncing inventory metrics...");
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText("System Ready");
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#051218] px-5 font-sans overflow-hidden">
      {/* AMBIENT BACKGROUND GLOW ORBS */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-sky-500/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[500px] w-[500px] rounded-full bg-[#0284C7]/20 blur-3xl animate-pulse" />

      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-sky-950/80 bg-[#081A23]/90 p-8 text-center shadow-[0_25px_90px_rgba(14,165,233,0.2)] backdrop-blur-2xl">
        {/* LOGO ICON WITH ROTATING RINGS */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-sky-500 via-blue-400 to-[#0284C7] opacity-30 blur-md animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xl shadow-sky-500/30">
            <Leaf size={32} className="animate-bounce" />
          </div>
        </div>

        {/* APP TITLE */}
        <h1 className="mt-5 text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          Aura Food
          <Globe size={18} className="text-[#38BDF8] animate-pulse" />
        </h1>
        <p className="text-xs font-bold text-sky-400 tracking-wider uppercase mt-1">
          Smart Food Redistribution System
        </p>

        {/* PROGRESS BAR */}
        <div className="mt-8">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-sky-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-[#0EA5E9] to-[#0284C7] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Cpu size={13} className="animate-spin" />
              {statusText}
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* MANUAL RECOVERY BUTTON */}
        <button
          type="button"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#38BDF8] transition underline cursor-pointer"
        >
          <RefreshCw size={12} />
          Click to reset session & force load
        </button>
      </div>
    </main>
  );
}
