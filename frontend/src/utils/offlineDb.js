/**
 * Aura Food - Enterprise IndexedDB Offline Storage & Caching Engine
 */

const DB_NAME = "AuraFoodOfflineDB";
const DB_VERSION = 1;

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. API Cache Store (Key-Value)
      if (!db.objectStoreNames.contains("api_cache")) {
        db.createObjectStore("api_cache", { keyPath: "key" });
      }

      // 2. Metadata Store (Last Synced Time, etc.)
      if (!db.objectStoreNames.contains("sync_meta")) {
        db.createObjectStore("sync_meta", { keyPath: "key" });
      }

      // 3. Pending Offline Mutations Store
      if (!db.objectStoreNames.contains("pending_mutations")) {
        db.createObjectStore("pending_mutations", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB Open Error:", event.target.error);
      resolve(null);
    };
  });

  return dbPromise;
}

/**
 * Formats a Date object into a readable string: "06 Aug 2026, 7:30 PM"
 */
export function formatSyncTimestamp(dateObj = new Date()) {
  try {
    const day = String(dateObj.getDate()).padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return new Date().toLocaleTimeString();
  }
}

/**
 * Saves API response data to IndexedDB cache & updates last synced timestamp.
 */
export async function saveApiCache(key, data) {
  const db = await openDatabase();
  if (!db) {
    // Fallback to localStorage if IndexedDB is unavailable
    try {
      localStorage.setItem(`offline_cache_${key}`, JSON.stringify(data));
      localStorage.setItem("last_synced_timestamp", formatSyncTimestamp());
    } catch (e) {}
    return;
  }

  const nowFormatted = formatSyncTimestamp();

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(["api_cache", "sync_meta"], "readwrite");
      const cacheStore = tx.objectStore("api_cache");
      const metaStore = tx.objectStore("sync_meta");

      cacheStore.put({ key, data, timestamp: new Date().toISOString() });
      metaStore.put({ key: "last_synced", value: nowFormatted, iso: new Date().toISOString() });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Retrieves cached API response data from IndexedDB.
 */
export async function getApiCache(key) {
  const db = await openDatabase();
  if (!db) {
    try {
      const raw = localStorage.getItem(`offline_cache_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("api_cache", "readonly");
      const store = tx.objectStore("api_cache");
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Retrieves last sync timestamp string.
 */
export async function getLastSyncTimestamp() {
  const db = await openDatabase();
  if (!db) {
    return localStorage.getItem("last_synced_timestamp") || formatSyncTimestamp();
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("sync_meta", "readonly");
      const store = tx.objectStore("sync_meta");
      const request = store.get("last_synced");

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve(request.result.value);
        } else {
          resolve(localStorage.getItem("last_synced_timestamp") || formatSyncTimestamp());
        }
      };

      request.onerror = () => {
        resolve(formatSyncTimestamp());
      };
    } catch (e) {
      resolve(formatSyncTimestamp());
    }
  });
}

/**
 * Queues a POST/PUT/DELETE request for background syncing when connection returns.
 */
export async function queueOfflineMutation(method, url, payload) {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("pending_mutations", "readwrite");
      const store = tx.objectStore("pending_mutations");
      store.add({
        method: method.toUpperCase(),
        url,
        payload,
        timestamp: new Date().toISOString(),
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Retrieves all pending offline mutations.
 */
export async function getPendingMutations() {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("pending_mutations", "readonly");
      const store = tx.objectStore("pending_mutations");
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Clears pending offline mutations after successful replay.
 */
export async function clearPendingMutations() {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("pending_mutations", "readwrite");
      const store = tx.objectStore("pending_mutations");
      store.clear();

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
