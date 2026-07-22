import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://fsmcobjzmgqvgbrovzrm.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_GPc-Avp6vA-rgBiIVcV5gQ_4MDOV1iW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const COMPANY_ID = "6ffdf608-cad8-4d35-b6a7-ee329e6737cb";
