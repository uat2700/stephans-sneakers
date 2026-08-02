import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) {
      toast.error("Could not subscribe", { description: error.message });
      return;
    }
    setEmail("");
    toast.success("You're on the list", {
      description: "We'll send new drops and flash sales first.",
    });
  }

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 sm:p-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Newsletter
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            Get drops before they sell out
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One short email per drop — new arrivals, restocks and flash sale codes.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="h-12 rounded-full"
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-12 shrink-0 rounded-full px-7"
          >
            {busy ? "Joining…" : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
