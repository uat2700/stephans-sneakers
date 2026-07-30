import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Stephans Collection" },
      {
        name: "description",
        content:
          "Sign in to the Stephans Collection dashboard to manage sneakers, brands and stock.",
      },
      { property: "og:title", content: "Sign In — Stephans Collection" },
      {
        property: "og:description",
        content: "Access the Stephans Collection dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/admin" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created. You can sign in now.");
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Dashboard access
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to manage the Stephans Collection catalogue.
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
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
