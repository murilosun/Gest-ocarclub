import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "./apiClient";

export interface AuthUser {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
}

export function useAuth() {
  // undefined = still loading; null = not logged in; object = logged in
  const [user, setUser] = useState<null | undefined | AuthUser>(undefined);

  const loadMe = useCallback(async () => {
    try {
      const res = await apiGet("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const signIn = async (email: string, password: string) => {
    const res = await apiPost("/auth/login", { email, password });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      return null; // no error
    }
    const err = await res.json().catch(() => ({ error: "Erro ao conectar" }));
    return { message: err.error ?? "Credenciais inválidas" };
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const res = await apiPost("/auth/register", { email, password, name, role });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      return { error: null, needsConfirmation: false };
    }
    const err = await res.json().catch(() => ({ error: "Erro ao criar conta" }));
    return { error: { message: err.error ?? "Erro ao criar conta" }, needsConfirmation: false };
  };

  const signOut = async () => {
    await apiPost("/auth/logout", {});
    setUser(null);
  };

  return {
    session: user,          // truthy when logged in (keeps same interface as before)
    profile: user ?? null,  // same object — has name, role, email, companyId
    loading: user === undefined,
    signIn,
    signUp,
    signOut,
    reloadProfile: loadMe,
  };
}
