import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { getSupabaseClient, type SupabaseClientType } from "@/lib/supabaseClient";

const SupabaseContext = createContext<SupabaseClientType | null>(null);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(() => getSupabaseClient());
  const value = useMemo(() => client, [client]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
};

