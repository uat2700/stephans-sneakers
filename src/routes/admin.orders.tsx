import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { OrdersPanel } from "@/components/admin/orders-panel";

export const Route = createFileRoute("/admin/orders")({
  component: () => (
    <RequireRank min={1}>{({ userId }) => <OrdersPanel userId={userId} />}</RequireRank>
  ),
});
