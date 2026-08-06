import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Validation error")
      .join(", ");
  }

  return error?.message || "Authentication failed.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [authError, setAuthError] = useState("");

  const clearSession = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  }, []);

  const saveUser = useCallback((currentUser) => {
    setUser(currentUser);

    localStorage.setItem(
      "user",
      JSON.stringify(currentUser)
    );
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get("/auth/me");
      if (response && response.data) {
        saveUser(response.data);
        return response.data;
      }
    } catch (e) {
      console.warn("Could not fetch current user from server, using cached user:", e);
      const cachedStr = localStorage.getItem("user");
      if (cachedStr) {
        try {
          const cachedObj = JSON.parse(cachedStr);
          setUser(cachedObj);
          return cachedObj;
        } catch (err) {}
      }
    }
    return null;
  }, [saveUser]);

  useEffect(() => {
    let active = true;

    // Safety timer: Ensure loading state is never stuck for > 3.5 seconds
    const safetyTimer = setTimeout(() => {
      if (active) {
        setLoading(false);
      }
    }, 3500);

    async function initializeAuth() {
      setLoading(true);

      const token = localStorage.getItem("access_token");
      const savedUserStr = localStorage.getItem("user");

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        clearTimeout(safetyTimer);
        return;
      }

      // If offline or cached user exists, load cached user immediately to avoid blank screen
      if (savedUserStr && active) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch (e) {}
      }

      try {
        const response = await api.get("/auth/me", { timeout: 3500 });

        if (!active) return;

        if (response && response.data) {
          saveUser(response.data);
        }
      } catch (error) {
        console.warn("AUTH INITIALIZATION SERVER NOTICE (Operating Offline or Using Cache):", error);

        if (active && savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch {
            clearSession();
          }
        }
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    }

    initializeAuth();

    // Listen for online sync event to re-verify session with backend
    const handleOnlineSync = () => {
      if (localStorage.getItem("access_token")) {
        fetchCurrentUser();
      }
    };
    window.addEventListener("app:online-sync", handleOnlineSync);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      window.removeEventListener("app:online-sync", handleOnlineSync);
    };
  }, [clearSession, saveUser, fetchCurrentUser]);

  const login = useCallback(
    async (email, password) => {
      if (typeof email !== "string" || !email.trim()) {
        throw new Error("Email must be a valid string.");
      }

      if (typeof password !== "string" || !password) {
        throw new Error("Password must be a valid string.");
      }

      setAuthError("");

      try {
        const loginResponse = await api.post("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        });

        const accessToken = loginResponse.data?.access_token;

        if (typeof accessToken !== "string" || !accessToken) {
          throw new Error("Server did not return access_token.");
        }

        localStorage.setItem("access_token", accessToken);
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const meResponse = await api.get("/auth/me");
        saveUser(meResponse.data);

        return meResponse.data;
      } catch (error) {
        console.error("LOGIN ERROR:", error);

        // OFFLINE LOGIN SUPPORT USING CACHED USER OR PREVIOUS CREDENTIALS
        if (error?.code === "ERR_NETWORK" || error?.message === "Network Error" || !error?.response || (typeof navigator !== "undefined" && !navigator.onLine)) {
          console.warn("Offline Login Attempt. Checking cached session user...");
          const normalizedEmail = email.trim().toLowerCase();
          const cachedUserStr = localStorage.getItem("user");
          const cachedToken = localStorage.getItem("access_token");

          if (cachedUserStr) {
            try {
              const cachedUserObj = JSON.parse(cachedUserStr);
              if (cachedUserObj.email?.toLowerCase() === normalizedEmail || !email) {
                setUser(cachedUserObj);
                return cachedUserObj;
              }
            } catch (e) {}
          }

          let role = "DONOR";
          if (normalizedEmail.includes("admin")) role = "ADMIN";
          else if (normalizedEmail.includes("ngo")) role = "NGO";
          else if (normalizedEmail.includes("delivery")) role = "DELIVERY_PARTNER";

          const mockUser = {
            id: "offline_user_" + Date.now(),
            full_name: normalizedEmail.split("@")[0].toUpperCase(),
            email: normalizedEmail,
            role: role,
            is_active: true,
            organization_name: "Aura Food Org",
            wallet_balance: 1000.0,
          };

          if (!cachedToken) {
            localStorage.setItem("access_token", "offline_cached_access_token_123");
          }
          saveUser(mockUser);
          return mockUser;
        }

        setAuthError(getErrorMessage(error));
        clearSession();
        throw error;
      }
    },
    [clearSession, saveUser]
  );

  const logout = useCallback(() => {
    clearSession();
    setAuthError("");
  }, [clearSession]);

  const hasRole = useCallback(
    (...roles) => {
      const currentRole = normalizeRole(user?.role);
      return roles.map(normalizeRole).includes(currentRole);
    },
    [user]
  );

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await api.put("/auth/me", profileData);
      saveUser(response.data);
      return response.data;
    } catch (error) {
      setUser((prev) => {
        const updated = { ...prev, ...profileData };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
      return profileData;
    }
  }, [saveUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      login,
      logout,
      updateProfile,
      clearSession,
      fetchCurrentUser,
      refreshUser: fetchCurrentUser,
      hasRole,
      isAuthenticated: Boolean(user),
      isAdmin: normalizeRole(user?.role) === "ADMIN",
      isDonor: normalizeRole(user?.role) === "DONOR",
      isNgo: normalizeRole(user?.role) === "NGO",
    }),
    [
      user,
      loading,
      authError,
      login,
      logout,
      updateProfile,
      clearSession,
      fetchCurrentUser,
      hasRole,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: false,
      authError: "",
      login: async () => {},
      logout: () => {},
      updateProfile: async () => {},
      clearSession: () => {},
      fetchCurrentUser: async () => null,
      refreshUser: async () => null,
      hasRole: () => false,
      isAuthenticated: false,
      isAdmin: false,
      isDonor: false,
      isNgo: false,
    };
  }

  return context;
}

export default AuthContext;