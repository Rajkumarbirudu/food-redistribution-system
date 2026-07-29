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

    async function initializeAuth() {
      setLoading(true);

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        const response = await api.get("/auth/me");

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
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
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
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

export default AuthContext;