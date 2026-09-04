import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { SettingsPanel } from "@/components/admin/settings-panel";

export const Route = createFileRoute("/admin/settings")({
  component: () => <RequireRank min={3}>{() => <SettingsPanel />}</RequireRank>,
});
