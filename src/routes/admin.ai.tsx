import { createFileRoute } from "@tanstack/react-router";
import { RequireRank } from "@/components/admin/require-rank";
import { AiImport } from "@/components/admin/ai-import";

export const Route = createFileRoute("/admin/ai")({
  component: () => <RequireRank min={2}>{() => <AiImport />}</RequireRank>,
});
