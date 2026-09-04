import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  position: number;
};

const bannersQueryKey = ["admin", "banners"];

function useBanners() {
  return useQuery({
    queryKey: bannersQueryKey,
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link_url,is_active,position")
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function BannerImageButton({
  banner,
  onDone,
}: {
  banner: Banner;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadProductImage(file);
      const { error } = await supabase
        .from("banners")
        .update({ image_url: url })
        .eq("id", banner.id);
      if (error) throw error;
      onDone();
      toast.success("Banner image updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        aria-label={`Change image for ${banner.title}`}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface text-muted-foreground transition-colors hover:border-foreground"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
    </>
  );
}

export function ContentPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const banners = useBanners();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: bannersQueryKey });
    queryClient.invalidateQueries({ queryKey: ["banners"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const clean = title.trim();
      if (!clean) throw new Error("Add a headline first");
      const nextPosition = (banners.data?.length ?? 0) + 1;
      const { error } = await supabase.from("banners").insert({
        title: clean,
        subtitle: subtitle.trim() || null,
        link_url: link.trim() || null,
        position: nextPosition,
        is_active: true,
      });
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "banner.create",
        entity: "banners",
        details: { title: clean },
      });
    },
    onSuccess: () => {
      setTitle("");
      setSubtitle("");
      setLink("");
      refresh();
      toast.success("Banner added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add banner"),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Banner, "is_active" | "position" | "title" | "subtitle" | "link_url">>;
    }) => {
      const { error } = await supabase.from("banners").update(patch).eq("id", id);
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "banner.update",
        entity: "banners",
        entityId: id,
        details: patch,
      });
    },
    onSuccess: refresh,
    onError: () => toast.error("Could not update banner"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "banner.delete",
        entity: "banners",
        entityId: id,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success("Banner removed");
    },
    onError: () => toast.error("Could not remove banner"),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-tight">
          New promo banner
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Banners can be shown on the storefront home page. Add the copy, then upload
          an image on the card below.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs" htmlFor="banner-title">
              Headline
            </Label>
            <Input
              id="banner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mid-season drop"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="banner-subtitle">
              Subtitle
            </Label>
            <Input
              id="banner-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Up to 30% off select pairs"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="banner-link">
              Link
            </Label>
            <Input
              id="banner-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/shop"
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>
        <Button
          className="mt-4 rounded-full"
          disabled={create.isPending}
          onClick={() => create.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" /> {create.isPending ? "Adding…" : "Add banner"}
        </Button>
      </section>

      <section className="space-y-3">
        {banners.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading banners…</p>
        ) : (banners.data?.length ?? 0) === 0 ? (
          <p className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No banners yet.
          </p>
        ) : (
          banners.data!.map((banner) => (
            <div
              key={banner.id}
              className="flex flex-wrap items-start gap-4 rounded-3xl border border-border bg-card p-4"
            >
              <BannerImageButton banner={banner} onDone={refresh} />
              <div className="min-w-[180px] flex-1 space-y-1">
                <p className="font-semibold">{banner.title}</p>
                {banner.subtitle ? (
                  <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
                ) : null}
                {banner.link_url ? (
                  <p className="text-[11px] text-muted-foreground">→ {banner.link_url}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Order
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={banner.position}
                    onChange={(e) =>
                      update.mutate({
                        id: banner.id,
                        patch: { position: Number(e.target.value) || 1 },
                      })
                    }
                    className="mt-1 h-9 rounded-xl"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Live
                  </Label>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) =>
                      update.mutate({ id: banner.id, patch: { is_active: checked } })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${banner.title}`}
                  onClick={() => remove.mutate(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
