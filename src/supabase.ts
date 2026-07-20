import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

if (!supabaseConfigured) {
  console.warn(
    "Supabase n'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local.",
  );
}
