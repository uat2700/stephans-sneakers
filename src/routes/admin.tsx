import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Stephans Collection" },
      {
        name: "description",
        content:
          "Admin dashboard for managing the Stephans Collection sneaker catalogue.",
      },
      { property: "og:title", content: "Admin — Stephans Collection" },
      { property: "og:description", content: "Manage the sneaker catalogue." },
    ],
  }),
  component: Admin,
});

function Admin() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Admin dashboard
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Product upload, brand management and order tracking are next up. The database
        and image storage are already wired and waiting.
      </p>
      <Button asChild className="mt-8 rounded-full">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
