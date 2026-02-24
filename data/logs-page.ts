import { RESULTS_PER_PAGE } from "@/lib/constants";
import { getAuditLogs, getNumAuditLogs } from "@/lib/db/queries/audit-log";
import { type AuditLog } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { and, eq, gte, lte, sql, count } from "drizzle-orm";

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
