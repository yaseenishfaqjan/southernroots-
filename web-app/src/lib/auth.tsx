import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  getToken,
  getStoredUser,
  setSession,
  type AuthUser,
} from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  // On mount, validate the stored token against the API.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((r) => setUser((prev) => ({ ...prev, ...r.user })))
      .catch(() => {
        setSession(null, null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API client drops us back to the login screen.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("srt:unauthorized", handler);
    return () => window.removeEventListener("srt:unauthorized", handler);
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const r = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    setSession(r.token, r.user);
    setUser(r.user);
  }

  function logout(): void {
    setSession(null, null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
