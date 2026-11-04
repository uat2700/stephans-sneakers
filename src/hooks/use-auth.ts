import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Read the persisted session straight from localStorage so a returning
 * signed-in user never sees a loading screen. The brokered preview storage
 * always mirrors the session into localStorage, and supabase-js stores it
 * under `sb-<project-ref>-auth-token`.
 */
function readCachedSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return null;
    const ref = new URL(url).hostname.split(".")[0];
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session | null;
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => readCachedSession());
  const [loading, setLoading] = useState(() => readCachedSession() === null);

  useEffect(() => {
    let done = false;
    const settle = (next: Session | null) => {
      done = true;
      setSession(next);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      settle(next);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => settle(data.session))
      .catch(() => settle(null));

    // Safety net: never leave the UI stuck on a loading state. The preview
    // session broker can take ~4.5s worst case, so allow 6s before giving up.
    const timer = window.setTimeout(() => {
      if (!done) setLoading(false);
    }, 6000);

    return () => {
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}


export function useIsAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(null);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return isAdmin;
}
