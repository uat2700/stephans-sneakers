import { supabase } from "@/integrations/supabase/client";

export type ActivityEntry = {
  actorId: string;
  actorLabel?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

/** Best-effort audit trail write — never blocks the admin action. */
export async function logActivity(entry: ActivityEntry) {
  try {
    await supabase.from("admin_activity_log").insert({
      actor_id: entry.actorId,
      actor_label: entry.actorLabel ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      details: (entry.details ?? {}) as never,
    });
  } catch {
    /* audit logging must not break the UI */
  }
}
