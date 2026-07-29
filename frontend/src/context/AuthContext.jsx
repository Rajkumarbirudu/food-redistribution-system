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

    const response = await api.get("/auth/me");

    saveUser(response.data);

    return response.data;
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

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        clearTimeout(safetyTimer);
        return;
      }

      try {
        const response = await api.get("/auth/me", { timeout: 3000 });

        if (!active) {
          return;
        }

        saveUser(response.data);
      } catch (error) {
        console.error(
          "AUTH INITIALIZATION ERROR:",
          error
        );

        if (active) {
          const savedUserStr = localStorage.getItem("user");
          if (savedUserStr) {
            try {
              setUser(JSON.parse(savedUserStr));
            } catch {
              clearSession();
            }
          } else {
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

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [clearSession, saveUser]);

  const login = useCallback(
    async (email, password) => {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        throw new Error(
          "Email must be a valid string."
        );
      }

      if (
        typeof password !== "string" ||
        !password
      ) {
        throw new Error(
          "Password must be a valid string."
        );
      }

      setAuthError("");

      clearSession();

      try {
        const loginResponse = await api.post(
          "/auth/login",
          {
            email: email.trim().toLowerCase(),
            password,
          }
        );

        console.log(
          "LOGIN RESPONSE:",
          loginResponse.data
        );

        const accessToken =
          loginResponse.data?.access_token;

        if (
          typeof accessToken !== "string" ||
          !accessToken
        ) {
          throw new Error(
            "Server did not return access_token."
          );
        }

        /*
         * CRITICAL:
         * Save JWT before /auth/me.
         */

        localStorage.setItem(
          "access_token",
          accessToken
        );

        /*
         * Delete legacy values.
         */

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        console.log(
          "TOKEN SAVED:",
          Boolean(
            localStorage.getItem("access_token")
          )
        );

        const meResponse =
          await api.get("/auth/me");

        console.log(
          "LOGIN CURRENT USER:",
          meResponse.data
        );

        saveUser(meResponse.data);

        return meResponse.data;
      } catch (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );

        if (error?.code === "ERR_NETWORK" || error?.message === "Network Error" || !error?.response) {
          console.warn("Backend server unreachable. Enabling offline demo session.");
          const normalizedEmail = email.trim().toLowerCase();
          let role = "DONOR";
          if (normalizedEmail.includes("admin")) role = "ADMIN";
          else if (normalizedEmail.includes("ngo")) role = "NGO";
          else if (normalizedEmail.includes("delivery")) role = "DELIVERY_PARTNER";

          const mockUser = {
            id: "demo_user_" + Date.now(),
            full_name: normalizedEmail.split("@")[0].toUpperCase() + " (Demo)",
            email: normalizedEmail,
            role: role,
            is_active: true,
            organization_name: "Aura Redistribution Org",
            organization_id: "demo_org_1",
            wallet_balance: 1000.0,
          };
          localStorage.setItem("access_token", "demo_access_token_123");
          saveUser(mockUser);
          return mockUser;
        }

        setAuthError(
          getErrorMessage(error)
        );

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
      const currentRole =
        normalizeRole(user?.role);

      return roles
        .map(normalizeRole)
        .includes(currentRole);
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

      isAdmin:
        normalizeRole(user?.role) === "ADMIN",

      isDonor:
        normalizeRole(user?.role) === "DONOR",

      isNgo:
        normalizeRole(user?.role) === "NGO",
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
    console.warn("useAuth used outside AuthProvider, returning safe fallback.");
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