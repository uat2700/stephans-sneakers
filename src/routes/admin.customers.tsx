import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { CustomersPanel } from "@/components/admin/customers-panel";

export const Route = createFileRoute("/admin/customers")({
  component: () => <RequireRank min={2}>{() => <CustomersPanel />}</RequireRank>,
});
