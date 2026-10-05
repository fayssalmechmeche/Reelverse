import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Me {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: Me | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Dernier utilisateur connu : sert à détecter un changement de compte.
  const lastUserId = useRef<number | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const me: Me = await res.json();
        // Changement de compte sans rechargement de page : on vide le cache
        // pour ne pas afficher les données (pseudo, avatar, inventaire...)
        // de l'utilisateur précédent.
        if (lastUserId.current !== null && lastUserId.current !== me.id) {
          queryClient.clear();
        }
        lastUserId.current = me.id;
        setUser(me);
      } else {
        lastUserId.current = null;
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    lastUserId.current = null;
    queryClient.clear();
    setUser(null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
