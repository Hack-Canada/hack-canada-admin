import { RESULTS_PER_PAGE } from "@/lib/constants";
import { getAuditLogs, getNumAuditLogs } from "@/lib/db/queries/audit-log";
import { type AuditLog } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { and, eq, gte, lte, sql, count, ilike } from "drizzle-orm";

interface GetLogsProps {
  page?: string;
  perPage?: string;
  search?: string;
  action?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
}

export const getLogs = async ({
  page = "1",
  perPage = RESULTS_PER_PAGE.toString(),
  search = "",
  action,
  entityType,
  fromDate,
  toDate,
}: GetLogsProps = {}) => {
  const start = (Number(page) - 1) * Number(perPage);

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (action && action !== "all") params.append("action", action);
  if (entityType && entityType !== "all")
    params.append("entityType", entityType);
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);

  const hasFilters = action || entityType || fromDate || toDate;

  if (hasFilters) {
    const filters: {
      action?: "create" | "update" | "delete";
      entityType?: string;
      fromDate?: Date;
      toDate?: Date;
    } = {};

    if (action && action !== "all") {
      filters.action = action as "create" | "update" | "delete";
    }
    if (entityType && entityType !== "all") {
      filters.entityType = entityType;
    }
    if (fromDate) {
      filters.fromDate = new Date(fromDate);
    }
    if (toDate) {
      filters.toDate = new Date(toDate + "T23:59:59");
    }

    const conditions = [];
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.entityType)
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.fromDate)
      conditions.push(gte(auditLogs.createdAt, filters.fromDate));
    if (filters.toDate)
      conditions.push(lte(auditLogs.createdAt, filters.toDate));

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    const logs = (await getAuditLogs(
      Number(perPage),
      start,
      filters,
    )) as AuditLog[];

    return {
      logs,
      totalLogs: Number(countResult.count),
      start,
      params: params.toString(),
    };
  }

  const totalLogs = await getNumAuditLogs();
  const logs = (await getAuditLogs(Number(perPage), start)) as AuditLog[];

  return {
    logs,
    totalLogs,
    start,
    params: params.toString(),
  };
};

export const getDistinctEntityTypes = async () => {
  try {
    const results = await db
      .selectDistinct({ entityType: auditLogs.entityType })
      .from(auditLogs);
    return results.map((r) => r.entityType);
  } catch {
    return [];
  }
};

export interface LogFlags {
  failedLogins: number;
  unauthorizedAttempts: number;
  roleEscalations: number;
  bulkUpdates: number;
  errors: number;
}

export const getLogFlags = async (): Promise<LogFlags> => {
  try {
    const [
      [failedLoginsResult],
      [unauthorizedResult],
      [roleEscalationsResult],
      [bulkUpdatesResult],
      [errorsResult],
    ] = await Promise.all([
      // Failed logins: session entity type with "Failed login" in metadata
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "session"),
            ilike(auditLogs.metadata, "%Failed login%")
          )
        ),
      // Unauthorized access attempts: metadata contains "Unauthorized"
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(ilike(auditLogs.metadata, "%Unauthorized%")),
      // Role escalations: user entity type with newValue containing "admin"
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "user"),
            ilike(auditLogs.newValue, '%"role":"admin"%')
          )
        ),
      // Bulk status changes
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(eq(auditLogs.entityType, "bulk-status-update")),
      // Errors/failures (excluding login failures to avoid double counting)
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(
          and(
            sql`(${auditLogs.metadata} ILIKE '%Failed%' OR ${auditLogs.metadata} ILIKE '%error%')`,
            sql`${auditLogs.entityType} != 'session'`
          )
        ),
    ]);

    return {
      failedLogins: Number(failedLoginsResult.count),
      unauthorizedAttempts: Number(unauthorizedResult.count),
      roleEscalations: Number(roleEscalationsResult.count),
      bulkUpdates: Number(bulkUpdatesResult.count),
      errors: Number(errorsResult.count),
    };
  } catch (error) {
    console.error("Error fetching log flags:", error);
    return {
      failedLogins: 0,
      unauthorizedAttempts: 0,
      roleEscalations: 0,
      bulkUpdates: 0,
      errors: 0,
    };
  }
};
