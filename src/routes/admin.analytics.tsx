import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { DashboardPanel } from "@/components/admin/dashboard-panel";

export const Route = createFileRoute("/admin/analytics")({
  component: () => (
    <RequireRank min={3}>{() => <DashboardPanel showFinancials />}</RequireRank>
  ),
});
