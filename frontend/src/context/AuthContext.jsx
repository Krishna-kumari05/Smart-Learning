import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sla_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("sla_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("sla_token", token);
    else localStorage.removeItem("sla_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("sla_user", JSON.stringify(user));
    else localStorage.removeItem("sla_user");
  }, [user]);

  function login(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
