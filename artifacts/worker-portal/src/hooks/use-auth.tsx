import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  workerId: number | null;
  setWorkerId: (id: number | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [workerId, setWorkerIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("workerId");
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const setWorkerId = (id: number | null) => {
    if (id) {
      localStorage.setItem("workerId", id.toString());
    } else {
      localStorage.removeItem("workerId");
    }
    setWorkerIdState(id);
  };

  const logout = () => {
    localStorage.removeItem("workerId");
    setWorkerIdState(null);
  };

  return (
    <AuthContext.Provider value={{ workerId, setWorkerId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
