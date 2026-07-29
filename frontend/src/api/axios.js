import axios from "axios";

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
  timeout: 10000,

  headers: {
    Accept: "application/json",
    Connection: "keep-alive",
  },
});

api.interceptors.request.use(
  (config) => {
    /*
     * ONE TOKEN KEY ONLY.
     */

    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] =
        "application/json";
    }

    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL || ""}${config.url}`
    );

    console.log(
      "AUTH TOKEN ATTACHED:",
      Boolean(token)
    );

    console.log(
      "REQUEST DATA:",
      config.data
    );

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    console.error(
      "API ERROR STATUS:",
      error.response?.status
    );

    console.error(
      "API ERROR URL:",
      error.config?.url
    );

    console.error(
      "API ERROR DATA:",
      error.response?.data
    );

    /*
     * AUTOMATIC FALLBACK TO CLOUD BACKEND IF LOCAL BACKEND IS DOWN / UNREACHABLE
     */
    if (
      (error.code === "ERR_NETWORK" || !error.response) &&
      !error.config?._retriedWithFallback &&
      api.defaults.baseURL !== PRODUCTION_API_URL
    ) {
      console.warn("Local backend connection refused. Switching to cloud backend:", PRODUCTION_API_URL);
      api.defaults.baseURL = PRODUCTION_API_URL;
      const retryConfig = { ...error.config, baseURL: PRODUCTION_API_URL, _retriedWithFallback: true };
      return api.request(retryConfig);
    }

    /*
     * Clear token and redirect to login on 401 (Unauthorized)
     * EXCEPT when the 401 is from the login request itself.
     */
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;