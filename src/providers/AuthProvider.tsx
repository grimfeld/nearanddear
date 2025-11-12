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
  // Helper to add timeout to promises
  const withTimeout = useCallback(<T,>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }, []);

  const ensureInvitesAccepted = useCallback(async () => {
    try {
      const { error } = await withTimeout(
        supabase.rpc("accept_map_invites"),
        10000, // 10 second timeout
        "accept_map_invites"
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to accept map invites", error);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("accept_map_invites timed out or failed", error);
    }
  }, [supabase, withTimeout]);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        10000, // 10 second timeout
        "loadProfile"
      );

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load profile", error);
        return;
      }

      setProfile(data ?? null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("loadProfile timed out or failed", error);
    }
  }, [supabase, withTimeout]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [loadProfile, user]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
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

        // Resolve loading state immediately after session is set
        // Don't block on profile/invites loading - they can load in background
        if (isMounted) {
          setLoading(false);
        }

        // Load profile and invites in background (don't block on these)
        if (initialSession?.user && isMounted) {
          // Run both operations in parallel, with timeouts
          // Promise.allSettled never rejects, so errors are already handled in the functions
          Promise.allSettled([
            loadProfile(initialSession.user.id),
            ensureInvitesAccepted(),
          ]);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error during session initialization", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          // Load profile and invites in parallel (non-blocking, with timeouts)
          // Errors are already handled within loadProfile and ensureInvitesAccepted
          Promise.allSettled([
            loadProfile(nextSession.user.id),
            ensureInvitesAccepted(),
          ]);
        } else {
          setProfile(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error during auth state change", error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, ensureInvitesAccepted, supabase]);

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

