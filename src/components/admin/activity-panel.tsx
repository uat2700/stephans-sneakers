import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LogRow = {
  id: string;
  actor_label: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
};

export function ActivityPanel() {
  const logs = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async (): Promise<LogRow[]> => {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("id, actor_label, action, entity, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (logs.isLoading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!logs.data?.length) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="font-display text-lg font-bold uppercase tracking-tight">
          No activity yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin actions such as price changes and order updates will be recorded here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
      {logs.data.map((log) => (
        <li key={log.id} className="flex items-start gap-3 p-4">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground">
            <Activity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{log.action}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {log.actor_label ?? "Team member"} ·{" "}
              {new Date(log.created_at).toLocaleString()}
              {log.entity ? ` · ${log.entity}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
