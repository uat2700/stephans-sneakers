import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { InventoryPanel } from "@/components/admin/inventory-panel";

export const Route = createFileRoute("/admin/inventory")({
  component: () => (
    <RequireRank min={1}>
      {({ userId }) => <InventoryPanel userId={userId} />}
    </RequireRank>
  ),
});
