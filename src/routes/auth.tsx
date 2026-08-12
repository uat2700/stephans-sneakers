import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession, useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Stephans Collection" },
      {
        name: "description",
        content:
          "Sign in to Stephans Collection to manage your profile, delivery details and sneaker orders.",
      },
      { property: "og:title", content: "Sign In — Stephans Collection" },
      {
        property: "og:description",
        content: "Sign in or create your Stephans Collection account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.3 7.3 0 0 1-11-3.8H1v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, user, loading } = useSession();
  const isAdmin = useIsAdmin(user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    if (!loading && session && isAdmin !== null) {
      void navigate({ to: isAdmin ? "/admin" : "/account", replace: true });
    }
  }, [loading, session, isAdmin, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else void navigate({ to: "/account", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      void navigate({ to: "/account", replace: true });
      return;
    }
    setSent("confirm");
  }

  async function google() {
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setSent("reset");
  }

  if (sent) {
    return (
      <div className="container-page max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {sent === "confirm"
            ? `We sent a confirmation link to ${email}. Click it to activate your account, then sign in.`
            : `We sent a password reset link to ${email}. Open it to choose a new password.`}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => setSent(null)}>
            Back to sign in
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/shop">Keep shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-md pb-24 pt-10 sm:py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to save your delivery details, track orders and keep your wishlist.
      </p>

      <Tabs defaultValue="signin" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 rounded-full">
          <TabsTrigger value="signin" className="rounded-full">
            Sign in
          </TabsTrigger>
          <TabsTrigger value="signup" className="rounded-full">
            Create account
          </TabsTrigger>
        </TabsList>

        {(["signin", "signup"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <form
              onSubmit={tab === "signin" ? signIn : signUp}
              className="mt-6 grid gap-4 rounded-3xl border border-border bg-card p-6"
            >
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-full"
                onClick={google}
              >
                <GoogleMark /> Continue with Google
              </Button>
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or email{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-email`}>Email</Label>
                <Input
                  id={`${tab}-email`}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-password`}>Password</Label>
                <Input
                  id={`${tab}-password`}
                  type="password"
                  autoComplete={
                    tab === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy} className="rounded-full">
                {busy
                  ? "Please wait…"
                  : tab === "signin"
                    ? "Sign in"
                    : "Create account"}
              </Button>
              {tab === "signin" ? (
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              ) : null}
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
