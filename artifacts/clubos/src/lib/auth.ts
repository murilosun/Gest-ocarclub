import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

export function useAuth() {
  const [session, setSession] = useState<any>(undefined);
  const [profile, setProfile] = useState<any>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("app_users").select("*").eq("auth_user_id", userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session?.user?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      loadProfile(sess?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error, needsConfirmation: !error && !data.session };
  };

  const signOut = () => supabase.auth.signOut();

  return {
    session,
    profile,
    loading: session === undefined,
    signIn,
    signUp,
    signOut,
    reloadProfile: () => loadProfile(session?.user?.id),
  };
}
