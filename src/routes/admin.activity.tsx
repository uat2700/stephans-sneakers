import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { ActivityPanel } from "@/components/admin/activity-panel";

export const Route = createFileRoute("/admin/activity")({
  component: () => <RequireRank min={4}>{() => <ActivityPanel />}</RequireRank>,
});
