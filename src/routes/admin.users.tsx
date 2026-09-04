import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export const Route = createFileRoute("/admin/users")({
  component: () => <RequireRank min={4}>{() => <AdminUsersPanel />}</RequireRank>,
});
