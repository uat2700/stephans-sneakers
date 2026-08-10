import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { reviewsQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

function Stars({
  value,
  onChange,
  size = "h-5 w-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const cls = cn(size, "text-primary", filled && "fill-current");
        if (!onChange) return <Star key={i} className={cls} aria-hidden="true" />;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            className="transition hover:scale-110"
          >
            <Star className={cls} />
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const reviews = useQuery(reviewsQuery(productId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = reviews.data ?? [];
  const count = rows.length;
  const average = count
    ? rows.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;

  const mine = useQuery({
    queryKey: ["my-review", productId, user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("product_id", productId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mine.data) {
      setRating(mine.data.rating);
      setComment(mine.data.comment ?? "");
    }
  }, [mine.data]);

  const submit = async () => {
    if (!user) return;
    if (rating < 1) return toast.error("Pick a star rating first");
    setSaving(true);
    const authorName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Customer";

    const { error } = mine.data
      ? await supabase
          .from("reviews")
          .update({ rating, comment: comment.trim() || null })
          .eq("id", mine.data.id)
      : await supabase.from("reviews").insert({
          product_id: productId,
          user_id: user.id,
          author_name: authorName,
          rating,
          comment: comment.trim() || null,
        });
    setSaving(false);

    if (error) return toast.error("Could not save your rating");
    toast.success(mine.data ? "Rating updated" : "Thanks for your rating!");
    void qc.invalidateQueries({ queryKey: ["reviews", productId] });
    void qc.invalidateQueries({ queryKey: ["my-review", productId] });
    void qc.invalidateQueries({ queryKey: ["review-stats"] });
  };

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
        Customer ratings
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-3xl font-extrabold leading-none">
            {count ? average.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {count
              ? `${count} rating${count > 1 ? "s" : ""}`
              : "No ratings yet"}
          </p>
        </div>
        <Stars value={average} />
      </div>

      <div className="mt-6 rounded-2xl border border-border p-5">
        {user ? (
          <div className="grid gap-3">
            <p className="text-sm font-semibold">
              {mine.data ? "Update your rating" : "Rate this sneaker"}
            </p>
            <Stars value={rating} onChange={setRating} size="h-7 w-7" />
            <Textarea
              rows={3}
              value={comment}
              placeholder="Share how the sneaker fits and feels (optional)"
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              className="w-fit rounded-full"
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving ? "Saving…" : mine.data ? "Update rating" : "Submit rating"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium underline">
              Sign in
            </Link>{" "}
            to rate this sneaker and leave a review.
          </p>
        )}
      </div>

      {count ? (
        <ul className="mt-6 grid gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{r.author_name}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1">
                <Stars value={r.rating} size="h-4 w-4" />
              </div>
              {r.comment ? (
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
