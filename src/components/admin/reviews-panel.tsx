import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminReview = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  products: { name: string; slug: string } | null;
};

const FILTERS = [
  { id: "pending", label: "Awaiting approval" },
  { id: "approved", label: "Published" },
  { id: "all", label: "All" },
] as const;

export function ReviewsPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("pending");

  const reviews = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async (): Promise<AdminReview[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, product_id, author_name, rating, comment, is_approved, created_at, products ( name, slug )",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as AdminReview[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
    queryClient.invalidateQueries({ queryKey: ["product-ratings"] });
  };

  const setApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: approved ? "review.approve" : "review.reject",
        entity: "reviews",
        entityId: id,
      });
    },
    onSuccess: (_d, vars) => {
      refresh();
      toast.success(vars.approved ? "Review published" : "Review hidden");
    },
    onError: () => toast.error("Could not update the review"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      await logActivity({
        actorId: userId,
        action: "review.delete",
        entity: "reviews",
        entityId: id,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success("Review deleted");
    },
    onError: () => toast.error("Could not delete the review"),
  });

  const list = (reviews.data ?? []).filter((r) =>
    filter === "all" ? true : filter === "approved" ? r.is_approved : !r.is_approved,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === f.id
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reviews.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((review) => (
            <li
              key={review.id}
              className="rounded-3xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-semibold">
                    {review.products?.name ?? "Product removed"}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < review.rating
                            ? "fill-gold text-gold"
                            : "text-muted-foreground",
                        )}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {review.author_name} ·{" "}
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {review.is_approved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        setApproval.mutate({ id: review.id, approved: false })
                      }
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Hide
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        setApproval.mutate({ id: review.id, approved: true })
                      }
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete review"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (
                        window.confirm("Delete this review permanently?")
                      ) {
                        remove.mutate(review.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
