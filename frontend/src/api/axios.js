import axios from "axios";
import { saveApiCache, getApiCache, queueOfflineMutation } from "../utils/offlineDb";

const PRODUCTION_API_URL = "https://food-redistribution-system-jk0k.onrender.com";

const isLocalHost = (host) => {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.") ||
    host.endsWith(".local")
  );
};

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const hostname = typeof window !== "undefined" && window.location ? window.location.hostname : "localhost";
  if (isLocalHost(hostname)) {
    return `http://${hostname}:8000`;
  }
  return PRODUCTION_API_URL;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    /*
     * ONE TOKEN KEY ONLY.
     */
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    // Generate unique cache key for GET requests
    const cacheKey = `${config.method?.toUpperCase() || "GET"}:${config.url}${
      config.params ? `?${new URLSearchParams(config.params).toString()}` : ""
    }`;
    config._cacheKey = cacheKey;

    // OFFLINE INTERCEPTION FOR GET REQUESTS
    if (config.method?.toUpperCase() === "GET" && typeof navigator !== "undefined" && !navigator.onLine) {
      console.warn(`[OFFLINE] Device offline. Fetching from IndexedDB cache: ${config.url}`);
      const cached = await getApiCache(cacheKey);
      if (cached !== null && cached !== undefined) {
        config.adapter = async () => ({
          data: cached,
          status: 200,
          statusText: "OK (Offline Cache)",
          headers: { "x-offline-cache": "true" },
          config,
        });
      }
    }

    // OFFLINE INTERCEPTION FOR MUTATIONS (POST / PUT / DELETE)
    if (
      config.method?.toUpperCase() !== "GET" &&
      typeof navigator !== "undefined" &&
      !navigator.onLine &&
      !config.headers["X-Replayed-Offline"]
    ) {
      console.warn(`[OFFLINE] Device offline. Queuing mutation for sync: ${config.url}`);
      await queueOfflineMutation(config.method, config.url, config.data);
      config.adapter = async () => ({
        data: { message: "Saved locally. Will automatically sync when connection returns.", offline: true },
        status: 200,
        statusText: "OK (Queued Offline)",
        headers: { "x-offline-queued": "true" },
        config,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  async (response) => {
    // On successful GET response, save to IndexedDB cache
    if (response.config?.method?.toUpperCase() === "GET" && response.config?._cacheKey && response.status === 200) {
      saveApiCache(response.config._cacheKey, response.data).catch(() => {});
    }

    return response;
  },

  async (error) => {
    const config = error.config;

    // If request failed due to network error or server down, attempt IndexedDB cache fallback for GET requests
    if (
      config?.method?.toUpperCase() === "GET" &&
      (error.code === "ERR_NETWORK" || !error.response || error.code === "ECONNABORTED")
    ) {
      console.warn(`[OFFLINE FALLBACK] Network request failed for ${config.url}. Trying IndexedDB cache fallback...`);
      const cacheKey = config._cacheKey || `GET:${config.url}`;
      const cachedData = await getApiCache(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        console.log(`[OFFLINE FALLBACK SUCCESS] Loaded cached data for ${config.url}`);
        return {
          data: cachedData,
          status: 200,
          statusText: "OK (Offline Fallback Cache)",
          headers: { "x-offline-fallback": "true" },
          config,
        };
      }
    }

    /*
     * AUTOMATIC FALLBACK TO CLOUD BACKEND IF LOCAL BACKEND IS DOWN / UNREACHABLE
     */
    if (
      (error.code === "ERR_NETWORK" || !error.response) &&
      !config?._retriedWithFallback &&
      api.defaults.baseURL !== PRODUCTION_API_URL
    ) {
      console.warn("Local backend connection refused. Switching to cloud backend:", PRODUCTION_API_URL);
      api.defaults.baseURL = PRODUCTION_API_URL;
      const retryConfig = { ...config, baseURL: PRODUCTION_API_URL, _retriedWithFallback: true };
      return api.request(retryConfig);
    }

    /*
     * Clear token and redirect to login on 401 (Unauthorized)
     * EXCEPT when the 401 is from the login request itself.
     */
    if (error.response?.status === 401 && !config?.url?.includes("/auth/login")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;