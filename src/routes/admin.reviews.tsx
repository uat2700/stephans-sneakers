import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { ReviewsPanel } from "@/components/admin/reviews-panel";

export const Route = createFileRoute("/admin/reviews")({
  component: () => (
    <RequireRank min={2}>{({ userId }) => <ReviewsPanel userId={userId} />}</RequireRank>
  ),
});
