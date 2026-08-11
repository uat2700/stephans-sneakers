import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Safety net: never leave the UI stuck on a loading state.
    const timer = window.setTimeout(() => {
      if (!done) setLoading(false);
    }, 4000);

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
