import { useOffline } from "../context/OfflineContext";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const { isOnline, lastSyncedText, pendingCount, syncPendingData } = useOffline();

  return (
    <div
      aria-label="Offline and sync status"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs transition-all duration-300 ${
        isOnline
          ? "border-emerald-200/90 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/80 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-200 animate-pulse"
      }`}
    >
      {/* STATUS DOT & ICON */}
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isOnline ? "animate-ping bg-emerald-400" : "animate-ping bg-amber-400"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isOnline ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
      </span>

      <span className="flex items-center gap-1.5 font-bold">
        {isOnline ? (
          <>
            <Wifi size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Offline</span>
          </>
        )}
      </span>

      <span className="opacity-40">•</span>

      {/* LAST SYNCED INFO */}
      <span className="truncate max-w-[180px] sm:max-w-none text-[11px]">
        {isOnline ? (
          `Last Synced: ${lastSyncedText}`
        ) : (
          <span>
            <span className="font-semibold text-amber-700 dark:text-amber-300 mr-1">Showing last synced data</span>
            (Last Synced: {lastSyncedText})
          </span>
        )}
      </span>

      {/* PENDING SYNC REPLAY BUTTON IF OFFLINE MUTATIONS EXIST */}
      {!isOnline && pendingCount > 0 && (
        <span className="ml-1 rounded-md bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 text-[10px] font-black text-amber-950 dark:text-amber-100">
          {pendingCount} pending
        </span>
      )}

      {isOnline && pendingCount > 0 && (
        <button
          type="button"
          onClick={syncPendingData}
          title="Sync pending changes now"
          className="ml-1 flex items-center gap-1 rounded-md bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950 hover:bg-emerald-300 transition cursor-pointer"
        >
          <RefreshCw size={10} className="animate-spin" />
          <span>Sync ({pendingCount})</span>
        </button>
      )}
    </div>
  );
}
