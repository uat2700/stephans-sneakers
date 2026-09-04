import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { DashboardPanel } from "@/components/admin/dashboard-panel";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <RequireRank min={1}>
      {({ rank }) => <DashboardPanel showFinancials={rank >= 3} />}
    </RequireRank>
  ),
});
