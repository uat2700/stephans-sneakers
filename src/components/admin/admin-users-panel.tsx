import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  grantAdminRole,
  listAdminUsers,
  revokeAdminRole,
} from "@/lib/admin-users.functions";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/hooks/use-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const admins = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers(),
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");

  const grant = useMutation({
    mutationFn: () => grantAdminRole({ data: { email, role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      toast.success("Role granted");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not grant role"),
  });

  const revoke = useMutation({
    mutationFn: (vars: { user_id: string; role: AdminRole }) =>
      revokeAdminRole({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role removed");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not remove role"),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="font-display text-sm font-extrabold uppercase tracking-tight">
          Add a team member
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          They must already have a customer account with this email. Super Admin can
          manage admins, settings, payments and financials.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="teammate@email.com"
            className="h-10 min-w-[220px] flex-1 rounded-full"
          />
          <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
            <SelectTrigger className="h-10 w-[170px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="rounded-full"
            disabled={!email || grant.isPending}
            onClick={() => grant.mutate()}
          >
            {grant.isPending ? "Adding…" : "Grant access"}
          </Button>
        </div>
      </div>

      {admins.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {(admins.data ?? []).map((row) => (
            <li key={row.user_id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {row.full_name ?? row.email ?? "Team member"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {row.roles.map((r) => (
                  <span key={r} className="flex items-center gap-1">
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {ROLE_LABELS[r as AdminRole] ?? r}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label={`Remove ${r}`}
                      onClick={() =>
                        revoke.mutate({ user_id: row.user_id, role: r as AdminRole })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
