import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveSetting } from "@/lib/settings";
import {
  homepageSettingsQuery,
  type HomepageSettings,
} from "@/lib/store-settings";
import { ContentPanel } from "@/components/admin/content-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SECTIONS: Array<{ key: keyof HomepageSettings; label: string }> = [
  { key: "show_banners", label: "Promo banners" },
  { key: "show_categories", label: "Shop by category" },
  { key: "show_brands", label: "Shop by brand" },
  { key: "show_flash_sale", label: "Flash sale" },
  { key: "show_featured", label: "Featured products" },
  { key: "show_new", label: "New arrivals" },
  { key: "show_best_sellers", label: "Best sellers" },
  { key: "show_trending", label: "Trending sneakers" },
  { key: "show_testimonials", label: "Customer reviews strip" },
  { key: "show_instagram", label: "Instagram gallery" },
  { key: "show_newsletter", label: "Newsletter signup" },
];

export function HomepagePanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const homepage = useQuery(homepageSettingsQuery());
  const [draft, setDraft] = useState<HomepageSettings | null>(null);

  useEffect(() => {
    if (homepage.data && !draft) setDraft(homepage.data);
  }, [homepage.data, draft]);

  const save = useMutation({
    mutationFn: async (value: HomepageSettings) => saveSetting("homepage", value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Homepage updated");
    },
    onError: () => toast.error("Could not save the homepage"),
  });

  if (!draft) {
    return <p className="text-sm text-muted-foreground">Loading homepage…</p>;
  }

  return (
    <div className="max-w-3xl space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Hero
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs" htmlFor="hero-title">
              Headline (line 1)
            </Label>
            <Input
              id="hero-title"
              value={draft.hero_title}
              onChange={(e) => setDraft({ ...draft, hero_title: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="hero-subtitle">
              Headline (line 2)
            </Label>
            <Input
              id="hero-subtitle"
              value={draft.hero_subtitle}
              onChange={(e) => setDraft({ ...draft, hero_subtitle: e.target.value })}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs" htmlFor="hero-note">
              Supporting line
            </Label>
            <Input
              id="hero-note"
              value={draft.hero_note}
              onChange={(e) => setDraft({ ...draft, hero_note: e.target.value })}
              placeholder="Leave empty to use the store tagline"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          Sections shown to customers
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li
              key={section.key}
              className="flex items-center justify-between rounded-2xl border border-border px-3 py-2.5"
            >
              <span className="text-sm">{section.label}</span>
              <Switch
                checked={Boolean(draft[section.key])}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, [section.key]: checked })
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <Button
        className="rounded-full"
        disabled={save.isPending}
        onClick={() => save.mutate(draft)}
      >
        {save.isPending ? "Saving…" : "Save homepage"}
      </Button>

      <ContentPanel userId={userId} />
    </div>
  );
}
