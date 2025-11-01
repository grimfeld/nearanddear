import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import type { Profile } from "@/types/models";
import { useSupabase } from "@/providers/SupabaseProvider";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load profile", error);
      return;
    }

    setProfile(data ?? null);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [loadProfile, user]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      setLoading(true);
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to get session", error);
      }

      setSession(initialSession ?? null);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await loadProfile(initialSession.user.id);
      }

      setLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

