import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Stephans Collection" },
      {
        name: "description",
        content:
          "Sign in to track your sneaker orders and manage your details at Stephans Collection.",
      },
      { property: "og:title", content: "My Account — Stephans Collection" },
      { property: "og:description", content: "Track your sneaker orders." },
    ],
  }),
  component: Account,
});

function Account() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        My account
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Customer accounts and order tracking arrive in the next phase. Until then,
        every order is confirmed and tracked over WhatsApp.
      </p>
      <Button asChild className="mt-8 rounded-full">
        <Link to="/shop">Continue shopping</Link>
      </Button>
    </div>
  );
}
