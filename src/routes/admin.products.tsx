import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { ProductsPanel } from "@/components/admin/products-panel";

export const Route = createFileRoute("/admin/products")({
  component: () => (
    <RequireRank min={2}>
      {({ userId }) => <ProductsPanel userId={userId} />}
    </RequireRank>
  ),
});
