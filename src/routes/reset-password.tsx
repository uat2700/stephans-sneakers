import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — Stephans Collection" },
      {
        name: "description",
        content: "Choose a new password for your Stephans Collection account.",
      },
      { property: "og:title", content: "Reset Password — Stephans Collection" },
      {
        property: "og:description",
        content: "Set a new password for your Stephans Collection account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/account", replace: true });
  }

  return (
    <div className="container-page max-w-md pb-24 pt-10 sm:py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        New password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ready
          ? "Choose a new password for your account."
          : "Open this page from the reset link in your email to continue."}
      </p>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6"
      >
        <div className="grid gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy || !ready} className="rounded-full">
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
