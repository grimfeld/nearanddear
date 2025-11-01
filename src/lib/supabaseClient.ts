import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing Supabase credentials. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

let browserClient: SupabaseClient<Database, "public"> | null = null;

export const getSupabaseClient = () => {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient<Database, "public">(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    auth: {
      persistSession: true,
      storageKey: "mapri-auth",
    },
  });

  return browserClient;
};

export type SupabaseClientType = SupabaseClient<Database, "public">;

