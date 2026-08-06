import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getLastSyncTimestamp,
  formatSyncTimestamp,
  getPendingMutations,
  clearPendingMutations
} from "../utils/offlineDb";
import api from "../api/axios";

const OfflineContext = createContext({
  isOnline: true,
  lastSyncedText: "",
  pendingCount: 0,
  refreshLastSync: () => {},
  syncPendingData: async () => {},
});

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastSyncedText, setLastSyncedText] = useState(formatSyncTimestamp());
  const [pendingCount, setPendingCount] = useState(0);

  const refreshLastSync = useCallback(async () => {
    const timestamp = await getLastSyncTimestamp();
    if (timestamp) {
      setLastSyncedText(timestamp);
    }
  }, []);

  const syncPendingData = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      const pendingList = await getPendingMutations();
      if (pendingList && pendingList.length > 0) {
        console.log(`[SYNC] Replaying ${pendingList.length} queued offline mutations to backend...`);
        for (const item of pendingList) {
          try {
            await api.request({
              method: item.method,
              url: item.url,
              data: item.payload,
              headers: { "X-Replayed-Offline": "true" }
            });
          } catch (err) {
            console.warn("[SYNC] Mutation replay notice:", err);
          }
        }
        await clearPendingMutations();
        setPendingCount(0);
      }

      await refreshLastSync();

      // Dispatch global app sync event to refresh all open page views
      if (typeof window !== "undefined") {
        console.log("[SYNC] Network connection active. Dispatching app:online-sync event to refresh pages.");
        window.dispatchEvent(new CustomEvent("app:online-sync"));
      }
    } catch (err) {
      console.error("[SYNC ERROR] Failed during background offline data sync:", err);
    }
  }, [refreshLastSync]);

  useEffect(() => {
    refreshLastSync();

    const handleOnline = async () => {
      console.log("[NETWORK] Device back online. Triggering automatic data sync.");
      setIsOnline(true);
      await syncPendingData();
    };

    const handleOffline = () => {
      console.warn("[NETWORK] Device offline. Operating in Offline-First mode using local IndexedDB cache.");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check for pending items
    getPendingMutations().then((items) => {
      if (items) setPendingCount(items.length);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshLastSync, syncPendingData]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        lastSyncedText,
        pendingCount,
        refreshLastSync,
        syncPendingData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
