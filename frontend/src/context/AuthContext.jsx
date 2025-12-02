// src/context/AuthProvider.jsx
import React, { useState, useEffect, createContext } from "react";
import { loginUser } from "../api/auth";

export const AuthContext = createContext(null);

let logoutTimer;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const getTokenExpiration = (jwt) => {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      return payload.exp * 1000;
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    if (logoutTimer) clearTimeout(logoutTimer);
  };

  const scheduleLogout = (expiryTime) => {
    const now = Date.now();
    const delay = expiryTime - now;
    if (delay <= 0) {
      handleLogout();
      return;
    }
    logoutTimer = setTimeout(handleLogout, delay);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedRole) {
      const expiry = getTokenExpiration(savedToken);
      if (!expiry || expiry <= Date.now()) {
        handleLogout();
      } else {
        setToken(savedToken);
        setRole(savedRole);
        setUser(savedUser ? JSON.parse(savedUser) : null);
        scheduleLogout(expiry);
      }
    }
    return () => clearTimeout(logoutTimer);
  }, []);

  const handleLogin = async (name, password) => {
    try {
      setLoading(true);
      const response = await loginUser(name, password);
      const { token, role } = response.data;
      const expiry = getTokenExpiration(token);

      setToken(token);
      setRole(role);
      setUser({ name });

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify({ name }));

      if (expiry) scheduleLogout(expiry);

      return { success: true, role };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || "Invalid credentials",
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        loading,
        handleLogin,
        handleLogout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
