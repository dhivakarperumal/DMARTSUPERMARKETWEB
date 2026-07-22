import React, { createContext, useContext, useEffect, useState } from "react";

const defaultAuthValue = {
  user: null,
  setUser: () => {},
  login: () => {},
  logout: () => {},
  loading: false,
  loginOpen: false,
  setLoginOpen: () => {},
  profileName: "Admin",
  role: "admin",
  email: "",
  phone: "",
};

export const AuthContext = createContext(defaultAuthValue);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to parse stored user", error);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    const normalizedUser = userData || null;
    setUser(normalizedUser);
    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("user");
    }
    if (token) {
      localStorage.setItem("token", token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Map user data for Header/Sidebar compatibility
  const profileName = user?.username || user?.name || "Admin";
  const role = user?.role || "admin";
  const email = user?.email || "";
  const phone = user?.phone || "";

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        loginOpen,
        setLoginOpen,
        profileName,
        role,
        email,
        phone
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};