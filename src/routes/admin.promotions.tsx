import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { PromotionsPanel } from "@/components/admin/promotions-panel";

export const Route = createFileRoute("/admin/promotions")({
  component: () => (
    <RequireRank min={2}>
      {({ userId }) => <PromotionsPanel userId={userId} />}
    </RequireRank>
  ),
});
