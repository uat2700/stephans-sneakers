import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { HomepagePanel } from "@/components/admin/homepage-panel";

export const Route = createFileRoute("/admin/homepage")({
  component: () => (
    <RequireRank min={2}>{({ userId }) => <HomepagePanel userId={userId} />}</RequireRank>
  ),
});
