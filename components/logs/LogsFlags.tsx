import Link from "next/link";
import {
  ShieldAlert,
  UserX,
  Crown,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { LogFlags } from "@/data/logs-page";

interface FlagCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
  severity: "critical" | "warning" | "info";
}

function FlagCard({ icon, label, count, href, severity }: FlagCardProps) {
  const hasItems = count > 0;

  const severityColors = {
    critical: hasItems
      ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
      : "border-border bg-card",
    warning: hasItems
      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30"
      : "border-border bg-card",
    info: hasItems
      ? "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30"
      : "border-border bg-card",
  };

  const iconColors = {
    critical: hasItems ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
    warning: hasItems ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground",
    info: hasItems ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground",
  };

  const countColors = {
    critical: hasItems ? "text-red-700 dark:text-red-300" : "text-muted-foreground",
    warning: hasItems ? "text-yellow-700 dark:text-yellow-300" : "text-muted-foreground",
    info: hasItems ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground",
  };

  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${severityColors[severity]} ${
        hasItems ? "hover:shadow-md cursor-pointer" : "opacity-60"
      }`}
    >
      <div className={iconColors[severity]}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${countColors[severity]}`}>
        {count}
      </div>
    </div>
  );

  if (!hasItems) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

interface LogsFlagsProps {
  flags: LogFlags;
}

export function LogsFlags({ flags }: LogsFlagsProps) {
  const totalFlags =
    flags.failedLogins +
    flags.unauthorizedAttempts +
    flags.roleEscalations +
    flags.bulkUpdates +
    flags.errors;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Flagged Activity</h2>
        {totalFlags > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalFlags} event{totalFlags !== 1 ? "s" : ""} flagged
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FlagCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Failed Logins"
          count={flags.failedLogins}
          href="/logs?entityType=session&search=Failed"
          severity="critical"
        />
        <FlagCard
          icon={<UserX className="h-5 w-5" />}
          label="Unauthorized"
          count={flags.unauthorizedAttempts}
          href="/logs?search=Unauthorized"
          severity="critical"
        />
        <FlagCard
          icon={<Crown className="h-5 w-5" />}
          label="Role Escalations"
          count={flags.roleEscalations}
          href="/logs?entityType=user&search=admin"
          severity="warning"
        />
        <FlagCard
          icon={<Users className="h-5 w-5" />}
          label="Bulk Updates"
          count={flags.bulkUpdates}
          href="/logs?entityType=bulk-status-update"
          severity="info"
        />
        <FlagCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Errors"
          count={flags.errors}
          href="/logs?search=Failed"
          severity="warning"
        />
      </div>
    </div>
  );
}
