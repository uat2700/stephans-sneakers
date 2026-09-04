import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const Route = createFileRoute("/admin/taxonomy")({
  component: () => <RequireRank min={2}>{() => <TaxonomyManager />}</RequireRank>,
});
