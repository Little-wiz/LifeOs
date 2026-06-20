// src/context/AuthContext.jsx
//
// Keeps track of who is logged in, across the whole app.
// Any component can ask "who is the current user?" by using the
// useAuth() hook below, instead of passing user data through props.

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // When the app first loads, check if we already have a saved login.
  useEffect(() => {
    const savedUser = localStorage.getItem("lifeos_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  function login(token, userData) {
    localStorage.setItem("lifeos_token", token);
    localStorage.setItem("lifeos_user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("lifeos_token");
    localStorage.removeItem("lifeos_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook every component uses to access login state.
// Example: const { user, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
